import type { AdminReportResponse } from "./reports.types.js";

const encoder = new TextEncoder();
const crcTable = makeCrcTable();

export function createReportPdf(report: AdminReportResponse): Buffer {
  const lines = [
    "Volt Rewards",
    report.title,
    `Range: ${report.resolvedRange.label}`,
    `Rows: ${report.totalRows}`,
    "",
    ...report.summary.map((item) => `${item.label}: ${item.value}${item.meta ? ` (${item.meta})` : ""}`),
    "",
    report.columns.map((column) => column.label).join(" | "),
    ...report.rows.slice(0, 60).map((row) =>
      report.columns.map((column) => sanitizePdfText(String(row[column.key] ?? ""))).join(" | "),
    ),
  ];

  if (report.rows.length > 60) {
    lines.push(`... ${report.rows.length - 60} more rows in full Excel export`);
  }

  const content = buildPdfTextContent(lines.flatMap(wrapPdfLine));
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  }

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  for (const offset of offsets.slice(1)) {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.from(chunks.join(""), "utf8");
}

export function createReportXlsx(report: AdminReportResponse): Buffer {
  const rows = [
    report.columns.map((column) => column.label),
    ...report.rows.map((row) => report.columns.map((column) => row[column.key] ?? "")),
  ];

  const files = new Map<string, Buffer>([
    ["[Content_Types].xml", xmlBuffer(contentTypesXml())],
    ["_rels/.rels", xmlBuffer(rootRelsXml())],
    ["xl/workbook.xml", xmlBuffer(workbookXml(report.title))],
    ["xl/_rels/workbook.xml.rels", xmlBuffer(workbookRelsXml())],
    ["xl/worksheets/sheet1.xml", xmlBuffer(worksheetXml(rows))],
  ]);

  return createZip(files);
}

export function createReportCsv(report: AdminReportResponse): Buffer {
  const rows = [
    report.columns.map((column) => column.label),
    ...report.rows.map((row) => report.columns.map((column) => row[column.key] ?? "")),
  ];

  return Buffer.from(`${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
}

function buildPdfTextContent(lines: readonly string[]): string {
  const output = ["BT", "/F1 8 Tf", "36 552 Td", "10 TL"];
  for (const [index, line] of lines.slice(0, 48).entries()) {
    if (index > 0) {
      output.push("T*");
    }
    output.push(`(${escapePdf(line)}) Tj`);
  }
  output.push("ET");
  return output.join("\n");
}

function wrapPdfLine(line: string): readonly string[] {
  const normalized = line.length > 145 ? `${line.slice(0, 142)}...` : line;
  return [normalized];
}

function sanitizePdfText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapePdf(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function contentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
}

function rootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName(title))}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;
}

function worksheetXml(rows: readonly (readonly (string | number | boolean)[])[]): string {
  const xmlRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => cellXml(columnName(columnIndex + 1), rowIndex + 1, cell))
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${xmlRows}</sheetData>
</worksheet>`;
}

function cellXml(column: string, row: number, value: string | number | boolean): string {
  const ref = `${column}${row}`;
  if (typeof value === "number") {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  if (typeof value === "boolean") {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
}

function columnName(index: number): string {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function sheetName(value: string): string {
  return value.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Report";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function xmlBuffer(value: string): Buffer {
  return Buffer.from(value, "utf8");
}

function createZip(files: ReadonlyMap<string, Buffer>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, data] of files.entries()) {
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    Buffer.from(nameBytes).copy(local, 30);

    localParts.push(local, data);

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    Buffer.from(nameBytes).copy(central, 46);
    centralParts.push(central);

    offset += local.length + data.length;
  }

  const centralOffset = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable(): readonly number[] {
  const table: number[] = [];
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

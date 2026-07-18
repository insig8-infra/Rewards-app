import { DomainError } from "@volt-rewards/domain";
import type {
  BusyInvoiceImport,
  BusyInvoiceLineImport,
  BusyInvoiceParty,
  BusyReturnVoucherImport,
  BusyReturnVoucherLineImport,
} from "./busy-import.repository.js";

type BusyPayloadNode = Record<string, unknown>;

export type BusyVoucherAdapterResult =
  | { readonly kind: "sale"; readonly invoice: BusyInvoiceImport }
  | { readonly kind: "return"; readonly returnVoucher: BusyReturnVoucherImport }
  | { readonly kind: "ignored"; readonly voucherType: string; readonly reason: string };

const rootNameKey = "__rootName";

const saleVoucherTypes = new Set(["sale", "9"]);
const returnVoucherTypes = new Set(["return", "sale return", "return of sale", "sales return"]);

export function mapBusyVoucherPayload(payload: unknown): BusyVoucherAdapterResult {
  const voucher = normalizeBusyPayload(payload);
  const rootName = optionalString(voucher, [[rootNameKey]])?.toLowerCase();
  const explicitVoucherType = optionalString(voucher, [["VchType"]]);
  const voucherType = explicitVoucherType ?? rootName ?? "";
  const normalizedVoucherType = voucherType.trim().toLowerCase();

  if (returnVoucherTypes.has(normalizedVoucherType) || (!explicitVoucherType && rootName === "return")) {
    return {
      kind: "return",
      returnVoucher: mapBusyReturnVoucher(voucher),
    };
  }

  if (saleVoucherTypes.has(normalizedVoucherType) || (!explicitVoucherType && rootName === "sale")) {
    return {
      kind: "sale",
      invoice: mapBusySaleVoucher(voucher),
    };
  }

  return {
    kind: "ignored",
    voucherType: voucherType || "UNKNOWN",
    reason: "Only BUSY Sale and Return vouchers affect Volt Rewards QR workflows.",
  };
}

function mapBusySaleVoucher(voucher: BusyPayloadNode): BusyInvoiceImport {
  const externalInvoiceId = requiredString(voucher, [["BillingDetails", "tmpVchCode"], ["tmpVchCode"]], "tmpVchCode");
  const invoiceDate = parseBusyDate(requiredString(voucher, [["Date"], ["BillingDetails", "Date"]], "Date"));
  const invoiceNumber = optionalString(voucher, [["VchNo"], ["tmpBillNoStr"], ["VchOtherInfoDetails", "PurchaseBillNo"]]) ?? externalInvoiceId;
  const partyName = requiredString(voucher, [["BillingDetails", "PartyName"], ["PartyName"], ["MasterName1"]], "PartyName");
  const totalAmount = decimalString(optionalString(voucher, [["tmpTotalAmt"], ["tmpSalePurcAmt"]]) ?? "0", "tmpTotalAmt");

  return {
    externalInvoiceId,
    invoiceNumber,
    invoiceDate,
    seller: buildParty(optionalString(voucher, [["MasterName2"]]) ?? "BUSY Store"),
    customer: buildParty(partyName, optionalString(voucher, [["BillingDetails", "tmpStateName"]])),
    customerRef: partyName,
    placeOfSupply: optionalString(voucher, [["BillingDetails", "tmpStateName"]]) ?? "",
    taxableSubtotal: decimalString(optionalString(voucher, [["tmpSalePurcAmt"], ["tmpTotalAmt"]]) ?? totalAmount, "tmpSalePurcAmt"),
    discountTotal: "0.00",
    freightTotal: "0.00",
    cgstTotal: "0.00",
    sgstTotal: "0.00",
    igstTotal: "0.00",
    gstTotal: "0.00",
    totalAmount,
    roundOff: "0.00",
    finalTotal: totalAmount,
    lines: getItemDetails(voucher).map((line, index) => mapBusySaleLine(line, externalInvoiceId, index)),
  };
}

function mapBusyReturnVoucher(voucher: BusyPayloadNode): BusyReturnVoucherImport {
  const externalReturnId = requiredString(voucher, [["BillingDetails", "tmpVchCode"], ["tmpVchCode"]], "return tmpVchCode");
  const originalExternalInvoiceId = requiredString(
    voucher,
    [
      ["OriginalSaleTmpVchCode"],
      ["OriginalTmpVchCode"],
      ["OriginalVchCode"],
      ["OriginalInvoiceTmpVchCode"],
      ["LinkedOriginalTmpVchCode"],
      ["BillingDetails", "OriginalSaleTmpVchCode"],
      ["VchOtherInfoDetails", "OriginalSaleTmpVchCode"],
    ],
    "linked original sale tmpVchCode",
  );
  const returnDate = parseBusyDate(requiredString(voucher, [["Date"]], "Date"));
  const returnNumber = optionalString(voucher, [["VchNo"], ["tmpBillNoStr"]]) ?? externalReturnId;
  const partyName = optionalString(voucher, [["BillingDetails", "PartyName"], ["PartyName"], ["MasterName1"]]);

  return {
    externalReturnId,
    returnNumber,
    returnDate,
    originalExternalInvoiceId,
    voucherType: "SALE_RETURN",
    ...(partyName ? { customerRef: partyName } : {}),
    lines: getItemDetails(voucher).map((line, index) => mapBusyReturnLine(line, externalReturnId, originalExternalInvoiceId, index)),
  };
}

function mapBusySaleLine(line: BusyPayloadNode, externalInvoiceId: string, index: number): BusyInvoiceLineImport {
  const srNo = requiredString(line, [["SrNo"]], "SrNo");
  const sku = requiredString(line, [["tmpItemCode"]], "tmpItemCode");
  const productName = requiredString(line, [["ItemName"]], "ItemName");
  const quantity = positiveWholeNumber(requiredString(line, [["Qty"]], "Qty"), "Qty");
  const unitRate = decimalString(requiredString(line, [["Price"]], "Price"), "Price");
  const lineTotal = decimalString(optionalString(line, [["NettAmount"], ["Amt"]]) ?? String(Number(unitRate) * quantity), "NettAmount");
  const category = optionalString(line, [["tmpGroupName"], ["ItemTaxCategory"]]);

  return {
    externalLineId: buildExternalLineId(externalInvoiceId, srNo || String(index + 1)),
    sku,
    productName,
    ...(category ? { category } : {}),
    unit: optionalString(line, [["UnitName"], ["tmpMainUnitName"]]) ?? "Pcs",
    quantity,
    returnedQty: 0,
    unitRate,
    taxableValue: decimalString(optionalString(line, [["NettAmount"], ["Amt"]]) ?? lineTotal, "NettAmount"),
    gstRatePercent: extractGstRate(optionalString(line, [["ItemTaxCategory"]])),
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    igstAmount: "0.00",
    lineTotal,
    pointsPerUnit: 0,
  };
}

function mapBusyReturnLine(
  line: BusyPayloadNode,
  externalReturnId: string,
  originalExternalInvoiceId: string,
  index: number,
): BusyReturnVoucherLineImport {
  const srNo = requiredString(line, [["SrNo"]], "SrNo");
  const originalSrNo = optionalString(line, [["OriginalSrNo"], ["OriginalItemSrNo"], ["OriginalLineSrNo"]]);
  const category = optionalString(line, [["tmpGroupName"], ["ItemTaxCategory"]]);

  return {
    externalReturnLineId: buildExternalLineId(externalReturnId, srNo || String(index + 1)),
    ...(originalSrNo ? { originalExternalLineId: buildExternalLineId(originalExternalInvoiceId, originalSrNo) } : {}),
    sku: requiredString(line, [["tmpItemCode"]], "tmpItemCode"),
    productName: requiredString(line, [["ItemName"]], "ItemName"),
    ...(category ? { category } : {}),
    unit: optionalString(line, [["UnitName"], ["tmpMainUnitName"]]) ?? "Pcs",
    quantity: positiveWholeNumber(requiredString(line, [["Qty"]], "Qty"), "Qty"),
  };
}

function getItemDetails(voucher: BusyPayloadNode): BusyPayloadNode[] {
  const itemEntries = getPath(voucher, ["ItemEntries"]);
  const details = isRecord(itemEntries) ? getPath(itemEntries, ["ItemDetail"]) : undefined;
  const items = asArray(details).filter(isRecord);
  if (items.length === 0) {
    throw new DomainError("BUSY_ADAPTER_NO_ITEM_LINES", "BUSY voucher did not include any ItemDetail rows.");
  }
  return items;
}

function normalizeBusyPayload(payload: unknown): BusyPayloadNode {
  if (typeof payload === "string") {
    return parseSimpleBusyXml(payload);
  }
  if (!isRecord(payload)) {
    throw new DomainError("BUSY_ADAPTER_INVALID_PAYLOAD", "BUSY payload must be an object or XML string.");
  }

  const rootEntry = Object.entries(payload).find(([key, value]) => ["sale", "return"].includes(key.toLowerCase()) && isRecord(value));
  if (rootEntry && isRecord(rootEntry[1])) {
    return {
      [rootNameKey]: rootEntry[0],
      ...rootEntry[1],
    };
  }
  return payload;
}

interface XmlNode {
  readonly name: string;
  readonly children: XmlNode[];
  readonly text: string[];
}

function parseSimpleBusyXml(xml: string): BusyPayloadNode {
  const cleanXml = xml
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, ""))
    .join("\n");
  const root: XmlNode = { name: "__root__", children: [], text: [] };
  const stack: XmlNode[] = [root];
  const tagPattern = /<[^>]+>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(cleanXml)) !== null) {
    const current = stack[stack.length - 1];
    if (!current) {
      throw new DomainError("BUSY_ADAPTER_INVALID_XML", "BUSY XML parser stack was empty.");
    }
    const text = cleanXml.slice(lastIndex, match.index).trim();
    if (text) {
      current.text.push(text);
    }

    const token = match[0];
    if (token.startsWith("</")) {
      const closingName = token.slice(2, -1).trim();
      const node = stack.pop();
      if (!node || node.name !== closingName) {
        throw new DomainError("BUSY_ADAPTER_INVALID_XML", "BUSY XML contained mismatched tags.");
      }
      const parent = stack[stack.length - 1];
      if (!parent) {
        throw new DomainError("BUSY_ADAPTER_INVALID_XML", "BUSY XML parser stack was empty.");
      }
      parent.children.push(node);
    } else if (token.endsWith("/>")) {
      current.children.push({ name: token.slice(1, -2).trim().split(/\s+/)[0] ?? "", children: [], text: [] });
    } else {
      stack.push({ name: token.slice(1, -1).trim().split(/\s+/)[0] ?? "", children: [], text: [] });
    }
    lastIndex = tagPattern.lastIndex;
  }

  if (stack.length !== 1) {
    throw new DomainError("BUSY_ADAPTER_INVALID_XML", "BUSY XML contained unclosed tags.");
  }
  if (root.children.length !== 1) {
    throw new DomainError("BUSY_ADAPTER_INVALID_XML", "BUSY XML must contain exactly one root voucher.");
  }

  const voucherRoot = root.children[0]!;
  const value = xmlNodeToValue(voucherRoot);
  if (!isRecord(value)) {
    throw new DomainError("BUSY_ADAPTER_INVALID_XML", "BUSY XML root did not contain voucher fields.");
  }
  return {
    [rootNameKey]: voucherRoot.name,
    ...value,
  };
}

function xmlNodeToValue(node: XmlNode): unknown {
  if (node.children.length === 0) {
    return node.text.join(" ").trim();
  }

  const result: Record<string, unknown> = {};
  for (const child of node.children) {
    const childValue = xmlNodeToValue(child);
    const existing = result[child.name];
    if (existing === undefined) {
      result[child.name] = childValue;
    } else if (Array.isArray(existing)) {
      existing.push(childValue);
    } else {
      result[child.name] = [existing, childValue];
    }
  }
  return result;
}

function buildParty(name: string, state = ""): BusyInvoiceParty {
  return {
    name,
    addressLine1: "",
    city: "",
    state,
    pincode: "",
  };
}

function buildExternalLineId(externalVoucherId: string, srNo: string): string {
  return `${externalVoucherId}:line:${srNo.trim()}`;
}

function requiredString(node: BusyPayloadNode, paths: readonly (readonly string[])[], fieldName: string): string {
  const value = optionalString(node, paths);
  if (!value) {
    throw new DomainError("BUSY_ADAPTER_FIELD_REQUIRED", `BUSY field ${fieldName} is required.`);
  }
  return value;
}

function optionalString(node: BusyPayloadNode, paths: readonly (readonly string[])[]): string | undefined {
  for (const path of paths) {
    const value = getPath(node, path);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}

function getPath(node: BusyPayloadNode, path: readonly string[]): unknown {
  let current: unknown = node;
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    const key = Object.keys(current).find((candidate) => candidate.toLowerCase() === segment.toLowerCase());
    if (!key) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null || value === "" ? [] : [value];
}

function isRecord(value: unknown): value is BusyPayloadNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBusyDate(value: string): Date {
  const trimmed = value.trim();
  const ddMmYyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed);
  if (ddMmYyyy) {
    const day = ddMmYyyy[1]!;
    const month = ddMmYyyy[2]!;
    const year = ddMmYyyy[3]!;
    return new Date(`${year}-${month}-${day}T00:00:00+05:30`);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError("BUSY_ADAPTER_DATE_INVALID", "BUSY voucher date is invalid.");
  }
  return parsed;
}

function positiveWholeNumber(value: string, fieldName: string): number {
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new DomainError("BUSY_ADAPTER_NUMBER_INVALID", `BUSY field ${fieldName} must be a positive whole number.`);
  }
  return parsed;
}

function decimalString(value: string, fieldName: string): string {
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) {
    throw new DomainError("BUSY_ADAPTER_NUMBER_INVALID", `BUSY field ${fieldName} must be numeric.`);
  }
  return parsed.toFixed(2);
}

function extractGstRate(value: string | undefined): string {
  const match = /(\d+(?:\.\d+)?)\s*%/.exec(value ?? "");
  return match ? decimalString(match[1]!, "ItemTaxCategory") : "0.00";
}

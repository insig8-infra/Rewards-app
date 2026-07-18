#!/usr/bin/env python3
from __future__ import annotations

from html import escape
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


OUT = Path("client-deliverables/Electrician_Loyalty_QR_Platform_One_Pager.docx")

NS = (
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
)

PAGE_W = 11906
PAGE_H = 16838
MARGIN = 794
CONTENT_W = PAGE_W - (MARGIN * 2)


def esc(text: str) -> str:
    return escape(text, quote=False)


def c(hex_color: str) -> str:
    return hex_color.replace("#", "").upper()


def run(text: str, *, bold=False, size=None, color=None) -> str:
    props = []
    if bold:
        props.append("<w:b/>")
    if size:
        props.append(f'<w:sz w:val="{int(size * 2)}"/><w:szCs w:val="{int(size * 2)}"/>')
    if color:
        props.append(f'<w:color w:val="{c(color)}"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    preserve = ' xml:space="preserve"' if text.startswith(" ") or text.endswith(" ") else ""
    return f"<w:r>{rpr}<w:t{preserve}>{esc(text)}</w:t></w:r>"


def para(text="", *, style=None, bold=False, size=None, color=None, before=0, after=80, num_id=None):
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    ppr.append(f'<w:spacing w:before="{before}" w:after="{after}" w:line="270" w:lineRule="auto"/>')
    if num_id:
        ppr.append(f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num_id}"/></w:numPr>')
    return f"<w:p><w:pPr>{''.join(ppr)}</w:pPr>{run(text, bold=bold, size=size, color=color)}</w:p>"


def mixed_para(parts, *, after=80):
    return (
        f'<w:p><w:pPr><w:spacing w:after="{after}" w:line="270" w:lineRule="auto"/></w:pPr>'
        + "".join(run(**part) for part in parts)
        + "</w:p>"
    )


def heading(text, level=1):
    return para(text, style=f"Heading{level}")


def bullet(text):
    return para(text, num_id=1, after=45)


def cell(text, width, *, fill=None, bold=False):
    shade = f'<w:shd w:fill="{c(fill)}"/>' if fill else ""
    return (
        f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{shade}'
        '<w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/>'
        '<w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar></w:tcPr>'
        + para(text, bold=bold, after=0)
        + "</w:tc>"
    )


def table(rows, widths, *, header=False):
    widths_dxa = [int(CONTENT_W * w) for w in widths]
    widths_dxa[-1] += CONTENT_W - sum(widths_dxa)
    grid = "<w:tblGrid>" + "".join(f'<w:gridCol w:w="{w}"/>' for w in widths_dxa) + "</w:tblGrid>"
    tblpr = (
        '<w:tblPr><w:tblW w:w="100%" w:type="pct"/>'
        "<w:tblBorders>"
        '<w:top w:val="single" w:sz="5" w:color="CFD8E3"/>'
        '<w:left w:val="single" w:sz="5" w:color="CFD8E3"/>'
        '<w:bottom w:val="single" w:sz="5" w:color="CFD8E3"/>'
        '<w:right w:val="single" w:sz="5" w:color="CFD8E3"/>'
        '<w:insideH w:val="single" w:sz="5" w:color="CFD8E3"/>'
        '<w:insideV w:val="single" w:sz="5" w:color="CFD8E3"/>'
        "</w:tblBorders></w:tblPr>"
    )
    trs = []
    for row_index, row in enumerate(rows):
        fill = "#F3F7FB" if header or row_index == 0 else None
        trs.append("<w:tr>" + "".join(cell(str(v), widths_dxa[i], fill=fill, bold=row_index == 0) for i, v in enumerate(row)) + "</w:tr>")
    return f"<w:tbl>{tblpr}{grid}{''.join(trs)}</w:tbl>{para('', after=50)}"


def callout(text):
    return (
        '<w:tbl><w:tblPr><w:tblW w:w="100%" w:type="pct"/>'
        '<w:tblBorders><w:left w:val="single" w:sz="18" w:color="1F4E79"/>'
        '<w:top w:val="single" w:sz="2" w:color="F3F7FB"/>'
        '<w:bottom w:val="single" w:sz="2" w:color="F3F7FB"/>'
        '<w:right w:val="single" w:sz="2" w:color="F3F7FB"/></w:tblBorders></w:tblPr>'
        f'<w:tblGrid><w:gridCol w:w="{CONTENT_W}"/></w:tblGrid><w:tr>'
        f'<w:tc><w:tcPr><w:tcW w:w="{CONTENT_W}" w:type="dxa"/><w:shd w:fill="F3F7FB"/>'
        '<w:tcMar><w:top w:w="130" w:type="dxa"/><w:left w:w="180" w:type="dxa"/>'
        '<w:bottom w:w="130" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>'
        + para(text, after=0)
        + "</w:tc></w:tr></w:tbl>"
        + para("", after=45)
    )


def content_types():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>"""


def styles():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="111827"/></w:rPr></w:rPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="0B2545"/><w:sz w:val="46"/><w:szCs w:val="46"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="150"/></w:pPr><w:rPr><w:color w:val="374151"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="160" w:after="75"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="27"/><w:szCs w:val="27"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="120" w:after="60"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:style>
</w:styles>"""


def numbering():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:pPr><w:ind w:left="540" w:hanging="260"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>"""


def rels():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""


def doc_rels():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>"""


def document():
    blocks = []
    blocks.append(para("Quick Idea Overview", bold=True, size=9, color="#1F4E79", after=70))
    blocks.append(para("Electrician Loyalty QR Platform", style="Title"))
    blocks.append(para("A loyalty app for electrical retailers to reward electricians for recommending and using their products, powered by secure product QR labels and a retailer admin panel.", style="Subtitle"))
    blocks.append(
        table(
            [
                ["Who it helps", "How it works", "Pilot goal"],
                ["Electrical retailers who want more electricians to recommend their products.", "Every sold product gets a secure QR label that a registered electrician scans for points.", "Prove the end-to-end flow in 6 weeks with 5 electricians and 1 category: Wires."],
            ],
            [0.33, 0.34, 0.33],
        )
    )
    blocks.append(heading("The Idea", 1))
    blocks.append(para("The retailer sells many electrical products and wants electricians to actively recommend those products to customers. To encourage this behavior, the retailer will reward electricians with loyalty points whenever they scan QR labels attached to eligible products."))
    blocks.append(para("The system connects sales, product-level QR labels, electrician scans, points, returns, and redemption data into one controlled loyalty platform."))
    blocks.append(heading("Typical Workflow", 1))
    blocks.append(
        table(
            [
                ["1", "2", "3", "4", "5"],
                ["Retailer creates invoice in BUSY.", "Staff selects invoice in admin panel.", "System prints QR labels.", "Electrician scans QR in Android app.", "Points are credited and tracked."],
            ],
            [0.2, 0.2, 0.2, 0.2, 0.2],
        )
    )
    blocks.append(callout("Important: The QR code is not printed inside the BUSY invoice. BUSY prints the invoice normally. QR labels are printed separately on a label printer and stuck on the physical products."))
    blocks.append(heading("Electrician App", 1))
    for item in [
        "Native Android app for the pilot.",
        "OTP login only for admin-registered mobile numbers.",
        "Bottom navigation: Home, Scan, History, Redeem.",
        "Bronze, Silver, and Gold tier display.",
        "PIN-style protection for redemption and total accumulated points.",
    ]:
        blocks.append(bullet(item))
    blocks.append(heading("Retailer Admin Panel", 1))
    for item in [
        "Register electricians and manage access.",
        "Add SKUs/categories and assign points.",
        "Select BUSY invoices and print QR labels.",
        "View electrician data, scan history, and point totals.",
        "Reverse points when returned material is scanned.",
    ]:
        blocks.append(bullet(item))
    blocks.append(heading("Security And Business Value", 1))
    for item in [
        "Unique QR per sold product unit; one-time redemption with configurable expiry.",
        "Duplicate, expired, invalid, or reversed scans are rejected.",
        "Encourages electricians to recommend retailer products and creates measurable loyalty data.",
        "Starts small in the pilot and can scale to more categories and electricians.",
    ]:
        blocks.append(bullet(item))
    blocks.append(para("Pilot scope: 6 weeks, 5 electricians, Wires category, BUSY invoice integration, separate QR label printer, direct APK/internal Android testing build.", size=9, color="#4B5563", before=70, after=0))
    sect = (
        "<w:sectPr>"
        f'<w:pgSz w:w="{PAGE_W}" w:h="{PAGE_H}"/>'
        f'<w:pgMar w:top="{MARGIN}" w:right="{MARGIN}" w:bottom="{MARGIN}" w:left="{MARGIN}" w:header="708" w:footer="708" w:gutter="0"/>'
        "</w:sectPr>"
    )
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {NS}><w:body>{"".join(blocks)}{sect}</w:body></w:document>'


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types())
        z.writestr("_rels/.rels", rels())
        z.writestr("word/_rels/document.xml.rels", doc_rels())
        z.writestr("word/document.xml", document())
        z.writestr("word/styles.xml", styles())
        z.writestr("word/numbering.xml", numbering())
    print(OUT)


if __name__ == "__main__":
    main()

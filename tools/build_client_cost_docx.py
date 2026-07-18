#!/usr/bin/env python3
from __future__ import annotations

from datetime import date
from html import escape
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


OUT = Path(".planning/docs/Electrician_Loyalty_QR_Pilot_Cost_Breakdown.docx")

NS = (
    'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
    'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
    'xmlns:o="urn:schemas-microsoft-com:office:office" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
    'xmlns:v="urn:schemas-microsoft-com:vml" '
    'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    'xmlns:w10="urn:schemas-microsoft-com:office:word" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
    'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
    'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
    'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" '
    'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
    'mc:Ignorable="w14 wp14"'
)

PAGE_W = 11906
PAGE_H = 16838
MARGIN_TOP = 1020
MARGIN_RIGHT = 907
MARGIN_BOTTOM = 1020
MARGIN_LEFT = 907
CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT


def w_text(text: str) -> str:
    return escape(text, quote=False)


def color(hex_color: str) -> str:
    return hex_color.replace("#", "").upper()


def run(text: str, *, bold=False, italic=False, size=None, color_hex=None) -> str:
    props = []
    if bold:
        props.append("<w:b/>")
    if italic:
        props.append("<w:i/>")
    if color_hex:
        props.append(f'<w:color w:val="{color(color_hex)}"/>')
    if size:
        props.append(f'<w:sz w:val="{int(size * 2)}"/>')
        props.append(f'<w:szCs w:val="{int(size * 2)}"/>')
    rpr = f"<w:rPr>{''.join(props)}</w:rPr>" if props else ""
    preserve = ' xml:space="preserve"' if text.startswith(" ") or text.endswith(" ") else ""
    return f"<w:r>{rpr}<w:t{preserve}>{w_text(text)}</w:t></w:r>"


def para(
    text: str = "",
    *,
    style: str | None = None,
    align: str | None = None,
    bold=False,
    italic=False,
    size=None,
    color_hex=None,
    before=None,
    after=None,
    num_id=None,
    ilvl=0,
    keep_next=False,
) -> str:
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    if before is not None or after is not None:
        attrs = []
        if before is not None:
            attrs.append(f'w:before="{int(before * 20)}"')
        if after is not None:
            attrs.append(f'w:after="{int(after * 20)}"')
        ppr.append(f"<w:spacing {' '.join(attrs)} w:line=\"280\" w:lineRule=\"auto\"/>")
    if num_id is not None:
        ppr.append(
            f"<w:numPr><w:ilvl w:val=\"{ilvl}\"/><w:numId w:val=\"{num_id}\"/></w:numPr>"
        )
    if keep_next:
        ppr.append("<w:keepNext/>")
    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>" if ppr else ""
    return f"<w:p>{ppr_xml}{run(text, bold=bold, italic=italic, size=size, color_hex=color_hex)}</w:p>"


def mixed_para(parts, *, style=None, after=6, before=None, num_id=None) -> str:
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    attrs = []
    if before is not None:
        attrs.append(f'w:before="{int(before * 20)}"')
    if after is not None:
        attrs.append(f'w:after="{int(after * 20)}"')
    if attrs:
        ppr.append(f"<w:spacing {' '.join(attrs)} w:line=\"280\" w:lineRule=\"auto\"/>")
    if num_id is not None:
        ppr.append(f"<w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"{num_id}\"/></w:numPr>")
    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>"
    return "<w:p>" + ppr_xml + "".join(run(**part) for part in parts) + "</w:p>"


def heading(text: str, level: int) -> str:
    return para(text, style=f"Heading{level}", keep_next=True)


def bullet(text: str) -> str:
    return para(text, num_id=1, after=4)


def number(text: str) -> str:
    return para(text, num_id=2, after=4)


def cell(text: str, width: int, *, fill: str | None = None, bold=False, align=None) -> str:
    shade = f'<w:shd w:fill="{color(fill)}"/>' if fill else ""
    tcpr = (
        f"<w:tcPr><w:tcW w:w=\"{width}\" w:type=\"dxa\"/>"
        "<w:tcMar><w:top w:w=\"90\" w:type=\"dxa\"/><w:left w:w=\"120\" w:type=\"dxa\"/>"
        "<w:bottom w:w=\"90\" w:type=\"dxa\"/><w:right w:w=\"120\" w:type=\"dxa\"/></w:tcMar>"
        f"{shade}</w:tcPr>"
    )
    return f"<w:tc>{tcpr}{para(text, bold=bold, align=align, after=0)}</w:tc>"


def table(headers, rows, widths) -> str:
    widths_dxa = [int(CONTENT_W * w) for w in widths]
    diff = CONTENT_W - sum(widths_dxa)
    widths_dxa[-1] += diff
    grid = "<w:tblGrid>" + "".join(f'<w:gridCol w:w="{w}"/>' for w in widths_dxa) + "</w:tblGrid>"
    tblpr = (
        "<w:tblPr><w:tblW w:w=\"100%\" w:type=\"pct\"/>"
        "<w:tblBorders>"
        "<w:top w:val=\"single\" w:sz=\"6\" w:space=\"0\" w:color=\"CFD8E3\"/>"
        "<w:left w:val=\"single\" w:sz=\"6\" w:space=\"0\" w:color=\"CFD8E3\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"6\" w:space=\"0\" w:color=\"CFD8E3\"/>"
        "<w:right w:val=\"single\" w:sz=\"6\" w:space=\"0\" w:color=\"CFD8E3\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"6\" w:space=\"0\" w:color=\"CFD8E3\"/>"
        "<w:insideV w:val=\"single\" w:sz=\"6\" w:space=\"0\" w:color=\"CFD8E3\"/>"
        "</w:tblBorders>"
        "<w:tblCellMar><w:top w:w=\"80\" w:type=\"dxa\"/><w:left w:w=\"120\" w:type=\"dxa\"/>"
        "<w:bottom w:w=\"80\" w:type=\"dxa\"/><w:right w:w=\"120\" w:type=\"dxa\"/></w:tblCellMar>"
        "</w:tblPr>"
    )
    head = "<w:tr>" + "".join(cell(h, widths_dxa[i], fill="#E8EEF5", bold=True) for i, h in enumerate(headers)) + "</w:tr>"
    body = []
    for row in rows:
        body.append("<w:tr>" + "".join(cell(str(v), widths_dxa[i]) for i, v in enumerate(row)) + "</w:tr>")
    return f"<w:tbl>{tblpr}{grid}{head}{''.join(body)}</w:tbl>{para('', after=4)}"


def callout(text: str) -> str:
    return (
        "<w:tbl><w:tblPr><w:tblW w:w=\"100%\" w:type=\"pct\"/>"
        "<w:tblBorders><w:left w:val=\"single\" w:sz=\"20\" w:space=\"0\" w:color=\"1F4E79\"/>"
        "<w:top w:val=\"single\" w:sz=\"2\" w:space=\"0\" w:color=\"F3F7FB\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"2\" w:space=\"0\" w:color=\"F3F7FB\"/>"
        "<w:right w:val=\"single\" w:sz=\"2\" w:space=\"0\" w:color=\"F3F7FB\"/></w:tblBorders>"
        "</w:tblPr><w:tblGrid><w:gridCol w:w=\""
        + str(CONTENT_W)
        + "\"/></w:tblGrid><w:tr>"
        + f"<w:tc><w:tcPr><w:tcW w:w=\"{CONTENT_W}\" w:type=\"dxa\"/><w:shd w:fill=\"F3F7FB\"/>"
        "<w:tcMar><w:top w:w=\"160\" w:type=\"dxa\"/><w:left w:w=\"200\" w:type=\"dxa\"/>"
        "<w:bottom w:w=\"160\" w:type=\"dxa\"/><w:right w:w=\"200\" w:type=\"dxa\"/></w:tcMar></w:tcPr>"
        + para(text, after=0)
        + "</w:tc></w:tr></w:tbl>"
        + para("", after=6)
    )


def page_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def document_xml() -> str:
    blocks = []
    blocks.append(para("Pilot Proposal Cost Note", bold=True, size=10, color_hex="#1F4E79", after=8))
    blocks.append(para("Electrician Loyalty QR Platform", style="Title"))
    blocks.append(
        para(
            "Pilot scope, delivery timeline, recommended tools/services, and client-borne cost breakdown for the electrical retailer loyalty app.",
            style="Subtitle",
            after=12,
        )
    )
    blocks.append(
        table(
            ["Prepared for", "Prepared on", "Pilot duration", "Pilot users"],
            [["Client discussion", "04 June 2026", "6 weeks", "5 electricians + admin/operator staff"]],
            [0.25, 0.25, 0.2, 0.3],
        )
    )
    blocks.append(heading("1. Executive Summary", 1))
    blocks.append(
        para(
            "The pilot will test a full loyalty workflow where the retailer prints secure QR labels for individual invoiced products, electricians scan those labels from a native Android app, and the retailer tracks point credit, history, return reversals, and basic redemption readiness from an admin panel."
        )
    )
    blocks.append(
        table(
            ["Development charge", "Client-borne pilot setup/operating costs*", "Practical total pilot budget range*"],
            [["₹1,00,000", "₹18,500-₹27,500", "₹1.2L-₹1.3L"]],
            [0.33, 0.34, 0.33],
        )
    )
    blocks.append(
        callout(
            "Important: QR codes will not be printed inside the BUSY invoice. BUSY will continue to print the invoice normally. Staff will select the latest BUSY invoice in the admin panel and click Print QR Labels to print one QR label per invoiced product unit on a separate QR label printer."
        )
    )

    blocks.append(heading("2. Pilot Scope", 1))
    blocks.append(heading("Included In Pilot", 2))
    for item in [
        "Native Android electrician app distributed as direct APK/internal testing build.",
        "OTP login for admin-registered electricians only.",
        "Bottom navigation in electrician app: Home, Scan, History, Redeem.",
        "Bronze/Silver/Gold virtual tier display.",
        "PIN-style protection for redemption and total accumulated points.",
        "Admin web panel for electrician registration, SKU/category setup, point rules, BUSY invoice selection, QR label printing, returns, and reporting.",
        "BUSY invoice integration based on client-provided SQL/API access.",
        "One secure QR label per invoiced product unit for the pilot category.",
        "QR expiry, one-time redemption, duplicate scan prevention, and return reversal ledger.",
    ]:
        blocks.append(bullet(item))
    blocks.append(heading("Outside Pilot Scope", 2))
    for item in [
        "Play Store publication. The pilot uses APK/internal testing distribution.",
        "QR code placement inside the BUSY invoice layout.",
        "Fully automatic QR printing directly triggered by BUSY invoice print action.",
        "Multiple product categories beyond Wires.",
        "Fully automated UPI/bank payout workflow.",
        "Advanced fraud analytics, distributor-level reporting, or large-scale production rollout.",
    ]:
        blocks.append(bullet(item))

    blocks.append(heading("3. Pilot Workflow", 1))
    for item in [
        "Retailer creates an invoice in BUSY accounting software.",
        "BUSY prints the normal invoice.",
        "Retailer staff opens the loyalty admin panel.",
        "Staff selects the latest BUSY invoice and clicks Print QR Labels.",
        "System reads invoice item data from BUSY SQL/API access.",
        "System generates one secure QR label per product unit in that invoice.",
        "QR labels are printed on a separate label printer and stuck on the products.",
        "Registered electricians scan labels in the Android app to collect points.",
        "Admin can scan returned material labels to reverse points where applicable.",
    ]:
        blocks.append(number(item))

    blocks.append(heading("4. Delivery Timeline", 1))
    blocks.append(
        table(
            ["Week", "Focus", "Key Deliverables", "Status Gate"],
            [
                ["Week 1", "Final scope lock and technical setup", "Confirm BUSY access, SKU/points rules, QR expiry, printer setup, Android project, database model.", "Build-ready"],
                ["Week 2", "Backend foundation and admin basics", "Authentication, electrician registration, SKU/category setup, point rule setup, audit-friendly data model.", "Admin foundation"],
                ["Week 3", "BUSY invoice and QR label flow", "Invoice lookup, line item mapping, secure QR generation, duplicate prevention, label print layout.", "QR print test"],
                ["Week 4", "Android electrician app", "OTP login, Home, Scan, History, Redeem, tier display, PIN-protected sections.", "APK test build"],
                ["Week 5", "Returns, reporting, and notifications", "Return scan/reversal, electrician totals/history, basic notifications, error states, operational safeguards.", "End-to-end UAT"],
                ["Week 6", "Pilot hardening and handover", "Bug fixes, pilot data setup, APK handover, admin training, sample invoice-to-scan workflow validation.", "Pilot launch"],
            ],
            [0.13, 0.28, 0.43, 0.16],
        )
    )
    blocks.append(para("* Timeline assumes timely BUSY access, printer availability, SMS/OTP onboarding, and client feedback.", italic=True, size=9, color_hex="#4B5563"))
    blocks.append(page_break())

    blocks.append(heading("5. Recommended Tools And Services", 1))
    blocks.append(
        table(
            ["Layer", "Recommended Tool / Service", "Reason"],
            [
                ["Electrician app", "Native Android with Kotlin + Jetpack Compose", "Native APK, strong camera control, and good fit for bottom navigation, scan flow, history, tier card, and PIN-protected views."],
                ["QR scanning", "Google ML Kit Barcode Scanning", "Proven Android QR scanning library; avoids custom camera/QR parsing logic."],
                ["Admin panel", "Next.js web admin", "Fast pilot delivery for forms, invoice selection, reporting, QR generation, and print pages."],
                ["Backend/API", "Next.js API / Node.js service", "Keeps admin and backend delivery simple for pilot while supporting secure QR/token/points logic."],
                ["Database", "Neon PostgreSQL Launch plan, or equivalent", "Managed PostgreSQL for electricians, QR tokens, point ledger, scans, returns, redemptions, and audit logs."],
                ["Hosting", "Vercel Pro, or equivalent", "Commercial-ready HTTPS hosting and deployment workflow for admin/API."],
                ["OTP/SMS", "MSG91 OTP", "India-focused OTP provider with public India OTP pricing."],
                ["APK distribution / push", "Firebase App Distribution + Firebase Cloud Messaging", "No-cost pilot-friendly APK distribution and native push notification channel."],
                ["QR label printer", "TSC TE244 thermal transfer barcode printer", "Reliable, cost-effective, India-available desktop barcode printer. Recommendation can be changed after vendor quote/testing."],
            ],
            [0.24, 0.31, 0.45],
        )
    )

    blocks.append(heading("6. Cost Breakdown", 1))
    blocks.append(heading("6.1 One-Time Development Charge", 2))
    blocks.append(
        table(
            ["Item", "Cost", "Paid To", "Notes"],
            [["Pilot application development", "₹1,00,000", "Development team", "Includes Android electrician app, admin panel, backend/API, QR logic, BUSY integration workflow, and pilot deployment. Taxes, if applicable, to be confirmed separately."]],
            [0.28, 0.16, 0.17, 0.39],
        )
    )
    blocks.append(heading("6.2 Client-Borne Pilot Costs", 2))
    blocks.append(
        table(
            ["Item", "Estimated Cost", "Type", "Notes / Conditions"],
            [
                ["TSC TE244 QR label printer*", "₹8,000-₹12,000", "One-time", "Recommendation only. Final price depends on vendor quote, GST, warranty, and local availability."],
                ["Thermal-transfer QR labels*", "₹1,000-₹2,500", "Initial consumable", "Recommend 50mm x 25mm or 50mm x 30mm adhesive labels. Final cost depends on roll quantity/material."],
                ["Wax-resin / wax ribbon*", "₹500-₹1,500", "Initial consumable", "Wax-resin preferred if labels need stronger handling durability."],
                ["OTP SMS credits*", "₹1,475 approx.", "Prepaid usage", "MSG91 5,000 OTP pack: ₹1,250 + 18% GST. Pilot usage will be lower, but minimum pack may apply."],
                ["Domain name", "₹1,000-₹2,000/year", "Annual", "Optional if client wants branded admin URL. Exact cost depends on .in, .com, or selected domain."],
                ["Hosting for admin/API*", "₹1,900-₹2,200/month", "Monthly", "Based on Vercel Pro $20/month + usage at approx. ₹96/USD. Pilot should fit included limits."],
                ["Managed PostgreSQL database*", "₹1,400-₹1,800/month", "Monthly", "Based on Neon Launch approx. $15/month. Free tier may work for demo; paid plan is safer for pilot reliability."],
            ],
            [0.29, 0.18, 0.16, 0.37],
        )
    )
    blocks.append(heading("6.3 Estimated Pilot Budget", 2))
    blocks.append(
        table(
            ["Category", "Estimate"],
            [
                ["Hardware + initial printing consumables", "₹9,500-₹16,000"],
                ["OTP initial pack", "₹1,475 approx."],
                ["Domain", "₹1,000-₹2,000"],
                ["2 months hosting + database", "₹6,600-₹8,000"],
                ["Estimated client-borne pilot costs, excluding development", "₹18,500-₹27,500 approx."],
                ["Development charge", "₹1,00,000"],
                ["Estimated total pilot budget", "₹1,18,500-₹1,27,500 approx."],
            ],
            [0.68, 0.32],
        )
    )
    blocks.append(para("* Recommended client-facing range: ₹1.2L-₹1.3L plus BUSY vendor/customization charges, if any, and actual reward payout budget.", italic=True, size=9, color_hex="#4B5563"))

    blocks.append(heading("7. Conditional / Not Included Costs", 1))
    blocks.append(
        table(
            ["Item", "Estimate", "When It Applies"],
            [
                ["Local BUSY connector / on-prem bridge", "Usually included if simple", "Needed if cloud backend cannot directly reach BUSY local server/API. Extra cost may apply if network/security setup is complex."],
                ["BUSY API/customization/vendor support", "Vendor quote required", "Client to bear any BUSY partner charges for SQL/API access, schema support, or integration assistance."],
                ["Static IP/VPN/network setup", "Vendor/ISP quote required", "Only needed if direct secure access to BUSY server is required and outbound connector sync is not sufficient."],
                ["Reward/redemption payout budget", "Client-defined", "Points liability, coupons, gifts, UPI payouts, or rewards are business costs and not included in software development."],
                ["SMS/WhatsApp notifications beyond OTP", "Usage-based", "Only needed if client wants marketing or transactional messages beyond app push notifications."],
                ["Play Store publication", "Not included", "Pilot uses direct APK/internal testing. Store publication can be estimated separately if required later."],
            ],
            [0.32, 0.23, 0.45],
        )
    )

    blocks.append(heading("8. Conditions And Explanations", 1))
    explanations = [
        ("* Printer recommendation: ", "TSC TE244 is recommended based on current research for India/Gujarat availability, reliability, QR support, and cost-effectiveness. It is not mandatory; any equivalent thermal-transfer barcode printer can be used after testing."),
        ("* Label/ribbon estimates: ", "Label and ribbon cost depends on selected label size, roll quantity, adhesive quality, and supplier. Final purchase should happen only after sample print and scan testing."),
        ("* OTP pricing: ", "OTP pricing is based on MSG91 public India OTP pricing. DLT registration, sender/template approval, and account setup may be required."),
        ("* Hosting/database pricing: ", "USD-denominated cloud services are estimated at ₹96/USD. Final billing may vary with exchange rate, taxes, and actual usage."),
        ("* BUSY assumption: ", "Current working assumption is that BUSY data is available on a local server through SQL/API access. Final integration effort depends on the actual BUSY version, schema/API, network access, and client security policy."),
        ("* Timeline condition: ", "The 6-week timeline assumes timely access to BUSY data, printer procurement, OTP onboarding, and client feedback."),
    ]
    for label, detail in explanations:
        blocks.append(mixed_para([{"text": label, "bold": True}, {"text": detail}], num_id=1, after=4))

    blocks.append(heading("9. Assumptions To Confirm Before Build Freeze", 1))
    for item in [
        "BUSY local server/API access and technical contact are available.",
        "Client confirms pilot category and SKU list for Wires.",
        "Client defines QR expiry duration.",
        "Client defines Bronze/Silver/Gold tier thresholds.",
        "Client defines redemption rule for pilot: request only, gift/coupon, or manual payout.",
        "Client provides 5 pilot electrician mobile numbers.",
        "Client confirms printer vendor quote, warranty, and label size.",
    ]:
        blocks.append(bullet(item))

    blocks.append(heading("10. Sources Checked", 1))
    for src in [
        "TSC TE244 India listing: https://shop.tscprintersindia.com/product/tsc-te244-barcode-printer/",
        "TSC TE244 Ahmedabad/Gujarat listing: https://www.easo.co.in/barcode-label-printer-tsc-te244.html",
        "MSG91 OTP pricing India: https://msg91.com/in/pricing/otp",
        "Vercel pricing: https://vercel.com/pricing",
        "Neon pricing: https://neon.com/pricing",
        "Firebase pricing / no-cost products: https://firebase.google.com/pricing",
        "Namecheap domain pricing reference: https://www.namecheap.com/domains.aspx",
    ]:
        blocks.append(para(src, size=8.5, color_hex="#374151", after=2))

    blocks.append(
        para(
            "This document is a pilot estimate, not a final vendor invoice. Hardware, cloud, SMS, domain, reward, and BUSY vendor charges should be confirmed at purchase/onboarding time.",
            italic=True,
            size=9,
            color_hex="#4B5563",
            before=10,
        )
    )

    sect = (
        "<w:sectPr>"
        f"<w:pgSz w:w=\"{PAGE_W}\" w:h=\"{PAGE_H}\"/>"
        f"<w:pgMar w:top=\"{MARGIN_TOP}\" w:right=\"{MARGIN_RIGHT}\" w:bottom=\"{MARGIN_BOTTOM}\" w:left=\"{MARGIN_LEFT}\" w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/>"
        "<w:cols w:space=\"708\"/>"
        "<w:docGrid w:linePitch=\"360\"/>"
        "</w:sectPr>"
    )
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {NS}><w:body>{"".join(blocks)}{sect}</w:body></w:document>'


def content_types() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>"""


def rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""


def doc_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>"""


def styles() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:color w:val="111827"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="280" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="0B2545"/><w:sz w:val="46"/><w:szCs w:val="46"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="374151"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="31"/><w:szCs w:val="31"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="25"/><w:szCs w:val="25"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="1F4E79"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:style>
</w:styles>"""


def numbering() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="2">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>"""


def settings() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>"""


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types())
        z.writestr("_rels/.rels", rels())
        z.writestr("word/_rels/document.xml.rels", doc_rels())
        z.writestr("word/document.xml", document_xml())
        z.writestr("word/styles.xml", styles())
        z.writestr("word/numbering.xml", numbering())
        z.writestr("word/settings.xml", settings())
    print(OUT)


if __name__ == "__main__":
    main()

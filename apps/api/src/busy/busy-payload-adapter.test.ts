import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "@volt-rewards/domain";
import { mapBusyVoucherPayload } from "./busy-payload-adapter.js";

const saleWithRefStyleXml = `
<Sale>
  <Date>07-02-2026</Date>
  <VchType>9</VchType>
  <VchNo>12/2025-26</VchNo>
  <BillingDetails>
    <PartyName>Busy Infotech Pvt. Ltd.</PartyName>
    <tmpVchCode>25</tmpVchCode>
    <tmpStateName>Delhi</tmpStateName>
  </BillingDetails>
  <ItemEntries>
    <ItemDetail>
      <SrNo>1</SrNo>
      <ItemName>TestItem One</ItemName>
      <UnitName>Pcs.</UnitName>
      <Qty>5</Qty>
      <Price>200</Price>
      <NettAmount>1000</NettAmount>
      <ItemTaxCategory>GST 12%</ItemTaxCategory>
      <tmpGroupName>General</tmpGroupName>
      <tmpItemCode>40291</tmpItemCode>
    </ItemDetail> # BUSY exports comments in the sample file
  </ItemEntries>
  <tmpTotalAmt>1000</tmpTotalAmt>
</Sale>
`;

test("BUSY SaleWithRef-style XML maps invoice metadata and item details", () => {
  const mapped = mapBusyVoucherPayload(saleWithRefStyleXml);

  assert.equal(mapped.kind, "sale");
  if (mapped.kind !== "sale") {
    return;
  }

  assert.equal(mapped.invoice.externalInvoiceId, "25");
  assert.equal(mapped.invoice.invoiceNumber, "12/2025-26");
  assert.equal(mapped.invoice.invoiceDate.toISOString(), "2026-02-06T18:30:00.000Z");
  assert.equal(mapped.invoice.customerRef, "Busy Infotech Pvt. Ltd.");
  assert.equal(mapped.invoice.customer.name, "Busy Infotech Pvt. Ltd.");
  assert.equal(mapped.invoice.placeOfSupply, "Delhi");
  assert.equal(mapped.invoice.finalTotal, "1000.00");

  const line = mapped.invoice.lines[0];
  assert.ok(line);
  assert.equal(line.externalLineId, "25:line:1");
  assert.equal(line.sku, "40291");
  assert.equal(line.productName, "TestItem One");
  assert.equal(line.category, "General");
  assert.equal(line.unit, "Pcs.");
  assert.equal(line.quantity, 5);
  assert.equal(line.unitRate, "200.00");
  assert.equal(line.taxableValue, "1000.00");
  assert.equal(line.gstRatePercent, "12.00");
  assert.equal(line.pointsPerUnit, 0);
});

test("BUSY return payload maps linked original invoice and original line reference", () => {
  const mapped = mapBusyVoucherPayload({
    Sale: {
      Date: "08-02-2026",
      VchType: "Return",
      VchNo: "SR/25/1",
      BillingDetails: {
        PartyName: "Busy Infotech Pvt. Ltd.",
        tmpVchCode: "30",
      },
      OriginalSaleTmpVchCode: "25",
      ItemEntries: {
        ItemDetail: {
          SrNo: "1",
          OriginalSrNo: "1",
          ItemName: "TestItem One",
          UnitName: "Pcs.",
          Qty: "2",
          Price: "200",
          tmpItemCode: "40291",
        },
      },
    },
  });

  assert.equal(mapped.kind, "return");
  if (mapped.kind !== "return") {
    return;
  }

  assert.equal(mapped.returnVoucher.externalReturnId, "30");
  assert.equal(mapped.returnVoucher.returnNumber, "SR/25/1");
  assert.equal(mapped.returnVoucher.originalExternalInvoiceId, "25");
  assert.equal(mapped.returnVoucher.customerRef, "Busy Infotech Pvt. Ltd.");
  const line = mapped.returnVoucher.lines[0];
  assert.ok(line);
  assert.equal(line.externalReturnLineId, "30:line:1");
  assert.equal(line.originalExternalLineId, "25:line:1");
  assert.equal(line.sku, "40291");
  assert.equal(line.quantity, 2);
});

test("BUSY adapter ignores unsupported voucher types", () => {
  const mapped = mapBusyVoucherPayload("<Purchase><VchType>Purchase</VchType></Purchase>");

  assert.deepEqual(mapped, {
    kind: "ignored",
    voucherType: "Purchase",
    reason: "Only BUSY Sale and Return vouchers affect Volt Rewards QR workflows.",
  });
});

test("BUSY adapter rejects required sale line fields deterministically", () => {
  assert.throws(
    () =>
      mapBusyVoucherPayload(`
        <Sale>
          <Date>07-02-2026</Date>
          <VchType>Sale</VchType>
          <BillingDetails>
            <PartyName>Busy Infotech Pvt. Ltd.</PartyName>
            <tmpVchCode>25</tmpVchCode>
          </BillingDetails>
          <ItemEntries>
            <ItemDetail>
              <SrNo>1</SrNo>
              <ItemName>TestItem One</ItemName>
              <Qty>5</Qty>
              <Price>200</Price>
            </ItemDetail>
          </ItemEntries>
        </Sale>
      `),
    (error) => error instanceof DomainError && error.code === "BUSY_ADAPTER_FIELD_REQUIRED",
  );
});

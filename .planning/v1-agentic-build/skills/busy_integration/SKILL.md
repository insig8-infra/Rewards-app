---
name: busy-integration
description: |
  Design or review BUSY invoice and return integration. Use when mapping BUSY fields, mock invoice adapters, return checks, idempotent imports, or QR print eligibility from invoice data. Do NOT use for mobile UI work.
version: 0.1.0
authority: read-only
---
# BUSY Integration

## When To Use

- Defining mock BUSY invoice data.
- Mapping invoice, line item, SKU, quantity, return, full-return all-lines, and exchange fields.
- Implementing import idempotency.
- Implementing later-print eligibility checks for Not Printed units.

## When Not To Use

- Reward catalog UI.
- General auth logic.

## Workflow

1. Check whether real BUSY sample data exists.
2. If not, implement only a mock adapter and mark production mapping as open.
3. Keep import idempotent by external invoice/line identifiers.
4. Store raw source references needed for audit/debug.
5. Add tests for duplicate import, missing fields, and partial return scenarios.

## Required Checks

- Invoice quantity is the maximum QR-printable quantity.
- Returned quantity blocks later printing where applicable.
- Duplicate import cannot duplicate QR unit records.
- Integration errors are visible and actionable.

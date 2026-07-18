# Data Model Draft

Status: Draft. Field names are conceptual until implementation stack and database conventions are locked.

## Identity And Roles

### `users`

Represents humans who can authenticate directly.

- `id`
- `role`: OWNER, STAFF, CONTRACTOR
- `mobile_number`
- `display_name`
- `photo_url`
- `status`: active, deactivated
- `created_at`
- `updated_at`

For contractors, `display_name` is the app-facing human contractor name used by Admin Web, Admin Mobile, end-user mobile, Team Member Recent, reward fulfillment, reports, and scan history. Do not duplicate it on `contractor_profiles` unless a future approved identity model separates display name, legal name, and business/shop name.

Team Member is not modeled as a full user in v1. Team Member is a temporary session actor tied to mobile number, selected contractor, and device/session context. Scan attempts persist Team Member mobile/session attribution for history and audit.

### `staff_profiles`

- `user_id`
- `pin_hash`
- `created_by_owner_id`
- `last_opened_at`
- `deactivated_at`

### `contractor_profiles`

- `user_id`
- `temporary_mpin_hash`
- `temporary_mpin_expires_at`
- `mpin_hash`
- `mpin_set_at`
- `mpin_reset_required`
- `belongs_to_note`: open admin-entered text area for where the contractor belongs / is associated; final label can be adjusted during UI copy.
- `tier`
- `total_points_accumulated`
- `available_points`
- `deactivated_at`

### `team_member_sessions`

- `id`
- `team_member_mobile_number`
- `contractor_id`
- `selected_site_id`
- `expires_at`
- `otp_verified_at`
- `device_id_hash`

## Sites

### `sites`

- `id`
- `contractor_id`
- `client_name`
- `flat_or_apartment_no`
- `building_name`
- `area`
- `city`
- `status`: active, archived
- `created_at`
- `updated_at`

Sites should be archived, not hard-deleted, after scans exist.

## BUSY And Invoices

### `busy_invoices`

- `id`
- `external_invoice_id`
- `source_system`: BUSY
- `company_id`
- `voucher_code`
- `voucher_type`
- `voucher_series_name`
- `voucher_series_code`
- `invoice_number`
- `invoice_date`
- `invoice_time`
- `stock_updation_date`
- `customer_ref`
- `party_name`
- `party_code`
- `party_state`
- `party_gstin`
- `store_name`
- `store_code`
- `currency`
- `status`: active, cancelled
- `total_quantity`
- `taxable_amount`
- `gst_amount`
- `cgst_amount`
- `sgst_amount`
- `igst_amount`
- `final_amount`
- `last_busy_event_id`
- `last_payload_hash`
- `raw_source`
- `imported_at`
- `updated_at`
- `cancelled_at`

### `busy_invoice_lines`

- `id`
- `invoice_id`
- `external_line_id`
- `busy_sr_no`
- `item_code`
- `sku`
- `product_name`
- `brand`
- `category`
- `hsn_code`
- `unit_name`
- `alt_unit_name`
- `quantity`
- `returned_quantity`: derived from linked return allocations for read models; BUSY does not mutate original sale lines.
- `tax_category`
- `tax_rate`
- `price`
- `list_price`
- `amount`
- `net_amount`
- `discount`
- `store_code`
- `store_name`
- `raw_source`

### `item_codes`

Operator-facing BUSY ItemCodes master used to resolve QR point values before printing.

- `id`
- `temp_item_code`: BUSY `TempItemCode` / `tmpItemCode`, unique.
- `item_name`
- `product_category`
- `price`
- `fixed_points`: nullable integer, displayed in Admin Web as `Absolute Points`.
- `percent_of_price_points`: nullable numeric percentage.
- `status`: in_use, not_in_use, not_in_busy.
- `busy_active`: true when present in the latest BUSY item master/invoice refresh.
- `last_busy_sync_at`
- `missing_since`
- `source_price_field`: optional metadata once BUSY confirms price semantics.
- `raw_source`
- `created_at`
- `updated_at`

Rules:

- `fixed_points` (`Absolute Points`) and `percent_of_price_points` (`% of Price`) are the editable reward-rule fields.
- Both reward-rule fields blank means `not_in_use`.
- Exactly one reward-rule field may be populated for active use. `Absolute Points` or `% of Price` populated means `in_use`; both blank means `not_in_use`; both populated is invalid.
- Missing/deactivated from BUSY means `not_in_busy`; future QR generation should not use that item, but already printed QR units keep their stored point value.
- Until production BUSY APIs exist, seed this table from a realistic dummy electrical-shop item list with `Absolute Points` populated and `% of Price` blank.
- `% of Price Points` and `Final Points` are derived read-model fields, not separate manual storage.

### `busy_return_vouchers`

- `id`
- `external_return_id`
- `return_number`
- `return_date`
- `original_invoice_id`
- `status`: imported, conflict
- `raw_source`
- `imported_at`
- `created_at`
- `updated_at`

### `busy_return_voucher_lines`

- `id`
- `return_voucher_id`
- `external_return_line_id`
- `sku` / BUSY `tmpItemCode`
- `product_name`
- `unit`
- `quantity`
- `original_invoice_line_id`: optional when BUSY gives a strong original line reference or allocation resolves one unambiguously.
- `pooled_by_item_code`: true when allocation used original invoice + `tmpItemCode` because no original line reference existed.
- `raw_source`

### `busy_return_allocations`

- `id`
- `return_line_id`
- `original_invoice_line_id`
- `qr_unit_id`: optional exact local QR unit selected by deterministic allocation.
- `quantity`
- `type`: not_printed_unavailable, printed_cancel_eligible, scanned_review_needed, scanned_reversed
- `created_at`

### `busy_integration_events`

- `id`
- `source_system`
- `company_id`
- `event_id`
- `event_type`: sale_invoice_upsert, sale_invoice_cancel, sale_return
- `idempotency_key`
- `external_invoice_id`
- `payload_hash`
- `status`: accepted, rejected, conflict, retryable_error
- `error_code`
- `error_message`
- `raw_payload`
- `received_at`
- `processed_at`

## QR Units

### `qr_units`

- `id`
- `invoice_line_id`
- `unit_index`
- `current_token_hash`
- `status`: NOT_PRINTED, PRINTED_UNCLAIMED, RESERVED_IN_CART, SCANNED_CLAIMED, EXPIRED, CANCELLED, REPRINTED, REVERSED
- `printed_at`
- `expires_at`
- `reserved_at`
- `reserved_cart_id`
- `resolved_points_at_print`: copied from `item_codes` at print/reprint time and used for scan/cart/ledger credit even if the ItemCode rule changes later.
- `scanned_at`
- `scanned_by_actor_type`: CONTRACTOR, TEAM_MEMBER
- `scanned_by_user_id`
- `scanned_by_team_member_mobile`
- `site_id`
- `replacement_for_qr_unit_id`
- `created_at`
- `updated_at`

### `qr_tokens`

- `id`
- `qr_unit_id`
- `token_hash`
- `status`: active, invalidated
- `created_at`
- `invalidated_at`

## Scan Attempts

### `scan_carts`

- `id`
- `contractor_id`
- `site_id`
- `actor_type`: CONTRACTOR, TEAM_MEMBER
- `actor_user_id`
- `team_member_session_id`
- `team_member_mobile_number`
- `status`: active, committed, abandoned_if_future, invalidated_if_future
- `cart_total_points`
- `scan_cap_points`: deprecated after MANUALUAT2A; do not enforce a v1 point-value cart cap
- `created_at`
- `last_activity_at`
- `committed_at`

Notes:

- Active carts persist across app visits and are not automatically cleared by a short TTL.
- Reserved cart items remain valid after later QR expiry unless an explicit invalidation rule applies.
- A contractor/site context should have at most one active cart per approved actor/session policy.
- `scan_cap_points` is deprecated for v1 behavior after MANUALUAT2A. Do not reject otherwise-valid scans by cart point total.
- Client flows guard navigation away from Scan when reserved cart items exist.
- Client Demo 2 adds a UI context reset: every Scan QR visit starts with no active scan-site selected, and successful `Add to account` clears active scan-site selection for the next batch. This UI reset must not delete retryable reserved cart items after a technical commit failure.

### `scan_cart_items`

- `id`
- `scan_cart_id`
- `qr_unit_id`
- `scan_attempt_id`
- `qr_value_points`
- `points_to_credit`
- `status`: reserved, committed, removed_by_user, invalidated
- `reserved_at`
- `committed_at`
- `removed_at`
- `invalidated_at`
- `invalidation_reason`
- `created_at`
- `updated_at`

Notes:

- Only successfully validated scans create cart items.
- Failed scans are recorded in `scan_attempts` and never create cart items.
- Technical failure during `Add to account` leaves reserved items unchanged for retry.

### `scan_attempts`

- `id`
- `qr_unit_id`
- `token_hash_seen`
- `actor_type`
- `actor_user_id`
- `team_member_session_id`
- `team_member_mobile_number`
- `contractor_id`
- `site_id`
- `result`: reserved, committed, already_claimed, expired, invalid, replaced, cart_cap_reached, network_retry, permission_denied
- `failure_reason`
- `qr_value_points`
- `credited_points`
- `scan_cart_id`
- `scan_cart_item_id`
- `created_at`

## Points And Rewards

### `points_ledger`

- `id`
- `contractor_id`
- `event_type`: scan_credit, qr_reverse, reward_redeem, reward_cancel_restore, manual_adjustment_if_future
- `points_delta`
- `balance_after`
- `source_type`
- `source_id`
- `created_at`

### `reward_catalog_items`

- `id`
- `name`
- `description`
- `points_required`
- `tier_required`
- `image_url`
- `status`

Product-grade catalog screens must populate and render `image_url` or a documented temporary catalog asset. Initials-only reward icons are a visible-shell fallback, not product completion.

### `reward_claims`

- `id`
- `claim_id`
- `contractor_id`
- `reward_item_id`
- `status`: chosen, cancelled_by_contractor, revoked_due_to_return, fulfilled
- `points_deducted`
- `chosen_at`
- `cancelled_at`
- `fulfilled_at`
- `fulfilled_by_owner_id`

### `reward_ledger`

- `id`
- `contractor_id`
- `reward_claim_id`
- `event_type`
- `points_delta`
- `balance_after`
- `created_at`

## Admin And Audit

### `audit_events`

- `id`
- `actor_type`
- `actor_id`
- `surface`: end_user_app, admin_mobile, admin_web, backend_job
- `action`
- `target_type`
- `target_id`
- `metadata`
- `created_at`

### `promotions`

- `id`
- `title`
- `body`
- `asset_url`
- `target_persona`
- `status`
- `starts_at`
- `ends_at`

## Reports

Reports should be generated from normalized tables above. Cache/materialized views can be added later if performance requires it.

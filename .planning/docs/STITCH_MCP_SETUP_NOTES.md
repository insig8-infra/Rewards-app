# Stitch MCP Setup Notes

**Created:** 2026-06-10  
**Status:** Handoff notes for next session  
**Secret policy:** Do not store the Stitch API key in this repo, prompt files, PRD docs, or client deliverables.

## Official Page Checked

Official setup page:

- https://stitch.withgoogle.com/docs/mcp/setup

The page is a JavaScript-rendered Stitch docs page. Raw HTML confirms the page title and description:

- Title: `Stitch via MCP - Stitch Docs`
- Description: `Connect IDEs and CLIs to Stitch using the Model Context Protocol.`

## Hosted MCP Config From Stitch Settings

The Stitch settings page provided a hosted MCP configuration. Prefer this over the community `npx` proxy route:

```toml
[mcp_servers.stitch]
url = "https://stitch.googleapis.com/mcp"

[mcp_servers.stitch.http_headers]
"X-Goog-Api-Key" = "<STITCH_API_KEY>"
```

Do not paste the real API key into this repository. If adding this to local Codex config, place it only in `~/.codex/config.toml` or another local/private MCP configuration file.

After adding this config, start a new Codex session so the `stitch` MCP server is loaded and its tools become available.

## Alternative MCP Package Identified

Context7 documentation resolves the relevant MCP package as:

- `@_davideast/stitch-mcp`

Alternative community proxy config shape:

```toml
[mcp_servers.stitch]
command = "npx"
args = ["@_davideast/stitch-mcp", "proxy"]
```

Known package commands from current docs:

```bash
npx @_davideast/stitch-mcp init
npx @_davideast/stitch-mcp view --projects
npx @_davideast/stitch-mcp screens -p <project-id>
```

Known virtual tool:

```bash
stitch tool get_screen_code -d '{
  "projectId": "PROJECT_ID",
  "screenId": "SCREEN_ID"
}'
```

## Authentication Handling

The hosted Stitch MCP config uses the `X-Goog-Api-Key` HTTP header.

The community proxy route supports API key auth through `STITCH_API_KEY`.

Do not hardcode the key into:

- `.planning/`
- `client-deliverables/`
- git-tracked files
- prompt documents

Preferred next-session approach:

1. Add the hosted Stitch MCP server config from Stitch settings to `~/.codex/config.toml`.
2. Use the real API key only in that local/private config, not in repo files.
3. Restart Codex so the new MCP server is loaded and Stitch tools appear.
4. Use Stitch MCP to list projects and screens.
5. Compare each Stitch screen against [Stitch_Frontend_App_Prompts.md](../../client-deliverables/Stitch_Frontend_App_Prompts.md).
6. Update prompts to match actual approved Stitch designs.

## Next Workflow

After Stitch MCP is connected:

1. List Stitch projects.
2. Identify the frontend app project.
3. List all screens.
4. Pull screen code/screenshots for each screen.
5. Compare against the current frontend prompt pack.
6. Update prompt pack only where Stitch design and prompt differ.
7. Then make future screen changes through this repo/prompt source of truth.

## Session Observations - 2026-06-11

- Hosted Stitch MCP is available in Codex with the local private config. Do not write or display the API key.
- Verified tools in this session: `list_projects`, `create_project`, `get_project`, `list_screens`, `get_screen`, `generate_screen_from_text`, `edit_screens`, and `upload_design_md`.
- Relevant project remains `Electrical Retailer Loyalty App` (`projects/255631333562829582`).
- `edit_screens` returns generated standardized screen resources that can be retrieved directly by returned screen ID, but `list_screens` and `get_project` continued to show the original 35 visible source screens after the edit batches.
- Treat MCP-generated variants as review/promote candidates until Stitch confirms they are visible source screens.
- Project-level design-system update is currently unreliable through MCP:
  - `update_design_system` returned `Request contains an invalid argument`.
  - `create_design_system` returned `Request contains an invalid argument`.
  - `upload_design_md` accepted a Volt Rewards DESIGN.md payload.
  - `create_design_system_from_design_md` then returned `Request contains an invalid argument`.
- Current practical workflow: use the local prompt pack as source of truth, generate or edit screen families in Stitch, then manually verify/promote the visible source screens in the Stitch UI if MCP does not expose promotion.

## Clean Project Session - 2026-06-11

- The original frontend project became messy after Stitch refresh, with multiple new screens appearing.
- A new private mobile project was created as the clean review target:
  - Title: `Volt Rewards - Clean End User Flow`
  - Project ID: `9940539769254693568`
  - Resource: `projects/9940539769254693568`
  - Design system asset: `assets/baaad88c73794da18984b9e731ea8dd4`
- Use the clean project as the active review target. Keep `Electrical Retailer Loyalty App` (`projects/255631333562829582`) as legacy/reference only unless the user explicitly asks to clean it.
- Full-flow generation should be done in smaller batches or individual screens. A one-shot full-flow prompt timed out.
- During initial clean-project generation on 2026-06-11, `list_screens` returned `{}` even though direct `get_screen` worked for generated screen IDs. This was superseded by the 2026-06-12 cleanup session; the current active clean-project inventory is the 36 kept visible screens returned by `list_screens`.
- The clean project design-system guidelines still contain stale wording such as generic `Rewards` bottom-nav and `Redeem`. Screen-generation prompts must explicitly require `Rewards & Balance`, `Claim`, `Collect`, and `Scan QR`.
- Helper screens require stricter verification. A generated Helper QR Expired screen initially leaked point/reward copy, and a replacement used the Material icon ligature `history`; both were superseded by a no-ligature replacement screen.
- No Stitch API key or MCP secret was written to repo files.

## Cleanup and Consistency Session - 2026-06-12

- User manually deleted duplicate/unneeded screens in `Volt Rewards - Clean End User Flow`.
- After cleanup, `list_screens` returned 36 kept visible screens. Use this current `list_screens` output, not the older generated/superseded ID map, as the active inventory.
- Final MCP verification after the documentation cleanup still returned the same 36 kept visible screens for `projects/9940539769254693568`.
- A one-screen-at-a-time `edit_screens` consistency pass was run against existing kept screen IDs only. The pass focused on:
  - Standard language toggle: `EN | हिंदी` as a compact top-right pill.
  - Contractor bottom nav: `Home`, `Scan`, `History`, `Rewards & Balance`.
  - Rewards icon: `card_giftcard` for rewards/catalog/claim/nav objects; `workspace_premium` reserved for tier/member badges.
  - Inner/result/error screens: no bottom navigation.
  - Helper screens: no ContractorID, points, balance, rewards, history, tier, wallet, claim, collect, or all-contractor directory.
- MCP caveat: one `edit_screens` call for Contractor History Ledger returned an unlisted generated variant (`df21cad0ebb64743be15909843ec93bc`) even though the prompt requested in-place editing. The visible kept inventory still remained 36 screens and did not include that variant. If it appears in Stitch UI after refresh, discard it manually.
- There is no exposed Stitch MCP delete-screen tool in this session, so cleanup/deletion remains a Stitch UI action.
- Practical workflow for future design edits: edit one screen at a time, immediately call `list_screens`, and stop if the visible screen count changes unexpectedly from 36.

## Volt Admin Stitch Session - 2026-06-13

- Active admin project: `Volt Admin Mobile App` (`projects/11128801461567928004`).
- Admin design system asset: `assets/3c9cd173ebbf4ea199fedaefaea901da`.
- `generate_screen_from_text` can create screens that are retrievable by direct `get_screen` even when they do not immediately appear in `list_screens`.
- `edit_screens` can still return a generated design object instead of `project.file_update` even when the prompt requests an in-place edit. Treat that as a hard stop condition.
- Known admin artifacts to discard if visible after refresh:
  - `projects/11128801461567928004/screens/25ef8579e3cd4816b68199058fd549e3` - `Reports Hub - OWNER View`.
  - `projects/11128801461567928004/screens/4cc090f5c254465a965fa3509cf7a722` - older generated `More`.
  - `projects/11128801461567928004/screens/4ed4fa91475c441bb920cec83aa37b41` - generated `Cancel QR Confirmation`.
  - `projects/11128801461567928004/screens/5bc89cebbccb41efba0706daeab675df` - generated `Contractor Detail - STAFF Read-only`.
  - `projects/11128801461567928004/screens/c6697fed76df4527ab0691e46d289cff` - generated `Cancel QR Success`.
- Latest clean regenerated admin screens:
  - `More` - `projects/11128801461567928004/screens/ccbc7cd7e7724e6e97544770210d80da`
  - `Staff Management` - `projects/11128801461567928004/screens/b752982f1eae4cc591e0674a6c5b17b5`
  - `Add Staff` - `projects/11128801461567928004/screens/c5a9cfacd4a8451991b7b0b80444c992`
  - `Staff Detail / PIN and Access` - `projects/11128801461567928004/screens/91ab777fb3dc41aab15010ac1fde3984`
  - `Contractor Leaderboard` - `projects/11128801461567928004/screens/e4a1ed5fc14b4d3dba3d7731835388f4`
- Resume admin edits only one screen at a time after confirming duplicate artifact visibility in Stitch.
- As of the 2026-06-14 resume pass, return-flow screens and STAFF Dashboard / STAFF contractor detail were updated with `project.file_update`; the next safe targets are `Profile and Language`, `About, Support, Privacy, Terms` visibility, and final inventory consistency.
- A later 2026-06-14 attempt to fix only the bottom nav on existing `Cancel QR Success` generated `c6697fed76df4527ab0691e46d289cff` instead of updating the original. Treat this as an existing-screen duplicate, not an intentional new STAFF or legal/support page.
- User then requested fresh replacement screens for `Cancel QR Success` and `Contractor Detail - STAFF Read-only` because the existing copies were not correct.
- Fresh replacement screens to keep:
  - `projects/11128801461567928004/screens/8206048fbb014847a796f18598f0b794` - `Cancel QR Success - Final`.
  - `projects/11128801461567928004/screens/86fac0a035e446d9a4a70584a371ee9e` - `STAFF - Contractor Detail Read-only - Final`.
- Latest safe in-place update:
  - `projects/11128801461567928004/screens/851018f32e534a3b9cde2c2f55bcbb0a` - `Profile and Language`, updated with `project.file_update` for profile identity, default language, session/security notes, support/legal links, and logout.
- Latest new legal/support screen:
  - `projects/11128801461567928004/screens/16f79f86cadb45e59c07c261639efe22` - `About - Volt Admin`.
  - `projects/11128801461567928004/screens/675806bf72db4dcd9fc9c7c001ab9fbc` - `Support - Volt Admin`.
  - `projects/11128801461567928004/screens/dae25b2116b7419fbdf484e0887e9086` - `Privacy Policy - Volt Admin`.
  - `projects/11128801461567928004/screens/d0f31ca89c7347ec91dd9f1f144c4f96` - `Terms & Conditions - Volt Admin`.
- Latest STAFF persona flow screen:
  - `projects/11128801461567928004/screens/316ba5ac61ad41a69d9e86342dd799eb` - `STAFF - Login`.
  - `projects/11128801461567928004/screens/f467bd4d628542c8bf8bcc74d1bd511f` - `STAFF - Access Blocked / Re-login`.
- Latest STAFF in-place flow update:
  - `projects/11128801461567928004/screens/804bc1cdcde44d39a115c0a13548f55f` - `STAFF Dashboard`, updated with `project.file_update` as the post-login STAFF landing screen.
  - `projects/11128801461567928004/screens/87388c0430ae4cf286762157bc8620cf` - `QR Status - Cancel Eligible`, updated with `project.file_update` as STAFF Cancel-only status after scanning an unused/uncollected, not-expired QR.
  - `projects/11128801461567928004/screens/4ed4fa91475c441bb920cec83aa37b41` - `Cancel QR Confirmation`, updated with `project.file_update` as STAFF confirmation with fixed Product Returned reason, label-discard checkbox, and STAFF audit note.
  - `projects/11128801461567928004/screens/8206048fbb014847a796f18598f0b794` - `Cancel QR Success - Final`, updated with `project.file_update` as STAFF Cancel success with no points reversed and STAFF audit note.
  - `projects/11128801461567928004/screens/11ad9f5300044e02bc26a91bab4c7985` - `QR Status - Reverse Eligible`, updated with `project.file_update` as STAFF Reverse-only status for scanned/claimed QR with contractor and points details.
  - `projects/11128801461567928004/screens/0f94124fa5524e62abe50d2f73c1b3c8` - `Reverse QR Confirmation`, updated with `project.file_update` as STAFF confirmation with Product Returned reason, points reversal details, label-discard checkbox, and STAFF audit note.
  - `projects/11128801461567928004/screens/ba497731bb574e5b9d00e70880a70d59` - `Reverse QR Success`, updated with `project.file_update` as STAFF Reverse success with Reversed/Discarded result, balance-book note, and STAFF audit note.
  - `projects/11128801461567928004/screens/51b5216a46ec4e52baf3c477dfee4bf3` - `QR Status - Non-actionable`, updated with `project.file_update` as STAFF no-action result with expired example, no Cancel/Reverse actions, and support note.
  - `projects/11128801461567928004/screens/fa1fb99b94ce451889c06d066d36787a` - `Reward Fulfillment - Claim ID Entry`, updated with `project.file_update` as STAFF Claim ID verification entry with OTP security note.
  - `projects/11128801461567928004/screens/f878e9d7648f40f898ddbd3ca81c77c7` - `Reward Fulfillment - OTP Verification`, updated with `project.file_update` as STAFF contractor OTP verification with resend timer, MPIN warning, and fulfillment next-step hint.
  - `projects/11128801461567928004/screens/3ac14fb9cee04899ad15c6ef9f559cb1` - `Reward Fulfillment Success`, updated with `project.file_update` as STAFF Fulfilled completion with claim summary and audit trail.
  - `projects/11128801461567928004/screens/e4a1ed5fc14b4d3dba3d7731835388f4` - `Contractor Leaderboard`, updated with `project.file_update` as the STAFF Contractors-tab landing screen with read-only ranking, no Add/Edit/Deactivate/export controls, and read-only contractor navigation entries.
  - `projects/11128801461567928004/screens/a5aaaea036534871ba2fc0f9cb26b9ec` - `Contractors List`, updated with `project.file_update` as the STAFF read-only list with search, Active/Deactivated/Tier filters, no Add Contractor, and no edit/deactivate/manual point controls.
  - `projects/11128801461567928004/screens/86fac0a035e446d9a4a70584a371ee9e` - `STAFF - Contractor Detail Read-only - Final`, updated with `project.file_update` as a strict read-only detail screen; a follow-up in-place correction removed Return Scan/Fulfill Reward shortcuts and any operational/admin actions.
  - `projects/11128801461567928004/screens/c06a5958cdc34498a20dbf1a32f1e6cf` - `Reports Hub`, updated with `project.file_update` as the STAFF view-only report hub with More selected and no export/share/download controls.
  - `projects/11128801461567928004/screens/7d7dd0117c7e4d668a9d1440cece8d56` - `QR Printed Report`, updated with `project.file_update` as a STAFF view-only report detail with page-title header, More selected, and no export/share/print/generate QR controls.
  - `projects/11128801461567928004/screens/8aa264eed1064226a3dfbd69c044ace2` - `QR Status Report`, updated with `project.file_update` as a STAFF view-only lifecycle report with More selected, no export/share/reprint/Cancel/Reverse controls, and Return Scan guidance for eligible actions.
  - `projects/11128801461567928004/screens/3bc76ce4294d4863a98bedecf868f28f` - `Reward Claims Report`, updated with `project.file_update` as a STAFF view-only claim report using Pending Pickup/Fulfilled/Revoked wording and no export/share or in-report fulfillment buttons.
- Latest Stitch artifact stop condition:
  - Attempted in-place edit of `projects/11128801461567928004/screens/a35ee0117316490dac3633348aa7944b` - `Returns and Reversals Report` returned a generated design object instead of `project.file_update`.
  - Generated artifact: `projects/11128801461567928004/screens/2e36eaa2ce9648928191425465482de9` - `Returns & Reversals Report - STAFF View`.
  - Immediate `list_screens` still showed the original `a35ee0117316490dac3633348aa7944b` and did not list `2e36eaa2ce9648928191425465482de9`.
  - Treat the original `Returns and Reversals Report` as not yet safely updated. Discard the generated artifact if it appears after Stitch refresh unless the user explicitly chooses to keep/promote it.
- Latest return-scan update:
  - User confirmed `projects/11128801461567928004/screens/4580c459a432402fa3c27b81a56dc715` - `Return Scan Camera` is the only STAFF return-scan screen visible and should be kept for now.
  - Treat `4580c459a432402fa3c27b81a56dc715` as the active STAFF return-scan screen.
- Next queue:
  - Continue remaining STAFF persona flow screens one at a time.
- User plans to delete old copies:
  - `projects/11128801461567928004/screens/6ec1b7e82fa94d5caaa7d294fe4a415f` - old `Cancel QR Success`.
  - `projects/11128801461567928004/screens/c6697fed76df4527ab0691e46d289cff` - generated `Cancel QR Success`.
  - `projects/11128801461567928004/screens/abd9cc0f0ee44643a6c375d8fbafd11c` - old `Contractor Detail - STAFF Read-only`.
  - `projects/11128801461567928004/screens/5bc89cebbccb41efba0706daeab675df` - generated `Contractor Detail - STAFF Read-only`.

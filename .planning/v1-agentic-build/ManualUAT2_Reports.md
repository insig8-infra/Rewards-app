
Issues - 

- Report Library is taking a lot of space leaving less room for actual report to be displayed. Actual reports should have entire screen avaialble. 
- The Top Row Statistics "QR Printed", "QR Scanned/Claimed" .....etc. are as per the report selected from the Report Library. Instead these number should be Important / Key and attention worthy stats that dont change on report selection or on changing filters below (on selected report)
-PDF and Excel both not working 
- Where is this "QR_NOT_SCANNABLE" Failure Reason coming from? If a Scan is failed, then failure reason should show the QR Status "Claimed","Cancelled", or "Already Claimed". 
- There should be a way to clear all filters (individually or clear all filters) present across all reports or lists across the app/ platform 
- In Reward Analytics - what is "Revoked Due To Return" Status? I dont think that scenario would ever exist ? no?
- While looking at the Report - Long reports are visually difficult to read - headers need to be fixed so when i scroll headers are not lost
- Instead of having a long list of dropdown Sort option , a sort icon should be given for each column header - each performing Ascending, desending or No sort on clicking. 
- Rewards Claim Report and Reward Analytics are exact same report - why the duplication?
- On selecting "Custom" date range - it pushed existing filer fields out / down/ away - custom date range should be able to exist without changing the postion of already existing fields. 
- Remove - Product/Category Performance Report
- Remove - Contractor Deep Dive Report 
- Show some cool but very useful Charts / Graphs on the reports section which are of most value for the Owner 


Note - Take learning related to Reports / filters/ sorting from here and ensure other places of the app / platform / web portal are also in line with our requirement instead of just finxing the reports

## Correction Pass - 2026-07-08

Status: Applied in code and planning docs. Manual browser retest still required.

| UAT Issue | Resolution |
|---|---|
| Report Library consumes too much width | Replaced left sidebar with compact horizontal report selector so active report uses full page width. |
| Top row stats change with selected report/filter | Reports landing cards are now platform-wide attention metrics loaded independently from report filters. |
| PDF/Excel not working | Root cause found after UAT: export controller used Express-style `setHeader` while the API runs on Fastify, and export audit could fail when a header/dev actor ID did not exist in `User`. Fixed with Fastify `reply.header(...)`, audit actor validation, a new controller boundary test, and live Excel endpoint smoke proof. Manual browser download proof remains required. |
| `QR_NOT_SCANNABLE` visible | Scan History now maps internal scan failure codes to owner-facing labels such as `Claimed`, `Cancelled`, `Already Claimed`, `Expired`, or `Permission Denied`. |
| Need clear filters | Added visible `Clear filters` action; added `REP-008` standard for report/list surfaces. |
| `Revoked Due To Return` visible | Reports and Admin Web Rewards now surface this as `Claim Cancelled` / `Cancelled / Points Restored` instead of a separate owner-facing status. Business can reopen if a distinct lifecycle is approved. |
| Long reports lose headers | Report table headers are sticky inside the scroll container. |
| Sort dropdown too long | Removed report sort dropdown and added column header sort buttons cycling ascending, descending, and none. |
| Reward Claims and Rewards Analytics duplicate | Removed `Rewards Analytics` from first-pass report library. |
| Custom date range shifts filters | From/To date controls now occupy reserved slots and are disabled unless `Custom` is selected. |
| Remove Product/Category Performance | Removed from frontend and backend report ID contract. Top-products chart keeps the useful insight. |
| Remove Contractor Deep Dive | Removed from frontend and backend report ID contract. Contractor Leaderboard remains. |
| Add useful charts/graphs | Added QR lifecycle mix, reward fulfillment funnel, points movement, and top claimed products charts. |

Harness update:

- Future report/list phases must define report purpose, stable filter layout, clear filters, sticky headers, per-column sort, and owner-facing status vocabulary before implementation.

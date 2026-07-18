# Manual UAT 1 - Agentic Engineering Review

Date started: 2026-07-06
Build paused after: Phase 19 - Admin Mobile QR Return Operations

Codex triage: `MANUAL_UAT1_TRIAGE.md`

## Test URLs

- API: http://127.0.0.1:3000/api
- Admin Web: http://127.0.0.1:3001
- End-user Mobile Web: http://127.0.0.1:3002
- Admin Mobile Web: http://127.0.0.1:3003

## Test Logins

### Admin Web

Current dev build uses a top-right development actor selector instead of a production login screen.

- OWNER actor: select `OWNER`
- STAFF actor: select `STAFF`

Reference seeded identities used by the backend:

- OWNER: `9000000091` / PIN `1111` / Shishir Mehta
- STAFF: `9000000092` / PIN `2222` / Aarti Deshmukh

UAT note: if the lack of real Admin Web login feels wrong for production-grade flow, log it as a product/process gap.

### Admin Mobile

- OWNER: mobile `9000000091`, PIN `1111`, name Shishir Mehta
- STAFF: mobile `9000000092`, PIN `2222`, name Aarti Deshmukh

### End-User App - Contractor

- Contractor mobile: `1`
- MPIN: `1234`
- Name: Ramesh Sharma
- Contractor code: `CON-0001`

### End-User App - Team Member

- Select the Team Member/helper login flow.
- Contractor mobile: `9000001001`
- Team member mobile: `9000011111`
- OTP: click/send OTP and enter the mock OTP displayed in the local dev screen. OTPs are dynamic and valid for 10 minutes.

Team Member is currently a temporary session identity, not a saved staff-style profile.



Issues 

Admin WEB Portal 

1. Dashboard 
- Make things clicklable with fully functioning workflows inside if applicable. Is i click on count of contractors it should take me to the contractors section where all contractor related workflows can be performed. Same for other available tiles
- Owner Dashboard section on Dashboard tab seems to be of no value. instead make the Dashboard itself feel like an actual dashboard - all important things at one place, dashboard serves the purpose of being that hawk eye view of key things happening, important numbers and statistics, basic insights into numbers. 
- Make the page dynamic - Owner should be able to click and go into those sections with ease, navigate back with less friction. 

2. Print QR Codes - 

BUSY Invoices section - 
A. IMPORTANT BUSY DEVELOPER UPDATE - HOW RETURN / CANCELLATION IS HANDLED. 
When a product is returned - the original invoice does not change. Instead a NEW invoice is created which shows the Return of Sale entry AND this new invoice is LINKED to the old invoice. The linkage does not happen on item level, it just happens on voucher level. There is also no unique identifier for each item. So, if say a invoice 1001 is created with 5 Atomberg Fans and 2 havells bulbs. A day later 1 Atomberg Fan is returned. Then a new invoice 1002 will be created which will have entry for Atomberg Fan is retunred and invoice 1002 will have a linkage to 1001. So what we need to do is - if we identify an invoice which is return of sale , track the original invoice , verify if that product existed on original invoice, check quantities sold, check quantities returned , identify if of the 5 atomberg fans if atleast 1 QR code is unscanned. If yes, we avoid reversal of points and simple cancel the QR code and update our logs. If all 5 QR codes for that tempItemCode are scanned then we go for reversal of points from 1 of them. 

B. The latest Invoice pushed from BUSY Backend to our backend should be at the top. Every invoice tile should indicate time and date of import. 

C. Return of Sale Invoices should not be shown seperately for QR printing. Since Admin Mobile App will scan the QR code on the returned product - it should be able to identify the invoice in our backend it is from and update points as per the action (Cancel vs Reverse). Our Admin Web Portal will simply show it as an update on that original invoice. 

D. Invoices that have nothing to print should not show in the main BUSY Invoices section, apart from Print History Tab, best to have a Invoices tab that is a record of all invoices fetched from BUSY with required sort, search , pre-built filters, and global search on invoice metadata. 


3.  Print History Tab
- App: Admin Web Portal
- Persona:OWNER
- URL:http://127.0.0.1:3001/#print-history
- Screen/workflow:Print History Tab
- Instead of it sitting at the bottom of Print QR tab, it should be a seperate screen / tab. 
- Expected: Seperate page for Print History with pre-defined filters, sorting by various types , search by invoice or date or product names. Every invoice is clickable that takes us to the history of that particular invoice. 
- Actual: shows a very static section on the print QR page
- Severity: High
- Category: Visual design gap , a production grade high quality web portal will not show it like this

4. Registering a contractor sits at the bottom of the page. It takes a long scroll to reach there especially if the contractor directory is big. It should be available at the top. 

Applicable to Contractor tab and in general as well - Current design feels very immature and intern-made. Elements on the page are placed without any design and User Experience consideration. Every click pushes other elements down or away, the design should be well thought - placement of buttons, sections, opening of a section / dropdown  - everything should be considered and then screens must be designed. 
Rethink design of each screen from a persepctive of end-user - What makes sense for the end-user when they are looking at the dashbaord, Contractors tab. etc. (so on for every tab), how they would like to see the information, what would they like to see on top etc. how it should be shown (dropdown makes sense or something else?), if its a list are we providing filters, sorting, search functions.

5. While looking at Contractor Details - Fields like mobile number - text is popping out of the box - looks poor design. Sites says 1 but not clickable. 
Name Mobile Mobile Number fields for Edit are unnecessarily big. Editing should not be readily available on clicking a contractor details. Instead it should have a "Edit Contractor Details" that allows you to Photo. Name and Phone Number of the contractor CANNOT BE EDITED once saved. user can deactivate the contractor and create a new one if they wish to change Name or phone number of the contractor. 
- Contractor Photo section seems poorly designed and placed. Will a production -grade popular web portal place Photo section like this? Design quality should be reflected upon. If we need to import high quality design elements from MCPS like https://21st.dev/ then lets install it and get best designs, look anf feel etc. for our platform. 

6. Same feedback for Staff Tab - I can see unncessary huge boxes, text popping out of the designated box / space, add staff sits at the bottom , staff directory doesnt come with pre-defined filters, sorting by various types , search functionalities. 

Rewards, Reports and Promotion remain untested. Will be tested once they are fully built. 

7. lack of real Admin Web login feels wrong for production-grade flow - product/process gap. 


Admin Mobile App 

- Login Pin should have a "mask-off" feature where OWNER/ STAFF can verify the Pin by unmasking it. 
- Why is this a Mobile Web App? It should look and feel like an actual mobile app 
- Almost same kind of feedback for Mobile APP as web portal - things look very static , unclickable, misplaced, poorly designed. 
- Staff management is missing for OWNER 
- Dashboard is not dynamic, missing important shortcuts, key information, insights
- "Owner controls" section on dashbaord is just text. whats the use of that? Instead rethink entire design of the admin mobile app and these should be working, well placed sections in the app. 
- Contractors section should first should leaderboard of the contractors, a seperate section to view all contractors - with key requirements of the list (pre-defined filters, sorting by various types , search by various types of metadata related to contractor - ID, Name, Phone number etc)



End-User App - Contractor

- Why is this a Mobile Web App? It should look and feel like an actual mobile app 
- Login Pin should have a "mask-off" feature where CONTRACTOR can verify the Pin by unmasking it. 
- It only says Selected Site - but no option to Select a site or create a new site. 
- Almost same kind of feedback for Mobile APP as web portal - things look very static , unclickable, misplaced, poorly designed. 
- Featured Rewards - why does it show Delivered / collected ones? That should be only be seen in the history. 
- Featured Rewards does not show Images - rewards tiles seem very poosrly designed. 
- Recent Activity , History , and other sections - have these codes like "cmr98ztyl0019farsfuma50dm". which doesnt make sense, doesnt tell who made the action - Contractor (themself) or Team Member, etc. 
- Recent History, Lists, history, Balance book must have with key requirements of the list (pre-defined filters, sorting by various types , search by various types of metadata related to the list)
- Clicking on Points Avaialble should take you to Balance Book
- Balance Book looks very static - missing the pre-defined filters, sorting by various types , search by various types of metadata related to the balance book

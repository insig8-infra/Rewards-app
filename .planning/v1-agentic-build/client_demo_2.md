
Changes / Enhancements from Client Demo 2:

Admin Web Portal :

    Invoice Ledger Tab - 
        1. The Ledger Report must have a Date Range Filter like the one we have in Reports (along with FROM and TO fields)

    Contractors Tab - 
        1. Add Contractors - Open Text Area field to de added (where they belong to)
        2. Contractor Detail > Sites > On clicking it should also show Site-wise data i QR Scan data, Item-wise Data (Price of items went to this site, points collected for this site and so on). Objective is OWNER should be able to do analytics by site here. 

    Rewards Tab - 
        1. Rewards History Table must have a Date Range Filter like the one we have in Reports (along with FROM and TO fields) AND same sorting functionlity like Reports (sort each column)
        2. Currently - we check for the status of the claim when "Send OTP" is clicked to ensure we are not fulfilling any claim request which is cancelled. Instead, the claim desk must have only those claims which are valid and good to be fulfilled. Whenever, someone clicks on Rewards tab - the claim desk section should be automatically refreshed to pull only valid claims. 
        3. Rewards History Table should show a column "Fulfilled Date/Time"
        4. Rewards History Table column "Unlocked AT" must be renamed to "Claimed Date/Time"
        5. Manage Reward Catalog > New Reward > "Reward code" field must be System populated. 

    Promotions Tab - 
        1. Add a horizontal marquee text scroller controls as well - Font Type (max 10 options that dont break when hindi is selected), Bold, Italic, Colour

    ItemCodes (NEW Tab below Promotions tab)

        - Need new tab added called "ItemCodes". This is basically an entire list of TempItemCodes that we will fetch from BUSY. Every TempItemCode to have TempItemCode, Item Name, Product Category, Price, editable field for allocating Points, editable field for allocating "% of Price" Points, Status. TempItemCode, Item Name, Product Category, Price should come from BUSY Integration and is periodically refreshed. A manual Refresh button is provided as well. "Points" and "Points (% of Price)" are two editable fields - one has to be populated always , both cannot be blank. If both are blank Status of that Item will be "Not In Use", else Status will be "In Use'. 
        - If an item is use gets deactivated / missing from BUSY Sync , it should not impact the Points already allocated OR the QR codes already printed for that Item. End-users should be able to collect the points. BUT these items should not be available for future QRs since they wont show up in the future invoices. Status of such Items should be "Not in BUSY"
        - Till we get the BUSY API integration in place - use our dummy list and set Points according to that (leave "Points (% of Price)" blank)
        - Dashboard > Attention Queue must flag if any item has "Points" and "Points (% of Price)" both empty. 
     

End-user app CONTRACTOR persona - 
    
    Scan QR - 
        1. Currently "Scan Product QR Place code inside the frame" section is always visible below "Select or change site" section. Instead, it should only appear when CONTRACTOR selects a particular site. Everytime the Contractor visits "Scan QR" - they must select a site. DO NOT keep any site selected by default - we want the contractor to select the site everytime. But once selected, they can scans QRs (in batch if needed) for that site. After "Add to Account" is done site gets deselected and CONTRACTOR to select site again before doing next scans. 

End-user app TEAM MEMBER persona - 

    Scan QR - 
        1. Currently "Scan Product QR Place code inside the frame" section is always visible below "Select or change site" section. Instead, it should only appear when TEAM MEMBER selects a particular site. Everytime the Team Member visits "Scan QR" - they must select a site. DO NOT keep any site selected by default - we want the Team Member to select the site everytime. But once selected, they can scans QRs (in batch if needed) for that site. After "Add to Account" is done -  site gets deselected and  Team Member to select site again before doing next scans. 
        

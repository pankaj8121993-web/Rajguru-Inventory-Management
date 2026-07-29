# RAJGURU FOODS
# MASTER PRODUCT BLUEPRINT
## Manual Weighment-Slip, Lot, Provisional Stock, Warehouse, Insurance and Spatial Inventory Management Platform

**Document status:** Final consolidated master blueprint  
**Version:** 1.0  
**Prepared for:** Rajguru Foods  
**Primary use:** Product design, development, testing, implementation and governance  
**Recommended development agents:** OpenAI Codex or Claude Code  
**Recommended architecture:** Secure cloud-hosted modular monolith  
**Primary database:** Supabase PostgreSQL  
**Initial transaction mode:** Manual entry based on weighment slips  
**Initial spatial mode:** Multi-level location hierarchy with 2D layout; 3D as a later phase  

---

# 1. PRODUCT VISION

Build a secure, reliable, high-end and easy-to-use internal platform for complete stock, warehouse and inventory control at Rajguru Foods.

The platform must become the single operational source of truth for:

- Manual inward and outward based on weighment slips
- Farmer, trader, broker, auction, government and other stock sources
- Day-wise bulk entry
- Invoice-wise entry
- Multiple weighment slips against one commercial transaction
- Multiple commercial documents against one movement
- Final lots
- Provisional stock
- Unidentified stock
- Mixed stock
- Multiple plots
- Multiple godowns
- Open yards
- Bays
- Stacks
- Bins
- Heaps
- Exact and approximate location tracking
- Stock ownership
- Stored stock
- Own stock
- Government stock
- Pledged stock
- Stock under processing
- Internal transfers
- Fumigation
- Quality inspection
- Physical verification
- Approximate physical quantity
- Book stock
- Final reconciliation
- Gain
- Loss
- Damage
- Shortage
- Excess
- Employee responsibility
- Role-based approvals
- Controlled admin overrides
- Insurance coverage
- Underinsurance analysis
- Warehouse occupancy
- Interactive 2D layouts
- Future 3D layouts
- Dashboards
- Reports
- Audit trails
- Notifications
- Management summaries

The platform must reflect real agricultural warehouse operations. It must not force artificial precision where the lot, quality grade or exact storage location is not known at the time of inward.

---

# 2. CORE PRODUCT PRINCIPLES

## 2.1 Manual Weighment-Slip First

The application will initially operate through manual entry from physical, photographed, scanned or PDF weighment slips.

No direct weighbridge connection is required in the first version.

Supported initial entry sources:

- Individual manual entry
- Day-wise bulk entry
- Invoice-wise bulk entry
- Spreadsheet-style data entry
- Copy-paste from Excel
- Excel import
- CSV import
- Future OCR-assisted entry

Future-ready entry sources may include:

- Weighbridge API
- Local device connector
- OCR
- Mobile camera recognition

These future modes must not complicate the initial design.

## 2.2 Transaction-Led Stock

Posted stock must never be directly edited.

Every stock change must occur through a controlled business transaction such as:

- Inward
- Outward
- Internal transfer
- Lot identification
- Lot split
- Lot merge
- Ownership transfer
- Gain
- Loss
- Damage
- Sample issue
- Processing issue
- Processing receipt
- Reversal
- Adjustment
- Final reconciliation

## 2.3 Permanent Traceability

Every quantity must remain traceable to:

- Weighment slip
- Inward or outward transaction
- Source
- Party
- Owner
- Inventory segment
- Final lot or provisional batch
- Location
- User
- Responsible persons
- Supporting documents
- Approval
- Audit history

## 2.4 No False Accuracy

The platform must record what is known and clearly identify what is not known.

It must not force the user to invent:

- A final lot number
- An exact stack
- A final grade
- A final party allocation
- A precise physical quantity
- A precise location where only a plot or godown is known

## 2.5 Human Accountability

Every important operational step should record the responsible person.

## 2.6 Secure by Default

Access must be explicitly granted through roles, permissions and scopes.

## 2.7 Simple for Basic Users

The system must minimise:

- Typing
- Repetitive entry
- Technical terminology
- Hidden actions
- Multi-screen navigation
- Complex approval logic visible to the operator

## 2.8 Auditability

Original information must remain visible after:

- Correction
- Reclassification
- Override
- Reversal
- Adjustment
- Final reconciliation

---

# 3. CURRENT OPERATING ASSUMPTIONS

1. Weighment slips will be manually entered.
2. Weighbridge hardware will not be integrated initially.
3. One inward may relate to one or many weighment slips.
4. One invoice may relate to one or many weighment slips.
5. One weighment slip may require allocation into more than one stock segment where justified.
6. Inward may be created:
   - Vehicle-wise
   - Invoice-wise
   - Party-wise
   - Day-wise
   - Commodity-wise
   - Purchase-batch-wise
7. Final lot may not be known at inward.
8. Exact location may not be known at inward.
9. Physical verification may be approximate.
10. Admin override must be available but fully controlled.
11. One person may hold multiple roles.
12. A person must not approve their own controlled transaction.
13. The application will be cloud hosted.
14. Supabase PostgreSQL is the preferred source of truth.
15. 2D spatial mapping is part of the core design.
16. 3D spatial mapping is a later phase.
17. Insurance coverage must be tracked godown-wise and stock-wise.

---

# 4. MASTER DATA MANAGEMENT

The platform must include a configurable master-data module.

All masters must support:

- Unique code
- Name
- Description
- Active or inactive status
- Effective date
- Expiry date where relevant
- Created by
- Approved by
- Change history
- Attachments
- Notes
- Import
- Export
- Duplicate prevention
- Maker-checker approval where required

## 4.1 Organisation Masters

- Company
- Business unit
- Facility
- Branch
- Department
- Cost centre
- Profit centre
- Legal entity
- GST registration
- State
- District
- Taluka
- Village

## 4.2 Commodity Masters

- Commodity
- Commodity group
- Commodity category
- Variety
- Grade
- Crop year
- Origin
- Quality profile
- Standard moisture
- Standard bag size
- Standard unit
- Alternative units
- Conversion rules
- Shelf-life guidance
- Fumigation interval
- Storage restrictions
- Insurance category
- Processing category
- Finished-good mapping
- By-product mapping

Example commodities:

- Tur
- Lemon Tur
- Chana
- Maize
- Urad
- Moong
- Wheat
- Paddy
- Finished dal
- Broken
- Husk
- Packing material
- Chemical
- Other agricultural stock

## 4.3 Location Masters

- Facility
- Plot
- Survey number
- Godown
- Warehouse
- Building
- Open yard
- Floor
- Section
- Bay
- Zone
- Stack
- Bin
- Heap
- Loading point
- Unloading point
- Gate
- Weighbridge
- Restricted area
- Fumigation zone
- Fire-safety zone

## 4.4 Party Masters

- Farmer
- Farmer group
- Trader
- Broker
- Commission agent
- Supplier
- Customer
- Storage customer
- Government agency
- Auction agency
- Processor
- Transporter
- Fumigation vendor
- Insurance company
- Insurance broker
- Surveyor
- Bank
- Warehouse service provider
- Labour contractor
- Other party

Party master fields may include:

- Party code
- Legal name
- Trade name
- Party type
- GSTIN
- PAN
- Address
- Contact person
- Mobile
- Email
- Bank details
- Credit terms
- Storage agreement
- Broker reference
- Active status
- Supporting documents

## 4.5 Employee and User Masters

- Employee
- Designation
- Department
- Facility
- Reporting manager
- Employment status
- User account
- Roles
- Permissions
- Location scopes
- Approval limits
- Override authority
- Signature specimen
- Mobile
- Email
- Shift
- Training status

## 4.6 Vehicle and Transport Masters

- Vehicle
- Vehicle type
- Transporter
- Driver
- Trailer
- Capacity
- Registration number
- Validity documents
- Insurance validity
- Pollution validity
- Notes

## 4.7 Operational Masters

- Weighbridge
- Movement type
- Inward type
- Outward type
- Ownership type
- Stock status
- Lot status
- Quality status
- Fumigation status
- Verification method
- Confidence level
- Gain reason
- Loss reason
- Damage reason
- Rejection reason
- Adjustment reason
- Override reason
- Approval type
- Document type
- Unit of measurement
- Bag type
- Chemical
- Fumigation method
- Notification type
- Report format

## 4.8 Insurance Masters

- Insurance company
- Insurance broker
- Insurance policy type
- Coverage type
- Peril
- Exclusion
- Deductible type
- Endorsement type
- Surveyor
- Claim status
- Policy status
- Valuation basis
- Stock declaration method
- Insurance location
- Coverage allocation rule

---

# 5. USER, ROLE AND PERMISSION MODEL

## 5.1 Multiple Roles Per User

Use a many-to-many role structure.

One person may hold multiple roles.

One role may be held by multiple persons.

Roles may differ by:

- Company
- Facility
- Plot
- Godown
- Department
- Commodity
- Ownership type
- Transaction type
- Value limit
- Quantity limit

Example:

| User | Role | Scope |
|---|---|---|
| Ramesh | Warehouse Supervisor | Aliyabad Godown 1 |
| Ramesh | Fumigation Approver | Aliyabad Facility |
| Ramesh | Stock Viewer | All facilities |

## 5.2 Permission Types

- View
- Create
- Edit draft
- Submit
- Verify
- Approve
- Reject
- Reverse
- Adjust
- Override
- Export
- Print
- Upload
- Download
- Allocate
- Reclassify
- Transfer
- Close
- Reopen
- Manage master
- Manage user
- View valuation
- View insurance
- Edit insurance
- View audit history

## 5.3 Maker-Checker

A user may hold both maker and approver roles, but must not approve their own transaction where maker-checker applies.

## 5.4 Suggested Roles

- Super Administrator
- Business Administrator
- Management Viewer
- Warehouse Manager
- Warehouse Operator
- Weighment Entry Operator
- Weighment Verifier
- Gate Operator
- Quality Inspector
- Fumigation Operator
- Fumigation Approver
- Stock Accountant
- Dispatch Executive
- Physical Verification Team
- Discrepancy Reviewer
- Insurance Manager
- Insurance Viewer
- Auditor
- Report Viewer
- Read-Only User

## 5.5 Scope-Based Access

A user may be restricted to:

- One facility
- Selected plots
- Selected godowns
- Selected commodities
- Selected owners
- Selected transaction types
- Selected reports

---

# 6. MANUAL WEIGHMENT MANAGEMENT

## 6.1 Weighment Record

Each weighment record should capture:

- Internal weighment record number
- External weighment slip number
- Weighbridge name
- Date
- First weighment time
- Second weighment time
- Vehicle number
- Trailer number
- Driver
- Transporter
- Party
- Source category
- Commodity
- Variety
- Movement direction
- Gross weight
- Tare weight
- Calculated net weight
- Printed net weight
- Difference
- Number of bags
- Invoice
- Delivery challan
- Purchase or sale reference
- Gate entry
- Inward or outward reference
- Slip attachment
- Entry user
- Verification user
- Posting status
- Remarks

## 6.2 Net Weight Validation

Calculated net weight:

> Gross weight − Tare weight

Where printed net weight differs:

- Show difference
- Show percentage difference
- Require reason beyond tolerance
- Require approval where configured
- Preserve both values

## 6.3 Weighment Statuses

- Draft
- Awaiting document
- Awaiting verification
- Verified
- Partially allocated
- Fully allocated
- Posted
- Disputed
- Reversed
- Cancelled

## 6.4 Bulk Entry

Support:

- Spreadsheet grid
- Copy-paste from Excel
- Excel import
- CSV import
- Common-value application
- Row duplication
- Row-level validation
- Batch-level validation
- Save draft
- Upload attachments in bulk
- Partial posting
- Error export

## 6.5 Duplicate Detection

Check combinations of:

- Slip number
- Weighbridge
- Date
- Vehicle number
- Gross
- Tare
- Net
- Party
- Commodity
- Movement direction

Possible outcomes:

- Warning
- Reviewed and accepted
- Confirmed duplicate
- Cancelled
- Linked to earlier record

---

# 7. RECEIPT BATCH AND INVENTORY SEGMENT MODEL

A final lot number must not be mandatory at initial inward.

## 7.1 Receipt Batch

A receipt batch groups one or more weighment slips and represents a commercial or operational inward.

It may be:

- Vehicle-wise
- Invoice-wise
- Day-wise
- Party-wise
- Commodity-wise
- Purchase-contract-wise
- Auction-wise

## 7.2 Inventory Segment

Every posted quantity must have a permanent inventory-segment reference.

An inventory segment represents a distinct quantity with its currently known identity, ownership and location.

Fields:

- Segment number
- Receipt batch
- Commodity if known
- Variety if known
- Grade if known
- Owner
- Source
- Quantity
- Unit
- Identification status
- Identification confidence
- Location
- Location precision
- Final lot if assigned
- Quality status
- Fumigation status
- Restrictions
- Responsible person
- Supporting documents
- Audit history

The stock ledger should reference `inventory_segment_id`.

`lot_id` may remain nullable until later identification.

---

# 8. STOCK IDENTIFICATION LEVELS

## 8.1 Final Identified Lot

The lot is fully known.

## 8.2 Provisional Stock Batch

Broad identity is known but final lot is pending.

Suggested reference:

`PB-[FACILITY]-[DATE]-[RUNNING NUMBER]`

## 8.3 Unidentified Holding Pool

Broad physical stock exists but exact lot, grade, source or location is not yet established.

## 8.4 Mixed Stock Pool

Stock is known to contain multiple grades, suppliers, owners or potential lots and requires segregation.

## 8.5 Identification Confidence

- Confirmed
- Reasonably identified
- Provisional
- Mixed
- Unidentified
- Awaiting segregation
- Awaiting quality classification
- Awaiting source allocation

---

# 9. LOCATION HIERARCHY AND PRECISION

Recommended hierarchy:

**Company → Facility → Plot → Godown/Building/Open Yard → Section/Floor → Bay/Zone → Stack/Bin/Heap**

## 9.1 Location Precision

- Facility known
- Plot known
- Godown known
- Section or bay known
- Stack, bin or heap known
- Exact confirmed

A stock record may be validly posted at any supported node.

## 9.2 Location Master Fields

- Code
- Name
- Parent
- Type
- Plot number
- Survey number
- Address
- Length
- Width
- Height
- Area
- Volume
- Approved capacity
- Operational capacity
- Current occupancy
- Available capacity
- Commodity restrictions
- Storage method
- Fumigation suitability
- Insurance location reference
- Fire-protection details
- Operational status
- Responsible employee
- Layout coordinates
- Photographs
- Documents
- Notes

---

# 10. INWARD MANAGEMENT

## 10.1 Inward Modes

- Individual weighment inward
- Invoice-wise inward
- Day-wise bulk inward
- Purchase-batch inward
- Farmer-group inward
- Auction inward
- Storage inward
- Government stock inward
- Transfer inward
- Processing return inward
- Temporary unallocated inward

## 10.2 Inward Workflow

1. Enter weighment slip
2. Group into receipt batch
3. Record source and owner
4. Record commodity or provisional commodity
5. Record best-known location
6. Choose identification status
7. Assign final lot if known
8. Otherwise create provisional or unidentified inventory segment
9. Upload evidence
10. Verify
11. Approve
12. Post to stock ledger
13. Add pending identification or location task
14. Later identify, classify, segregate or transfer

## 10.3 Inward Fields

- Inward number
- Receipt batch
- Weighment slips
- Party
- Source type
- Owner
- Commodity
- Variety
- Grade
- Crop year
- Quantity
- Bags
- Quality
- Best-known location
- Location precision
- Inventory segment
- Lot if known
- Responsible employees
- Documents
- Remarks
- Approval

---

# 11. LATER IDENTIFICATION, CLASSIFICATION AND LOCATION REFINEMENT

## 11.1 Identify and Allocate Stock Workflow

Users should be able to:

- Select provisional stock
- Select quantity
- Assign existing lot
- Create new lot
- Split among several lots
- Update commodity
- Update variety
- Update grade
- Update crop year
- Update source allocation
- Assign exact location
- Add quality result
- Add photographs
- Submit for approval

## 11.2 Metadata Refinement Versus Physical Movement

### Metadata refinement

No physical movement happened.

Examples:

- Plot later identified as Godown 2
- Godown later identified as Bay B
- Tur later identified as Lemon Tur
- Final lot number assigned later

Use identification, classification or location-refinement transaction.

### Physical movement

Stock physically moved.

Use internal transfer.

The user must explicitly answer:

> Did the stock physically move?

## 11.3 Partial Identification

The system must support:

- Part of provisional stock allocated to Lot A
- Part allocated to Lot B
- Balance still pending

## 11.4 Partial Location Refinement

The system must support:

- Part allocated to Godown 1
- Part allocated to Godown 2
- Balance still at plot level

## 11.5 Correction Versus Reclassification

Correction means original entry was wrong.

Reclassification means original entry was reasonable but later information became available.

They must have separate workflows and reporting.

---

# 12. LOT MANAGEMENT

Each lot should contain:

- Lot number
- Commodity
- Variety
- Grade
- Crop year
- Origin
- Owner
- Stock category
- Original quantity
- Current book quantity
- Reserved quantity
- Available quantity
- Blocked quantity
- Damaged quantity
- Pledged quantity
- Source allocations
- Location allocations
- Quality history
- Fumigation history
- Verification history
- Insurance allocation
- Movement history
- Gain
- Loss
- Supporting documents
- Status

## 12.1 Lot Operations

- Create
- Identify
- Split
- Merge
- Transfer
- Reclassify
- Change ownership
- Reserve
- Release
- Process
- Close
- Reopen through approval

## 12.2 Lot Closure

Lot closure requires:

- Warehouse confirmation
- Location cleared
- Final physical check
- Final reconciliation
- Pending discrepancy review
- Gain or loss posting
- No active reservation
- No unresolved transfer
- Supervisor approval
- Stock accountant approval
- Final closure approval

---

# 13. INTERNAL TRANSFER

Support movement between:

- Facility
- Plot
- Godown
- Open yard
- Bay
- Stack
- Bin
- Heap
- Processing section

Workflow:

1. Transfer request
2. Source selection
3. Quantity
4. Approval
5. Issue
6. Movement
7. Receipt
8. Difference
9. Reconciliation
10. Posting

Capture responsible persons:

- Requestor
- Approver
- Issuer
- Labour contractor
- Vehicle or equipment operator
- Receiver
- Verifier

Transfer must preserve total stock.

---

# 14. OUTWARD MANAGEMENT

## 14.1 Outward Modes

- One invoice, one weighment
- One invoice, multiple weighments
- Multiple invoices, one vehicle
- Multiple lots, one vehicle
- One lot, multiple vehicles
- Day-wise bulk dispatch
- Delivery-order dispatch
- Government release
- Customer stored-stock release
- Internal transfer dispatch
- Exceptional outward from provisional stock
- Ownership transfer without movement

## 14.2 Controls

- Cannot exceed available stock
- Cannot use reserved stock
- Cannot dispatch blocked stock without override
- Cannot dispatch pledged stock without release
- Cannot dispatch fumigation-restricted stock without override
- Must reconcile to weighment
- Must preserve source lot or provisional segment
- Must preserve responsible persons

## 14.3 Exceptional Outward from Provisional Stock

Allowed only through controlled approval.

Must capture:

- Provisional reference
- Quantity
- Best-known location
- Outward weighment
- Customer or destination
- Reason
- Approver
- Final reconciliation requirement
- Evidence

---

# 15. QUALITY MANAGEMENT

Support commodity-wise quality templates.

Possible parameters:

- Moisture
- Foreign matter
- Other grains
- Damaged grains
- Discoloured grains
- Broken grains
- Weevilled grains
- Immature grains
- Admixture
- Infestation
- Odour
- Colour
- Size
- Density
- Aflatoxin
- Protein
- Oil content

Support:

- Pre-inward sample
- Vehicle sample
- Stack sample
- Periodic sample
- Dispatch sample
- Lab report
- Conditional approval
- Rejection
- Quality override
- Original result preservation

---

# 16. FUMIGATION MANAGEMENT

Fumigation may be recorded against:

- Facility
- Plot
- Godown
- Bay
- Stack
- Bin
- Provisional batch
- Unidentified pool
- Final lot

Fields:

- Fumigation number
- Date
- Location
- Lots or segments
- Quantity covered
- Chemical
- Batch
- Dosage
- Quantity consumed
- Vendor
- Operator
- Supervisor
- Start
- Exposure
- Opening date
- Safety period
- Result
- Follow-up
- Next due
- Photographs
- Certificate
- Remarks

Controls:

- Due alerts
- Overdue alerts
- Restricted dispatch
- Chemical stock
- Chemical expiry
- Repeat infestation
- Coverage certainty
- Admin extension
- Cost per tonne

When provisional stock later becomes final lots, fumigation history must flow to the final lots according to quantity and location coverage.

---

# 17. PHYSICAL VERIFICATION

## 17.1 Three Quantity Concepts

### Book quantity

Derived from posted stock transactions.

### Estimated physical quantity

Approximate physical estimate.

### Final reconciled quantity

Final quantity established after complete weighment, exhaustion or approved reconciliation.

## 17.2 Verification Methods

- Approximate bag count
- Complete bag count
- Sample weighing
- Stack dimension estimate
- Bulk volume estimate
- Average bag weight
- Visual estimate
- Complete weighment
- Other approved method

## 17.3 Confidence Levels

- Final verified
- High confidence
- Moderate confidence
- Approximate
- Visual only

## 17.4 Verification Scope

Verification may be performed at:

- Lot
- Inventory segment
- Provisional batch
- Commodity pool
- Stack
- Bay
- Godown
- Plot
- Facility

## 17.5 Reference Until Lot Closure

The latest approved verification remains a reference until:

- New verification
- Final lot closure

Subsequent movements should be shown against the reference estimate without treating it as exact.

## 17.6 Discrepancy Workflow

- Identified
- Under review
- Recount requested
- Explanation pending
- Monitoring until lot closure
- Adjustment recommended
- Adjustment approved
- Recovery initiated
- Closed without adjustment
- Closed after reconciliation

Approximate verification must never automatically change book stock.

---

# 18. GAIN, LOSS, DAMAGE AND ADJUSTMENT

## 18.1 Gain Reasons

- Moisture increase
- Weighment variation
- Excess receipt
- Processing recovery
- Physical verification surplus
- Bag-count correction
- Standardisation correction

## 18.2 Loss Reasons

- Moisture loss
- Drying loss
- Handling loss
- Spillage
- Transit loss
- Pest damage
- Rodent damage
- Water damage
- Theft
- Bag shortage
- Weighment difference
- Sampling
- Processing loss
- Fire
- Natural event
- Physical verification shortage

## 18.3 Controls

- Reason mandatory
- Supporting evidence
- Responsible person
- Tolerance comparison
- Approval according to quantity or value
- Recovery status
- Audit history
- No direct edit of stock

---

# 19. INSURANCE COVERAGE MANAGEMENT

Insurance must be tracked godown-wise, plot-wise, facility-wise and, where relevant, stock-category-wise.

The purpose is to help management identify:

- Total stock at risk
- Stock covered by insurance
- Uninsured stock
- Underinsured stock
- Overlapping coverage
- Expired policies
- Policies nearing expiry
- Locations not endorsed
- Commodities excluded
- Sum insured utilisation
- Average-clause risk
- Deductible impact
- Claim exposure

## 19.1 Insurance Policy Master

Fields:

- Policy internal reference
- Insurance company
- Insurance broker
- Policy number
- Policy type
- Policy status
- Start date
- Expiry date
- Sum insured
- Currency
- Premium
- GST
- Deductible
- Excess
- Valuation basis
- Declaration basis
- Average clause
- Co-insurance
- Reinstatement basis
- Escalation clause
- Add-on covers
- Perils covered
- Exclusions
- Commodity restrictions
- Ownership restrictions
- Storage conditions
- Security requirements
- Fire-protection requirements
- Fumigation requirements
- Warranty clauses
- Special conditions
- Policy document
- Endorsements
- Renewal history
- Responsible employee
- Notes

## 19.2 Location Coverage

A policy may cover:

- Entire facility
- Specific plot
- Specific godown
- Specific open yard
- Specific warehouse section
- Temporary storage location

Fields:

- Covered location
- Effective date
- Endorsement reference
- Location sum insured
- Maximum stock limit
- Commodity limits
- Excluded stock types
- Fire-risk category
- Flood-risk category
- Construction type
- Security arrangements
- Fire-safety equipment
- Last inspection
- Surveyor remarks

## 19.3 Stock Coverage Allocation

The system should support coverage allocation by:

- Facility
- Plot
- Godown
- Commodity
- Owner
- Stock category
- Policy
- Sub-limit
- Declared value
- Peak stock value
- Average stock value
- Manual allocation

## 19.4 Coverage Calculations

At minimum calculate:

### Current stock value at location

Based on configured valuation method.

### Available sum insured

After applying location and commodity sub-limits.

### Coverage ratio

> Available insurance cover ÷ Current insurable stock value

### Uninsured value

> Current insurable stock value − Available valid cover

### Potential underinsurance

Where stock value exceeds cover.

### Expiry risk

Policies expiring within configured days.

### Unendorsed location risk

Stock at location not included in policy.

### Excluded commodity risk

Commodity present but not covered.

The calculations are management indicators and do not replace legal interpretation of the policy.

## 19.5 Insurance Dashboard

Display:

- Total stock value
- Total valid cover
- Estimated uninsured value
- Estimated underinsured value
- Coverage ratio
- Policies expiring in 30, 60 and 90 days
- Expired policies
- Godowns without active cover
- Stock at unendorsed locations
- Commodity exclusions
- Location-wise coverage
- Policy-wise utilisation
- Claim history
- Open claims
- Missing policy documents
- Pending endorsements

## 19.6 Insurance Alerts

- Policy expiry
- Policy renewal due
- Sum insured exceeded
- Godown coverage exceeded
- Commodity sub-limit exceeded
- Stock moved to uncovered location
- Stock ownership not covered
- Fire-safety inspection overdue
- Endorsement pending
- Claim document pending
- Policy document missing

## 19.7 Insurance Reports

- Policy register
- Policy expiry report
- Godown-wise coverage
- Plot-wise coverage
- Commodity-wise coverage
- Stock value versus insurance
- Estimated underinsurance
- Uninsured stock
- Overlapping policy coverage
- Policy utilisation
- Endorsement register
- Claim register
- Claim document checklist
- Insurance audit report
- Fire-safety compliance report

## 19.8 Insurance Override

Management may manually override coverage allocation or valuation assumptions, but must capture:

- Original calculation
- Revised allocation
- Reason
- Supporting document
- Approver
- Effective period
- Audit trail

---

# 20. 2D INTERACTIVE WAREHOUSE LAYOUT

The 2D layout must be operational.

## 20.1 Layout Editor

Authorised users can:

- Create plot
- Draw godown
- Draw yard
- Draw bay
- Draw stack
- Draw bin
- Draw pathways
- Mark gates
- Mark weighbridge
- Mark loading points
- Mark restricted zones
- Upload floor plan
- Draw over plan
- Resize
- Rotate
- Lock
- Publish version

## 20.2 Stock Display

Clicking a location should show:

- Commodity
- Lot
- Provisional stock
- Owner
- Quantity
- Bag count
- Ageing
- Fumigation
- Quality
- Physical verification
- Discrepancy
- Insurance coverage
- Coverage ratio
- Responsible person
- Active alerts

## 20.3 Uncertainty Display

The layout must show:

- Exact stack stock
- Godown-level unallocated stock
- Plot-level stock
- Unplaced stock
- Mixed stock
- Identification pending
- Location pending
- Uninsured or underinsured stock

## 20.4 Visual States

- Empty
- Partially occupied
- Full
- Overcapacity
- Fumigation due
- Under fumigation
- Quarantined
- Damaged
- Discrepancy
- Provisional
- Uninsured
- Underinsured

The map must not directly alter stock. Movement requires a proper transfer transaction.

---

# 21. FUTURE 3D LAYOUT

3D should be generated from the same location data as 2D.

Features:

- Rotate
- Zoom
- Hide roof or wall
- View stack height
- View occupancy
- Filter commodity
- Filter owner
- Filter lot
- Filter fumigation
- Filter discrepancy
- Filter insurance coverage
- Click stock object

3D is not part of the first MVP.

---

# 22. ADMIN OVERRIDE FRAMEWORK

Admin override must be available for exceptional operations.

Possible override areas:

- Backdated transaction
- Location restriction
- Capacity limit
- Fumigation due date
- Fumigation restriction
- Quality status
- Reservation
- Ownership classification
- Party allocation
- Weighment allocation
- Lot closure
- Approval routing
- Physical verification status
- Insurance allocation
- Insurance valuation
- Dispatch restriction

Controls:

- Separate override permission
- Maker-checker
- High-risk dual approval
- Original value retained
- Reason mandatory
- Supporting document
- Temporary or permanent
- Expiry date
- Repeated override alert
- Audit report

Quantity must not be silently overwritten through override.

---

# 23. DASHBOARDS

## 23.1 Management Dashboard

- Total stock
- Own stock
- Stored stock
- Government stock
- Pledged stock
- Available stock
- Reserved stock
- Provisional stock
- Unidentified stock
- Commodity-wise stock
- Location-wise stock
- Ageing
- Gain and loss
- Fumigation due
- Physical discrepancy
- Underinsurance
- Expiring policies
- Pending approvals
- Critical alerts

## 23.2 Weighment Dashboard

- Draft weighments
- Awaiting verification
- Unallocated
- Partially allocated
- Duplicate warnings
- Corrected weighments
- Daily inward and outward

## 23.3 Identification Dashboard

- Lot pending
- Location pending
- Provisional stock
- Mixed stock
- Ageing
- Responsible person
- Exceptional outward
- Pending reconciliation

## 23.4 Warehouse Dashboard

- Occupancy
- Capacity
- Inward pending
- Outward pending
- Transfers in progress
- Fumigation
- Physical verification
- Uninsured location
- Tasks

## 23.5 Insurance Dashboard

- Valid cover
- Uninsured value
- Underinsured value
- Coverage ratio
- Expiry
- Unendorsed locations
- Excluded commodities
- Policy utilisation
- Open claims

## 23.6 Exception Dashboard

- Negative stock attempts
- Duplicate slips
- Excess variance
- Manual adjustments
- Backdated entries
- Overcapacity
- Fumigation overdue
- Provisional stock aged
- Uninsured stock
- Self-approval attempts
- Missing documents
- Unclosed batches

---

# 24. REPORTS

Essential reports include:

1. Daily stock summary
2. Commodity-wise stock
3. Location-wise stock
4. Lot-wise stock
5. Provisional stock register
6. Unidentified stock register
7. Identification pending
8. Location pending
9. Provisional stock ageing
10. Inward register
11. Outward register
12. Weighment register
13. Duplicate review report
14. Internal transfer report
15. Lot split and merge
16. Ownership-wise stock
17. Stored stock statement
18. Government stock statement
19. Pledged stock report
20. Fumigation due
21. Fumigation history
22. Chemical consumption
23. Quality register
24. Supplier quality
25. Physical verification
26. Discrepancy report
27. Book versus estimated physical
28. Gain report
29. Loss report
30. Damage report
31. Warehouse capacity
32. Reservation report
33. Blocked stock
34. User activity
35. Approval pending
36. Override report
37. Reversal report
38. Audit trail
39. Storage ageing
40. Insurance policy register
41. Godown-wise insurance
42. Plot-wise insurance
43. Stock value versus cover
44. Underinsurance report
45. Uninsured stock report
46. Policy expiry report
47. Endorsement report
48. Claim register
49. Fire-safety compliance
50. Provisional-to-final reconciliation

Reports should support:

- Filters
- Saved views
- Excel export
- PDF export
- Scheduled delivery
- Drill-down to source records

---

# 25. SEARCH AND TRACEABILITY

Global search should support:

- Lot number
- Provisional batch
- Inventory segment
- Weighment slip
- Vehicle
- Party
- Commodity
- Invoice
- Delivery challan
- Plot
- Godown
- Bay
- Stack
- Employee
- Fumigation
- Physical verification
- Insurance policy
- Claim
- Date range

---

# 26. ALERTS AND NOTIFICATIONS

Possible channels:

- In-app
- Email
- WhatsApp later
- Mobile push later

Alerts:

- Fumigation due
- Fumigation overdue
- Stock unallocated
- Lot identification pending
- Location identification pending
- Provisional ageing
- Physical discrepancy
- Overcapacity
- Duplicate weighment
- Pending approval
- Policy expiry
- Sum insured exceeded
- Godown uninsured
- Commodity excluded
- Fire inspection overdue
- Override nearing expiry
- Delivery order expiring
- Missing document

---

# 27. UI AND UX REQUIREMENTS

## 27.1 Navigation

- Dashboard
- Tasks
- Weighments
- Inward
- Lots
- Stock
- Warehouse Map
- Quality
- Fumigation
- Transfers
- Outward
- Physical Verification
- Discrepancies
- Gain and Loss
- Insurance
- Approvals
- Reports
- Parties
- Masters
- Administration

## 27.2 UX Standards

- Mobile-first
- Desktop and tablet support
- Minimal typing
- Smart defaults
- Copy-paste grids
- QR or barcode later
- Camera upload
- Multilingual-ready
- Clear status labels
- Global search
- Saved filters
- Favourite reports
- Keyboard shortcuts
- Offline draft queue where feasible
- Accessible colours and labels
- Responsive tables
- Strong error handling
- Visible audit timeline

---

# 28. SECURITY REQUIREMENTS

## 28.1 Authentication

- Strong passwords
- MFA for privileged users
- Session expiry
- Device management
- Lockout or rate limiting
- Secure reset

## 28.2 Authorisation

- Role-based access
- Multiple roles
- Scope-based access
- Maker-checker
- Record-level control
- Approval limits
- Override separation

## 28.3 Data Protection

- Encryption in transit
- Encryption at rest
- Private document storage
- Signed URLs
- Backup
- Point-in-time recovery
- Environment separation
- Secret management

## 28.4 Audit

Record:

- User
- Date and time
- Device
- IP where appropriate
- Action
- Previous value
- New value
- Reason
- Approval
- Evidence

## 28.5 Application Security

Protect against:

- SQL injection
- XSS
- CSRF
- Unauthorised API access
- IDOR
- Privilege escalation
- Unsafe upload
- Malware
- Secret exposure
- Missing rate limit
- Unbounded queries
- Sensitive error messages

---

# 29. RECOMMENDED TECHNICAL ARCHITECTURE

## 29.1 Front End

- Next.js
- React
- TypeScript
- Progressive Web App
- Tailwind CSS
- shadcn/ui
- TanStack Query
- TanStack Table
- React Hook Form
- Zod

## 29.2 Backend

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security
- Versioned SQL migrations
- Controlled stock-posting functions
- Server-side application services

## 29.3 Spatial

- Konva or equivalent for 2D
- PostGIS only where justified
- Three.js and React Three Fiber for future 3D

## 29.4 Testing

- Vitest
- React Testing Library
- Playwright
- Database tests
- RLS tests
- Accessibility tests

## 29.5 Monitoring

- Structured logs
- Error tracking
- Performance monitoring
- Health checks
- Audit dashboards

## 29.6 Architecture Style

Use a modular monolith.

Do not begin with:

- Microservices
- Kubernetes
- Kafka
- Multiple primary databases
- MongoDB as source of truth
- Unnecessary Redis
- Complex event architecture

---

# 30. CRITICAL DATABASE ENTITY GROUPS

## Identity and access

- users
- profiles
- roles
- permissions
- user_roles
- role_permissions
- user_scopes
- approval_rules
- approval_instances
- approval_actions

## Masters

- companies
- facilities
- plots
- location_nodes
- commodities
- varieties
- grades
- units
- bag_types
- parties
- party_types
- employees
- vehicles
- transporters
- weighbridges
- chemicals
- insurance_companies
- insurance_brokers
- insurance_policy_types

## Weighment

- weighment_batches
- weighment_slips
- weighment_attachments
- weighment_allocations
- corrections
- duplicate_reviews

## Stock

- receipt_batches
- inventory_segments
- provisional_batches
- unidentified_pools
- lots
- lot_sources
- lot_source_allocations
- lot_ownership_history
- lot_location_allocations
- stock_transactions
- stock_transaction_lines
- stock_ledger
- stock_balance_projections
- reservations
- splits
- merges
- closures

## Identification

- identification_events
- classification_events
- location_refinement_events
- segment_split_events
- segment_merge_events
- pending_identity_tasks
- pending_location_tasks
- provisional_reconciliations

## Quality and fumigation

- quality_templates
- quality_parameters
- quality_inspections
- quality_results
- fumigation_plans
- fumigation_events
- fumigation_lots
- fumigation_locations
- chemical_inventory
- chemical_usage
- safety_restrictions

## Verification

- verification_sessions
- verification_teams
- verification_lines
- physical_estimates
- discrepancy_cases
- discrepancy_actions
- stock_adjustments
- lot_reconciliations

## Insurance

- insurance_policies
- insurance_policy_locations
- insurance_policy_commodities
- insurance_policy_owners
- insurance_policy_perils
- insurance_policy_exclusions
- insurance_endorsements
- insurance_declarations
- insurance_coverage_allocations
- insurance_valuation_snapshots
- insurance_claims
- insurance_claim_documents
- insurance_alerts
- fire_safety_inspections

## Spatial

- layout_versions
- layout_objects
- layout_geometry
- location_dimensions
- map_layers
- annotations

## Governance

- attachments
- comments
- notifications
- override_requests
- override_actions
- audit_events
- system_settings
- feature_flags
- job_runs
- report_exports

---

# 31. INVENTORY INVARIANTS

1. Stock cannot become negative.
2. Posted ledger entries are immutable.
3. Every posted quantity has an inventory segment.
4. Final lot is not mandatory at inward.
5. Broad location is valid where exact location is unknown.
6. Identification precision is recorded.
7. Location precision is recorded.
8. Provisional stock cannot disappear during allocation.
9. Final lot allocations cannot exceed available provisional quantity.
10. Location refinement without movement does not create transfer.
11. Actual movement requires transfer.
12. Correction and reclassification are different.
13. Physical verification does not automatically change ledger.
14. Transfer preserves total quantity.
15. Split preserves total quantity.
16. Merge preserves total quantity.
17. Ownership transfer preserves physical quantity.
18. Reservation reduces availability but not physical quantity.
19. Override cannot silently change quantity.
20. Lot closure cannot leave unexplained balance.
21. Insurance calculations must not alter stock.
22. Insurance coverage is advisory unless confirmed by policy interpretation.
23. Stock at uncovered locations must be visible.
24. Maker cannot approve their own controlled transaction.
25. Service-role access remains server-side.

---

# 32. DEVELOPMENT PHASES

## Phase 0 — Governance

- Repository
- AGENTS.md
- CLAUDE.md
- Skills
- CI
- Docs
- Security baseline
- Current-state file
- Capability register

## Phase 1 — Discovery and Domain

- Process maps
- Glossary
- Masters
- Role matrix
- Approval matrix
- Override matrix
- Stock invariants
- Insurance rules
- Data model

## Phase 2 — UX Prototype

- Login
- Dashboard
- Manual weighment
- Bulk entry
- Inward
- Provisional stock
- Lot
- Warehouse map
- Physical verification
- Insurance dashboard
- Approval inbox

## Phase 3 — Platform Foundation

- Auth
- Roles
- Multiple roles
- Scopes
- Approvals
- Overrides
- Audit
- Masters
- Attachments

## Phase 4 — Manual Weighment

- Individual entry
- Bulk entry
- Excel import
- Validation
- Duplicate detection
- Verification
- Correction
- Reversal

## Phase 5 — Provisional Stock and Identification

- Receipt batch
- Inventory segment
- Provisional batch
- Unidentified pool
- Broad location
- Partial identification
- Partial location allocation
- Reclassification
- Location refinement
- Reconciliation

## Phase 6 — Inward, Lot and Ledger

- Inward
- Sources
- Ownership
- Lot
- Stock posting
- Ledger
- Balance
- Timeline

## Phase 7 — Transfer and Outward

- Transfer
- Reservation
- Outward
- Exceptional outward
- Reversal

## Phase 8 — Quality and Fumigation

- Quality
- Fumigation
- Restrictions
- Chemicals
- Alerts

## Phase 9 — Physical Verification

- Estimates
- Confidence
- Discrepancy
- Recount
- Adjustment
- Lot closure

## Phase 10 — Insurance

- Policy master
- Location coverage
- Commodity coverage
- Stock valuation
- Underinsurance analysis
- Alerts
- Claims
- Reports

## Phase 11 — 2D Layout

- Map
- Occupancy
- Uncertainty
- Fumigation
- Discrepancy
- Insurance
- Layout editor
- Versioning

## Phase 12 — Reporting

- Operational reports
- Management reports
- Exports
- Dashboards

## Phase 13 — Production Hardening

- Security
- Load testing
- Backup
- Restore
- UAT
- Training
- Opening stock migration

## Phase 14 — Future

- 3D layout
- OCR
- Weighbridge integration
- AI assistant
- WhatsApp
- Customer portal
- Processing
- Sensor integration

---

# 33. MINIMUM GO-LIVE CONDITIONS

- Opening stock reconciled
- All locations created
- Insurance policies entered
- Godown coverage reviewed
- Role matrix approved
- Maker-checker tested
- Negative stock prevented
- Ledger reconciles
- Provisional stock visible
- Fumigation controls work
- Physical verification remains reference only
- Audit logs complete
- Backups tested
- Reports reconcile
- Users trained
- SOPs issued
- UAT approved
- No unresolved critical security issue

---

# 34. FINAL PRODUCT RULE

The platform must always follow this principle:

> Record what is known, clearly identify what is not known, preserve every original record, progressively improve identity and location, protect the stock ledger, and make operational, insurance and accountability risks visible to management.

# Master Data Catalogue

Every master the platform must support, per blueprint §4 and development prompt §7.

**No business master may be hard-coded in source (DR-52).** Commodities, reason codes,
statuses, document types and thresholds are all configuration.

---

## Common requirements

Every master supports: unique code, name, description, active/inactive status, effective
date, expiry date where relevant, created by, approved by, change history, attachments,
notes, import, export, duplicate prevention, and maker-checker approval where required.

Two rules apply universally:

- **DR-53** Changing a master never rewrites history. Posted transactions retain the values
  that applied at the time of posting.
- **DR-54** A master that has been used is deactivated, never deleted.

---

## 1. Organisation

Company · Business unit · Facility · Branch · Department · Cost centre · Profit centre ·
Legal entity · GST registration · State · District · Taluka · Village

## 2. Commodity

Commodity · Commodity group · Commodity category · Variety · Grade · Crop year · Origin ·
Quality profile · Standard moisture · Standard bag size · Standard unit · Alternative
units · Conversion rules · Shelf-life guidance · Fumigation interval · Storage
restrictions · Insurance category · Processing category · Finished-good mapping ·
By-product mapping

**Seed examples (data, not code):** Tur, Lemon Tur, Chana, Maize, Urad, Moong, Wheat,
Paddy, finished dal, broken, husk, packing material, chemical, other agricultural stock.

## 3. Location

Facility · Plot · Survey number · Godown · Warehouse · Building · Open yard · Floor ·
Section · Bay · Zone · Stack · Bin · Heap · Loading point · Unloading point · Gate ·
Weighbridge · Restricted area · Fumigation zone · Fire-safety zone

**Location node fields:** code, name, parent, type, plot number, survey number, address,
length, width, height, area, volume, approved capacity, operational capacity, current
occupancy, available capacity, commodity restrictions, storage method, fumigation
suitability, insurance location reference, fire-protection details, operational status,
responsible employee, layout coordinates, photographs, documents, notes.

Modelled as a single self-referencing `location_nodes` tree typed by node type, so the
hierarchy stays flexible and location precision is derivable from depth.

## 4. Party

Farmer · Farmer group · Trader · Broker · Commission agent · Supplier · Customer · Storage
customer · Government agency · Auction agency · Processor · Transporter · Fumigation
vendor · Insurance company · Insurance broker · Surveyor · Bank · Warehouse service
provider · Labour contractor · Other party

**Fields:** party code, legal name, trade name, party type, GSTIN, PAN, address, contact
person, mobile, email, bank details, credit terms, storage agreement, broker reference,
active status, supporting documents.

A party may hold more than one type — a trader may also be a storage customer. Model the
type as a many-to-many relationship, not a single column.

## 5. Employee and user

Employee · Designation · Department · Facility · Reporting manager · Employment status ·
User account · Roles · Permissions · Location scopes · Approval limits · Override
authority · Signature specimen · Mobile · Email · Shift · Training status

## 6. Vehicle and transport

Vehicle · Vehicle type · Transporter · Driver · Trailer · Capacity · Registration number ·
Validity documents · Insurance validity · Pollution validity · Notes

## 7. Operational

Weighbridge · Movement type · Inward type · Outward type · Ownership type · Stock status ·
Lot status · Quality status · Fumigation status · Verification method · Confidence level ·
Gain reason · Loss reason · Damage reason · Rejection reason · Adjustment reason · Override
reason · Approval type · Document type · Unit of measurement · Bag type · Chemical ·
Fumigation method · Notification type · Report format

These are the reason-code and status vocabularies the workflows depend on. Every one is
editable configuration with an active flag and effective dating.

## 8. Insurance

Insurance company · Insurance broker · Insurance policy type · Coverage type · Peril ·
Exclusion · Deductible type · Endorsement type · Surveyor · Claim status · Policy status ·
Valuation basis · Stock declaration method · Insurance location · Coverage allocation rule

---

## Implementation notes

**Reference data versus transactional masters.** Small closed vocabularies (statuses,
confidence levels, precision levels) may be Postgres enums *only* where the values are
structural and appear in invariant logic. Anything the business may want to extend —
reason codes, document types, commodity attributes — must be a table, not an enum.
Changing an enum requires a migration; the business must not need a developer to add a loss
reason.

**Codes.** Every master carries a human-meaningful unique code as well as a surrogate UUID
primary key. Operators search and speak in codes.

**Import and export.** Every master supports Excel and CSV import with row-level validation
and an error export, because opening-stock migration (Phase 13) depends on it.

**Approval.** Masters affecting stock valuation, insurance or access control require
maker-checker. Purely descriptive masters do not.

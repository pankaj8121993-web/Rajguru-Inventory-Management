-- seed.sql
-- Realistic development seed data for Rajguru Foods.
--
-- Per docs/06-testing/TEST_STRATEGY.md: realistic agricultural data only.
-- Never foo/test123 — unrealistic data hides layout, rounding and validation
-- bugs that real data exposes immediately.
--
-- Safe to re-run: everything is ON CONFLICT DO NOTHING against natural keys.

begin;

-- ---------------------------------------------------------------------------
-- Users (interim — replaced by Supabase Auth)
-- ---------------------------------------------------------------------------
insert into users (code, full_name, email) values
  ('EMP001', 'Ramesh Patil',      'ramesh.patil@rajgurufoods.local'),
  ('EMP002', 'Sunita Deshmukh',   'sunita.deshmukh@rajgurufoods.local'),
  ('EMP003', 'Ganesh Kulkarni',   'ganesh.kulkarni@rajgurufoods.local'),
  ('EMP004', 'Prakash Jadhav',    'prakash.jadhav@rajgurufoods.local')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Company
-- ---------------------------------------------------------------------------
insert into companies (code, name, legal_name, address, created_by)
select 'RGF', 'Rajguru Foods', 'Rajguru Foods Private Limited',
       'Latur, Maharashtra', u.id
from users u where u.code = 'EMP001'
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Units
-- ---------------------------------------------------------------------------
insert into units (code, name, symbol, factor_to_base, base_unit_code) values
  ('KG',      'Kilogram',     'kg',    1,          'KG'),
  ('QUINTAL', 'Quintal',      'qtl',   100,        'KG'),
  ('MT',      'Metric Tonne', 'MT',    1000,       'KG'),
  ('BAG',     'Bag',          'bag',   50,         'KG'),
  ('GRAM',    'Gram',         'g',     0.001,      'KG')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Bag types
-- ---------------------------------------------------------------------------
insert into bag_types (code, name, standard_weight_kg, material) values
  ('JUTE50',  'Jute Bag 50 kg',        50,  'Jute'),
  ('JUTE100', 'Jute Bag 100 kg',       100, 'Jute'),
  ('PP50',    'PP Woven Bag 50 kg',    50,  'Polypropylene'),
  ('PP30',    'PP Woven Bag 30 kg',    30,  'Polypropylene'),
  ('LOOSE',   'Loose / Bulk',          null,'None')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Commodity groups
-- ---------------------------------------------------------------------------
insert into commodity_groups (code, name, description) values
  ('PULSES',  'Pulses',            'Tur, Chana, Urad, Moong and other pulses'),
  ('CEREALS', 'Cereals',           'Wheat, Maize, Paddy and other cereals'),
  ('FINISHED','Finished Goods',    'Milled dal and packed finished product'),
  ('BYPROD',  'By-products',       'Broken, husk, chuni and other by-products'),
  ('PACKING', 'Packing Material',  'Bags, thread, labels'),
  ('CHEM',    'Chemicals',         'Fumigation and treatment chemicals')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Commodities
-- ---------------------------------------------------------------------------
insert into commodities (
  code, name, commodity_group_id, standard_unit_id, standard_bag_type_id,
  standard_moisture_pct, fumigation_interval_days, storage_restrictions, created_by
)
select v.code, v.name, g.id, u.id, b.id,
       v.moisture, v.fum_days, v.restrictions, usr.id
from (values
  ('TUR',      'Tur',            'PULSES',  'QUINTAL', 'JUTE50',  12.0, 90,  'Keep dry. Susceptible to bruchid infestation.'),
  ('CHANA',    'Chana',          'PULSES',  'QUINTAL', 'JUTE50',  10.0, 90,  'Keep dry and well ventilated.'),
  ('URAD',     'Urad',           'PULSES',  'QUINTAL', 'JUTE50',  10.0, 75,  'High infestation risk. Inspect monthly.'),
  ('MOONG',    'Moong',          'PULSES',  'QUINTAL', 'JUTE50',  10.0, 75,  'High infestation risk.'),
  ('WHEAT',    'Wheat',          'CEREALS', 'QUINTAL', 'JUTE100', 12.0, 120, 'Protect from moisture ingress.'),
  ('MAIZE',    'Maize',          'CEREALS', 'QUINTAL', 'PP50',    14.0, 90,  'Monitor moisture. Aflatoxin risk if damp.'),
  ('PADDY',    'Paddy',          'CEREALS', 'QUINTAL', 'JUTE100', 14.0, 120, 'Do not stack against outer walls.'),
  ('TURDAL',   'Tur Dal',        'FINISHED','QUINTAL', 'PP30',     9.0, 60,  'Finished good. Segregate from raw stock.'),
  ('CHANADAL', 'Chana Dal',      'FINISHED','QUINTAL', 'PP30',     9.0, 60,  'Finished good.'),
  ('BROKEN',   'Broken',         'BYPROD',  'QUINTAL', 'PP50',    10.0, 90,  'By-product.'),
  ('HUSK',     'Husk',           'BYPROD',  'MT',      'LOOSE',   null, null,'Fire risk. Store away from ignition sources.'),
  ('CHUNI',    'Chuni',          'BYPROD',  'QUINTAL', 'PP50',    10.0, null,'Cattle feed by-product.')
) as v(code, name, grp, unit, bag, moisture, fum_days, restrictions)
join commodity_groups g on g.code = v.grp
join units u            on u.code = v.unit
join bag_types b        on b.code = v.bag
cross join (select id from users where code = 'EMP001') usr
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Varieties
--
-- "Tur" later identified as "Lemon Tur" is the blueprint's own example of a
-- classification event (DR-17), so Tur carries real varieties here.
-- ---------------------------------------------------------------------------
insert into varieties (commodity_id, code, name, description)
select c.id, v.code, v.name, v.description
from (values
  ('TUR',   'LEMON',    'Lemon Tur',       'Bold, light-coloured tur'),
  ('TUR',   'RED',      'Red Tur',         'Standard red tur'),
  ('TUR',   'WHITE',    'White Tur',       'White-seeded tur'),
  ('CHANA', 'DESI',     'Desi Chana',      'Small, dark, thick-skinned'),
  ('CHANA', 'KABULI',   'Kabuli Chana',    'Large, light-coloured'),
  ('CHANA', 'ANNIGERI', 'Annigeri',        'Annigeri variety'),
  ('WHEAT', 'SHARBATI', 'Sharbati',        'Premium milling wheat'),
  ('WHEAT', 'LOKWAN',   'Lokwan',          'Lokwan wheat'),
  ('MAIZE', 'YELLOW',   'Yellow Maize',    'Feed and starch grade'),
  ('MAIZE', 'WHITE',    'White Maize',     'Food grade'),
  ('URAD',  'BLACK',    'Black Urad',      'Whole black gram'),
  ('MOONG', 'GREEN',    'Green Moong',     'Whole green gram'),
  ('PADDY', 'SONA',     'Sona Masuri',     'Fine grain'),
  ('PADDY', 'IR64',     'IR-64',           'Coarse grain')
) as v(commodity_code, code, name, description)
join commodities c on c.code = v.commodity_code
on conflict (commodity_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- Grades
-- ---------------------------------------------------------------------------
insert into grades (commodity_id, code, name, description, sort_order)
select c.id, g.code, g.name, g.description, g.sort_order
from (values
  ('TUR',   'FAQ',   'FAQ',        'Fair Average Quality',              1),
  ('TUR',   'BOLD',  'Bold',       'Bold grain, above FAQ',             2),
  ('TUR',   'UGRADE','Under Grade','Below FAQ, discounted',             3),
  ('CHANA', 'FAQ',   'FAQ',        'Fair Average Quality',              1),
  ('CHANA', 'BOLD',  'Bold',       'Bold grain',                        2),
  ('CHANA', 'UGRADE','Under Grade','Below FAQ',                         3),
  ('WHEAT', 'MILL',  'Mill Grade', 'Suitable for milling',              1),
  ('WHEAT', 'FEED',  'Feed Grade', 'Feed quality only',                 2),
  ('MAIZE', 'FAQ',   'FAQ',        'Fair Average Quality',              1),
  ('MAIZE', 'FEED',  'Feed Grade', 'Feed quality',                      2),
  ('URAD',  'FAQ',   'FAQ',        'Fair Average Quality',              1),
  ('MOONG', 'FAQ',   'FAQ',        'Fair Average Quality',              1),
  ('PADDY', 'FAQ',   'FAQ',        'Fair Average Quality',              1)
) as g(commodity_code, code, name, description, sort_order)
join commodities c on c.code = g.commodity_code
on conflict (commodity_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- Location hierarchy
--
-- Facility -> Plot -> Godown -> Bay -> Stack, plus open yards and gates.
-- Deliberately includes coarse nodes so INV-05 (stock valid at any node) can
-- be exercised.
-- ---------------------------------------------------------------------------

-- Facilities
insert into location_nodes (company_id, parent_id, node_type, code, name, address, created_by)
select co.id, null, 'facility', v.code, v.name, v.address, u.id
from (values
  ('ALY', 'Aliyabad Facility', 'Aliyabad, Latur, Maharashtra'),
  ('MUR', 'Murud Facility',    'Murud, Latur, Maharashtra')
) as v(code, name, address)
cross join (select id from companies where code = 'RGF') co
cross join (select id from users where code = 'EMP001') u
on conflict (company_id, code) do nothing;

-- Plots
insert into location_nodes (company_id, parent_id, node_type, code, name,
                            plot_number, survey_number, area_sqm, created_by)
select co.id, p.id, 'plot', v.code, v.name, v.plot_no, v.survey_no, v.area, u.id
from (values
  ('ALY', 'ALY-P1', 'Plot 1',  'P-1',  '142/2A', 12000.000),
  ('ALY', 'ALY-P2', 'Plot 2',  'P-2',  '142/2B',  8500.000),
  ('MUR', 'MUR-P1', 'Plot 1',  'P-1',  '87/1',    9500.000)
) as v(parent_code, code, name, plot_no, survey_no, area)
join location_nodes p on p.code = v.parent_code and p.node_type = 'facility'
cross join (select id from companies where code = 'RGF') co
cross join (select id from users where code = 'EMP001') u
on conflict (company_id, code) do nothing;

-- Godowns and open yards
insert into location_nodes (company_id, parent_id, node_type, code, name,
                            length_m, width_m, height_m, area_sqm,
                            approved_capacity_mt, operational_capacity_mt,
                            storage_method, fumigation_suitable, created_by)
select co.id, p.id, v.ntype::location_node_type, v.code, v.name,
       v.len, v.wid, v.hgt, v.area, v.appr, v.oper, v.method, v.fumigable, u.id
from (values
  ('ALY-P1', 'godown',    'ALY-G1', 'Godown 1',      60.000, 25.000, 8.000, 1500.000, 3000.000, 2700.000, 'Bag stacking',  true),
  ('ALY-P1', 'godown',    'ALY-G2', 'Godown 2',      60.000, 25.000, 8.000, 1500.000, 3000.000, 2700.000, 'Bag stacking',  true),
  ('ALY-P1', 'open_yard', 'ALY-Y1', 'Open Yard 1',   40.000, 30.000, null,  1200.000, 1000.000,  800.000, 'Covered heap',  false),
  ('ALY-P2', 'godown',    'ALY-G3', 'Godown 3',      45.000, 20.000, 7.000,  900.000, 1800.000, 1600.000, 'Bag stacking',  true),
  ('MUR-P1', 'godown',    'MUR-G1', 'Godown 1',      50.000, 22.000, 7.500, 1100.000, 2200.000, 2000.000, 'Bag stacking',  true),
  ('MUR-P1', 'open_yard', 'MUR-Y1', 'Open Yard 1',   35.000, 25.000, null,   875.000,  700.000,  600.000, 'Open heap',     false)
) as v(parent_code, ntype, code, name, len, wid, hgt, area, appr, oper, method, fumigable)
join location_nodes p on p.code = v.parent_code and p.node_type = 'plot'
cross join (select id from companies where code = 'RGF') co
cross join (select id from users where code = 'EMP001') u
on conflict (company_id, code) do nothing;

-- Bays
insert into location_nodes (company_id, parent_id, node_type, code, name,
                            approved_capacity_mt, operational_capacity_mt, created_by)
select co.id, p.id, 'bay', v.code, v.name, v.appr, v.oper, u.id
from (values
  ('ALY-G1', 'ALY-G1-A', 'Bay A', 750.000, 675.000),
  ('ALY-G1', 'ALY-G1-B', 'Bay B', 750.000, 675.000),
  ('ALY-G1', 'ALY-G1-C', 'Bay C', 750.000, 675.000),
  ('ALY-G1', 'ALY-G1-D', 'Bay D', 750.000, 675.000),
  ('ALY-G2', 'ALY-G2-A', 'Bay A', 1000.000, 900.000),
  ('ALY-G2', 'ALY-G2-B', 'Bay B', 1000.000, 900.000),
  ('ALY-G3', 'ALY-G3-A', 'Bay A', 900.000, 800.000),
  ('MUR-G1', 'MUR-G1-A', 'Bay A', 1100.000, 1000.000),
  ('MUR-G1', 'MUR-G1-B', 'Bay B', 1100.000, 1000.000)
) as v(parent_code, code, name, appr, oper)
join location_nodes p on p.code = v.parent_code and p.node_type = 'godown'
cross join (select id from companies where code = 'RGF') co
cross join (select id from users where code = 'EMP001') u
on conflict (company_id, code) do nothing;

-- Stacks
insert into location_nodes (company_id, parent_id, node_type, code, name,
                            length_m, width_m, height_m,
                            approved_capacity_mt, operational_capacity_mt, created_by)
select co.id, p.id, 'stack', v.code, v.name, v.len, v.wid, v.hgt, v.appr, v.oper, u.id
from (values
  ('ALY-G1-A', 'ALY-G1-A-S1', 'Stack 1', 12.000, 8.000, 5.000, 250.000, 225.000),
  ('ALY-G1-A', 'ALY-G1-A-S2', 'Stack 2', 12.000, 8.000, 5.000, 250.000, 225.000),
  ('ALY-G1-A', 'ALY-G1-A-S3', 'Stack 3', 12.000, 8.000, 5.000, 250.000, 225.000),
  ('ALY-G1-B', 'ALY-G1-B-S1', 'Stack 1', 12.000, 8.000, 5.000, 250.000, 225.000),
  ('ALY-G1-B', 'ALY-G1-B-S2', 'Stack 2', 12.000, 8.000, 5.000, 250.000, 225.000),
  ('ALY-G2-A', 'ALY-G2-A-S1', 'Stack 1', 14.000, 9.000, 5.500, 330.000, 300.000),
  ('MUR-G1-A', 'MUR-G1-A-S1', 'Stack 1', 13.000, 8.500, 5.000, 275.000, 250.000)
) as v(parent_code, code, name, len, wid, hgt, appr, oper)
join location_nodes p on p.code = v.parent_code and p.node_type = 'bay'
cross join (select id from companies where code = 'RGF') co
cross join (select id from users where code = 'EMP001') u
on conflict (company_id, code) do nothing;

-- Heaps in the open yards
insert into location_nodes (company_id, parent_id, node_type, code, name,
                            approved_capacity_mt, operational_capacity_mt, created_by)
select co.id, p.id, 'heap', v.code, v.name, v.appr, v.oper, u.id
from (values
  ('ALY-Y1', 'ALY-Y1-H1', 'Heap 1', 400.000, 350.000),
  ('ALY-Y1', 'ALY-Y1-H2', 'Heap 2', 400.000, 350.000),
  ('MUR-Y1', 'MUR-Y1-H1', 'Heap 1', 350.000, 300.000)
) as v(parent_code, code, name, appr, oper)
join location_nodes p on p.code = v.parent_code and p.node_type = 'open_yard'
cross join (select id from companies where code = 'RGF') co
cross join (select id from users where code = 'EMP001') u
on conflict (company_id, code) do nothing;

-- Gates and weighbridges
insert into location_nodes (company_id, parent_id, node_type, code, name, created_by)
select co.id, p.id, v.ntype::location_node_type, v.code, v.name, u.id
from (values
  ('ALY', 'gate',        'ALY-GATE1', 'Main Gate'),
  ('ALY', 'weighbridge', 'ALY-WB1',   'Weighbridge 1'),
  ('MUR', 'gate',        'MUR-GATE1', 'Main Gate'),
  ('MUR', 'weighbridge', 'MUR-WB1',   'Weighbridge 1')
) as v(parent_code, ntype, code, name)
join location_nodes p on p.code = v.parent_code and p.node_type = 'facility'
cross join (select id from companies where code = 'RGF') co
cross join (select id from users where code = 'EMP001') u
on conflict (company_id, code) do nothing;

commit;

-- ===========================================================================
-- Parties, employees, transport and reason codes (migrations 0004, 0005)
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Party types
-- ---------------------------------------------------------------------------
insert into party_types (code, name, is_supplier, is_customer, sort_order) values
  ('FARMER',      'Farmer',                 true,  false, 10),
  ('FARMER_GRP',  'Farmer Group',           true,  false, 20),
  ('TRADER',      'Trader',                 true,  true,  30),
  ('BROKER',      'Broker',                 false, false, 40),
  ('COMM_AGENT',  'Commission Agent',       false, false, 50),
  ('SUPPLIER',    'Supplier',               true,  false, 60),
  ('CUSTOMER',    'Customer',               false, true,  70),
  ('STORAGE_CUST','Storage Customer',       true,  true,  80),
  ('GOVT',        'Government Agency',      true,  true,  90),
  ('AUCTION',     'Auction Agency',         true,  false, 100),
  ('PROCESSOR',   'Processor',              false, true,  110),
  ('TRANSPORTER', 'Transporter',            false, false, 120),
  ('FUMIG_VENDOR','Fumigation Vendor',      false, false, 130),
  ('INSURER',     'Insurance Company',      false, false, 140),
  ('INS_BROKER',  'Insurance Broker',       false, false, 150),
  ('SURVEYOR',    'Surveyor',               false, false, 160),
  ('BANK',        'Bank',                   false, false, 170),
  ('LABOUR',      'Labour Contractor',      false, false, 180),
  ('OTHER',       'Other Party',            false, false, 190)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Parties
-- ---------------------------------------------------------------------------
insert into parties (code, legal_name, trade_name, gstin, pan, village, district,
                     state, mobile, contact_person, credit_terms_days, created_by)
select v.code, v.legal_name, v.trade_name, v.gstin, v.pan, v.village, v.district,
       'Maharashtra', v.mobile, v.contact, v.credit, u.id
from (values
  ('P0001','Sanjay Bhaurao Patil',        null,                    null, null,              'Ausa',      'Latur',      '9822011001','Sanjay Patil',   null),
  ('P0002','Vithal Namdev Shinde',        null,                    null, null,              'Nilanga',   'Latur',      '9822011002','Vithal Shinde',  null),
  ('P0003','Kaveri Farmer Producer Co',   'Kaveri FPC',            '27AABCK1234M1Z5', 'AABCK1234M', 'Renapur', 'Latur', '9822011003','Anil Jadhav',    7),
  ('P0004','Shree Balaji Traders',        'Balaji Traders',        '27AAECS4567P1ZQ', 'AAECS4567P', 'Latur',   'Latur',  '9822011004','Mahesh Agarwal', 15),
  ('P0005','Ganesh Agro Commodities',     'Ganesh Agro',           '27AAFCG7890R1Z8', 'AAFCG7890R', 'Latur',   'Latur',  '9822011005','Rakesh Gupta',   21),
  ('P0006','Mahalaxmi Dal Mill',          'Mahalaxmi Mill',        '27AAGCM2345K1Z3', 'AAGCM2345K', 'Barshi',  'Solapur','9822011006','Sunil Kulkarni', 30),
  ('P0007','Nanded Commission Agency',    'Nanded Adat',           '27AAHCN6789L1Z1', 'AAHCN6789L', 'Nanded',  'Nanded', '9822011007','Prakash Deshmukh', null),
  ('P0008','Latur APMC',                  'Latur Market Yard',     null, null,              'Latur',     'Latur',      '9822011008','Market Secretary', null),
  ('P0009','Maharashtra State Warehousing','MSWC',                 '27AAACM1111N1Z9', 'AAACM1111N', 'Mumbai',  'Mumbai', '9822011009','Regional Manager', null),
  ('P0010','Siddhi Vinayak Roadlines',    'Siddhi Roadlines',      '27AAJCS3456T1Z7', 'AAJCS3456T', 'Latur',   'Latur',  '9822011010','Ravi Pawar',     null),
  ('P0011','Om Sai Transport Company',    'Om Sai Transport',      '27AAKCO8901U1Z2', 'AAKCO8901U', 'Solapur', 'Solapur','9822011011','Datta Jagtap',   null),
  ('P0012','Krishna Pest Control',        'Krishna Fumigation',    '27AALCK2222V1Z4', 'AALCK2222V', 'Latur',   'Latur',  '9822011012','Nitin Sharma',   null),
  ('P0013','Bharat Foods Private Limited','Bharat Foods',          '27AAMCB5555W1Z6', 'AAMCB5555W', 'Pune',    'Pune',   '9822011013','Amit Rane',      45),
  ('P0014','Suvarna Storage Services',    'Suvarna Storage',       '27AANCS7777X1Z0', 'AANCS7777X', 'Latur',   'Latur',  '9822011014','Kiran More',     null),
  ('P0015','National Insurance Company',  'NIC',                   '27AAACN1234Y1Z5', 'AAACN1234Y', 'Mumbai',  'Mumbai', '9822011015','Branch Manager', null)
) as v(code, legal_name, trade_name, gstin, pan, village, district, mobile, contact, credit)
cross join (select id from users where code = 'EMP001') u
on conflict (code) do nothing;

-- Party types — several parties genuinely hold more than one.
insert into party_party_types (party_id, party_type_id)
select p.id, t.id
from (values
  ('P0001','FARMER'),
  ('P0002','FARMER'),
  ('P0003','FARMER_GRP'), ('P0003','SUPPLIER'),
  ('P0004','TRADER'),     ('P0004','CUSTOMER'),
  ('P0005','TRADER'),     ('P0005','STORAGE_CUST'),
  ('P0006','PROCESSOR'),  ('P0006','CUSTOMER'),
  ('P0007','COMM_AGENT'), ('P0007','BROKER'),
  ('P0008','AUCTION'),
  ('P0009','GOVT'),       ('P0009','STORAGE_CUST'),
  ('P0010','TRANSPORTER'),
  ('P0011','TRANSPORTER'),
  ('P0012','FUMIG_VENDOR'),
  ('P0013','CUSTOMER'),
  ('P0014','STORAGE_CUST'),
  ('P0015','INSURER')
) as v(party_code, type_code)
join parties p     on p.code = v.party_code
join party_types t on t.code = v.type_code
on conflict do nothing;

-- Broker relationships
update parties set broker_party_id = (select id from parties where code = 'P0007')
 where code in ('P0001','P0002') and broker_party_id is null;

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------
insert into employees (code, full_name, designation, department, facility_id,
                       employment_status, mobile, shift, date_of_joining, user_id, created_by)
select v.code, v.name, v.designation, v.dept, f.id, 'active', v.mobile, v.shift,
       v.doj::date, usr.id, cr.id
from (values
  ('E001','Ramesh Patil',     'Warehouse Manager',      'Operations', 'ALY', '9822022001','General','2019-06-01','EMP001'),
  ('E002','Sunita Deshmukh',  'Stock Accountant',       'Accounts',   'ALY', '9822022002','General','2020-02-15','EMP002'),
  ('E003','Ganesh Kulkarni',  'Weighment Operator',     'Operations', 'ALY', '9822022003','Shift A','2021-08-10','EMP003'),
  ('E004','Prakash Jadhav',   'Warehouse Supervisor',   'Operations', 'MUR', '9822022004','General','2018-11-20','EMP004'),
  ('E005','Anita Kadam',      'Quality Inspector',      'Quality',    'ALY', '9822022005','General','2022-03-05',null),
  ('E006','Suresh Chavan',    'Gate Operator',          'Security',   'ALY', '9822022006','Shift B','2021-01-12',null),
  ('E007','Manoj Sawant',     'Dispatch Executive',     'Dispatch',   'MUR', '9822022007','General','2020-07-01',null)
) as v(code, name, designation, dept, facility_code, mobile, shift, doj, user_code)
join location_nodes f on f.code = v.facility_code and f.node_type = 'facility'
left join users usr on usr.code = v.user_code
cross join (select id from users where code = 'EMP001') cr
on conflict (code) do nothing;

update employees set reporting_manager_id = (select id from employees where code = 'E001')
 where code in ('E002','E003','E005','E006') and reporting_manager_id is null;
update employees set reporting_manager_id = (select id from employees where code = 'E004')
 where code = 'E007' and reporting_manager_id is null;

-- ---------------------------------------------------------------------------
-- Vehicles
-- ---------------------------------------------------------------------------
-- Document validity is stored relative to the seed date so the data stays
-- meaningful whenever it is loaded, and deliberately includes one vehicle with
-- an expired certificate and one expiring shortly. An expired document is a
-- real situation the system must display rather than hide.
insert into vehicles (registration_number, vehicle_type, transporter_party_id,
                      capacity_mt, insurance_valid_to, pollution_valid_to,
                      fitness_valid_to, created_by)
select v.reg, v.vtype, t.id, v.cap,
       current_date + (v.ins || ' days')::interval,
       current_date + (v.pol || ' days')::interval,
       case when v.fit is null then null
            else current_date + (v.fit || ' days')::interval end,
       u.id
from (values
  ('MH24AB1234','Truck 10-wheeler','P0010', 16.000,  245,  63,  337),
  ('MH24AB5678','Truck 6-wheeler', 'P0010',  9.000,  186,  33,  275),
  ('MH24CD9012','Trailer',         'P0011', 25.000,  155,  94,  214),
  ('MH13EF3456','Truck 10-wheeler','P0011', 16.000,  306, 124,  398),
  ('MH24GH7890','Tractor Trolley', null,     6.000,   33,  33, null),
  -- Lapsed pollution certificate and insurance expiring within the month.
  ('MH12IJ2345','Truck 12-wheeler','P0010', 21.000,   17, -12,  155)
) as v(reg, vtype, transporter_code, cap, ins, pol, fit)
left join parties t on t.code = v.transporter_code
cross join (select id from users where code = 'EMP001') u
on conflict (registration_number) do nothing;

-- ---------------------------------------------------------------------------
-- Drivers
-- ---------------------------------------------------------------------------
insert into drivers (code, full_name, licence_number, licence_valid_to,
                     mobile, transporter_party_id, created_by)
select v.code, v.name, v.lic, current_date + (v.valid || ' days')::interval,
       v.mobile, t.id, u.id
from (values
  ('D001','Balu Shinde',    'MH2420190001234', 671, '9822033001','P0010'),
  ('D002','Ramrao Gaikwad', 'MH2420180005678', 489, '9822033002','P0010'),
  ('D003','Imran Shaikh',   'MH1320200009012', 944, '9822033003','P0011'),
  ('D004','Santosh Bhosale','MH2420170003456',  63, '9822033004','P0011')
) as v(code, name, lic, valid, mobile, transporter_code)
left join parties t on t.code = v.transporter_code
cross join (select id from users where code = 'EMP001') u
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Weighbridges
-- ---------------------------------------------------------------------------
insert into weighbridges (code, name, location_node_id, is_own, make,
                          capacity_mt, least_count_kg, calibration_valid_to, created_by)
select v.code, v.name, n.id, v.own, v.make, v.cap, v.lc,
       current_date + (v.cal || ' days')::interval, u.id
from (values
  ('WB-ALY-1','Aliyabad Weighbridge 1','ALY-WB1', true,  'Avery India',       60.000, 10.000, 245),
  ('WB-MUR-1','Murud Weighbridge 1',   'MUR-WB1', true,  'Essae Digitronics', 50.000, 10.000, 155)
) as v(code, name, node_code, own, make, cap, lc, cal)
left join location_nodes n on n.code = v.node_code
cross join (select id from users where code = 'EMP001') u
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Reason code categories
-- ---------------------------------------------------------------------------
insert into reason_code_categories (code, name, description, sort_order) values
  ('GAIN',        'Gain',            'Reasons book stock increased (blueprint 18.1)', 10),
  ('LOSS',        'Loss',            'Reasons book stock decreased (blueprint 18.2)', 20),
  ('DAMAGE',      'Damage',          'Reasons stock was damaged',                     30),
  ('REJECTION',   'Rejection',       'Reasons stock or a vehicle was rejected',       40),
  ('ADJUSTMENT',  'Adjustment',      'Reasons for a stock adjustment',                50),
  ('OVERRIDE',    'Override',        'Reasons a restriction was overridden',          60),
  ('CORRECTION',  'Correction',      'The original entry was wrong (DR-17)',          70),
  ('RECLASS',     'Reclassification','New information improved the record (DR-17)',   80),
  ('DUPLICATE',   'Duplicate Review','Outcomes of a suspected duplicate weighment',   90)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Reason codes
-- ---------------------------------------------------------------------------
insert into reason_codes (category_id, code, name, requires_evidence,
                          requires_approval, is_exception, sort_order)
select c.id, v.code, v.name, v.evidence, v.approval, v.exception, v.sort_order
from (values
  -- Gain (blueprint 18.1)
  ('GAIN','MOISTURE_GAIN',   'Moisture increase',              false,false,false,10),
  ('GAIN','WEIGH_VARIATION', 'Weighment variation',            false,false,false,20),
  ('GAIN','EXCESS_RECEIPT',  'Excess receipt',                 true, true, false,30),
  ('GAIN','PROC_RECOVERY',   'Processing recovery',            false,false,false,40),
  ('GAIN','PV_SURPLUS',      'Physical verification surplus',  true, true, true, 50),
  ('GAIN','BAG_COUNT_CORR',  'Bag-count correction',           true, false,false,60),
  ('GAIN','STANDARDISATION', 'Standardisation correction',     false,false,false,70),
  -- Loss (blueprint 18.2)
  ('LOSS','MOISTURE_LOSS',   'Moisture loss',                  false,false,false,10),
  ('LOSS','DRYING',          'Drying loss',                    false,false,false,20),
  ('LOSS','HANDLING',        'Handling loss',                  false,false,false,30),
  ('LOSS','SPILLAGE',        'Spillage',                       true, false,false,40),
  ('LOSS','TRANSIT',         'Transit loss',                   true, true, false,50),
  ('LOSS','PEST',            'Pest damage',                    true, true, true, 60),
  ('LOSS','RODENT',          'Rodent damage',                  true, true, true, 70),
  ('LOSS','WATER',           'Water damage',                   true, true, true, 80),
  ('LOSS','THEFT',           'Theft',                          true, true, true, 90),
  ('LOSS','BAG_SHORTAGE',    'Bag shortage',                   true, false,false,100),
  ('LOSS','WEIGH_DIFF',      'Weighment difference',           false,false,false,110),
  ('LOSS','SAMPLING',        'Sampling',                       false,false,false,120),
  ('LOSS','PROC_LOSS',       'Processing loss',                false,false,false,130),
  ('LOSS','FIRE',            'Fire',                           true, true, true, 140),
  ('LOSS','NATURAL_EVENT',   'Natural event',                  true, true, true, 150),
  ('LOSS','PV_SHORTAGE',     'Physical verification shortage', true, true, true, 160),
  -- Damage
  ('DAMAGE','WET',           'Wet or water-affected',          true, true, true, 10),
  ('DAMAGE','INFESTED',      'Infested',                       true, true, true, 20),
  ('DAMAGE','DISCOLOURED',   'Discoloured',                    true, false,false,30),
  ('DAMAGE','TORN_BAGS',     'Torn bags',                      true, false,false,40),
  ('DAMAGE','CONTAMINATED',  'Contaminated',                   true, true, true, 50),
  -- Rejection
  ('REJECTION','QUALITY_FAIL','Failed quality parameters',     true, false,false,10),
  ('REJECTION','MOISTURE_HIGH','Moisture above limit',         true, false,false,20),
  ('REJECTION','FM_HIGH',    'Foreign matter above limit',     true, false,false,30),
  ('REJECTION','WRONG_COMMODITY','Wrong commodity supplied',   true, false,true, 40),
  ('REJECTION','DOC_MISSING','Documents missing',              false,false,false,50),
  -- Adjustment
  ('ADJUSTMENT','RECONCILE', 'Final reconciliation',           true, true, false,10),
  ('ADJUSTMENT','ROUNDING',  'Rounding correction',            false,false,false,20),
  ('ADJUSTMENT','OPENING_BAL','Opening balance correction',    true, true, true, 30),
  -- Override
  ('OVERRIDE','URGENT_DISPATCH','Urgent dispatch requirement',  true, true, true, 10),
  ('OVERRIDE','CAPACITY_EXCEED','Capacity limit exceeded',      true, true, true, 20),
  ('OVERRIDE','FUMIG_EARLY', 'Early release from fumigation',  true, true, true, 30),
  ('OVERRIDE','BACKDATED',   'Backdated entry',                true, true, true, 40),
  ('OVERRIDE','SYSTEM_ERROR','System error workaround',        true, true, true, 50),
  -- Correction (original entry was wrong)
  ('CORRECTION','TYPING_ERROR','Data entry error',             false,true, true, 10),
  ('CORRECTION','WRONG_PARTY','Wrong party selected',          false,true, true, 20),
  ('CORRECTION','WRONG_VEHICLE','Wrong vehicle recorded',      false,true, true, 30),
  ('CORRECTION','SLIP_MISREAD','Weighment slip misread',       true, true, true, 40),
  -- Reclassification (new information arrived)
  ('RECLASS','VARIETY_KNOWN','Variety now established',        false,true, false,10),
  ('RECLASS','GRADE_ASSESSED','Grade assessed after inspection',false,true,false,20),
  ('RECLASS','LOT_ASSIGNED', 'Final lot now assigned',         false,true, false,30),
  ('RECLASS','LOCATION_CONFIRMED','Exact location confirmed',  false,true, false,40),
  ('RECLASS','SOURCE_ALLOCATED','Source allocation established',false,true,false,50),
  -- Duplicate review
  ('DUPLICATE','GENUINE_SEPARATE','Genuine separate weighment', true, true, false,10),
  ('DUPLICATE','CONFIRMED_DUP','Confirmed duplicate',           false,false,true, 20),
  ('DUPLICATE','LINKED_EARLIER','Linked to the earlier record', false,false,false,30)
) as v(cat_code, code, name, evidence, approval, exception, sort_order)
join reason_code_categories c on c.code = v.cat_code
on conflict (category_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- Document types
-- ---------------------------------------------------------------------------
insert into document_types (code, name, applies_to, is_mandatory) values
  ('WEIGH_SLIP',   'Weighment Slip',          'weighment',    true),
  ('INVOICE',      'Tax Invoice',             'inward',       false),
  ('DELIVERY_CHLN','Delivery Challan',        'outward',      true),
  ('GATE_PASS',    'Gate Pass',               'inward',       false),
  ('LORRY_RECEIPT','Lorry Receipt',           'outward',      false),
  ('QUALITY_CERT', 'Quality Certificate',     'quality',      false),
  ('LAB_REPORT',   'Laboratory Report',       'quality',      false),
  ('FUMIG_CERT',   'Fumigation Certificate',  'fumigation',   true),
  ('PV_SHEET',     'Physical Verification Sheet','verification',true),
  ('POLICY_DOC',   'Insurance Policy Document','insurance',   true),
  ('ENDORSEMENT',  'Policy Endorsement',      'insurance',    false),
  ('SURVEY_REPORT','Surveyor Report',         'insurance',    false),
  ('STORAGE_AGMT', 'Storage Agreement',       'party',        false),
  ('GST_CERT',     'GST Registration',        'party',        false),
  ('PAN_CARD',     'PAN Card',                'party',        false),
  ('RC_BOOK',      'Vehicle Registration',    'vehicle',      false),
  ('VEH_INSURANCE','Vehicle Insurance',       'vehicle',      false),
  ('PHOTO',        'Photograph',              'inward',       false)
on conflict (code) do nothing;

commit;

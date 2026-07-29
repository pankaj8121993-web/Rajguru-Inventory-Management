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

-- ===========================================================================
-- Roles, permissions and the role matrix (migration 0007)
--
-- Seeded from docs/04-security/PERMISSION_MATRIX.md, which is a DRAFT awaiting
-- Rajguru Foods management approval. These grants are a starting point to build
-- against, not an approved matrix.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Roles (blueprint §5.4)
-- ---------------------------------------------------------------------------
insert into roles (code, name, description, may_override, sort_order) values
  ('SUPER_ADMIN',   'Super Administrator',      'Technical administration. Commercial override is granted separately (DR-50).', false, 10),
  ('BUS_ADMIN',     'Business Administrator',   'Business configuration and senior approvals.',                                   true,  20),
  ('MGMT_VIEWER',   'Management Viewer',        'Read-only across the business, including valuation and insurance.',              false, 30),
  ('WH_MANAGER',    'Warehouse Manager',        'Runs a facility. Approves operational transactions within scope.',               false, 40),
  ('WH_SUPERVISOR', 'Warehouse Supervisor',     'Supervises a godown or plot.',                                                   false, 50),
  ('WH_OPERATOR',   'Warehouse Operator',       'Records inward, movement and identification.',                                   false, 60),
  ('WEIGH_ENTRY',   'Weighment Entry Operator', 'Enters weighment slips.',                                                        false, 70),
  ('WEIGH_VERIFY',  'Weighment Verifier',       'Verifies weighment slips. Cannot verify their own (INV-24).',                    false, 80),
  ('GATE_OPERATOR', 'Gate Operator',            'Records gate entry and exit.',                                                   false, 90),
  ('QUALITY_INSP',  'Quality Inspector',        'Records quality inspections and results.',                                       false, 100),
  ('FUMIG_OP',      'Fumigation Operator',      'Executes fumigation.',                                                           false, 110),
  ('FUMIG_APPROVER','Fumigation Approver',      'Approves fumigation and safety-period release.',                                 true,  120),
  ('STOCK_ACCT',    'Stock Accountant',         'Owns the ledger. Approves identification and adjustments.',                      false, 130),
  ('DISPATCH_EXEC', 'Dispatch Executive',       'Records outward dispatch.',                                                      false, 140),
  ('PV_TEAM',       'Physical Verification Team','Records physical verification. Cannot alter the ledger (INV-13).',              false, 150),
  ('DISCREP_REVIEW','Discrepancy Reviewer',     'Investigates and closes discrepancies.',                                         false, 160),
  ('INS_MANAGER',   'Insurance Manager',        'Maintains policies and coverage. Read-only on stock (INV-21).',                  true,  170),
  ('INS_VIEWER',    'Insurance Viewer',         'Views insurance coverage.',                                                      false, 180),
  ('AUDITOR',       'Auditor',                  'Read-only across everything, including full audit history.',                     false, 190),
  ('REPORT_VIEWER', 'Report Viewer',            'Views and exports reports within scope.',                                        false, 200),
  ('READ_ONLY',     'Read-Only User',           'Views stock within scope.',                                                      false, 210)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Permissions — action per module
-- ---------------------------------------------------------------------------
insert into permissions (module, action, name, is_controlled)
select v.module, v.action::permission_action, v.name, v.controlled
from (values
  ('masters','view','View masters',false),
  ('masters','create','Create masters',false),
  ('masters','manage_master','Manage masters',true),
  ('locations','view','View locations',false),
  ('locations','manage_master','Manage locations',true),
  ('parties','view','View parties',false),
  ('parties','manage_master','Manage parties',true),
  ('weighment','view','View weighments',false),
  ('weighment','create','Enter weighments',false),
  ('weighment','edit_draft','Edit draft weighments',false),
  ('weighment','submit','Submit weighments',false),
  ('weighment','verify','Verify weighments',true),
  ('weighment','reverse','Reverse weighments',true),
  ('inward','view','View inward',false),
  ('inward','create','Create inward',false),
  ('inward','approve','Approve inward',true),
  ('identification','view','View identification',false),
  ('identification','allocate','Allocate provisional stock',false),
  ('identification','reclassify','Reclassify stock',false),
  ('identification','approve','Approve identification',true),
  ('stock','view','View stock',false),
  ('stock','view_valuation','View stock valuation',false),
  ('stock','adjust','Adjust stock',true),
  ('stock','close','Close a lot',true),
  ('stock','reopen','Reopen a lot',true),
  ('transfer','view','View transfers',false),
  ('transfer','create','Request transfers',false),
  ('transfer','approve','Approve transfers',true),
  ('transfer','transfer','Issue and receive transfers',false),
  ('outward','view','View outward',false),
  ('outward','create','Create outward',false),
  ('outward','approve','Approve outward',true),
  ('quality','view','View quality',false),
  ('quality','create','Record quality results',false),
  ('quality','approve','Approve quality decisions',true),
  ('fumigation','view','View fumigation',false),
  ('fumigation','create','Record fumigation',false),
  ('fumigation','approve','Approve fumigation',true),
  ('verification','view','View physical verification',false),
  ('verification','create','Record physical verification',false),
  ('verification','approve','Approve physical verification',true),
  ('insurance','view_insurance','View insurance',false),
  ('insurance','edit_insurance','Maintain insurance',true),
  ('reports','view','View reports',false),
  ('reports','export','Export reports',false),
  ('reports','print','Print reports',false),
  ('governance','view_audit','View audit history',false),
  ('governance','override','Apply an override',true),
  ('governance','approve','Approve an override',true),
  ('administration','manage_user','Manage users and roles',true)
) as v(module, action, name, controlled)
on conflict (module, action) do nothing;

-- ---------------------------------------------------------------------------
-- Role matrix
-- ---------------------------------------------------------------------------

-- Read-only roles.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'READ_ONLY' and (p.module, p.action::text) in (('stock','view'),('reports','view'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'REPORT_VIEWER'
   and (p.module, p.action::text) in
       (('reports','view'),('reports','export'),('reports','print'),('stock','view'))
on conflict do nothing;

-- Auditor: read everything, change nothing.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'AUDITOR'
   and p.action::text in ('view','view_audit','view_valuation','view_insurance','export','print')
on conflict do nothing;

-- Management viewer: read, including money.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'MGMT_VIEWER'
   and p.action::text in ('view','view_valuation','view_insurance','export','print')
on conflict do nothing;

-- Weighment entry and verification, deliberately separated (INV-24).
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'WEIGH_ENTRY'
   and (p.module, p.action::text) in
       (('weighment','view'),('weighment','create'),('weighment','edit_draft'),
        ('weighment','submit'),('parties','view'),('locations','view'),('masters','view'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'WEIGH_VERIFY'
   and (p.module, p.action::text) in
       (('weighment','view'),('weighment','verify'),('governance','view_audit'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'GATE_OPERATOR'
   and (p.module, p.action::text) in
       (('weighment','view'),('weighment','create'),('parties','view'))
on conflict do nothing;

-- Warehouse operations.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'WH_OPERATOR'
   and (p.module, p.action::text) in
       (('stock','view'),('inward','view'),('inward','create'),
        ('identification','view'),('identification','allocate'),
        ('transfer','view'),('transfer','create'),('transfer','transfer'),
        ('locations','view'),('parties','view'),('masters','view'),('weighment','view'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'WH_SUPERVISOR'
   and (p.module, p.action::text) in
       (('stock','view'),('inward','view'),('inward','create'),
        ('identification','view'),('identification','allocate'),('identification','reclassify'),
        ('transfer','view'),('transfer','create'),('transfer','transfer'),
        ('verification','view'),('verification','create'),
        ('locations','view'),('parties','view'),('masters','view'),
        ('weighment','view'),('governance','view_audit'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'WH_MANAGER'
   and (p.module, p.action::text) in
       (('stock','view'),('inward','view'),('inward','approve'),
        ('identification','view'),('identification','approve'),
        ('transfer','view'),('transfer','approve'),
        ('outward','view'),('outward','approve'),
        ('quality','view'),('quality','approve'),
        ('verification','view'),('verification','approve'),
        ('weighment','view'),('locations','view'),('parties','view'),('masters','view'),
        ('reports','view'),('reports','export'),('governance','view_audit'))
on conflict do nothing;

-- Stock accountant owns the ledger.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'STOCK_ACCT'
   and (p.module, p.action::text) in
       (('stock','view'),('stock','view_valuation'),('stock','adjust'),('stock','close'),
        ('identification','view'),('identification','approve'),
        ('weighment','view'),('weighment','reverse'),
        ('inward','view'),('transfer','view'),('outward','view'),
        ('verification','view'),
        ('reports','view'),('reports','export'),('governance','view_audit'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'DISPATCH_EXEC'
   and (p.module, p.action::text) in
       (('outward','view'),('outward','create'),('stock','view'),
        ('weighment','view'),('weighment','create'),('parties','view'))
on conflict do nothing;

-- Quality and fumigation.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'QUALITY_INSP'
   and (p.module, p.action::text) in
       (('quality','view'),('quality','create'),('stock','view'),
        ('identification','view'),('identification','reclassify'),('masters','view'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'FUMIG_OP'
   and (p.module, p.action::text) in
       (('fumigation','view'),('fumigation','create'),('stock','view'),('locations','view'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'FUMIG_APPROVER'
   and (p.module, p.action::text) in
       (('fumigation','view'),('fumigation','approve'),('stock','view'),
        ('governance','override'),('governance','view_audit'))
on conflict do nothing;

-- Verification and discrepancy. PV team can never adjust the ledger (INV-13).
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'PV_TEAM'
   and (p.module, p.action::text) in
       (('verification','view'),('verification','create'),('stock','view'),('locations','view'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'DISCREP_REVIEW'
   and (p.module, p.action::text) in
       (('verification','view'),('stock','view'),('stock','adjust'),
        ('reports','view'),('governance','view_audit'))
on conflict do nothing;

-- Insurance. Read-only on stock (INV-21).
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'INS_MANAGER'
   and (p.module, p.action::text) in
       (('insurance','view_insurance'),('insurance','edit_insurance'),
        ('stock','view'),('stock','view_valuation'),
        ('reports','view'),('reports','export'),('governance','view_audit'))
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'INS_VIEWER'
   and (p.module, p.action::text) in
       (('insurance','view_insurance'),('stock','view'),('reports','view'))
on conflict do nothing;

-- Business administrator: broad approval and configuration, plus override.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'BUS_ADMIN'
   and p.action::text in
       ('view','create','manage_master','approve','view_valuation','view_insurance',
        'edit_insurance','view_audit','export','print','override','reopen','close')
on conflict do nothing;

-- Super administrator: technical administration and masters.
-- Deliberately WITHOUT governance.override — commercial override is separate
-- and must be granted explicitly (DR-50).
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
 where r.code = 'SUPER_ADMIN'
   and (p.action::text in ('view','create','manage_master','manage_user','view_audit','export','print'))
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Example assignments
--
-- Reproduces the blueprint's own §5.1 example: Ramesh holds three roles at
-- three different scopes.
-- ---------------------------------------------------------------------------
insert into user_roles (user_id, role_id, location_node_id, notes, created_by)
select u.id, r.id, n.id, v.notes, cr.id
from (values
  ('EMP001','WH_SUPERVISOR','ALY-G1', 'Blueprint §5.1 example — supervises Godown 1 only'),
  ('EMP001','FUMIG_APPROVER','ALY',   'Blueprint §5.1 example — approves fumigation facility-wide'),
  ('EMP001','READ_ONLY',    null,     'Blueprint §5.1 example — views stock everywhere'),
  ('EMP002','STOCK_ACCT',   null,     'Owns the ledger across the business'),
  ('EMP003','WEIGH_ENTRY',  'ALY',    'Enters weighments at Aliyabad'),
  ('EMP004','WH_MANAGER',   'MUR',    'Runs the Murud facility')
) as v(user_code, role_code, node_code, notes)
join users u on u.code = v.user_code
join roles r on r.code = v.role_code
left join location_nodes n on n.code = v.node_code
cross join (select id from users where code = 'EMP001') cr
on conflict do nothing;

-- EMP003 enters weighments; EMP002 verifies them. Separating the two is what
-- makes maker-checker meaningful (INV-24).
insert into user_roles (user_id, role_id, location_node_id, notes, created_by)
select u.id, r.id, n.id, 'Verifies weighments entered by others', cr.id
from users u, roles r, location_nodes n, (select id from users where code='EMP001') cr
 where u.code = 'EMP002' and r.code = 'WEIGH_VERIFY' and n.code = 'ALY'
on conflict do nothing;

commit;

-- ===========================================================================
-- Weighment slips (migration 0006)
--
-- A realistic mix: exact matches, a small within-tolerance difference, one
-- beyond tolerance with a reason, an outward dispatch, and a slip whose
-- commodity is not yet known — which is legitimate at inward (blueprint §2.4).
-- ===========================================================================

begin;

insert into weighment_slips (
  slip_no, external_slip_no, weighbridge_id, weighment_date,
  vehicle_number, driver_name, party_id, source_category, commodity_id, variety_id,
  direction, gross_weight_kg, tare_weight_kg, printed_net_weight_kg,
  bag_count, invoice_no, status, entry_user_id, created_by, updated_by
)
select
  v.slip_no, v.ext, wb.id, current_date - (v.days_ago || ' days')::interval,
  v.veh_reg, v.drv_name, pty.id, v.source::source_category, com.id, var.id,
  v.direction::movement_direction, v.gross, v.tare, v.printed,
  v.bags, v.invoice, v.status::weighment_status, eu.id, eu.id, eu.id
from (values
  ('IN-202607-0001','KP-4471','WB-ALY-1', 6,'MH24AB1234','Balu Shinde','P0001','farmer',
   'TUR','LEMON','inward', 24500.000,  9800.000, 14700.000, 294, null,'verified','EMP003'),
  ('IN-202607-0002','KP-4472','WB-ALY-1', 6,'MH24AB5678','Ramrao Gaikwad','P0004','trader',
   'CHANA','DESI','inward', 18250.000,  8900.000,  9350.000, 187,'INV/26-27/0412','verified','EMP003'),
  -- Small difference, within the 0.5% tolerance: no reason needed.
  ('IN-202607-0003','KP-4489','WB-ALY-1', 4,'MH24CD9012','Imran Shaikh','P0003','farmer',
   'TUR','RED','inward', 31200.000, 12400.000, 18760.000, 376, null,'verified','EMP003'),
  -- Commodity not yet established. Entirely legitimate at inward.
  ('IN-202607-0004','KP-4501','WB-ALY-1', 3,'MH24GH7890',null,'P0002','farmer',
   null,null,'inward',  8600.000,  3100.000,  5500.000, 110, null,'awaiting_verification','EMP003'),
  -- Difference beyond tolerance. Carries a reason.
  ('IN-202607-0005','KP-4515','WB-ALY-1', 2,'MH13EF3456','Santosh Bhosale','P0005','trader',
   'WHEAT','LOKWAN','inward', 27400.000, 11100.000, 16150.000, 163,'INV/26-27/0455','awaiting_verification','EMP003'),
  ('IN-202607-0006','KP-4530','WB-ALY-1', 1,'MH24AB1234','Balu Shinde','P0008','auction',
   'MOONG','GREEN','inward', 15800.000,  9750.000,  6050.000, 121, null,'draft','EMP003'),
  ('OUT-202607-0001','KP-4533','WB-ALY-1',1,'MH12IJ2345','Ramrao Gaikwad','P0006','processor',
   'CHANA','DESI','outward', 29100.000, 13200.000, 15900.000, 318,'SI/26-27/0088','draft','EMP003')
) as v(slip_no, ext, wb_code, days_ago, veh_reg, drv_name, party_code, source,
       com_code, var_code, direction, gross, tare, printed, bags, invoice, status, user_code)
left join weighbridges wb on wb.code = v.wb_code
left join parties pty     on pty.code = v.party_code
left join commodities com on com.code = v.com_code
left join varieties var   on var.commodity_id = com.id and var.code = v.var_code
left join users eu        on eu.code = v.user_code
on conflict (slip_no) do nothing;

-- The beyond-tolerance slip carries a reason (DR-03).
update weighment_slips
   set difference_reason_id = (select id from reason_codes where code = 'WEIGH_DIFF'),
       difference_remarks   = 'Weighbridge re-check requested; operator recorded both readings.'
 where slip_no = 'IN-202607-0005';

-- Verification is by someone other than the person who entered it (INV-24).
update weighment_slips
   set verified_by_id = (select id from users where code = 'EMP002'),
       verified_at    = now()
 where status = 'verified';

commit;

-- ===========================================================================
-- Opening stock (migration 0008)
--
-- Posted through post_stock_transaction() — the same path the application
-- uses. Nothing writes to stock_ledger directly, including this seed.
--
-- Deliberately mixed: two segments with a final lot, one provisional batch
-- whose lot is not yet decided, and one recorded only to godown level. That
-- mix is the point of the product (blueprint §2.4).
-- ===========================================================================

begin;

insert into receipt_batches (batch_no, batch_basis, receipt_date, facility_id,
                             party_id, source_category, created_by)
select v.no, v.basis, current_date - (v.days || ' days')::interval, f.id, p.id,
       v.src::source_category, u.id
from (values
  ('RB-202607-0001','vehicle', 6,'ALY','P0001','farmer'),
  ('RB-202607-0002','vehicle', 6,'ALY','P0004','trader'),
  ('RB-202607-0003','day',     4,'ALY','P0003','farmer')
) as v(no, basis, days, fac_code, party_code, src)
join location_nodes f on f.code = v.fac_code and f.node_type='facility'
join parties p on p.code = v.party_code
cross join (select id from users where code='EMP001') u
on conflict (batch_no) do nothing;

insert into lots (lot_no, commodity_id, variety_id, grade_id, crop_year,
                  owner_type, created_by)
select v.no, c.id, vr.id, g.id, '2025-26', 'own'::ownership_type, u.id
from (values
  ('LOT-TUR-0001','TUR','LEMON','FAQ'),
  ('LOT-CHANA-0001','CHANA','DESI','FAQ')
) as v(no, com, var, grd)
join commodities c on c.code = v.com
left join varieties vr on vr.commodity_id = c.id and vr.code = v.var
left join grades g on g.commodity_id = c.id and g.code = v.grd
cross join (select id from users where code='EMP001') u
on conflict (lot_no) do nothing;

-- Segments. Note the third: a real provisional batch with no lot at all.
insert into inventory_segments (
  segment_no, receipt_batch_id, commodity_id, variety_id,
  identification_status, identification_confidence, lot_id,
  location_node_id, location_precision, owner_type, owner_party_id,
  source_category, created_by
)
select v.no, rb.id, c.id, vr.id,
       v.ident::identification_status, v.conf::identification_confidence, l.id,
       n.id, v.prec::location_precision, 'own'::ownership_type, p.id,
       v.src::source_category, u.id
from (values
  ('SEG-202607-0001','RB-202607-0001','TUR','LEMON','final_lot','confirmed',
   'LOT-TUR-0001','ALY-G1-A-S1','stack_bin_or_heap_known','P0001','farmer'),
  ('SEG-202607-0002','RB-202607-0002','CHANA','DESI','final_lot','confirmed',
   'LOT-CHANA-0001','ALY-G1-B-S1','stack_bin_or_heap_known','P0004','trader'),
  -- Provisional: commodity broadly known, lot not yet decided, placed only to
  -- godown level. Entirely legitimate at inward.
  ('SEG-202607-0003','RB-202607-0003','TUR',null,'provisional_batch','provisional',
   null,'ALY-G2','godown_known','P0003','farmer')
) as v(no, batch, com, var, ident, conf, lot, node, prec, party, src)
join receipt_batches rb on rb.batch_no = v.batch
join commodities c on c.code = v.com
left join varieties vr on vr.commodity_id = c.id and vr.code = v.var
left join lots l on l.lot_no = v.lot
join location_nodes n on n.code = v.node
join parties p on p.code = v.party
cross join (select id from users where code='EMP001') u
on conflict (segment_no) do nothing;

-- Post the opening quantities through the real posting function.
select post_stock_transaction(
  'inward'::stock_transaction_type,
  current_date - 6,
  jsonb_build_array(
    jsonb_build_object('segment_id', (select id from inventory_segments where segment_no='SEG-202607-0001'),
                       'quantity_kg', 14700.000, 'bag_count', 294),
    jsonb_build_object('segment_id', (select id from inventory_segments where segment_no='SEG-202607-0002'),
                       'quantity_kg', 9350.000, 'bag_count', 187)
  ),
  (select id from users where code='EMP001'),
  (select id from receipt_batches where batch_no='RB-202607-0001'),
  null, null, 'Opening stock — identified lots'
) where not exists (select 1 from stock_ledger);

select post_stock_transaction(
  'inward'::stock_transaction_type,
  current_date - 4,
  jsonb_build_array(
    jsonb_build_object('segment_id', (select id from inventory_segments where segment_no='SEG-202607-0003'),
                       'quantity_kg', 18800.000, 'bag_count', 376)
  ),
  (select id from users where code='EMP001'),
  (select id from receipt_batches where batch_no='RB-202607-0003'),
  null, null, 'Opening stock — provisional, lot not yet decided'
) where (select count(*) from stock_ledger) = 2;

commit;

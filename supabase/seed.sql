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

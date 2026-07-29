-- 0004_parties_and_transport.sql
-- Party, employee and transport masters.
--
-- A party may hold more than one type — a trader may also be a storage customer
-- (docs/01-domain/MASTER_DATA_CATALOGUE.md §4). The relationship is therefore
-- many-to-many, never a single type column.
--
-- ROLLBACK: drop table weighbridges, drivers, vehicles, employees,
--           party_party_types, parties, party_types;

begin;

-- ---------------------------------------------------------------------------
-- Party types
--
-- A table, not an enum: the business may need a party type nobody anticipated
-- (DR-52), and adding one must not require a migration.
-- ---------------------------------------------------------------------------
create table party_types (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  -- Types that can supply stock inward, for filtering the inward party picker.
  is_supplier boolean not null default false,
  -- Types that can receive stock outward.
  is_customer boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint party_types_code_not_blank check (length(trim(code)) > 0)
);

create trigger party_types_set_updated_at
  before update on party_types for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Parties
-- ---------------------------------------------------------------------------
create table parties (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  legal_name      text not null,
  trade_name      text,

  -- Statutory identifiers. Format-checked, but never mandatory: a farmer
  -- selling at the mandi gate frequently has neither.
  gstin           text,
  pan             text,

  address         text,
  village         text,
  district        text,
  state           text,
  pincode         text,

  contact_person  text,
  mobile          text,
  email           text,

  bank_name           text,
  bank_account_number text,
  bank_ifsc           text,

  credit_terms_days   integer,
  storage_agreement_ref text,
  broker_party_id     uuid references parties(id) on delete restrict,

  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint parties_code_not_blank       check (length(trim(code)) > 0),
  constraint parties_legal_name_not_blank check (length(trim(legal_name)) > 0),
  constraint parties_not_own_broker       check (broker_party_id is null or broker_party_id <> id),

  -- 15 characters: 2 state + 10 PAN + 1 entity + 1 'Z' + 1 checksum.
  constraint parties_gstin_format check (
    gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
  ),
  constraint parties_pan_format check (
    pan is null or pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
  ),
  constraint parties_mobile_format check (
    mobile is null or mobile ~ '^[6-9][0-9]{9}$'
  ),
  constraint parties_pincode_format check (
    pincode is null or pincode ~ '^[1-9][0-9]{5}$'
  ),
  constraint parties_email_format check (
    email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint parties_ifsc_format check (
    bank_ifsc is null or bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
  ),
  constraint parties_credit_terms_non_negative check (
    credit_terms_days is null or credit_terms_days >= 0
  )
);

create index parties_active_idx    on parties (is_active);
create index parties_broker_idx    on parties (broker_party_id);
create index parties_name_trgm     on parties using gin (legal_name gin_trgm_ops);
create unique index parties_gstin_unique on parties (gstin) where gstin is not null;
create unique index parties_pan_unique   on parties (pan)   where pan   is not null;

create trigger parties_set_updated_at
  before update on parties for each row execute function set_updated_at();

comment on table parties is
  'Farmers, traders, brokers, customers, transporters and other counterparties. Types are many-to-many.';

-- ---------------------------------------------------------------------------
-- Party to type — many-to-many
-- ---------------------------------------------------------------------------
create table party_party_types (
  party_id      uuid not null references parties(id) on delete cascade,
  party_type_id uuid not null references party_types(id) on delete restrict,
  created_at    timestamptz not null default now(),
  created_by    uuid references users(id),
  primary key (party_id, party_type_id)
);

create index party_party_types_type_idx on party_party_types (party_type_id);

-- A party must hold at least one type. Enforced as a deferred constraint
-- trigger so both rows can be written inside one transaction.
create or replace function parties_require_a_type()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
  v_id    uuid := coalesce(new.party_id, old.party_id);
begin
  -- Skip when the party itself has gone; the cascade removed its types.
  if not exists (select 1 from parties where id = v_id) then
    return null;
  end if;

  select count(*) into v_count from party_party_types where party_id = v_id;
  if v_count = 0 then
    raise exception 'A party must have at least one type';
  end if;
  return null;
end;
$$;

create constraint trigger party_party_types_require_one
  after insert or delete on party_party_types
  deferrable initially deferred
  for each row execute function parties_require_a_type();

-- The trigger above only fires when a type row is touched. A party inserted
-- with no types at all would slip past it, so the party itself is checked too.
create or replace function parties_check_has_type()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*) into v_count from party_party_types where party_id = new.id;
  if v_count = 0 then
    raise exception 'A party must have at least one type';
  end if;
  return null;
end;
$$;

create constraint trigger parties_require_a_type_trg
  after insert or update on parties
  deferrable initially deferred
  for each row execute function parties_check_has_type();

-- ---------------------------------------------------------------------------
-- Employees
-- ---------------------------------------------------------------------------
create table employees (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  full_name         text not null,
  designation       text,
  department        text,
  facility_id       uuid references location_nodes(id) on delete restrict,
  reporting_manager_id uuid references employees(id) on delete restrict,
  employment_status text not null default 'active',
  mobile            text,
  email             text,
  shift             text,
  date_of_joining   date,
  user_id           uuid references users(id) on delete set null,

  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint employees_code_not_blank check (length(trim(code)) > 0),
  constraint employees_name_not_blank check (length(trim(full_name)) > 0),
  constraint employees_not_own_manager check (
    reporting_manager_id is null or reporting_manager_id <> id
  ),
  constraint employees_mobile_format check (mobile is null or mobile ~ '^[6-9][0-9]{9}$')
);

create index employees_facility_idx on employees (facility_id);
create index employees_manager_idx  on employees (reporting_manager_id);

create trigger employees_set_updated_at
  before update on employees for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Vehicles
--
-- The transporter is a party holding the transporter type, not a separate
-- master — the same firm may also be a trader.
-- ---------------------------------------------------------------------------
create table vehicles (
  id                  uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  vehicle_type        text,
  transporter_party_id uuid references parties(id) on delete restrict,

  capacity_mt         numeric(12,3),
  trailer_number      text,

  -- Document validity. Expiry is surfaced as a warning, never a hard block:
  -- a vehicle at the gate with a lapsed certificate is a real situation that
  -- must be recorded, not hidden.
  insurance_valid_to  date,
  pollution_valid_to  date,
  fitness_valid_to    date,
  permit_valid_to     date,

  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint vehicles_registration_not_blank check (length(trim(registration_number)) > 0),
  constraint vehicles_capacity_non_negative  check (capacity_mt is null or capacity_mt >= 0),
  -- Indian format, allowing the older and BH series: MH12AB1234, MH 12 AB 1234.
  constraint vehicles_registration_format check (
    registration_number ~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$'
  )
);

create index vehicles_transporter_idx on vehicles (transporter_party_id);
create index vehicles_active_idx      on vehicles (is_active);

create trigger vehicles_set_updated_at
  before update on vehicles for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Drivers
-- ---------------------------------------------------------------------------
create table drivers (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  full_name           text not null,
  licence_number      text,
  licence_valid_to    date,
  mobile              text,
  transporter_party_id uuid references parties(id) on delete restrict,

  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint drivers_code_not_blank check (length(trim(code)) > 0),
  constraint drivers_name_not_blank check (length(trim(full_name)) > 0),
  constraint drivers_mobile_format  check (mobile is null or mobile ~ '^[6-9][0-9]{9}$')
);

create index drivers_transporter_idx on drivers (transporter_party_id);

create trigger drivers_set_updated_at
  before update on drivers for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Weighbridges
--
-- The physical position is a location node; this master holds the operational
-- attributes weighment entry needs (blueprint §4.7).
-- ---------------------------------------------------------------------------
create table weighbridges (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name              text not null,
  location_node_id  uuid references location_nodes(id) on delete restrict,
  is_own            boolean not null default true,
  operator_party_id uuid references parties(id) on delete restrict,

  make              text,
  capacity_mt       numeric(12,3),
  least_count_kg    numeric(10,3),
  calibration_valid_to date,

  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint weighbridges_code_not_blank check (length(trim(code)) > 0),
  constraint weighbridges_name_not_blank check (length(trim(name)) > 0),
  constraint weighbridges_capacity_non_negative check (
    capacity_mt is null or capacity_mt >= 0
  ),
  constraint weighbridges_least_count_positive check (
    least_count_kg is null or least_count_kg > 0
  )
);

create index weighbridges_location_idx on weighbridges (location_node_id);

create trigger weighbridges_set_updated_at
  before update on weighbridges for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (NFR-03)
-- ---------------------------------------------------------------------------
alter table party_types        enable row level security;
alter table parties            enable row level security;
alter table party_party_types  enable row level security;
alter table employees          enable row level security;
alter table vehicles           enable row level security;
alter table drivers            enable row level security;
alter table weighbridges       enable row level security;

revoke all on party_types, parties, party_party_types, employees,
              vehicles, drivers, weighbridges from public;

commit;

-- 0003_commodity_masters.sql
-- Commodity masters: units, bag types, commodity groups, commodities,
-- varieties and grades.
--
-- DR-52: no business master is hard-coded in source. Everything here is data
-- the business maintains through the application.
--
-- ROLLBACK: drop table grades, varieties, commodities, commodity_groups,
--           bag_types, units;

begin;

-- ---------------------------------------------------------------------------
-- Units of measurement
-- ---------------------------------------------------------------------------
create table units (
  id            uuid primary key default gen_random_uuid(),
  code          text        not null unique,
  name          text        not null,
  symbol        text        not null,
  -- Conversion to the base unit for its dimension (kg for weight).
  factor_to_base numeric(18,6) not null,
  base_unit_code text       not null,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid        references users(id),
  updated_at    timestamptz not null default now(),
  updated_by    uuid        references users(id),

  constraint units_code_not_blank check (length(trim(code)) > 0),
  constraint units_factor_positive check (factor_to_base > 0)
);

create trigger units_set_updated_at
  before update on units for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Bag types
-- ---------------------------------------------------------------------------
create table bag_types (
  id                uuid primary key default gen_random_uuid(),
  code              text        not null unique,
  name              text        not null,
  standard_weight_kg numeric(10,3),
  material          text,
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  created_by        uuid        references users(id),
  updated_at        timestamptz not null default now(),
  updated_by        uuid        references users(id),

  constraint bag_types_code_not_blank check (length(trim(code)) > 0),
  constraint bag_types_weight_positive check (
    standard_weight_kg is null or standard_weight_kg > 0
  )
);

create trigger bag_types_set_updated_at
  before update on bag_types for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Commodity groups
-- ---------------------------------------------------------------------------
create table commodity_groups (
  id          uuid primary key default gen_random_uuid(),
  code        text        not null unique,
  name        text        not null,
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid        references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references users(id),

  constraint commodity_groups_code_not_blank check (length(trim(code)) > 0)
);

create trigger commodity_groups_set_updated_at
  before update on commodity_groups for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Commodities
-- ---------------------------------------------------------------------------
create table commodities (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  commodity_group_id  uuid references commodity_groups(id) on delete restrict,
  description         text,

  standard_unit_id    uuid references units(id) on delete restrict,
  standard_bag_type_id uuid references bag_types(id) on delete restrict,

  -- Quality guidance
  standard_moisture_pct numeric(6,3),
  shelf_life_days       integer,

  -- Fumigation guidance (blueprint 4.2)
  fumigation_interval_days integer,

  storage_restrictions  text,
  insurance_category    text,
  processing_category   text,

  is_active   boolean     not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid        references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references users(id),

  constraint commodities_code_not_blank check (length(trim(code)) > 0),
  constraint commodities_name_not_blank check (length(trim(name)) > 0),
  constraint commodities_moisture_range check (
    standard_moisture_pct is null
    or (standard_moisture_pct >= 0 and standard_moisture_pct <= 100)
  ),
  constraint commodities_shelf_life_positive check (
    shelf_life_days is null or shelf_life_days > 0
  ),
  constraint commodities_fumigation_interval_positive check (
    fumigation_interval_days is null or fumigation_interval_days > 0
  )
);

create index commodities_group_idx  on commodities (commodity_group_id);
create index commodities_active_idx on commodities (is_active);
create index commodities_name_trgm  on commodities using gin (name gin_trgm_ops);

create trigger commodities_set_updated_at
  before update on commodities for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Varieties
--
-- "Tur" later identified as "Lemon Tur" is a classification event, not a
-- correction (DR-17). Varieties belong to a commodity.
-- ---------------------------------------------------------------------------
create table varieties (
  id            uuid primary key default gen_random_uuid(),
  commodity_id  uuid not null references commodities(id) on delete restrict,
  code          text not null,
  name          text not null,
  description   text,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid        references users(id),
  updated_at    timestamptz not null default now(),
  updated_by    uuid        references users(id),

  constraint varieties_code_not_blank check (length(trim(code)) > 0),
  constraint varieties_code_unique_per_commodity unique (commodity_id, code)
);

create index varieties_commodity_idx on varieties (commodity_id);

create trigger varieties_set_updated_at
  before update on varieties for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Grades
--
-- A grade may apply to a commodity generally, or to one variety specifically.
-- ---------------------------------------------------------------------------
create table grades (
  id            uuid primary key default gen_random_uuid(),
  commodity_id  uuid not null references commodities(id) on delete restrict,
  variety_id    uuid references varieties(id) on delete restrict,
  code          text not null,
  name          text not null,
  description   text,
  sort_order    integer not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid        references users(id),
  updated_at    timestamptz not null default now(),
  updated_by    uuid        references users(id),

  constraint grades_code_not_blank check (length(trim(code)) > 0),
  constraint grades_code_unique_per_commodity unique (commodity_id, code)
);

create index grades_commodity_idx on grades (commodity_id);
create index grades_variety_idx   on grades (variety_id);

create trigger grades_set_updated_at
  before update on grades for each row execute function set_updated_at();

-- A grade's variety, where set, must belong to the same commodity.
create or replace function grades_validate_variety()
returns trigger
language plpgsql
as $$
declare
  v_commodity uuid;
begin
  if new.variety_id is not null then
    select commodity_id into v_commodity from varieties where id = new.variety_id;
    if v_commodity is distinct from new.commodity_id then
      raise exception 'The selected variety belongs to a different commodity';
    end if;
  end if;
  return new;
end;
$$;

create trigger grades_validate_variety_trg
  before insert or update of variety_id, commodity_id on grades
  for each row execute function grades_validate_variety();

-- ---------------------------------------------------------------------------
-- Row Level Security (NFR-03)
-- ---------------------------------------------------------------------------
alter table units            enable row level security;
alter table bag_types        enable row level security;
alter table commodity_groups enable row level security;
alter table commodities      enable row level security;
alter table varieties        enable row level security;
alter table grades           enable row level security;

revoke all on units, bag_types, commodity_groups, commodities, varieties, grades from public;

commit;

-- 0005_reason_codes.sql
-- Reason codes and document types.
--
-- DR-39: every gain, loss, damage, adjustment, override and correction carries
-- a mandatory reason from the configured list.
--
-- DR-52: the business must be able to add a loss reason without a developer and
-- a migration. Categories are a table, not an enum, for exactly that reason.
--
-- ROLLBACK: drop table document_types, reason_codes, reason_code_categories;

begin;

-- ---------------------------------------------------------------------------
-- Reason code categories
--
-- Seeded with the vocabularies the workflows need (blueprint §4.7, §18).
-- The business may add more.
-- ---------------------------------------------------------------------------
create table reason_code_categories (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint reason_code_categories_code_not_blank check (length(trim(code)) > 0)
);

create trigger reason_code_categories_set_updated_at
  before update on reason_code_categories for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Reason codes
-- ---------------------------------------------------------------------------
create table reason_codes (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references reason_code_categories(id) on delete restrict,
  code        text not null,
  name        text not null,
  description text,

  -- DR-39: some reasons cannot be accepted on assertion alone.
  requires_evidence  boolean not null default false,
  -- DR-40: some always escalate regardless of quantity or value.
  requires_approval  boolean not null default false,
  -- Reasons that indicate a possible control failure rather than normal
  -- operational variance, for the exception dashboard (blueprint §23.6).
  is_exception       boolean not null default false,

  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint reason_codes_code_not_blank check (length(trim(code)) > 0),
  constraint reason_codes_name_not_blank check (length(trim(name)) > 0),
  constraint reason_codes_code_unique_per_category unique (category_id, code)
);

create index reason_codes_category_idx on reason_codes (category_id);
create index reason_codes_active_idx   on reason_codes (is_active);

create trigger reason_codes_set_updated_at
  before update on reason_codes for each row execute function set_updated_at();

comment on table reason_codes is
  'Mandatory reasons for gain, loss, damage, adjustment, override, correction and reclassification (DR-39).';

-- ---------------------------------------------------------------------------
-- Document types
-- ---------------------------------------------------------------------------
create table document_types (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  -- Where this document is expected: weighment, inward, outward, quality,
  -- fumigation, verification, insurance, party, vehicle.
  applies_to  text,
  is_mandatory boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint document_types_code_not_blank check (length(trim(code)) > 0)
);

create trigger document_types_set_updated_at
  before update on document_types for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (NFR-03)
-- ---------------------------------------------------------------------------
alter table reason_code_categories enable row level security;
alter table reason_codes           enable row level security;
alter table document_types         enable row level security;

revoke all on reason_code_categories, reason_codes, document_types from public;

commit;

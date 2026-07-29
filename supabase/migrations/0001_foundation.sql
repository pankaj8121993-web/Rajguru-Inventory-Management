-- 0001_foundation.sql
-- Extensions, shared enums, audit infrastructure and helper functions.
--
-- Phase 3 (Platform Foundation). Supabase-compatible: applies unchanged to a
-- Supabase project and to a plain PostgreSQL 16 instance.
--
-- ROLLBACK: drop schema app cascade; drop table audit_events; drop table users;
--           drop type location_node_type, identification_status,
--                     identification_confidence, location_precision;

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";       -- fuzzy search on codes and names

-- ---------------------------------------------------------------------------
-- Structural enums
--
-- Only values that are structural and appear in invariant logic are enums.
-- Anything the business may extend (reason codes, document types) is a table.
-- See docs/01-domain/MASTER_DATA_CATALOGUE.md.
-- ---------------------------------------------------------------------------

-- The location hierarchy node types (blueprint 9, DOMAIN GLOSSARY "Location").
create type location_node_type as enum (
  'company', 'facility', 'plot', 'godown', 'building', 'open_yard',
  'floor', 'section', 'bay', 'zone', 'stack', 'bin', 'heap',
  'loading_point', 'unloading_point', 'gate', 'weighbridge',
  'restricted_area', 'fumigation_zone', 'fire_safety_zone'
);

-- INV-06: identification precision is always recorded.
create type identification_status as enum (
  'final_lot', 'provisional_batch', 'unidentified_pool', 'mixed_pool'
);

create type identification_confidence as enum (
  'confirmed', 'reasonably_identified', 'provisional', 'mixed',
  'unidentified', 'awaiting_segregation', 'awaiting_quality_classification',
  'awaiting_source_allocation'
);

-- INV-07: location precision is always recorded. Ordered coarse to fine;
-- DR-18 says precision may only increase.
create type location_precision as enum (
  'facility_known', 'plot_known', 'godown_known', 'section_or_bay_known',
  'stack_bin_or_heap_known', 'exact_confirmed'
);

-- ---------------------------------------------------------------------------
-- Users
--
-- Interim table for development. When Supabase Auth is provisioned this becomes
-- a profiles table keyed to auth.users(id). See KNOWN_ISSUES.md.
-- ---------------------------------------------------------------------------
create table users (
  id             uuid primary key default gen_random_uuid(),
  code           text        not null unique,
  full_name      text        not null,
  email          text        not null unique,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint users_code_not_blank check (length(trim(code)) > 0)
);

comment on table users is
  'Interim user table for development. Replaced by Supabase Auth + profiles at Phase 3 completion.';

-- ---------------------------------------------------------------------------
-- Audit events
--
-- NFR-14: every mutation writes an audit event inside the same transaction as
-- the change. Append-only: update and delete are blocked by trigger.
-- ---------------------------------------------------------------------------
create table audit_events (
  id              bigserial primary key,
  occurred_at     timestamptz not null default now(),
  actor_id        uuid        references users(id),
  actor_label     text        not null,
  action          text        not null,     -- create | update | deactivate | reactivate
  entity_table    text        not null,
  entity_id       uuid,
  entity_label    text,
  previous_value  jsonb,
  new_value       jsonb,
  reason          text,
  ip_address      inet,
  user_agent      text
);

create index audit_events_entity_idx on audit_events (entity_table, entity_id, occurred_at desc);
create index audit_events_actor_idx  on audit_events (actor_id, occurred_at desc);
create index audit_events_time_idx   on audit_events (occurred_at desc);

comment on table audit_events is
  'Append-only audit trail. Blueprint 28.4. Never updated, never deleted.';

-- Append-only guard.
create or replace function audit_events_no_mutate()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events is append-only (NFR-14): % is not permitted', tg_op;
end;
$$;

create trigger audit_events_block_update
  before update on audit_events
  for each row execute function audit_events_no_mutate();

create trigger audit_events_block_delete
  before delete on audit_events
  for each row execute function audit_events_no_mutate();

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

-- Keeps updated_at honest without relying on application code.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

commit;

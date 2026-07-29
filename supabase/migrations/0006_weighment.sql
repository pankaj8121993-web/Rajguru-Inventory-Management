-- 0006_weighment.sql
-- Manual weighment slip entry (Phase 4, blueprint §6).
--
-- DR-01: calculated net weight is always gross − tare. The system computes it;
--        the user never types it. Enforced here as a GENERATED column, so it is
--        impossible to write a wrong net weight even from a bad query.
--
-- DR-02: gross, tare, calculated net, printed net and the difference are five
--        separate persisted values. Neither net ever overwrites the other.
--
-- DR-07: no weighbridge hardware integration. Entry is manual, from physical,
--        photographed, scanned or PDF slips.
--
-- ROLLBACK: drop table duplicate_reviews, weighment_slips;
--           drop type weighment_status, movement_direction, source_category;
--           delete from system_settings where key like 'weighment.%';

begin;

-- ---------------------------------------------------------------------------
-- Structural enums
-- ---------------------------------------------------------------------------

-- Blueprint §6.3.
create type weighment_status as enum (
  'draft', 'awaiting_document', 'awaiting_verification', 'verified',
  'partially_allocated', 'fully_allocated', 'posted',
  'disputed', 'reversed', 'cancelled'
);

create type movement_direction as enum ('inward', 'outward');

-- Where the stock came from. Structural: it drives which party types are valid
-- and, later, how the receipt batch is grouped.
create type source_category as enum (
  'farmer', 'trader', 'broker', 'auction', 'government',
  'storage_customer', 'processor', 'transfer', 'processing_return', 'other'
);

-- ---------------------------------------------------------------------------
-- System settings
--
-- Tolerances are configuration, not code (DR-03). Changing one must never
-- require a deployment.
-- ---------------------------------------------------------------------------
create table system_settings (
  key         text primary key,
  value       text not null,
  value_type  text not null default 'text',   -- text | number | boolean
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint system_settings_key_not_blank check (length(trim(key)) > 0)
);

create trigger system_settings_set_updated_at
  before update on system_settings for each row execute function set_updated_at();

insert into system_settings (key, value, value_type, description) values
  ('weighment.net_difference_tolerance_pct', '0.5', 'number',
   'Percentage difference between calculated and printed net weight that passes without a reason (DR-03). Confirm with operations — blocker 7.'),
  ('weighment.net_difference_escalation_pct', '2.0', 'number',
   'Percentage difference above which approval is required (DR-03).'),
  ('weighment.duplicate_window_days', '7', 'number',
   'How far back duplicate detection looks (DR-05).')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Weighment slips
-- ---------------------------------------------------------------------------
create table weighment_slips (
  id                 uuid primary key default gen_random_uuid(),

  -- Our own reference, and the number printed on the physical slip. They are
  -- different things and both matter.
  slip_no            text not null,
  external_slip_no   text,

  weighbridge_id     uuid references weighbridges(id) on delete restrict,
  weighment_date     date not null,
  first_weighment_at timestamptz,
  second_weighment_at timestamptz,

  vehicle_id         uuid references vehicles(id) on delete restrict,
  trailer_number     text,
  driver_id          uuid references drivers(id) on delete restrict,
  transporter_party_id uuid references parties(id) on delete restrict,

  party_id           uuid references parties(id) on delete restrict,
  source_category    source_category,
  broker_party_id    uuid references parties(id) on delete restrict,

  commodity_id       uuid references commodities(id) on delete restrict,
  variety_id         uuid references varieties(id) on delete restrict,

  direction          movement_direction not null,

  -- The five weights (DR-02). Kilograms, numeric — never floating point.
  gross_weight_kg    numeric(18,3) not null,
  tare_weight_kg     numeric(18,3) not null,
  calculated_net_weight_kg numeric(18,3)
    generated always as (gross_weight_kg - tare_weight_kg) stored,
  printed_net_weight_kg numeric(18,3),
  net_difference_kg  numeric(18,3)
    generated always as (
      case when printed_net_weight_kg is null then null
           else (gross_weight_kg - tare_weight_kg) - printed_net_weight_kg
      end
    ) stored,

  bag_count          integer,

  invoice_no         text,
  challan_no         text,
  gate_entry_no      text,
  purchase_sale_ref  text,

  status             weighment_status not null default 'draft',

  -- Reason and approval for a difference beyond tolerance (DR-03).
  difference_reason_id uuid references reason_codes(id) on delete restrict,
  difference_remarks   text,

  entry_user_id      uuid references users(id) on delete restrict,
  verified_by_id     uuid references users(id) on delete restrict,
  verified_at        timestamptz,

  remarks            text,

  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint weighment_slips_slip_no_not_blank check (length(trim(slip_no)) > 0),
  constraint weighment_slips_slip_no_unique unique (slip_no),

  -- Weights must be sane. A gross below tare would mean a negative net, which
  -- is not a weighment — it is a transcription error.
  constraint weighment_slips_gross_positive check (gross_weight_kg > 0),
  constraint weighment_slips_tare_non_negative check (tare_weight_kg >= 0),
  constraint weighment_slips_gross_above_tare check (gross_weight_kg > tare_weight_kg),
  constraint weighment_slips_printed_net_non_negative check (
    printed_net_weight_kg is null or printed_net_weight_kg >= 0
  ),
  constraint weighment_slips_bags_non_negative check (
    bag_count is null or bag_count >= 0
  ),
  constraint weighment_slips_second_after_first check (
    first_weighment_at is null or second_weighment_at is null
    or second_weighment_at >= first_weighment_at
  ),
  constraint weighment_slips_verified_together check (
    (verified_by_id is null) = (verified_at is null)
  )
);

create index weighment_slips_date_idx      on weighment_slips (weighment_date desc);
create index weighment_slips_status_idx    on weighment_slips (status);
create index weighment_slips_party_idx     on weighment_slips (party_id);
create index weighment_slips_vehicle_idx   on weighment_slips (vehicle_id);
create index weighment_slips_commodity_idx on weighment_slips (commodity_id);
create index weighment_slips_direction_idx on weighment_slips (direction);
create index weighment_slips_external_idx  on weighment_slips (external_slip_no);

create trigger weighment_slips_set_updated_at
  before update on weighment_slips for each row execute function set_updated_at();

comment on table weighment_slips is
  'Manual weighment entry. Net weight is generated, never typed (DR-01). Both calculated and printed net are preserved (DR-02).';

-- ---------------------------------------------------------------------------
-- Immutability after posting
--
-- Before posting a slip may be corrected freely. After posting it can only be
-- reversed by contra entry (DR-06).
-- ---------------------------------------------------------------------------
create or replace function weighment_slips_guard_posted()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'posted' and new.status not in ('reversed', 'disputed') then
    raise exception
      'A posted weighment cannot be edited. Reverse it instead (DR-06).';
  end if;

  -- A verifier may not be the person who entered the slip (maker-checker).
  if new.verified_by_id is not null
     and new.entry_user_id is not null
     and new.verified_by_id = new.entry_user_id then
    raise exception
      'The person who entered a weighment cannot verify it (INV-24).';
  end if;

  return new;
end;
$$;

create trigger weighment_slips_guard_posted_trg
  before update on weighment_slips
  for each row execute function weighment_slips_guard_posted();

-- The same maker-checker rule on insert, in case a slip arrives pre-verified.
create or replace function weighment_slips_guard_insert()
returns trigger
language plpgsql
as $$
begin
  if new.verified_by_id is not null
     and new.entry_user_id is not null
     and new.verified_by_id = new.entry_user_id then
    raise exception
      'The person who entered a weighment cannot verify it (INV-24).';
  end if;
  return new;
end;
$$;

create trigger weighment_slips_guard_insert_trg
  before insert on weighment_slips
  for each row execute function weighment_slips_guard_insert();

-- ---------------------------------------------------------------------------
-- Duplicate reviews
--
-- DR-05: a suspected duplicate is never auto-merged. It is resolved explicitly.
-- ---------------------------------------------------------------------------
create table duplicate_reviews (
  id             uuid primary key default gen_random_uuid(),
  slip_id        uuid not null references weighment_slips(id) on delete cascade,
  matched_slip_id uuid not null references weighment_slips(id) on delete cascade,
  match_reason   text not null,
  outcome        text,        -- reviewed_accepted | confirmed_duplicate | cancelled | linked
  outcome_reason_id uuid references reason_codes(id) on delete restrict,
  resolved_by_id uuid references users(id) on delete restrict,
  resolved_at    timestamptz,
  remarks        text,
  created_at     timestamptz not null default now(),
  created_by     uuid references users(id),

  constraint duplicate_reviews_not_self check (slip_id <> matched_slip_id),
  constraint duplicate_reviews_resolved_together check (
    (resolved_by_id is null) = (resolved_at is null)
  )
);

create index duplicate_reviews_slip_idx on duplicate_reviews (slip_id);
create index duplicate_reviews_open_idx on duplicate_reviews (outcome) where outcome is null;

-- ---------------------------------------------------------------------------
-- Duplicate detection
--
-- Compares the nine fields in DR-05 and returns candidates. It reports; it
-- never decides.
-- ---------------------------------------------------------------------------
create or replace function find_duplicate_weighments(
  p_external_slip_no text,
  p_weighbridge_id   uuid,
  p_date             date,
  p_vehicle_id       uuid,
  p_gross            numeric,
  p_tare             numeric,
  p_party_id         uuid,
  p_commodity_id     uuid,
  p_direction        movement_direction,
  p_exclude_id       uuid default null
)
returns table (id uuid, slip_no text, match_reason text)
language sql
stable
as $$
  with window_days as (
    select coalesce((select value::numeric from system_settings
                      where key = 'weighment.duplicate_window_days'), 7) as d
  )
  select w.id, w.slip_no,
         concat_ws(', ',
           case when p_external_slip_no is not null
                 and w.external_slip_no = p_external_slip_no
                then 'same slip number' end,
           case when w.vehicle_id is not distinct from p_vehicle_id
                 and p_vehicle_id is not null
                then 'same vehicle' end,
           case when w.gross_weight_kg = p_gross and w.tare_weight_kg = p_tare
                then 'same gross and tare' end,
           case when w.party_id is not distinct from p_party_id
                 and p_party_id is not null
                then 'same party' end
         ) as match_reason
    from weighment_slips w, window_days
   where w.is_active
     and w.status <> 'cancelled'
     and (p_exclude_id is null or w.id <> p_exclude_id)
     and w.direction = p_direction
     and w.weighment_date between p_date - (window_days.d || ' days')::interval
                              and p_date + (window_days.d || ' days')::interval
     and (
       -- Same printed slip number on the same weighbridge is a strong signal.
       (p_external_slip_no is not null
        and w.external_slip_no = p_external_slip_no
        and w.weighbridge_id is not distinct from p_weighbridge_id)
       or
       -- Same vehicle, same weights, same day is a strong signal too.
       (p_vehicle_id is not null
        and w.vehicle_id = p_vehicle_id
        and w.gross_weight_kg = p_gross
        and w.tare_weight_kg = p_tare
        and w.weighment_date = p_date)
       or
       -- Same party, commodity and exact weights within the window.
       (p_party_id is not null
        and w.party_id = p_party_id
        and w.commodity_id is not distinct from p_commodity_id
        and w.gross_weight_kg = p_gross
        and w.tare_weight_kg = p_tare)
     )
   order by w.weighment_date desc, w.slip_no;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (NFR-03)
-- ---------------------------------------------------------------------------
alter table system_settings    enable row level security;
alter table weighment_slips    enable row level security;
alter table duplicate_reviews  enable row level security;

revoke all on system_settings, weighment_slips, duplicate_reviews from public;

commit;

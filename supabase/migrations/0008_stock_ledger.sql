-- 0008_stock_ledger.sql
-- Receipt batches, inventory segments, lots and the stock ledger.
--
-- This is the highest-risk migration in the project. It carries the invariants
-- that make the platform trustworthy:
--
--   INV-01  stock can never go negative
--   INV-02  posted ledger entries are immutable
--   INV-03  every posted quantity has an inventory_segment_id
--   INV-04  lot_id is nullable, permanently (ADR-0002)
--   INV-05  a broad location is valid where the exact one is unknown
--   INV-06  identification precision is always recorded
--   INV-07  location precision is always recorded
--   INV-08  quantity is conserved through allocation
--   INV-14  transfer preserves total stock
--
-- ROLLBACK: drop table stock_balance_projections, stock_ledger,
--           stock_transaction_lines, stock_transactions, lot_location_allocations,
--           lots, inventory_segments, receipt_batches;
--           drop type stock_transaction_type, lot_status, segment_status;

begin;

-- ---------------------------------------------------------------------------
-- Structural enums
-- ---------------------------------------------------------------------------

-- Blueprint §2.2: every stock change occurs through a controlled transaction.
create type stock_transaction_type as enum (
  'inward', 'outward', 'internal_transfer',
  'identification', 'classification', 'location_refinement',
  'segment_split', 'segment_merge', 'ownership_transfer',
  'gain', 'loss', 'damage', 'sample_issue',
  'processing_issue', 'processing_receipt',
  'reversal', 'adjustment', 'final_reconciliation'
);

create type lot_status as enum (
  'open', 'reserved', 'blocked', 'under_processing', 'closed', 'reopened'
);

create type segment_status as enum ('open', 'exhausted', 'closed');

-- ---------------------------------------------------------------------------
-- Receipt batches
--
-- Groups one or more weighment slips into a commercial or operational inward
-- (blueprint §7.1). May be vehicle-, invoice-, day-, party-, commodity-,
-- contract- or auction-wise.
-- ---------------------------------------------------------------------------
create table receipt_batches (
  id            uuid primary key default gen_random_uuid(),
  batch_no      text not null unique,
  batch_basis   text not null default 'vehicle',
  receipt_date  date not null,
  facility_id   uuid not null references location_nodes(id) on delete restrict,
  party_id      uuid references parties(id) on delete restrict,
  source_category source_category,
  broker_party_id uuid references parties(id) on delete restrict,
  invoice_no    text,
  remarks       text,

  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint receipt_batches_no_not_blank check (length(trim(batch_no)) > 0)
);

create index receipt_batches_date_idx  on receipt_batches (receipt_date desc);
create index receipt_batches_party_idx on receipt_batches (party_id);

create trigger receipt_batches_set_updated_at
  before update on receipt_batches for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Lots
--
-- A lot exists only when identity is genuinely established. It is never
-- created as a placeholder to satisfy a NOT NULL constraint (ADR-0002).
-- ---------------------------------------------------------------------------
create table lots (
  id            uuid primary key default gen_random_uuid(),
  lot_no        text not null unique,
  commodity_id  uuid not null references commodities(id) on delete restrict,
  variety_id    uuid references varieties(id) on delete restrict,
  grade_id      uuid references grades(id) on delete restrict,
  crop_year     text,
  origin        text,
  owner_type    ownership_type not null default 'own',
  owner_party_id uuid references parties(id) on delete restrict,
  status        lot_status not null default 'open',
  opened_on     date not null default current_date,
  closed_on     date,
  remarks       text,

  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint lots_no_not_blank check (length(trim(lot_no)) > 0),
  constraint lots_closed_consistent check (
    (status = 'closed') = (closed_on is not null)
  )
);

create index lots_commodity_idx on lots (commodity_id);
create index lots_status_idx    on lots (status);
create index lots_owner_idx     on lots (owner_party_id);

create trigger lots_set_updated_at
  before update on lots for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Inventory segments — the anchor of stock identity (ADR-0002)
--
-- Every posted quantity references one. Identity matures over time; the
-- segment does not.
-- ---------------------------------------------------------------------------
create table inventory_segments (
  id            uuid primary key default gen_random_uuid(),
  segment_no    text not null unique,
  receipt_batch_id uuid references receipt_batches(id) on delete restrict,

  -- Identity, as far as it is currently known. All nullable except the two
  -- precision columns, which are never null (INV-06, INV-07).
  commodity_id  uuid references commodities(id) on delete restrict,
  variety_id    uuid references varieties(id) on delete restrict,
  grade_id      uuid references grades(id) on delete restrict,
  crop_year     text,

  identification_status     identification_status     not null,
  identification_confidence identification_confidence not null,

  -- INV-04: nullable, permanently. Never add NOT NULL to this column.
  lot_id        uuid references lots(id) on delete restrict,

  -- INV-05: any node in the hierarchy is valid, not only a leaf.
  location_node_id uuid not null references location_nodes(id) on delete restrict,
  location_precision location_precision not null,

  owner_type    ownership_type not null default 'own',
  owner_party_id uuid references parties(id) on delete restrict,
  source_category source_category,

  status        segment_status not null default 'open',
  responsible_employee_id uuid references employees(id) on delete restrict,

  -- Parent, where this segment came from a split.
  parent_segment_id uuid references inventory_segments(id) on delete restrict,

  remarks     text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint inventory_segments_no_not_blank check (length(trim(segment_no)) > 0),
  constraint inventory_segments_not_own_parent check (
    parent_segment_id is null or parent_segment_id <> id
  ),
  -- A segment carrying a final lot must say so, and vice versa. This keeps
  -- "identified" from drifting away from "has a lot".
  constraint inventory_segments_lot_matches_status check (
    (identification_status = 'final_lot') = (lot_id is not null)
  )
);

create index inventory_segments_lot_idx      on inventory_segments (lot_id);
create index inventory_segments_location_idx on inventory_segments (location_node_id);
create index inventory_segments_status_idx   on inventory_segments (identification_status);
create index inventory_segments_batch_idx    on inventory_segments (receipt_batch_id);
create index inventory_segments_commodity_idx on inventory_segments (commodity_id);
create index inventory_segments_created_idx  on inventory_segments (created_at);

create trigger inventory_segments_set_updated_at
  before update on inventory_segments for each row execute function set_updated_at();

comment on table inventory_segments is
  'The permanent anchor of stock identity (ADR-0002). lot_id is nullable by design (INV-04).';

-- ---------------------------------------------------------------------------
-- Stock transactions
-- ---------------------------------------------------------------------------
create table stock_transactions (
  id            uuid primary key default gen_random_uuid(),
  txn_no        text not null unique,
  txn_type      stock_transaction_type not null,
  txn_date      date not null default current_date,
  posted_at     timestamptz not null default now(),

  receipt_batch_id uuid references receipt_batches(id) on delete restrict,
  weighment_slip_id uuid references weighment_slips(id) on delete restrict,
  reason_code_id uuid references reason_codes(id) on delete restrict,

  -- A reversal points at what it reverses. The original is never deleted.
  reverses_txn_id uuid references stock_transactions(id) on delete restrict,

  posted_by_id  uuid references users(id) on delete restrict,
  approved_by_id uuid references users(id) on delete restrict,
  remarks       text,

  created_at  timestamptz not null default now(),

  constraint stock_transactions_no_not_blank check (length(trim(txn_no)) > 0),
  constraint stock_transactions_not_self_reversal check (
    reverses_txn_id is null or reverses_txn_id <> id
  ),
  -- INV-24: a maker never approves their own controlled transaction.
  constraint stock_transactions_no_self_approval check (
    approved_by_id is null or posted_by_id is null or approved_by_id <> posted_by_id
  )
);

create index stock_transactions_type_idx on stock_transactions (txn_type);
create index stock_transactions_date_idx on stock_transactions (txn_date desc);

-- ---------------------------------------------------------------------------
-- Stock ledger — append-only
--
-- The single record of what the business holds. One row per quantity movement
-- against one segment.
-- ---------------------------------------------------------------------------
create table stock_ledger (
  id            bigserial primary key,
  txn_id        uuid not null references stock_transactions(id) on delete restrict,
  txn_type      stock_transaction_type not null,
  posted_at     timestamptz not null default now(),
  effective_date date not null,

  -- INV-03: never null. The ledger anchors on the segment.
  inventory_segment_id uuid not null references inventory_segments(id) on delete restrict,

  -- INV-04: nullable, permanently.
  lot_id        uuid references lots(id) on delete restrict,

  -- INV-05: any node, not only a leaf.
  location_node_id uuid not null references location_nodes(id) on delete restrict,

  commodity_id  uuid references commodities(id) on delete restrict,
  owner_type    ownership_type not null default 'own',
  owner_party_id uuid references parties(id) on delete restrict,

  -- Signed: positive adds, negative removes. numeric, never floating point.
  quantity_kg   numeric(18,3) not null,
  bag_count     integer,

  posted_by_id  uuid references users(id) on delete restrict,
  remarks       text,

  constraint stock_ledger_quantity_not_zero check (quantity_kg <> 0)
);

create index stock_ledger_segment_idx   on stock_ledger (inventory_segment_id);
create index stock_ledger_lot_idx       on stock_ledger (lot_id);
create index stock_ledger_location_idx  on stock_ledger (location_node_id);
create index stock_ledger_commodity_idx on stock_ledger (commodity_id);
create index stock_ledger_txn_idx       on stock_ledger (txn_id);
create index stock_ledger_date_idx      on stock_ledger (effective_date desc);

comment on table stock_ledger is
  'Append-only record of stock movement. Never updated, never deleted (INV-02). Corrections are contra entries.';

-- INV-02: posted ledger entries are immutable.
create or replace function stock_ledger_no_mutate()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'stock_ledger is append-only (INV-02): % is not permitted. Correct by contra entry.',
    tg_op;
end;
$$;

create trigger stock_ledger_block_update
  before update on stock_ledger for each row execute function stock_ledger_no_mutate();

create trigger stock_ledger_block_delete
  before delete on stock_ledger for each row execute function stock_ledger_no_mutate();

-- ---------------------------------------------------------------------------
-- Balance projections
--
-- Maintained inside the posting transaction under row lock. The CHECK is what
-- makes INV-01 structural rather than a convention.
-- ---------------------------------------------------------------------------
create table stock_balance_projections (
  inventory_segment_id uuid primary key references inventory_segments(id) on delete restrict,
  location_node_id uuid not null references location_nodes(id) on delete restrict,
  lot_id        uuid references lots(id) on delete restrict,
  commodity_id  uuid references commodities(id) on delete restrict,
  owner_type    ownership_type not null default 'own',

  quantity_kg   numeric(18,3) not null default 0,
  bag_count     integer not null default 0,
  reserved_kg   numeric(18,3) not null default 0,
  blocked_kg    numeric(18,3) not null default 0,

  updated_at    timestamptz not null default now(),

  -- INV-01: stock can never go negative.
  constraint stock_balance_non_negative check (quantity_kg >= 0),
  -- INV-18: a reservation reduces availability but never physical quantity,
  -- and can never exceed it.
  constraint stock_balance_reserved_within check (reserved_kg >= 0 and reserved_kg <= quantity_kg),
  constraint stock_balance_blocked_within check (blocked_kg >= 0 and blocked_kg <= quantity_kg)
);

create index stock_balance_location_idx  on stock_balance_projections (location_node_id);
create index stock_balance_commodity_idx on stock_balance_projections (commodity_id);
create index stock_balance_lot_idx       on stock_balance_projections (lot_id);

-- ---------------------------------------------------------------------------
-- The posting function
--
-- The only path that writes to stock_ledger. Atomic: it succeeds completely or
-- rolls back completely (ARCHITECTURE.md §3).
--
-- Lines are supplied as jsonb:
--   [{"segment_id": uuid, "quantity_kg": numeric, "bag_count": int,
--     "location_node_id": uuid}]
--
-- A negative quantity removes stock. The balance check happens *after* the row
-- lock is taken, because a check without a lock is meaningless under
-- concurrency — that is the defect this design exists to prevent.
-- ---------------------------------------------------------------------------
create or replace function post_stock_transaction(
  p_txn_type    stock_transaction_type,
  p_effective_date date,
  p_lines       jsonb,
  p_posted_by   uuid default null,
  p_receipt_batch_id uuid default null,
  p_weighment_slip_id uuid default null,
  p_reason_code_id uuid default null,
  p_remarks     text default null,
  p_approved_by uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_txn_id   uuid;
  v_txn_no   text;
  v_line     jsonb;
  v_seg      inventory_segments%rowtype;
  v_qty      numeric(18,3);
  v_bags     integer;
  v_loc      uuid;
  v_balance  numeric(18,3);
  v_total    numeric(18,3) := 0;
begin
  if p_lines is null or jsonb_array_length(p_lines) = 0 then
    raise exception 'A stock transaction must have at least one line';
  end if;

  -- Transaction number, per type and month.
  select concat(
    upper(left(p_txn_type::text, 3)), '-',
    to_char(p_effective_date, 'YYYYMM'), '-',
    lpad((coalesce(max(substring(txn_no from '[0-9]+$')::int), 0) + 1)::text, 4, '0'))
    into v_txn_no
    from stock_transactions
   where txn_no like concat(upper(left(p_txn_type::text, 3)), '-',
                            to_char(p_effective_date, 'YYYYMM'), '-%');

  insert into stock_transactions
    (txn_no, txn_type, txn_date, receipt_batch_id, weighment_slip_id,
     reason_code_id, posted_by_id, approved_by_id, remarks)
  values
    (v_txn_no, p_txn_type, p_effective_date, p_receipt_batch_id, p_weighment_slip_id,
     p_reason_code_id, p_posted_by, p_approved_by, p_remarks)
  returning id into v_txn_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty  := (v_line->>'quantity_kg')::numeric;
    v_bags := nullif(v_line->>'bag_count', '')::integer;

    if v_qty is null or v_qty = 0 then
      raise exception 'Every line must carry a non-zero quantity';
    end if;

    -- Lock the segment before reading anything about its balance. This lock,
    -- not the CHECK constraint, is what makes concurrent dispatch safe.
    select * into v_seg from inventory_segments
     where id = (v_line->>'segment_id')::uuid
     for update;

    if not found then
      raise exception 'Inventory segment % does not exist', v_line->>'segment_id';
    end if;

    v_loc := coalesce(nullif(v_line->>'location_node_id','')::uuid, v_seg.location_node_id);

    -- Lock the balance row too, then read it. A projection row may not exist
    -- yet for a brand new segment.
    select quantity_kg into v_balance
      from stock_balance_projections
     where inventory_segment_id = v_seg.id
     for update;

    if not found then
      insert into stock_balance_projections
        (inventory_segment_id, location_node_id, lot_id, commodity_id, owner_type,
         quantity_kg, bag_count)
      values (v_seg.id, v_loc, v_seg.lot_id, v_seg.commodity_id, v_seg.owner_type, 0, 0);
      v_balance := 0;
    end if;

    -- INV-01, checked under the lock. The CHECK constraint below is the
    -- backstop; this raise is what gives the user a comprehensible message.
    if v_balance + v_qty < 0 then
      raise exception
        'Insufficient stock in segment %: % kg available, % kg requested',
        v_seg.segment_no, v_balance, abs(v_qty)
        using errcode = 'check_violation';
    end if;

    insert into stock_ledger
      (txn_id, txn_type, effective_date, inventory_segment_id, lot_id,
       location_node_id, commodity_id, owner_type, owner_party_id,
       quantity_kg, bag_count, posted_by_id)
    values
      (v_txn_id, p_txn_type, p_effective_date, v_seg.id, v_seg.lot_id,
       v_loc, v_seg.commodity_id, v_seg.owner_type, v_seg.owner_party_id,
       v_qty, v_bags, p_posted_by);

    update stock_balance_projections
       set quantity_kg = quantity_kg + v_qty,
           bag_count   = greatest(0, bag_count + coalesce(v_bags, 0)),
           lot_id      = v_seg.lot_id,
           commodity_id = v_seg.commodity_id,
           location_node_id = v_loc,
           updated_at  = now()
     where inventory_segment_id = v_seg.id;

    -- A segment whose balance reaches zero is exhausted, never deleted.
    update inventory_segments
       set status = case
             when (select quantity_kg from stock_balance_projections
                    where inventory_segment_id = v_seg.id) = 0
             then 'exhausted'::segment_status else 'open'::segment_status end
     where id = v_seg.id and status <> 'closed';

    v_total := v_total + v_qty;
  end loop;

  -- INV-08, INV-14, INV-15, INV-16: movements that only relocate or reshape
  -- stock must net to zero. Inward adds and outward removes; everything else
  -- conserves.
  if p_txn_type in ('internal_transfer', 'segment_split', 'segment_merge',
                    'ownership_transfer', 'identification')
     and v_total <> 0 then
    raise exception
      'A % must preserve total quantity; these lines net to % kg',
      p_txn_type, v_total;
  end if;

  return v_txn_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (NFR-03)
--
-- ADR-0004: no client role holds write access to any stock table. Posting
-- happens only through the server-side service and this function.
-- ---------------------------------------------------------------------------
alter table receipt_batches            enable row level security;
alter table lots                       enable row level security;
alter table inventory_segments         enable row level security;
alter table stock_transactions         enable row level security;
alter table stock_ledger               enable row level security;
alter table stock_balance_projections  enable row level security;

revoke all on receipt_batches, lots, inventory_segments, stock_transactions,
              stock_ledger, stock_balance_projections from public;

commit;

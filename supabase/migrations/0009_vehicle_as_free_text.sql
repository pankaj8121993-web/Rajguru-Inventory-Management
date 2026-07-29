-- 0009_vehicle_as_free_text.sql
-- Vehicle and driver become typed fields on the weighment slip, not masters.
--
-- Business decision (2026-07-29): a vehicle is data input, not reference data.
-- A truck nobody has seen before arrives at the gate every day, and requiring
-- someone to register it first would either block the weighment or push the
-- operator to pick a wrong vehicle from the list. Recording what is actually
-- on the paper matters more than a tidy master.
--
-- The same reasoning applies to the driver, so it moves with it.
--
-- Transporters remain parties: they are commercial counterparties with GSTIN,
-- terms and a relationship, which a registration number is not.
--
-- ROLLBACK: not reversible — the vehicles and drivers tables are dropped and
--           their content folded into weighment_slips as text.

begin;

-- ---------------------------------------------------------------------------
-- Fold the existing references into text on the slip
-- ---------------------------------------------------------------------------
alter table weighment_slips add column vehicle_number text;
alter table weighment_slips add column driver_name text;

update weighment_slips s
   set vehicle_number = v.registration_number
  from vehicles v
 where v.id = s.vehicle_id;

update weighment_slips s
   set driver_name = d.full_name
  from drivers d
 where d.id = s.driver_id;

alter table weighment_slips drop column vehicle_id;
alter table weighment_slips drop column driver_id;

-- Normalised on the way in by the application; the constraint keeps a
-- hand-written insert honest. Deliberately permissive: an unreadable or
-- non-standard number on a paper slip must still be recordable.
alter table weighment_slips
  add constraint weighment_slips_vehicle_number_shape check (
    vehicle_number is null or length(trim(vehicle_number)) between 4 and 20
  );

create index weighment_slips_vehicle_number_idx on weighment_slips (vehicle_number);

-- ---------------------------------------------------------------------------
-- Drop the masters
-- ---------------------------------------------------------------------------
drop table if exists drivers;
drop table if exists vehicles;

-- ---------------------------------------------------------------------------
-- Duplicate detection now matches on the typed vehicle number
-- ---------------------------------------------------------------------------
drop function if exists find_duplicate_weighments(text, uuid, date, uuid, numeric,
                                                  numeric, uuid, uuid, movement_direction, uuid);

create or replace function find_duplicate_weighments(
  p_external_slip_no text,
  p_weighbridge_id   uuid,
  p_date             date,
  p_vehicle_number   text,
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
           case when p_vehicle_number is not null
                 and w.vehicle_number = p_vehicle_number
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
       (p_external_slip_no is not null
        and w.external_slip_no = p_external_slip_no
        and w.weighbridge_id is not distinct from p_weighbridge_id)
       or
       (p_vehicle_number is not null
        and w.vehicle_number = p_vehicle_number
        and w.gross_weight_kg = p_gross
        and w.tare_weight_kg = p_tare
        and w.weighment_date = p_date)
       or
       (p_party_id is not null
        and w.party_id = p_party_id
        and w.commodity_id is not distinct from p_commodity_id
        and w.gross_weight_kg = p_gross
        and w.tare_weight_kg = p_tare)
     )
   order by w.weighment_date desc, w.slip_no;
$$;

commit;

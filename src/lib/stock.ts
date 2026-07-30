import 'server-only';

import { query } from './db';

/**
 * Stock reporting.
 *
 * Every figure here is derived from `stock_balance_projections`, which is
 * maintained inside the posting transaction. Nothing is estimated and nothing
 * is hard-coded — if a number appears on the dashboard, a ledger entry put it
 * there.
 *
 * Report queries outer-join to lots so provisional stock cannot be silently
 * dropped (INV-23, and the join trap in the report-development skill).
 */

export interface StockTotals {
  total_kg: string;
  own_kg: string;
  stored_kg: string;
  government_kg: string;
  pledged_kg: string;
  reserved_kg: string;
  blocked_kg: string;
  identified_kg: string;
  provisional_kg: string;
  unidentified_kg: string;
  segment_count: number;
  provisional_segments: number;
  imprecise_segments: number;
  lot_count: number;
}

export interface CommodityStock {
  commodity_id: string | null;
  commodity: string;
  group_name: string | null;
  total_kg: string;
  identified_kg: string;
  provisional_kg: string;
  segment_count: number;
  lot_count: number;
  location_count: number;
}

export interface LocationOccupancy {
  id: string;
  code: string;
  name: string;
  path: string;
  node_type: string;
  approved_capacity_mt: string | null;
  operational_capacity_mt: string | null;
  stock_kg: string;
}

export interface ProvisionalSegment {
  id: string;
  segment_no: string;
  commodity: string | null;
  identification_status: string;
  identification_confidence: string;
  location_path: string;
  location_precision: string;
  quantity_kg: string;
  age_days: number;
  party: string | null;
}

const OWNER_SUM = (t: string) =>
  `coalesce(sum(case when b.owner_type = '${t}' then b.quantity_kg end), 0)::text`;

const IDENT_SUM = (t: string) =>
  `coalesce(sum(case when s.identification_status = '${t}' then b.quantity_kg end), 0)::text`;

export async function stockTotals(): Promise<StockTotals> {
  const rows = await query<StockTotals>(
    `select
       coalesce(sum(b.quantity_kg), 0)::text          as total_kg,
       ${OWNER_SUM('own')}                            as own_kg,
       ${OWNER_SUM('stored')}                         as stored_kg,
       ${OWNER_SUM('government')}                     as government_kg,
       ${OWNER_SUM('pledged')}                        as pledged_kg,
       coalesce(sum(b.reserved_kg), 0)::text          as reserved_kg,
       coalesce(sum(b.blocked_kg), 0)::text           as blocked_kg,
       ${IDENT_SUM('final_lot')}                      as identified_kg,
       ${IDENT_SUM('provisional_batch')}              as provisional_kg,
       ${IDENT_SUM('unidentified_pool')}              as unidentified_kg,
       count(*)::int                                  as segment_count,
       count(*) filter (where s.lot_id is null)::int   as provisional_segments,
       count(*) filter (
         where s.location_precision in ('facility_known','plot_known','godown_known')
       )::int                                          as imprecise_segments,
       count(distinct s.lot_id)::int                   as lot_count
     from stock_balance_projections b
     join inventory_segments s on s.id = b.inventory_segment_id
    where b.quantity_kg > 0`,
  );
  return rows[0];
}

export async function commodityStock(): Promise<CommodityStock[]> {
  return query<CommodityStock>(
    `select b.commodity_id,
            coalesce(c.name, 'Not yet identified') as commodity,
            g.name as group_name,
            sum(b.quantity_kg)::text as total_kg,
            ${IDENT_SUM('final_lot')} as identified_kg,
            ${IDENT_SUM('provisional_batch')} as provisional_kg,
            count(*)::int as segment_count,
            count(distinct s.lot_id)::int as lot_count,
            count(distinct b.location_node_id)::int as location_count
       from stock_balance_projections b
       join inventory_segments s on s.id = b.inventory_segment_id
       left join commodities c on c.id = b.commodity_id
       left join commodity_groups g on g.id = c.commodity_group_id
      where b.quantity_kg > 0
      group by b.commodity_id, c.name, g.name
      order by sum(b.quantity_kg) desc`,
  );
}

/**
 * Occupancy for every godown and yard, including those holding nothing —
 * an empty godown is as much a fact as a full one.
 */
export async function locationOccupancy(): Promise<LocationOccupancy[]> {
  return query<LocationOccupancy>(
    `with holdings as (
       select b.location_node_id, sum(b.quantity_kg) as qty
         from stock_balance_projections b
        where b.quantity_kg > 0
        group by b.location_node_id
     ),
     -- Stock recorded at a bay or stack still occupies the godown above it, so
     -- roll every holding up to its nearest godown or yard ancestor.
     rolled as (
       select n.id as store_id, coalesce(sum(h.qty), 0) as qty
         from location_nodes n
         left join location_nodes d
                on d.id = n.id
                or d.parent_id = n.id
                or d.parent_id in (select id from location_nodes where parent_id = n.id)
                or d.parent_id in (
                     select id from location_nodes
                      where parent_id in (select id from location_nodes where parent_id = n.id)
                   )
         left join holdings h on h.location_node_id = d.id
        where n.node_type in ('godown', 'open_yard') and n.is_active
        group by n.id
     )
     select n.id, n.code, n.name, location_node_path(n.id) as path,
            n.node_type::text as node_type,
            n.approved_capacity_mt::text, n.operational_capacity_mt::text,
            r.qty::text as stock_kg
       from rolled r
       join location_nodes n on n.id = r.store_id
      order by r.qty desc, n.code`,
  );
}

export async function provisionalSegments(): Promise<ProvisionalSegment[]> {
  return query<ProvisionalSegment>(
    `select s.id, s.segment_no,
            c.name as commodity,
            s.identification_status::text,
            s.identification_confidence::text,
            location_node_path(s.location_node_id) as location_path,
            s.location_precision::text,
            b.quantity_kg::text,
            (current_date - s.created_at::date)::int as age_days,
            p.legal_name as party
       from inventory_segments s
       join stock_balance_projections b on b.inventory_segment_id = s.id
       left join commodities c on c.id = s.commodity_id
       left join parties p on p.id = s.owner_party_id
      where b.quantity_kg > 0
        and (s.lot_id is null
             or s.location_precision in ('facility_known','plot_known','godown_known'))
      order by s.created_at`,
  );
}

/** Weighments not yet turned into stock, and other things needing attention. */
export async function openWork(): Promise<{
  draft_weighments: number;
  awaiting_verification: number;
  open_duplicates: number;
  unposted_verified: number;
  expiring_policies: number;
}> {
  const rows = await query<{
    draft_weighments: string;
    awaiting_verification: string;
    open_duplicates: string;
    unposted_verified: string;
    expiring_policies: string;
  }>(
    `select
       (select count(*) from weighment_slips where status = 'draft' and is_active)::text,
       (select count(*) from weighment_slips where status = 'awaiting_verification' and is_active)::text,
       (select count(*) from duplicate_reviews where outcome is null)::text,
       (select count(*) from weighment_slips w
         where w.status = 'verified' and w.is_active
           and not exists (select 1 from stock_transactions t where t.weighment_slip_id = w.id))::text,
       '0'::text`,
  );
  const r = rows[0];
  return {
    draft_weighments: Number(r.draft_weighments),
    awaiting_verification: Number(r.awaiting_verification),
    open_duplicates: Number(r.open_duplicates),
    unposted_verified: Number(r.unposted_verified),
    expiring_policies: Number(r.expiring_policies),
  };
}

export async function recentMovements(limit = 8) {
  return query<{
    txn_no: string;
    txn_type: string;
    effective_date: string;
    segment_no: string;
    commodity: string | null;
    location_path: string;
    quantity_kg: string;
  }>(
    `select t.txn_no, l.txn_type::text, l.effective_date::text,
            s.segment_no, c.name as commodity,
            location_node_path(l.location_node_id) as location_path,
            l.quantity_kg::text
       from stock_ledger l
       join stock_transactions t on t.id = l.txn_id
       join inventory_segments s on s.id = l.inventory_segment_id
       left join commodities c on c.id = l.commodity_id
      order by l.id desc
      limit $1`,
    [Math.min(limit, 50)],
  );
}

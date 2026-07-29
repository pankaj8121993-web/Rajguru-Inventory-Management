import 'server-only';

import { query, queryOne, transaction, writeAudit, currentActor } from './db';
import {
  weighmentInputSchema, type WeighmentInput,
  type MovementDirection, type WeighmentStatus,
} from './validation/weighment';

export { weighmentInputSchema };
export type { WeighmentInput };

/**
 * Weighment slip data access (blueprint §6).
 *
 * Net weight is never written by this module — it is a generated column
 * (DR-01). We supply gross, tare and the printed net; the database computes
 * the rest.
 */

export interface WeighmentSlip {
  id: string;
  slip_no: string;
  external_slip_no: string | null;
  weighbridge_id: string | null;
  weighbridge_name: string | null;
  weighment_date: string;
  vehicle_number: string | null;
  trailer_number: string | null;
  driver_name: string | null;
  transporter_party_id: string | null;
  party_id: string | null;
  party_name: string | null;
  source_category: string | null;
  broker_party_id: string | null;
  commodity_id: string | null;
  commodity_name: string | null;
  variety_id: string | null;
  variety_name: string | null;
  direction: MovementDirection;
  gross_weight_kg: string;
  tare_weight_kg: string;
  calculated_net_weight_kg: string;
  printed_net_weight_kg: string | null;
  net_difference_kg: string | null;
  bag_count: number | null;
  invoice_no: string | null;
  challan_no: string | null;
  gate_entry_no: string | null;
  status: WeighmentStatus;
  difference_reason_id: string | null;
  difference_reason_name: string | null;
  difference_remarks: string | null;
  entry_user_id: string | null;
  entry_user_name: string | null;
  verified_by_id: string | null;
  verified_by_name: string | null;
  verified_at: string | null;
  remarks: string | null;
  open_duplicates: number;
}

export interface DuplicateCandidate {
  id: string;
  slip_no: string;
  match_reason: string;
}

export interface Tolerances {
  tolerancePct: number;
  escalationPct: number;
}

const SELECT_SLIP = `
  select s.*,
         s.weighment_date::text as weighment_date,
         s.first_weighment_at::text as first_weighment_at,
         s.second_weighment_at::text as second_weighment_at,
         s.verified_at::text as verified_at,
         wb.name as weighbridge_name,
         p.legal_name as party_name,
         c.name as commodity_name,
         vr.name as variety_name,
         rc.name as difference_reason_name,
         eu.full_name as entry_user_name,
         vu.full_name as verified_by_name,
         (select count(*)::int from duplicate_reviews dr
           where dr.slip_id = s.id and dr.outcome is null) as open_duplicates
    from weighment_slips s
    left join weighbridges wb on wb.id = s.weighbridge_id
    left join parties p       on p.id  = s.party_id
    left join commodities c   on c.id  = s.commodity_id
    left join varieties vr    on vr.id = s.variety_id
    left join reason_codes rc on rc.id = s.difference_reason_id
    left join users eu        on eu.id = s.entry_user_id
    left join users vu        on vu.id = s.verified_by_id
`;

export async function listWeighments(opts: {
  direction?: MovementDirection;
  status?: WeighmentStatus;
  search?: string;
  limit?: number;
} = {}): Promise<WeighmentSlip[]> {
  const conditions = ['s.is_active'];
  const params: unknown[] = [];

  if (opts.direction) {
    params.push(opts.direction);
    conditions.push(`s.direction = $${params.length}`);
  }
  if (opts.status) {
    params.push(opts.status);
    conditions.push(`s.status = $${params.length}`);
  }
  if (opts.search?.trim()) {
    params.push(`%${opts.search.trim()}%`);
    conditions.push(
      `(s.slip_no ilike $${params.length} or s.external_slip_no ilike $${params.length}
        or s.invoice_no ilike $${params.length})`,
    );
  }

  // NFR-07: every list is bounded.
  params.push(Math.min(opts.limit ?? 200, 500));

  return query<WeighmentSlip>(
    `${SELECT_SLIP}
      where ${conditions.join(' and ')}
      order by s.weighment_date desc, s.slip_no desc
      limit $${params.length}`,
    params,
  );
}

export async function getWeighment(id: string): Promise<WeighmentSlip | null> {
  return queryOne<WeighmentSlip>(`${SELECT_SLIP} where s.id = $1`, [id]);
}

export async function getTolerances(): Promise<Tolerances> {
  const rows = await query<{ key: string; value: string }>(
    `select key, value from system_settings
      where key in ('weighment.net_difference_tolerance_pct',
                    'weighment.net_difference_escalation_pct')`,
  );
  const get = (k: string, fallback: number) => {
    const v = rows.find((r) => r.key === k)?.value;
    return v === undefined ? fallback : Number(v);
  };
  return {
    tolerancePct: get('weighment.net_difference_tolerance_pct', 0.5),
    escalationPct: get('weighment.net_difference_escalation_pct', 2.0),
  };
}

/**
 * Next slip number, per direction and financial-year-agnostic date prefix.
 * Format: IN-YYYYMM-0001 / OUT-YYYYMM-0001.
 */
async function nextSlipNo(
  client: Parameters<Parameters<typeof transaction>[0]>[0],
  direction: MovementDirection,
  date: string,
): Promise<string> {
  const prefix = `${direction === 'inward' ? 'IN' : 'OUT'}-${date.slice(0, 7).replace('-', '')}`;
  const result = await client.query<{ next: string }>(
    `select lpad((coalesce(max(substring(slip_no from '[0-9]+$')::int), 0) + 1)::text, 4, '0') as next
       from weighment_slips where slip_no like $1`,
    [`${prefix}-%`],
  );
  return `${prefix}-${result.rows[0].next}`;
}

/** Duplicate candidates for a proposed slip (DR-05). Reports; never decides. */
export interface DuplicateProbe {
  external_slip_no: string | null;
  weighbridge_id: string | null;
  weighment_date: string;
  vehicle_number: string | null;
  gross_weight_kg: string | null;
  tare_weight_kg: string | null;
  party_id: string | null;
  commodity_id: string | null;
  direction: MovementDirection;
}

export async function findDuplicates(
  input: DuplicateProbe,
  excludeId?: string,
): Promise<DuplicateCandidate[]> {
  return query<DuplicateCandidate>(
    `select * from find_duplicate_weighments($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      input.external_slip_no, input.weighbridge_id, input.weighment_date,
      input.vehicle_number, input.gross_weight_kg, input.tare_weight_kg,
      input.party_id, input.commodity_id, input.direction, excludeId ?? null,
    ],
  );
}

export async function createWeighment(
  input: WeighmentInput,
): Promise<{ id: string; slipNo: string; duplicates: DuplicateCandidate[] }> {
  const actor = await currentActor();

  return transaction(async (client) => {
    const slipNo = await nextSlipNo(client, input.direction, input.weighment_date);

    const result = await client.query<{ id: string }>(
      `insert into weighment_slips
         (slip_no, external_slip_no, weighbridge_id, weighment_date,
          first_weighment_at, second_weighment_at,
          vehicle_number, trailer_number, driver_name, transporter_party_id,
          party_id, source_category, broker_party_id,
          commodity_id, variety_id, direction,
          gross_weight_kg, tare_weight_kg, printed_net_weight_kg, bag_count,
          invoice_no, challan_no, gate_entry_no,
          difference_reason_id, difference_remarks, remarks,
          status, entry_user_id, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::source_category,$13,$14,$15,
               $16::movement_direction,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
               'draft',$27,$27,$27)
       returning id`,
      [
        slipNo, input.external_slip_no, input.weighbridge_id, input.weighment_date,
        input.first_weighment_at || null, input.second_weighment_at || null,
        input.vehicle_number, input.trailer_number, input.driver_name,
        input.transporter_party_id, input.party_id, input.source_category,
        input.broker_party_id, input.commodity_id, input.variety_id, input.direction,
        input.gross_weight_kg, input.tare_weight_kg, input.printed_net_weight_kg,
        input.bag_count, input.invoice_no, input.challan_no, input.gate_entry_no,
        input.difference_reason_id, input.difference_remarks, input.remarks,
        actor.id || null,
      ],
    );

    const id = result.rows[0].id;

    // Record every duplicate candidate for explicit resolution (DR-05).
    const dupes = await client.query<DuplicateCandidate>(
      `select * from find_duplicate_weighments($1,$2,$3,$4,$5,$6,$7,$8,$9::movement_direction,$10)`,
      [
        input.external_slip_no, input.weighbridge_id, input.weighment_date,
        input.vehicle_number, input.gross_weight_kg, input.tare_weight_kg,
        input.party_id, input.commodity_id, input.direction, id,
      ],
    );

    for (const d of dupes.rows) {
      await client.query(
        `insert into duplicate_reviews (slip_id, matched_slip_id, match_reason, created_by)
         values ($1,$2,$3,$4)`,
        [id, d.id, d.match_reason || 'similar weighment', actor.id || null],
      );
    }

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'weighment_slips',
      entityId: id,
      entityLabel: slipNo,
      newValue: { ...input, slip_no: slipNo, duplicate_candidates: dupes.rowCount },
    });

    return { id, slipNo, duplicates: dupes.rows };
  });
}

export async function updateWeighment(id: string, input: WeighmentInput): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{ status: string }>(
      'select * from weighment_slips where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That weighment no longer exists.');

    // DR-06: free correction before posting, contra entry after.
    if (before.rows[0].status === 'posted') {
      throw new Error('A posted weighment cannot be edited. Reverse it instead.');
    }

    await client.query(
      `update weighment_slips set
         external_slip_no = $2, weighbridge_id = $3, weighment_date = $4,
         first_weighment_at = $5, second_weighment_at = $6,
         vehicle_number = $7, trailer_number = $8, driver_name = $9,
         transporter_party_id = $10, party_id = $11,
         source_category = $12::source_category, broker_party_id = $13,
         commodity_id = $14, variety_id = $15, direction = $16::movement_direction,
         gross_weight_kg = $17, tare_weight_kg = $18, printed_net_weight_kg = $19,
         bag_count = $20, invoice_no = $21, challan_no = $22, gate_entry_no = $23,
         difference_reason_id = $24, difference_remarks = $25, remarks = $26,
         updated_by = $27
       where id = $1`,
      [
        id, input.external_slip_no, input.weighbridge_id, input.weighment_date,
        input.first_weighment_at || null, input.second_weighment_at || null,
        input.vehicle_number, input.trailer_number, input.driver_name,
        input.transporter_party_id, input.party_id, input.source_category,
        input.broker_party_id, input.commodity_id, input.variety_id, input.direction,
        input.gross_weight_kg, input.tare_weight_kg, input.printed_net_weight_kg,
        input.bag_count, input.invoice_no, input.challan_no, input.gate_entry_no,
        input.difference_reason_id, input.difference_remarks, input.remarks,
        actor.id || null,
      ],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'update',
      entityTable: 'weighment_slips',
      entityId: id,
      entityLabel: String((before.rows[0] as unknown as { slip_no: string }).slip_no),
      previousValue: before.rows[0],
      newValue: input,
    });
  });
}

/**
 * Moves a slip through its status lifecycle (blueprint §6.3).
 *
 * Verification records who verified it. The database rejects a verifier who is
 * also the entry user (INV-24) — that check is not left to this layer alone.
 */
export async function setWeighmentStatus(
  id: string,
  status: WeighmentStatus,
): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{ slip_no: string; status: string; entry_user_id: string | null }>(
      'select slip_no, status, entry_user_id from weighment_slips where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That weighment no longer exists.');

    const verifying = status === 'verified';

    await client.query(
      `update weighment_slips set
         status = $2::weighment_status,
         verified_by_id = case when $3 then $4::uuid else verified_by_id end,
         verified_at    = case when $3 then now()      else verified_at end,
         updated_by = $4
       where id = $1`,
      [id, status, verifying, actor.id || null],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'update',
      entityTable: 'weighment_slips',
      entityId: id,
      entityLabel: before.rows[0].slip_no,
      previousValue: { status: before.rows[0].status },
      newValue: { status },
    });
  });
}

/** Resolves a duplicate review explicitly (DR-05). Never auto-merges. */
export async function resolveDuplicate(
  reviewId: string,
  outcome: 'reviewed_accepted' | 'confirmed_duplicate' | 'cancelled' | 'linked',
  remarks: string | null,
): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{ slip_id: string }>(
      'select slip_id from duplicate_reviews where id = $1 for update',
      [reviewId],
    );
    if (before.rowCount === 0) throw new Error('That review no longer exists.');

    await client.query(
      `update duplicate_reviews
          set outcome = $2, remarks = $3, resolved_by_id = $4, resolved_at = now()
        where id = $1`,
      [reviewId, outcome, remarks, actor.id || null],
    );

    // A confirmed duplicate cancels the newer slip; it is never deleted.
    if (outcome === 'confirmed_duplicate') {
      await client.query(
        `update weighment_slips set status = 'cancelled', updated_by = $2 where id = $1`,
        [before.rows[0].slip_id, actor.id || null],
      );
    }

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'update',
      entityTable: 'duplicate_reviews',
      entityId: reviewId,
      entityLabel: `duplicate review`,
      newValue: { outcome, remarks },
    });
  });
}

export async function listOpenDuplicates(slipId: string): Promise<Array<{
  id: string;
  matched_slip_no: string;
  matched_date: string;
  match_reason: string;
}>> {
  return query(
    `select dr.id, m.slip_no as matched_slip_no,
            m.weighment_date::text as matched_date, dr.match_reason
       from duplicate_reviews dr
       join weighment_slips m on m.id = dr.matched_slip_id
      where dr.slip_id = $1 and dr.outcome is null
      order by m.weighment_date desc`,
    [slipId],
  );
}

// --- Pickers -------------------------------------------------------------

export async function weighmentPickers() {
  const [weighbridges, parties, commodities, varieties, reasons] =
    await Promise.all([
      query<{ id: string; label: string }>(
        `select id, name as label from weighbridges where is_active order by name`,
      ),
      query<{ id: string; label: string }>(
        `select id, legal_name || ' (' || code || ')' as label from parties
          where is_active order by legal_name`,
      ),
      query<{ id: string; label: string }>(
        `select id, name as label from commodities where is_active order by name`,
      ),
      query<{ id: string; label: string; commodity_id: string }>(
        `select id, name as label, commodity_id from varieties where is_active order by name`,
      ),
      query<{ id: string; label: string }>(
        `select r.id, r.name as label from reason_codes r
           join reason_code_categories c on c.id = r.category_id
          where r.is_active and c.code in ('CORRECTION','ADJUSTMENT','LOSS','GAIN')
          order by c.sort_order, r.sort_order`,
      ),
    ]);

  return { weighbridges, parties, commodities, varieties, reasons };
}

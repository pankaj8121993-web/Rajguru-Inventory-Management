import 'server-only';

import { query, transaction, writeAudit, currentActor } from './db';
import {
  partyInputSchema, reasonCodeInputSchema,
  type PartyInput, type ReasonCodeInput,
} from './validation/party';

export { partyInputSchema, reasonCodeInputSchema };
export type { PartyInput, ReasonCodeInput };

/**
 * Party, vehicle and reason-code data access.
 *
 * A party holds its types many-to-many — a trader may also be a storage
 * customer (MASTER_DATA_CATALOGUE §4).
 */

export interface PartyType {
  id: string;
  code: string;
  name: string;
  is_supplier: boolean;
  is_customer: boolean;
  sort_order: number;
}

export interface Party {
  id: string;
  code: string;
  legal_name: string;
  trade_name: string | null;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  contact_person: string | null;
  mobile: string | null;
  email: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  credit_terms_days: number | null;
  storage_agreement_ref: string | null;
  broker_party_id: string | null;
  broker_name: string | null;
  is_active: boolean;
  notes: string | null;
  type_ids: string[];
  type_names: string[];
}

export interface ReasonCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface ReasonCode {
  id: string;
  category_id: string;
  category_code: string;
  category_name: string;
  code: string;
  name: string;
  description: string | null;
  requires_evidence: boolean;
  requires_approval: boolean;
  is_exception: boolean;
  sort_order: number;
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Parties
// ---------------------------------------------------------------------------

const SELECT_PARTY = `
  select p.*,
         b.legal_name as broker_name,
         coalesce(
           (select array_agg(pt.party_type_id::text order by t.sort_order)
              from party_party_types pt
              join party_types t on t.id = pt.party_type_id
             where pt.party_id = p.id), '{}'
         ) as type_ids,
         coalesce(
           (select array_agg(t.name order by t.sort_order)
              from party_party_types pt
              join party_types t on t.id = pt.party_type_id
             where pt.party_id = p.id), '{}'
         ) as type_names
    from parties p
    left join parties b on b.id = p.broker_party_id
`;

export async function listParties(opts: {
  includeInactive?: boolean;
  search?: string;
  typeId?: string;
} = {}): Promise<Party[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!opts.includeInactive) conditions.push('p.is_active');

  if (opts.search?.trim()) {
    params.push(`%${opts.search.trim()}%`);
    conditions.push(
      `(p.legal_name ilike $${params.length} or p.trade_name ilike $${params.length}
        or p.code ilike $${params.length} or p.mobile ilike $${params.length})`,
    );
  }

  if (opts.typeId) {
    params.push(opts.typeId);
    conditions.push(
      `exists (select 1 from party_party_types pt
                where pt.party_id = p.id and pt.party_type_id = $${params.length})`,
    );
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  return query<Party>(`${SELECT_PARTY} ${where} order by p.legal_name`, params);
}

export async function listPartyTypes(): Promise<PartyType[]> {
  return query<PartyType>(
    `select id, code, name, is_supplier, is_customer, sort_order
       from party_types where is_active order by sort_order, name`,
  );
}

/** Brokers and commission agents, for the broker picker. */
export async function listBrokers(): Promise<Array<{ id: string; label: string }>> {
  const rows = await query<{ id: string; legal_name: string; code: string }>(
    `select distinct p.id, p.legal_name, p.code
       from parties p
       join party_party_types pt on pt.party_id = p.id
       join party_types t on t.id = pt.party_type_id
      where p.is_active and t.code in ('BROKER','COMM_AGENT')
      order by p.legal_name`,
  );
  return rows.map((r) => ({ id: r.id, label: `${r.legal_name} (${r.code})` }));
}

export async function createParty(input: PartyInput): Promise<string> {
  const actor = await currentActor();

  return transaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `insert into parties
         (code, legal_name, trade_name, gstin, pan, address, village, district,
          state, pincode, contact_person, mobile, email, bank_name,
          bank_account_number, bank_ifsc, credit_terms_days,
          storage_agreement_ref, broker_party_id, notes, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21)
       returning id`,
      [
        input.code, input.legal_name, input.trade_name, input.gstin, input.pan,
        input.address, input.village, input.district, input.state, input.pincode,
        input.contact_person, input.mobile, input.email, input.bank_name,
        input.bank_account_number, input.bank_ifsc, input.credit_terms_days,
        input.storage_agreement_ref, input.broker_party_id, input.notes,
        actor.id || null,
      ],
    );

    const id = result.rows[0].id;
    await setPartyTypes(client, id, input.type_ids, actor.id || null);

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'parties',
      entityId: id,
      entityLabel: `${input.code} — ${input.legal_name}`,
      newValue: input,
    });

    return id;
  });
}

export async function updateParty(id: string, input: PartyInput): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query(
      'select * from parties where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That party no longer exists.');

    await client.query(
      `update parties set
         code = $2, legal_name = $3, trade_name = $4, gstin = $5, pan = $6,
         address = $7, village = $8, district = $9, state = $10, pincode = $11,
         contact_person = $12, mobile = $13, email = $14, bank_name = $15,
         bank_account_number = $16, bank_ifsc = $17, credit_terms_days = $18,
         storage_agreement_ref = $19, broker_party_id = $20, notes = $21,
         updated_by = $22
       where id = $1`,
      [
        id, input.code, input.legal_name, input.trade_name, input.gstin, input.pan,
        input.address, input.village, input.district, input.state, input.pincode,
        input.contact_person, input.mobile, input.email, input.bank_name,
        input.bank_account_number, input.bank_ifsc, input.credit_terms_days,
        input.storage_agreement_ref, input.broker_party_id, input.notes,
        actor.id || null,
      ],
    );

    await setPartyTypes(client, id, input.type_ids, actor.id || null);

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'update',
      entityTable: 'parties',
      entityId: id,
      entityLabel: `${input.code} — ${input.legal_name}`,
      previousValue: before.rows[0],
      newValue: input,
    });
  });
}

/**
 * Replaces a party's types.
 *
 * The "at least one type" rule is a deferred constraint trigger, so removing
 * every row and re-inserting inside one transaction is safe — the check runs
 * at commit, not between statements.
 */
async function setPartyTypes(
  client: Parameters<Parameters<typeof transaction>[0]>[0],
  partyId: string,
  typeIds: string[],
  actorId: string | null,
): Promise<void> {
  await client.query('delete from party_party_types where party_id = $1', [partyId]);
  for (const typeId of typeIds) {
    await client.query(
      `insert into party_party_types (party_id, party_type_id, created_by)
       values ($1, $2, $3) on conflict do nothing`,
      [partyId, typeId, actorId],
    );
  }
}

export async function setPartyActive(id: string, active: boolean): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{ code: string; legal_name: string; is_active: boolean }>(
      'select code, legal_name, is_active from parties where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That party no longer exists.');

    if (!active) {
      const used = await client.query<{ n: string }>(
        `select (
           (select count(*) from parties where broker_party_id = $1 and is_active) +
           (select count(*) from vehicles where transporter_party_id = $1 and is_active) +
           (select count(*) from drivers  where transporter_party_id = $1 and is_active)
         )::text as n`,
        [id],
      );
      if (Number(used.rows[0].n) > 0) {
        throw new Error(
          'This party is still referenced by an active vehicle, driver or party. Reassign those first.',
        );
      }
    }

    await client.query(
      'update parties set is_active = $2, updated_by = $3 where id = $1',
      [id, active, actor.id || null],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: active ? 'reactivate' : 'deactivate',
      entityTable: 'parties',
      entityId: id,
      entityLabel: `${before.rows[0].code} — ${before.rows[0].legal_name}`,
      previousValue: { is_active: before.rows[0].is_active },
      newValue: { is_active: active },
    });
  });
}

// ---------------------------------------------------------------------------
// Reason codes
// ---------------------------------------------------------------------------

export async function listReasonCategories(): Promise<ReasonCategory[]> {
  return query<ReasonCategory>(
    `select id, code, name, description, sort_order
       from reason_code_categories where is_active order by sort_order, name`,
  );
}

export async function listReasonCodes(opts: {
  includeInactive?: boolean;
  categoryId?: string;
} = {}): Promise<ReasonCode[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!opts.includeInactive) conditions.push('r.is_active');
  if (opts.categoryId) {
    params.push(opts.categoryId);
    conditions.push(`r.category_id = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  return query<ReasonCode>(
    `select r.*, c.code as category_code, c.name as category_name
       from reason_codes r
       join reason_code_categories c on c.id = r.category_id
       ${where}
      order by c.sort_order, r.sort_order, r.name`,
    params,
  );
}

export async function createReasonCode(input: ReasonCodeInput): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const r = await client.query<{ id: string }>(
      `insert into reason_codes
         (category_id, code, name, description, requires_evidence,
          requires_approval, is_exception, sort_order, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
       returning id`,
      [
        input.category_id, input.code, input.name, input.description,
        input.requires_evidence, input.requires_approval, input.is_exception,
        Number(input.sort_order), actor.id || null,
      ],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'reason_codes',
      entityId: r.rows[0].id,
      entityLabel: `${input.code} — ${input.name}`,
      newValue: input,
    });
  });
}

export async function setReasonCodeActive(id: string, active: boolean): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{ code: string; name: string; is_active: boolean }>(
      'select code, name, is_active from reason_codes where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That reason code no longer exists.');

    await client.query(
      'update reason_codes set is_active = $2, updated_by = $3 where id = $1',
      [id, active, actor.id || null],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: active ? 'reactivate' : 'deactivate',
      entityTable: 'reason_codes',
      entityId: id,
      entityLabel: `${before.rows[0].code} — ${before.rows[0].name}`,
      previousValue: { is_active: before.rows[0].is_active },
      newValue: { is_active: active },
    });
  });
}

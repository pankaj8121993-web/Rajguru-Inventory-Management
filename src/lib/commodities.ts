import 'server-only';

import { query, queryOne, transaction, writeAudit, currentActor } from './db';
import {
  commodityInputSchema, varietyInputSchema, gradeInputSchema,
  type CommodityInput, type VarietyInput, type GradeInput,
} from './validation/commodity';

export { commodityInputSchema, varietyInputSchema, gradeInputSchema };
export type { CommodityInput, VarietyInput, GradeInput };

/**
 * Commodity master data access.
 *
 * DR-52: no business master is hard-coded. Commodities, varieties and grades
 * are all maintained by the business through the application.
 */

export interface Commodity {
  id: string;
  code: string;
  name: string;
  commodity_group_id: string | null;
  group_name: string | null;
  description: string | null;
  standard_unit_id: string | null;
  unit_name: string | null;
  standard_bag_type_id: string | null;
  bag_type_name: string | null;
  standard_moisture_pct: string | null;
  shelf_life_days: number | null;
  fumigation_interval_days: number | null;
  storage_restrictions: string | null;
  insurance_category: string | null;
  is_active: boolean;
  notes: string | null;
  variety_count: number;
  grade_count: number;
}

export interface Variety {
  id: string;
  commodity_id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Grade {
  id: string;
  commodity_id: string;
  variety_id: string | null;
  variety_name: string | null;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Lookup {
  id: string;
  code: string;
  name: string;
}



const SELECT_COMMODITY = `
  select c.*,
         g.name as group_name,
         u.name as unit_name,
         b.name as bag_type_name,
         (select count(*)::int from varieties v where v.commodity_id = c.id and v.is_active) as variety_count,
         (select count(*)::int from grades gr where gr.commodity_id = c.id and gr.is_active) as grade_count
    from commodities c
    left join commodity_groups g on g.id = c.commodity_group_id
    left join units u            on u.id = c.standard_unit_id
    left join bag_types b        on b.id = c.standard_bag_type_id
`;

export async function listCommodities(opts: {
  includeInactive?: boolean;
  search?: string;
} = {}): Promise<Commodity[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!opts.includeInactive) conditions.push('c.is_active');

  if (opts.search?.trim()) {
    params.push(`%${opts.search.trim()}%`);
    conditions.push(`(c.name ilike $${params.length} or c.code ilike $${params.length})`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  return query<Commodity>(`${SELECT_COMMODITY} ${where} order by g.name nulls last, c.name`, params);
}

export async function getCommodity(id: string): Promise<Commodity | null> {
  return queryOne<Commodity>(`${SELECT_COMMODITY} where c.id = $1`, [id]);
}

export async function listVarieties(commodityId: string): Promise<Variety[]> {
  return query<Variety>(
    'select * from varieties where commodity_id = $1 order by name',
    [commodityId],
  );
}

export async function listGrades(commodityId: string): Promise<Grade[]> {
  return query<Grade>(
    `select g.*, v.name as variety_name
       from grades g
       left join varieties v on v.id = g.variety_id
      where g.commodity_id = $1
      order by g.sort_order, g.name`,
    [commodityId],
  );
}

export async function listCommodityGroups(): Promise<Lookup[]> {
  return query<Lookup>(
    'select id, code, name from commodity_groups where is_active order by name',
  );
}

export async function listUnits(): Promise<Lookup[]> {
  return query<Lookup>('select id, code, name from units where is_active order by name');
}

export async function listBagTypes(): Promise<Lookup[]> {
  return query<Lookup>('select id, code, name from bag_types where is_active order by name');
}

export async function createCommodity(input: CommodityInput): Promise<string> {
  const actor = await currentActor();

  return transaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `insert into commodities
         (code, name, commodity_group_id, description, standard_unit_id,
          standard_bag_type_id, standard_moisture_pct, shelf_life_days,
          fumigation_interval_days, storage_restrictions, insurance_category,
          notes, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
       returning id`,
      [
        input.code, input.name, input.commodity_group_id, input.description,
        input.standard_unit_id, input.standard_bag_type_id,
        input.standard_moisture_pct, input.shelf_life_days,
        input.fumigation_interval_days, input.storage_restrictions,
        input.insurance_category, input.notes, actor.id || null,
      ],
    );

    const id = result.rows[0].id;
    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'commodities',
      entityId: id,
      entityLabel: `${input.code} — ${input.name}`,
      newValue: input,
    });
    return id;
  });
}

export async function updateCommodity(id: string, input: CommodityInput): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query(
      'select * from commodities where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That commodity no longer exists.');

    await client.query(
      `update commodities set
         code = $2, name = $3, commodity_group_id = $4, description = $5,
         standard_unit_id = $6, standard_bag_type_id = $7,
         standard_moisture_pct = $8, shelf_life_days = $9,
         fumigation_interval_days = $10, storage_restrictions = $11,
         insurance_category = $12, notes = $13, updated_by = $14
       where id = $1`,
      [
        id, input.code, input.name, input.commodity_group_id, input.description,
        input.standard_unit_id, input.standard_bag_type_id,
        input.standard_moisture_pct, input.shelf_life_days,
        input.fumigation_interval_days, input.storage_restrictions,
        input.insurance_category, input.notes, actor.id || null,
      ],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'update',
      entityTable: 'commodities',
      entityId: id,
      entityLabel: `${input.code} — ${input.name}`,
      previousValue: before.rows[0],
      newValue: input,
    });
  });
}

export async function setCommodityActive(id: string, active: boolean): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{ code: string; name: string; is_active: boolean }>(
      'select code, name, is_active from commodities where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That commodity no longer exists.');

    await client.query(
      'update commodities set is_active = $2, updated_by = $3 where id = $1',
      [id, active, actor.id || null],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: active ? 'reactivate' : 'deactivate',
      entityTable: 'commodities',
      entityId: id,
      entityLabel: `${before.rows[0].code} — ${before.rows[0].name}`,
      previousValue: { is_active: before.rows[0].is_active },
      newValue: { is_active: active },
    });
  });
}

export async function createVariety(input: VarietyInput): Promise<void> {
  const actor = await currentActor();
  await transaction(async (client) => {
    const r = await client.query<{ id: string }>(
      `insert into varieties (commodity_id, code, name, description, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$5) returning id`,
      [input.commodity_id, input.code, input.name, input.description, actor.id || null],
    );
    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'varieties',
      entityId: r.rows[0].id,
      entityLabel: `${input.code} — ${input.name}`,
      newValue: input,
    });
  });
}

export async function createGrade(input: GradeInput): Promise<void> {
  const actor = await currentActor();
  await transaction(async (client) => {
    const r = await client.query<{ id: string }>(
      `insert into grades (commodity_id, variety_id, code, name, description, sort_order, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$7) returning id`,
      [
        input.commodity_id, input.variety_id, input.code, input.name,
        input.description, Number(input.sort_order), actor.id || null,
      ],
    );
    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'grades',
      entityId: r.rows[0].id,
      entityLabel: `${input.code} — ${input.name}`,
      newValue: input,
    });
  });
}

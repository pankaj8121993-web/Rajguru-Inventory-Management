import 'server-only';

import { query, queryOne, transaction, writeAudit, currentActor } from './db';
import { type NodeType, type LocationNode } from './location-types';
import { locationInputSchema, type LocationInput } from './validation/location';

export { locationInputSchema };
export type { LocationInput };

export { NODE_TYPES, NODE_TYPE_LABELS, STORAGE_NODE_TYPES } from './location-types';
export type { NodeType, LocationNode } from './location-types';

/**
 * Location hierarchy data access.
 *
 * Company -> Facility -> Plot -> Godown/Building/Open Yard -> Section/Floor
 *         -> Bay/Zone -> Stack/Bin/Heap   (blueprint 9)
 *
 * INV-05: stock may be validly posted at any node, not only leaves.
 */



const SELECT_NODE = `
  select n.*,
         location_node_path(n.id) as path,
         (select count(*)::int from location_nodes c where c.parent_id = n.id) as child_count
  from location_nodes n
`;

export async function listLocations(opts: {
  includeInactive?: boolean;
  search?: string;
} = {}): Promise<LocationNode[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!opts.includeInactive) conditions.push('n.is_active');

  if (opts.search?.trim()) {
    params.push(`%${opts.search.trim()}%`);
    conditions.push(`(n.name ilike $${params.length} or n.code ilike $${params.length})`);
  }

  const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
  return query<LocationNode>(`${SELECT_NODE} ${where} order by location_node_path(n.id)`, params);
}

export async function getLocation(id: string): Promise<LocationNode | null> {
  return queryOne<LocationNode>(`${SELECT_NODE} where n.id = $1`, [id]);
}

/**
 * Parents a node of `childType` is allowed to sit under, from the rules table.
 * Returned in hierarchy order so the picker reads top-down.
 */
export async function allowedParents(
  childType: NodeType,
  excludeId?: string,
): Promise<Array<{ id: string; label: string }>> {
  const rows = await query<{ id: string; path: string }>(
    `select n.id, location_node_path(n.id) as path
       from location_nodes n
      where n.is_active
        and n.node_type in (
          select parent_type from location_node_type_rules
           where child_type = $1 and parent_type is not null
        )
        and ($2::uuid is null or n.id <> $2::uuid)
      order by location_node_path(n.id)`,
    [childType, excludeId ?? null],
  );
  return rows.map((r) => ({ id: r.id, label: r.path }));
}

export async function canBeRoot(childType: NodeType): Promise<boolean> {
  const row = await queryOne<{ ok: boolean }>(
    `select exists (
       select 1 from location_node_type_rules
        where child_type = $1 and parent_type is null
     ) as ok`,
    [childType],
  );
  return row?.ok ?? false;
}

export async function createLocation(input: LocationInput): Promise<string> {
  const actor = await currentActor();

  return transaction(async (client) => {
    const company = await client.query<{ id: string }>(
      'select id from companies where is_active order by created_at limit 1',
    );
    const companyId = company.rows[0]?.id;
    if (!companyId) throw new Error('No active company exists. Seed the database first.');

    const result = await client.query<{ id: string }>(
      `insert into location_nodes
         (company_id, parent_id, node_type, code, name, description,
          plot_number, survey_number, length_m, width_m, height_m, area_sqm,
          approved_capacity_mt, operational_capacity_mt, storage_method,
          fumigation_suitable, commodity_restrictions, responsible_employee,
          notes, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$20)
       returning id`,
      [
        companyId, input.parent_id, input.node_type, input.code, input.name,
        input.description, input.plot_number, input.survey_number,
        input.length_m, input.width_m, input.height_m, input.area_sqm,
        input.approved_capacity_mt, input.operational_capacity_mt,
        input.storage_method, input.fumigation_suitable,
        input.commodity_restrictions, input.responsible_employee,
        input.notes, actor.id || null,
      ],
    );

    const id = result.rows[0].id;
    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'location_nodes',
      entityId: id,
      entityLabel: `${input.code} — ${input.name}`,
      newValue: input,
    });

    return id;
  });
}

export async function updateLocation(id: string, input: LocationInput): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query(
      'select * from location_nodes where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That location no longer exists.');

    await client.query(
      `update location_nodes set
         parent_id = $2, node_type = $3, code = $4, name = $5, description = $6,
         plot_number = $7, survey_number = $8, length_m = $9, width_m = $10,
         height_m = $11, area_sqm = $12, approved_capacity_mt = $13,
         operational_capacity_mt = $14, storage_method = $15,
         fumigation_suitable = $16, commodity_restrictions = $17,
         responsible_employee = $18, notes = $19, updated_by = $20
       where id = $1`,
      [
        id, input.parent_id, input.node_type, input.code, input.name,
        input.description, input.plot_number, input.survey_number,
        input.length_m, input.width_m, input.height_m, input.area_sqm,
        input.approved_capacity_mt, input.operational_capacity_mt,
        input.storage_method, input.fumigation_suitable,
        input.commodity_restrictions, input.responsible_employee,
        input.notes, actor.id || null,
      ],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'update',
      entityTable: 'location_nodes',
      entityId: id,
      entityLabel: `${input.code} — ${input.name}`,
      previousValue: before.rows[0],
      newValue: input,
    });
  });
}

/**
 * Deactivates rather than deletes (DR-54). A location that has held stock must
 * stay traceable forever.
 */
export async function setLocationActive(id: string, active: boolean): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{ code: string; name: string; is_active: boolean }>(
      'select code, name, is_active from location_nodes where id = $1 for update',
      [id],
    );
    if (before.rowCount === 0) throw new Error('That location no longer exists.');

    if (!active) {
      const children = await client.query<{ n: string }>(
        'select count(*) as n from location_nodes where parent_id = $1 and is_active',
        [id],
      );
      if (Number(children.rows[0].n) > 0) {
        throw new Error(
          'Deactivate or move the locations inside this one first.',
        );
      }
    }

    await client.query(
      'update location_nodes set is_active = $2, updated_by = $3 where id = $1',
      [id, active, actor.id || null],
    );

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: active ? 'reactivate' : 'deactivate',
      entityTable: 'location_nodes',
      entityId: id,
      entityLabel: `${before.rows[0].code} — ${before.rows[0].name}`,
      previousValue: { is_active: before.rows[0].is_active },
      newValue: { is_active: active },
    });
  });
}

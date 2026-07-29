import 'server-only';

import { query, transaction, writeAudit, currentActor } from './db';

/**
 * Roles, permissions and scoped user assignments (blueprint §5).
 *
 * This is authorisation *structure*. Authentication — login, sessions, MFA —
 * is deferred until Supabase Auth is provisioned and the administrator creates
 * the real accounts. Every module is written against these functions so that
 * when login lands, nothing else has to change.
 */

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  may_override: boolean;
  sort_order: number;
  is_active: boolean;
  permission_count: number;
  user_count: number;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  is_controlled: boolean;
}

export interface UserRow {
  id: string;
  code: string;
  full_name: string;
  email: string;
  is_active: boolean;
  assignments: Array<{
    id: string;
    role_code: string;
    role_name: string;
    scope: string;
    value_limit: string | null;
    quantity_limit_kg: string | null;
    is_active: boolean;
  }>;
}

export async function listRoles(): Promise<Role[]> {
  return query<Role>(
    `select r.*,
            (select count(*)::int from role_permissions rp where rp.role_id = r.id) as permission_count,
            (select count(*)::int from user_roles ur
              where ur.role_id = r.id and ur.is_active) as user_count
       from roles r
      where r.is_active
      order by r.sort_order, r.name`,
  );
}

export async function listPermissions(): Promise<Permission[]> {
  return query<Permission>(
    `select id, module, action::text as action, name, is_controlled
       from permissions order by module, action`,
  );
}

/** Which roles hold which permissions, as a lookup the matrix view can index. */
export async function rolePermissionGrid(): Promise<Record<string, Set<string>>> {
  const rows = await query<{ role_code: string; permission_id: string }>(
    `select r.code as role_code, rp.permission_id
       from role_permissions rp join roles r on r.id = rp.role_id`,
  );
  const grid: Record<string, Set<string>> = {};
  for (const row of rows) {
    (grid[row.role_code] ??= new Set()).add(row.permission_id);
  }
  return grid;
}

export async function listUsersWithRoles(): Promise<UserRow[]> {
  const users = await query<Omit<UserRow, 'assignments'>>(
    `select id, code, full_name, email, is_active from users order by code`,
  );

  const assignments = await query<{
    user_id: string; id: string; role_code: string; role_name: string;
    scope: string; value_limit: string | null; quantity_limit_kg: string | null;
    is_active: boolean;
  }>(
    `select ur.user_id, ur.id, r.code as role_code, r.name as role_name,
            coalesce(location_node_path(ur.location_node_id), 'All facilities') as scope,
            ur.value_limit::text, ur.quantity_limit_kg::text, ur.is_active
       from user_roles ur
       join roles r on r.id = ur.role_id
      order by r.sort_order`,
  );

  return users.map((u) => ({
    ...u,
    assignments: assignments
      .filter((a) => a.user_id === u.id)
      .map(({ user_id: _user_id, ...rest }) => rest),
  }));
}

export async function listAssignableScopes(): Promise<Array<{ id: string; label: string }>> {
  const rows = await query<{ id: string; path: string }>(
    `select id, location_node_path(id) as path
       from location_nodes
      where is_active and node_type in ('facility','plot','godown','open_yard','bay')
      order by location_node_path(id)`,
  );
  return rows.map((r) => ({ id: r.id, label: r.path }));
}

export async function assignRole(input: {
  userId: string;
  roleId: string;
  locationNodeId: string | null;
  valueLimit: string | null;
  quantityLimitKg: string | null;
  notes: string | null;
}): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `insert into user_roles
         (user_id, role_id, location_node_id, value_limit, quantity_limit_kg,
          notes, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$7)
       returning id`,
      [
        input.userId, input.roleId, input.locationNodeId,
        input.valueLimit, input.quantityLimitKg, input.notes, actor.id || null,
      ],
    );

    const detail = await client.query<{ full_name: string; role_name: string; scope: string }>(
      `select u.full_name, r.name as role_name,
              coalesce(location_node_path(ur.location_node_id),'All facilities') as scope
         from user_roles ur
         join users u on u.id = ur.user_id
         join roles r on r.id = ur.role_id
        where ur.id = $1`,
      [inserted.rows[0].id],
    );
    const d = detail.rows[0];

    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: 'create',
      entityTable: 'user_roles',
      entityId: inserted.rows[0].id,
      entityLabel: `${d.full_name} — ${d.role_name} @ ${d.scope}`,
      newValue: input,
    });
  });
}

export async function setAssignmentActive(id: string, active: boolean): Promise<void> {
  const actor = await currentActor();

  await transaction(async (client) => {
    const before = await client.query<{
      full_name: string; role_name: string; scope: string; is_active: boolean;
    }>(
      `select u.full_name, r.name as role_name,
              coalesce(location_node_path(ur.location_node_id),'All facilities') as scope,
              ur.is_active
         from user_roles ur
         join users u on u.id = ur.user_id
         join roles r on r.id = ur.role_id
        where ur.id = $1 for update of ur`,
      [id],
    );
    if (before.rowCount === 0) throw new Error('That role assignment no longer exists.');

    await client.query(
      'update user_roles set is_active = $2, updated_by = $3 where id = $1',
      [id, active, actor.id || null],
    );

    const d = before.rows[0];
    await writeAudit(client, {
      actorId: actor.id || null,
      actorLabel: actor.label,
      action: active ? 'reactivate' : 'deactivate',
      entityTable: 'user_roles',
      entityId: id,
      entityLabel: `${d.full_name} — ${d.role_name} @ ${d.scope}`,
      previousValue: { is_active: d.is_active },
      newValue: { is_active: active },
    });
  });
}

/** Recent audit events, for the administration overview. */
export async function recentAuditEvents(limit = 25) {
  return query<{
    id: string; occurred_at: string; actor_label: string; action: string;
    entity_table: string; entity_label: string | null;
  }>(
    `select id::text, occurred_at::text, actor_label, action, entity_table, entity_label
       from audit_events order by id desc limit $1`,
    [Math.min(limit, 100)],
  );
}

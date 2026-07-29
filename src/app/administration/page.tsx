import {
  listRoles, listPermissions, rolePermissionGrid,
  listUsersWithRoles, listAssignableScopes, recentAuditEvents,
} from '@/lib/access';
import AdministrationClient from './AdministrationClient';

export const dynamic = 'force-dynamic';

export default async function AdministrationPage() {
  const [roles, permissions, gridSets, users, scopes, audit] = await Promise.all([
    listRoles(),
    listPermissions(),
    rolePermissionGrid(),
    listUsersWithRoles(),
    listAssignableScopes(),
    recentAuditEvents(30),
  ]);

  // Sets are not serialisable across the server/client boundary.
  const grid: Record<string, string[]> = {};
  for (const [code, ids] of Object.entries(gridSets)) grid[code] = [...ids];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="muted text-sm mt-1">
          Roles, permissions, scoped assignments and the audit trail.
        </p>
      </div>

      <div className="card p-4 text-sm" style={{ borderColor: '#b45309' }}>
        <p className="font-medium" style={{ color: '#b45309' }}>
          Authorisation is defined here; authentication is not built yet.
        </p>
        <p className="hint mt-1">
          There is no login. The role matrix, permissions and scoped assignments exist so
          every module can be written against them, and so the administrator can create
          real accounts once Supabase Auth is provisioned. Until then, run this
          application locally only.
        </p>
      </div>

      <AdministrationClient
        roles={roles}
        permissions={permissions}
        grid={grid}
        users={users}
        scopes={scopes}
        audit={audit}
      />
    </div>
  );
}

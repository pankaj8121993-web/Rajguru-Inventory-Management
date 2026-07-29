'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { assignRoleAction, toggleAssignmentAction, type ActionState } from './actions';
import type { Role, Permission, UserRow } from '@/lib/access';

interface Props {
  roles: Role[];
  permissions: Permission[];
  grid: Record<string, string[]>;
  users: UserRow[];
  scopes: Array<{ id: string; label: string }>;
  audit: Array<{
    id: string; occurred_at: string; actor_label: string;
    action: string; entity_table: string; entity_label: string | null;
  }>;
}

const INITIAL: ActionState = { ok: false };

function Notice({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div
      data-testid="form-notice"
      role={state.ok ? 'status' : 'alert'}
      className="rounded-md border px-3 py-2 text-sm"
      style={{
        borderColor: state.ok ? 'rgb(var(--accent))' : '#b91c1c',
        color: state.ok ? 'rgb(var(--accent))' : '#b91c1c',
      }}
    >
      {state.message}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Assigning…' : 'Assign role'}
    </button>
  );
}

type Tab = 'users' | 'matrix' | 'audit';

export default function AdministrationClient({
  roles, permissions, grid, users, scopes, audit,
}: Props) {
  const [tab, setTab] = useState<Tab>('users');
  const [assigning, setAssigning] = useState(false);
  const [assignState, assignAction] = useActionState(assignRoleAction, INITIAL);
  const [toggleState, toggleAction] = useActionState(toggleAssignmentAction, INITIAL);

  const modules = [...new Set(permissions.map((p) => p.module))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1" role="tablist">
        {([
          ['users', `Users and roles (${users.length})`],
          ['matrix', `Role matrix (${roles.length} roles · ${permissions.length} permissions)`],
          ['audit', 'Audit trail'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <Notice state={assignState} />
      <Notice state={toggleState} />

      {tab === 'users' && (
        <>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setAssigning((v) => !v)}>
              {assigning ? 'Close' : '+ Assign a role'}
            </button>
          </div>

          {assigning && (
            <section className="card p-5">
              <h2 className="text-lg font-semibold mb-4">Assign a role</h2>
              <form action={assignAction} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label" htmlFor="a_user">User</label>
                    <select id="a_user" name="user_id" className="field" required>
                      <option value="">— Select —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="a_role">Role</label>
                    <select id="a_role" name="role_id" className="field" required>
                      <option value="">— Select —</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="a_scope">Scope</label>
                    <select id="a_scope" name="location_node_id" className="field">
                      <option value="">All facilities</option>
                      {scopes.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    <p className="hint">Applies to this location and everything inside it.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label" htmlFor="a_value">Approval value limit</label>
                    <input id="a_value" name="value_limit" className="field num"
                           inputMode="decimal" placeholder="No limit" />
                  </div>
                  <div>
                    <label className="label" htmlFor="a_qty">Approval quantity limit (kg)</label>
                    <input id="a_qty" name="quantity_limit_kg" className="field num"
                           inputMode="decimal" placeholder="No limit" />
                  </div>
                  <div>
                    <label className="label" htmlFor="a_notes">Notes</label>
                    <input id="a_notes" name="notes" className="field" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Submit />
                  <button type="button" className="btn-secondary"
                          onClick={() => setAssigning(false)}>Cancel</button>
                </div>
              </form>
            </section>
          )}

          <div className="space-y-3">
            {users.map((u) => (
              <section key={u.id} className="card p-4">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-semibold">{u.full_name}</h3>
                  <span className="font-mono text-xs muted">{u.code}</span>
                  <span className="muted text-sm">{u.email}</span>
                  <span className="badge ml-auto">
                    {u.assignments.filter((a) => a.is_active).length} role
                    {u.assignments.filter((a) => a.is_active).length === 1 ? '' : 's'}
                  </span>
                </div>
                {u.assignments.length === 0 ? (
                  <p className="hint mt-2">No roles assigned.</p>
                ) : (
                  <table className="w-full text-sm mt-3">
                    <caption className="sr-only">Roles held by {u.full_name}</caption>
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                        <th scope="col" className="text-left font-medium py-2">Role</th>
                        <th scope="col" className="text-left font-medium py-2">Scope</th>
                        <th scope="col" className="text-right font-medium py-2">Limits</th>
                        <th scope="col" className="text-right font-medium py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {u.assignments.map((a) => (
                        <tr key={a.id} className="border-b last:border-0"
                            style={{
                              borderColor: 'rgb(var(--border))',
                              opacity: a.is_active ? 1 : 0.5,
                            }}>
                          <td className="py-2">{a.role_name}</td>
                          <td className="py-2 muted">{a.scope}</td>
                          <td className="py-2 num muted text-xs">
                            {a.value_limit ?? a.quantity_limit_kg ? (
                              <>
                                {a.value_limit && `value ≤ ${a.value_limit}`}
                                {a.value_limit && a.quantity_limit_kg && ' · '}
                                {a.quantity_limit_kg && `qty ≤ ${a.quantity_limit_kg} kg`}
                              </>
                            ) : 'No limit'}
                          </td>
                          <td className="py-2">
                            <form action={toggleAction} className="flex justify-end">
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="active" value={String(!a.is_active)} />
                              <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                                {a.is_active ? 'Remove' : 'Restore'}
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            ))}
          </div>

          <div className="card p-4 text-sm">
            <p className="font-medium">A user may hold the same role at several scopes.</p>
            <p className="hint mt-1">
              Ramesh Patil above is the blueprint&rsquo;s own example: warehouse supervisor
              for one godown, fumigation approver across the facility, and read-only
              everywhere. A permission granted at a facility reaches every plot, godown,
              bay and stack inside it — but not another facility.
            </p>
          </div>
        </>
      )}

      {tab === 'matrix' && (
        <>
          <div className="card p-4 text-sm">
            <p className="font-medium">
              Draft matrix — requires Rajguru Foods management approval.
            </p>
            <p className="hint mt-1">
              Derived from the blueprint. Note that Super Administrator does <strong>not</strong>{' '}
              hold the override permission: commercial override authority is granted
              separately and never implied by administrative access.
            </p>
          </div>

          {modules.map((mod) => (
            <section key={mod} className="card overflow-x-auto">
              <h3 className="font-semibold px-4 py-3 border-b"
                  style={{ borderColor: 'rgb(var(--border))' }}>
                {mod}
              </h3>
              <table className="w-full text-xs">
                <caption className="sr-only">{mod} permissions by role</caption>
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                    <th scope="col" className="text-left font-medium px-3 py-2 sticky left-0"
                        style={{ background: 'rgb(var(--surface))' }}>
                      Permission
                    </th>
                    {roles.map((r) => (
                      <th key={r.id} scope="col"
                          className="font-medium px-2 py-2 whitespace-nowrap"
                          style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            height: '9rem',
                          }}>
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.filter((p) => p.module === mod).map((p) => (
                    <tr key={p.id} className="border-b last:border-0"
                        style={{ borderColor: 'rgb(var(--border))' }}>
                      <th scope="row"
                          className="text-left font-normal px-3 py-2 whitespace-nowrap sticky left-0"
                          style={{ background: 'rgb(var(--surface))' }}>
                        {p.name}
                        {p.is_controlled && (
                          <span className="badge ml-2" title="Maker-checker applies">C</span>
                        )}
                      </th>
                      {roles.map((r) => {
                        const has = grid[r.code]?.includes(p.id);
                        return (
                          <td key={r.id} className="text-center px-2 py-2"
                              style={has ? { color: 'rgb(var(--accent))', fontWeight: 700 } : undefined}>
                            <span className="sr-only">
                              {r.name} {has ? 'has' : 'does not have'} {p.name}
                            </span>
                            <span aria-hidden>{has ? '●' : '·'}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
          <p className="hint">
            <strong>C</strong> marks a controlled permission — maker-checker applies and the
            maker can never approve their own transaction.
          </p>
        </>
      )}

      {tab === 'audit' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Recent audit events</caption>
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <th scope="col" className="text-left font-medium px-4 py-3">When</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Who</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Action</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Record</th>
              </tr>
            </thead>
            <tbody>
              {audit.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center hint">
                  No audit events yet.
                </td></tr>
              ) : audit.map((e) => (
                <tr key={e.id} className="border-b last:border-0"
                    style={{ borderColor: 'rgb(var(--border))' }}>
                  <td className="px-4 py-2 muted text-xs">{e.occurred_at.slice(0, 19)}</td>
                  <td className="px-4 py-2">{e.actor_label}</td>
                  <td className="px-4 py-2"><span className="badge">{e.action}</span></td>
                  <td className="px-4 py-2 muted">
                    {e.entity_label ?? '—'}
                    <span className="hint"> · {e.entity_table}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint px-4 py-3">
            Append-only. Audit events cannot be edited or deleted by anyone, at any
            permission level.
          </p>
        </div>
      )}
    </div>
  );
}

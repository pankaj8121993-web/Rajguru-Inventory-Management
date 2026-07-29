'use client';

import { useActionState, useMemo, useState } from 'react';
import LocationForm from './LocationForm';
import { toggleLocationActiveAction, type ActionState } from './actions';
import { NODE_TYPE_LABELS, type NodeType, type LocationNode } from '@/lib/location-types';

interface Props {
  nodes: LocationNode[];
  rules: Record<string, { parents: string[]; canRoot: boolean }>;
  includeInactive: boolean;
}

const INITIAL: ActionState = { ok: false };

/** Formats a numeric string for display; blank stays blank, never 0. */
function num(value: string | null, dp = 3): string {
  if (value === null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export default function LocationsClient({ nodes, rules, includeInactive }: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toggleState, toggleAction] = useActionState(toggleLocationActiveAction, INITIAL);

  // Depth from the path string, so the tree indents without another query.
  const rows = useMemo(() => {
    const filtered = search.trim()
      ? nodes.filter(
          (n) =>
            n.name.toLowerCase().includes(search.toLowerCase()) ||
            n.code.toLowerCase().includes(search.toLowerCase()) ||
            n.path.toLowerCase().includes(search.toLowerCase()),
        )
      : nodes;
    return filtered.map((n) => ({
      ...n,
      depth: Math.max(0, (n.path?.split(' / ').length ?? 1) - 1),
    }));
  }, [nodes, search]);

  const parentOptions = nodes.map((n) => ({
    id: n.id,
    label: n.path,
    node_type: n.node_type as NodeType,
  }));

  const editing = editingId ? nodes.find((n) => n.id === editingId) ?? null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="search">Search locations</label>
          <input
            id="search"
            className="field"
            placeholder="Search by name, code or path…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <a
          className="btn-secondary"
          href={includeInactive ? '/locations' : '/locations?inactive=1'}
        >
          {includeInactive ? 'Hide inactive' : 'Show inactive'}
        </a>
        <button
          className="btn-primary"
          onClick={() => { setCreating((v) => !v); setEditingId(null); }}
        >
          {creating ? 'Close' : '+ New location'}
        </button>
      </div>

      {toggleState.message && (
        <div
          data-testid="form-notice"
          role={toggleState.ok ? 'status' : 'alert'}
          className="rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: toggleState.ok ? 'rgb(var(--accent))' : '#b91c1c',
            color: toggleState.ok ? 'rgb(var(--accent))' : '#b91c1c',
          }}
        >
          {toggleState.message}
        </div>
      )}

      {creating && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">New location</h2>
          <LocationForm
            parentOptions={parentOptions}
            rules={rules}
            onDone={() => setCreating(false)}
          />
        </section>
      )}

      {editing && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-1">Edit {editing.name}</h2>
          <p className="hint mb-4">{editing.path}</p>
          <LocationForm
            parentOptions={parentOptions}
            rules={rules}
            initial={{
              id: editing.id,
              node_type: editing.node_type,
              parent_id: editing.parent_id,
              code: editing.code,
              name: editing.name,
              description: editing.description,
              plot_number: editing.plot_number,
              survey_number: editing.survey_number,
              length_m: editing.length_m,
              width_m: editing.width_m,
              height_m: editing.height_m,
              area_sqm: editing.area_sqm,
              approved_capacity_mt: editing.approved_capacity_mt,
              operational_capacity_mt: editing.operational_capacity_mt,
              storage_method: editing.storage_method,
              fumigation_suitable: editing.fumigation_suitable,
              commodity_restrictions: editing.commodity_restrictions,
              responsible_employee: editing.responsible_employee,
              notes: editing.notes,
            }}
            onDone={() => setEditingId(null)}
          />
        </section>
      )}

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium">
            {search ? 'No locations match that search.' : 'No locations yet.'}
          </p>
          <p className="hint mt-1">
            {search
              ? 'Try a different name, code or path.'
              : 'Create a facility first, then plots and godowns inside it.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Storage locations, shown as a hierarchy
            </caption>
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <th scope="col" className="text-left font-medium px-4 py-3">Location</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Type</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Code</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Approved (MT)</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Operational (MT)</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Status</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr
                  key={n.id}
                  className="border-b last:border-0"
                  style={{ borderColor: 'rgb(var(--border))', opacity: n.is_active ? 1 : 0.55 }}
                >
                  <td className="px-4 py-3">
                    <span style={{ paddingLeft: `${n.depth * 1.25}rem` }}>
                      {n.depth > 0 && <span className="muted mr-1.5" aria-hidden>└</span>}
                      {n.name}
                    </span>
                    {n.child_count > 0 && (
                      <span className="muted ml-2 text-xs">({n.child_count})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 muted">{NODE_TYPE_LABELS[n.node_type]}</td>
                  <td className="px-4 py-3 font-mono text-xs">{n.code}</td>
                  <td className="px-4 py-3 num">{num(n.approved_capacity_mt)}</td>
                  <td className="px-4 py-3 num">{num(n.operational_capacity_mt)}</td>
                  <td className="px-4 py-3">
                    <span className="badge">{n.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-secondary !min-h-0 !py-1 !px-2 text-xs"
                        onClick={() => { setEditingId(n.id); setCreating(false); }}
                      >
                        Edit
                      </button>
                      <form action={toggleAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="active" value={String(!n.is_active)} />
                        <button
                          type="submit"
                          className="btn-secondary !min-h-0 !py-1 !px-2 text-xs"
                        >
                          {n.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="hint">
        Showing {rows.length} of {nodes.length} location{nodes.length === 1 ? '' : 's'}.
        Locations are deactivated, never deleted, so stock history stays traceable.
      </p>
    </div>
  );
}

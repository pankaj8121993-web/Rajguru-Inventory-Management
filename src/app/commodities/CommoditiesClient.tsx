'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  saveCommodityAction,
  toggleCommodityActiveAction,
  createVarietyAction,
  createGradeAction,
  type ActionState,
} from './actions';
import type { Commodity, Variety, Grade, Lookup } from '@/lib/commodities';

interface Props {
  commodities: Commodity[];
  groups: Lookup[];
  units: Lookup[];
  bagTypes: Lookup[];
  detail: Record<string, { varieties: Variety[]; grades: Grade[] }>;
  includeInactive: boolean;
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

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function CommodityForm({
  groups, units, bagTypes, initial, onDone,
}: {
  groups: Lookup[];
  units: Lookup[];
  bagTypes: Lookup[];
  initial?: Commodity;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveCommodityAction, INITIAL);
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Notice state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c_code">Code</label>
          <input id="c_code" name="code" className="field" required maxLength={40}
                 defaultValue={initial?.code ?? ''} placeholder="TUR" aria-invalid={!!err.code} />
          {err.code && <p className="hint" style={{ color: '#b91c1c' }}>{err.code}</p>}
        </div>
        <div>
          <label className="label" htmlFor="c_name">Name</label>
          <input id="c_name" name="name" className="field" required maxLength={120}
                 defaultValue={initial?.name ?? ''} placeholder="Tur" aria-invalid={!!err.name} />
          {err.name && <p className="hint" style={{ color: '#b91c1c' }}>{err.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="c_group">Group</label>
          <select id="c_group" name="commodity_group_id" className="field"
                  defaultValue={initial?.commodity_group_id ?? ''}>
            <option value="">— None —</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c_unit">Standard unit</label>
          <select id="c_unit" name="standard_unit_id" className="field"
                  defaultValue={initial?.standard_unit_id ?? ''}>
            <option value="">— None —</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c_bag">Standard bag type</label>
          <select id="c_bag" name="standard_bag_type_id" className="field"
                  defaultValue={initial?.standard_bag_type_id ?? ''}>
            <option value="">— None —</option>
            {bagTypes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c_moist">Standard moisture (%)</label>
          <input id="c_moist" name="standard_moisture_pct" className="field num"
                 inputMode="decimal" defaultValue={initial?.standard_moisture_pct ?? ''}
                 placeholder="12.0" aria-invalid={!!err.standard_moisture_pct} />
          {err.standard_moisture_pct && (
            <p className="hint" data-testid="error-moisture" style={{ color: '#b91c1c' }}>
              {err.standard_moisture_pct}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="c_fum">Fumigation interval (days)</label>
          <input id="c_fum" name="fumigation_interval_days" className="field num"
                 inputMode="numeric" defaultValue={initial?.fumigation_interval_days ?? ''}
                 placeholder="90" aria-invalid={!!err.fumigation_interval_days} />
          {err.fumigation_interval_days && (
            <p className="hint" style={{ color: '#b91c1c' }}>{err.fumigation_interval_days}</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="c_shelf">Shelf life (days)</label>
          <input id="c_shelf" name="shelf_life_days" className="field num"
                 inputMode="numeric" defaultValue={initial?.shelf_life_days ?? ''}
                 aria-invalid={!!err.shelf_life_days} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="c_restrict">Storage restrictions</label>
        <input id="c_restrict" name="storage_restrictions" className="field"
               defaultValue={initial?.storage_restrictions ?? ''}
               placeholder="Keep dry. Susceptible to bruchid infestation." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c_ins">Insurance category</label>
          <input id="c_ins" name="insurance_category" className="field"
                 defaultValue={initial?.insurance_category ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="c_notes">Notes</label>
          <input id="c_notes" name="notes" className="field" defaultValue={initial?.notes ?? ''} />
        </div>
      </div>

      <div className="flex gap-3">
        <Submit label={initial ? 'Save changes' : 'Create commodity'} pendingLabel="Saving…" />
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

function VarietyForm({ commodityId, onDone }: { commodityId: string; onDone: () => void }) {
  const [state, action] = useActionState(createVarietyAction, INITIAL);
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="commodity_id" value={commodityId} />
      <Notice state={state} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="v_code">Code</label>
          <input id="v_code" name="code" className="field" required placeholder="LEMON" />
        </div>
        <div>
          <label className="label" htmlFor="v_name">Name</label>
          <input id="v_name" name="name" className="field" required placeholder="Lemon Tur" />
        </div>
        <div>
          <label className="label" htmlFor="v_desc">Description</label>
          <input id="v_desc" name="description" className="field" />
        </div>
      </div>
      <div className="flex gap-3">
        <Submit label="Add variety" pendingLabel="Adding…" />
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

function GradeForm({
  commodityId, varieties, onDone,
}: { commodityId: string; varieties: Variety[]; onDone: () => void }) {
  const [state, action] = useActionState(createGradeAction, INITIAL);
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="commodity_id" value={commodityId} />
      <Notice state={state} />
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="g_code">Code</label>
          <input id="g_code" name="code" className="field" required placeholder="FAQ" />
        </div>
        <div>
          <label className="label" htmlFor="g_name">Name</label>
          <input id="g_name" name="name" className="field" required placeholder="Fair Average Quality" />
        </div>
        <div>
          <label className="label" htmlFor="g_var">Variety (optional)</label>
          <select id="g_var" name="variety_id" className="field">
            <option value="">— All varieties —</option>
            {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="g_sort">Sort order</label>
          <input id="g_sort" name="sort_order" className="field num" inputMode="numeric" defaultValue="0" />
        </div>
      </div>
      <div className="flex gap-3">
        <Submit label="Add grade" pendingLabel="Adding…" />
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export default function CommoditiesClient({
  commodities, groups, units, bagTypes, detail, includeInactive,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingVarietyTo, setAddingVarietyTo] = useState<string | null>(null);
  const [addingGradeTo, setAddingGradeTo] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toggleState, toggleAction] = useActionState(toggleCommodityActiveAction, INITIAL);

  const rows = search.trim()
    ? commodities.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : commodities;

  const editing = editingId ? commodities.find((c) => c.id === editingId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="csearch">Search commodities</label>
          <input id="csearch" className="field" placeholder="Search by name or code…"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <a className="btn-secondary"
           href={includeInactive ? '/commodities' : '/commodities?inactive=1'}>
          {includeInactive ? 'Hide inactive' : 'Show inactive'}
        </a>
        <button className="btn-primary"
                onClick={() => { setCreating((v) => !v); setEditingId(null); }}>
          {creating ? 'Close' : '+ New commodity'}
        </button>
      </div>

      <Notice state={toggleState} />

      {creating && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">New commodity</h2>
          <CommodityForm groups={groups} units={units} bagTypes={bagTypes}
                         onDone={() => setCreating(false)} />
        </section>
      )}

      {editing && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">Edit {editing.name}</h2>
          <CommodityForm groups={groups} units={units} bagTypes={bagTypes}
                         initial={editing} onDone={() => setEditingId(null)} />
        </section>
      )}

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium">
            {search ? 'No commodities match that search.' : 'No commodities yet.'}
          </p>
          <p className="hint mt-1">
            {search ? 'Try a different name or code.' : 'Add your first commodity to begin.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Commodities with varieties and grades</caption>
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <th scope="col" className="text-left font-medium px-4 py-3">Commodity</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Code</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Group</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Unit</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Moisture %</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Fum. days</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Var / Grade</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Status</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const d = detail[c.id] ?? { varieties: [], grades: [] };
                const open = expandedId === c.id;
                return (
                  <>
                    <tr key={c.id} className="border-b"
                        style={{ borderColor: 'rgb(var(--border))', opacity: c.is_active ? 1 : 0.55 }}>
                      <td className="px-4 py-3">
                        <button className="underline underline-offset-2 hover:opacity-70"
                                onClick={() => setExpandedId(open ? null : c.id)}
                                aria-expanded={open}>
                          {c.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                      <td className="px-4 py-3 muted">{c.group_name ?? '—'}</td>
                      <td className="px-4 py-3 muted">{c.unit_name ?? '—'}</td>
                      <td className="px-4 py-3 num">{c.standard_moisture_pct ?? '—'}</td>
                      <td className="px-4 py-3 num">{c.fumigation_interval_days ?? '—'}</td>
                      <td className="px-4 py-3 num">{c.variety_count} / {c.grade_count}</td>
                      <td className="px-4 py-3">
                        <span className="badge">{c.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs"
                                  onClick={() => { setEditingId(c.id); setCreating(false); }}>
                            Edit
                          </button>
                          <form action={toggleAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="active" value={String(!c.is_active)} />
                            <button type="submit" className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                              {c.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${c.id}-detail`} className="border-b"
                          style={{ borderColor: 'rgb(var(--border))' }}>
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">Varieties</h3>
                                <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs"
                                        onClick={() => setAddingVarietyTo(addingVarietyTo === c.id ? null : c.id)}>
                                  {addingVarietyTo === c.id ? 'Cancel' : '+ Add'}
                                </button>
                              </div>
                              {addingVarietyTo === c.id && (
                                <div className="mb-3">
                                  <VarietyForm commodityId={c.id} onDone={() => setAddingVarietyTo(null)} />
                                </div>
                              )}
                              {d.varieties.length === 0 ? (
                                <p className="hint">No varieties recorded.</p>
                              ) : (
                                <ul className="space-y-1">
                                  {d.varieties.map((v) => (
                                    <li key={v.id} className="text-sm">
                                      <span className="font-mono text-xs muted mr-2">{v.code}</span>
                                      {v.name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium">Grades</h3>
                                <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs"
                                        onClick={() => setAddingGradeTo(addingGradeTo === c.id ? null : c.id)}>
                                  {addingGradeTo === c.id ? 'Cancel' : '+ Add'}
                                </button>
                              </div>
                              {addingGradeTo === c.id && (
                                <div className="mb-3">
                                  <GradeForm commodityId={c.id} varieties={d.varieties}
                                             onDone={() => setAddingGradeTo(null)} />
                                </div>
                              )}
                              {d.grades.length === 0 ? (
                                <p className="hint">No grades recorded.</p>
                              ) : (
                                <ul className="space-y-1">
                                  {d.grades.map((g) => (
                                    <li key={g.id} className="text-sm">
                                      <span className="font-mono text-xs muted mr-2">{g.code}</span>
                                      {g.name}
                                      {g.variety_name && (
                                        <span className="muted"> · {g.variety_name}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                          {c.storage_restrictions && (
                            <p className="hint mt-4">
                              <strong>Storage:</strong> {c.storage_restrictions}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="hint">
        Showing {rows.length} of {commodities.length} commodit
        {commodities.length === 1 ? 'y' : 'ies'}. Click a name to manage its
        varieties and grades.
      </p>
    </div>
  );
}

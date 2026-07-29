'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createReasonCodeAction, toggleReasonCodeActiveAction, type ActionState,
} from './actions';
import type { ReasonCode, ReasonCategory } from '@/lib/parties';

interface Props {
  codes: ReasonCode[];
  categories: ReasonCategory[];
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

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Adding…' : 'Add reason code'}
    </button>
  );
}

function ReasonForm({
  categories, defaultCategoryId, onDone,
}: {
  categories: ReasonCategory[];
  defaultCategoryId?: string;
  onDone: () => void;
}) {
  const [state, action] = useActionState(createReasonCodeAction, INITIAL);
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="r_cat">Category</label>
          <select id="r_cat" name="category_id" className="field" required
                  defaultValue={defaultCategoryId ?? ''}>
            <option value="">— Select —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {err.category_id && (
            <p className="hint" style={{ color: '#b91c1c' }}>{err.category_id}</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="r_code">Code</label>
          <input id="r_code" name="code" className="field" required placeholder="FORKLIFT_DAMAGE" />
          {err.code && <p className="hint" style={{ color: '#b91c1c' }}>{err.code}</p>}
        </div>
        <div>
          <label className="label" htmlFor="r_name">Name</label>
          <input id="r_name" name="name" className="field" required placeholder="Forklift damage" />
          {err.name && <p className="hint" style={{ color: '#b91c1c' }}>{err.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="r_sort">Sort order</label>
          <input id="r_sort" name="sort_order" className="field num" inputMode="numeric"
                 defaultValue="0" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="r_desc">Description</label>
        <input id="r_desc" name="description" className="field" />
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="requires_evidence" className="h-5 w-5" />
          Requires evidence
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="requires_approval" className="h-5 w-5" />
          Requires approval
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_exception" className="h-5 w-5" />
          Flag on the exception dashboard
        </label>
      </div>

      <div className="flex gap-3">
        <Submit />
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export default function ReasonCodesClient({ codes, categories, includeInactive }: Props) {
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [toggleState, toggleAction] = useActionState(toggleReasonCodeActiveAction, INITIAL);

  const filtered = search.trim()
    ? codes.filter((c) => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      })
    : codes;

  const byCategory = categories
    .map((cat) => ({ cat, items: filtered.filter((c) => c.category_id === cat.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="rsearch">Search reason codes</label>
          <input id="rsearch" className="field" placeholder="Search by name or code…"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <a className="btn-secondary"
           href={includeInactive ? '/reason-codes' : '/reason-codes?inactive=1'}>
          {includeInactive ? 'Hide inactive' : 'Show inactive'}
        </a>
        <button className="btn-primary" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Close' : '+ New reason code'}
        </button>
      </div>

      <Notice state={toggleState} />

      {creating && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">New reason code</h2>
          <ReasonForm categories={categories} onDone={() => setCreating(false)} />
        </section>
      )}

      {byCategory.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium">No reason codes match.</p>
        </div>
      ) : (
        byCategory.map(({ cat, items }) => (
          <section key={cat.id} className="card overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
              <h2 className="font-semibold">{cat.name}</h2>
              {cat.description && <p className="hint">{cat.description}</p>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{cat.name} reason codes</caption>
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                    <th scope="col" className="text-left font-medium px-4 py-2">Reason</th>
                    <th scope="col" className="text-left font-medium px-4 py-2">Code</th>
                    <th scope="col" className="text-left font-medium px-4 py-2">Controls</th>
                    <th scope="col" className="text-left font-medium px-4 py-2">Status</th>
                    <th scope="col" className="text-right font-medium px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b last:border-0"
                        style={{ borderColor: 'rgb(var(--border))', opacity: r.is_active ? 1 : 0.55 }}>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {r.requires_evidence && <span className="badge">Evidence</span>}
                          {r.requires_approval && <span className="badge">Approval</span>}
                          {r.is_exception && (
                            <span className="badge" style={{ color: '#b45309' }}>Exception</span>
                          )}
                          {!r.requires_evidence && !r.requires_approval && !r.is_exception && (
                            <span className="muted text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="badge">{r.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-4 py-2">
                        <form action={toggleAction} className="flex justify-end">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="active" value={String(!r.is_active)} />
                          <button type="submit" className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                            {r.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      <p className="hint">
        {filtered.length} of {codes.length} reason codes across {categories.length} categories.
        Every gain, loss, damage, adjustment, override and correction must cite one of these.
      </p>
    </div>
  );
}

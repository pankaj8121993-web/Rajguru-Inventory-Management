'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveVehicleAction, toggleVehicleActiveAction, type ActionState } from './actions';
import type { Vehicle } from '@/lib/parties';

interface Props {
  vehicles: Vehicle[];
  transporters: Array<{ id: string; label: string }>;
  includeInactive: boolean;
  /** Server-provided so client and server agree on "today" (SSR hydration). */
  today: string;
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

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
    </button>
  );
}

/**
 * Document validity, shown as a warning rather than a block.
 *
 * A vehicle at the gate with a lapsed certificate is a real situation. Refusing
 * to record it would push staff to enter a different vehicle number, which is
 * worse than recording the truth and flagging it.
 */
function validity(date: string | null, today: string): {
  label: string;
  tone: 'ok' | 'soon' | 'expired' | 'none';
} {
  if (!date) return { label: '—', tone: 'none' };
  const d = new Date(date);
  const t = new Date(today);
  const days = Math.floor((d.getTime() - t.getTime()) / 86_400_000);
  const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (days < 0) return { label: `${label} · expired`, tone: 'expired' };
  if (days <= 30) return { label: `${label} · ${days}d`, tone: 'soon' };
  return { label, tone: 'ok' };
}

function ValidityCell({ date, today }: { date: string | null; today: string }) {
  const v = validity(date, today);
  const colour =
    v.tone === 'expired' ? '#b91c1c' : v.tone === 'soon' ? '#b45309' : undefined;
  return (
    <span style={colour ? { color: colour, fontWeight: 500 } : undefined}>
      {v.label}
    </span>
  );
}

function VehicleForm({
  transporters, initial, onDone,
}: {
  transporters: Array<{ id: string; label: string }>;
  initial?: Vehicle;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveVehicleAction, INITIAL);
  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Notice state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="v_reg">Registration number</label>
          <input id="v_reg" name="registration_number" className="field font-mono uppercase"
                 required defaultValue={initial?.registration_number ?? ''}
                 placeholder="MH24AB1234" aria-invalid={!!err.registration_number} />
          {err.registration_number
            ? <p className="hint" data-testid="error-registration" style={{ color: '#b91c1c' }}>
                {err.registration_number}
              </p>
            : <p className="hint">Spaces and dashes are fine — they are removed on save.</p>}
        </div>
        <div>
          <label className="label" htmlFor="v_type">Vehicle type</label>
          <input id="v_type" name="vehicle_type" className="field"
                 defaultValue={initial?.vehicle_type ?? ''} placeholder="Truck 10-wheeler" />
        </div>
        <div>
          <label className="label" htmlFor="v_transporter">Transporter</label>
          <select id="v_transporter" name="transporter_party_id" className="field"
                  defaultValue={initial?.transporter_party_id ?? ''}>
            <option value="">— Own or unknown —</option>
            {transporters.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <p className="hint">Only parties holding the Transporter type appear here.</p>
        </div>
        <div>
          <label className="label" htmlFor="v_cap">Capacity (MT)</label>
          <input id="v_cap" name="capacity_mt" className="field num" inputMode="decimal"
                 defaultValue={initial?.capacity_mt ?? ''} placeholder="16.000"
                 aria-invalid={!!err.capacity_mt} />
          {err.capacity_mt && (
            <p className="hint" style={{ color: '#b91c1c' }}>{err.capacity_mt}</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="v_trailer">Trailer number</label>
          <input id="v_trailer" name="trailer_number" className="field font-mono"
                 defaultValue={initial?.trailer_number ?? ''} />
        </div>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="label mb-2">
          Document validity{' '}
          <span className="muted font-normal">— expiry warns, it never blocks</span>
        </legend>
        {([
          ['insurance_valid_to', 'Insurance to'],
          ['pollution_valid_to', 'Pollution to'],
          ['fitness_valid_to', 'Fitness to'],
          ['permit_valid_to', 'Permit to'],
        ] as const).map(([field, label]) => (
          <div key={field}>
            <label className="label" htmlFor={`v_${field}`}>{label}</label>
            <input id={`v_${field}`} name={field} type="date" className="field"
                   defaultValue={initial?.[field] ?? ''} />
          </div>
        ))}
      </fieldset>

      <div>
        <label className="label" htmlFor="v_notes">Notes</label>
        <input id="v_notes" name="notes" className="field" defaultValue={initial?.notes ?? ''} />
      </div>

      <div className="flex gap-3">
        <Submit editing={!!initial} />
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export default function VehiclesClient({
  vehicles, transporters, includeInactive, today,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toggleState, toggleAction] = useActionState(toggleVehicleActiveAction, INITIAL);

  const rows = search.trim()
    ? vehicles.filter((v) =>
        v.registration_number.toLowerCase().includes(
          search.toLowerCase().replace(/[\s-]/g, ''),
        ),
      )
    : vehicles;

  const editing = editingId ? vehicles.find((v) => v.id === editingId) : undefined;

  const expiredCount = vehicles.filter((v) =>
    [v.insurance_valid_to, v.pollution_valid_to, v.fitness_valid_to].some(
      (d) => d && new Date(d) < new Date(today),
    ),
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="vsearch">Search vehicles</label>
          <input id="vsearch" className="field" placeholder="Search by registration…"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <a className="btn-secondary"
           href={includeInactive ? '/vehicles' : '/vehicles?inactive=1'}>
          {includeInactive ? 'Hide inactive' : 'Show inactive'}
        </a>
        <button className="btn-primary"
                onClick={() => { setCreating((v) => !v); setEditingId(null); }}>
          {creating ? 'Close' : '+ New vehicle'}
        </button>
      </div>

      {expiredCount > 0 && (
        <div className="rounded-md border px-3 py-2 text-sm"
             style={{ borderColor: '#b45309', color: '#b45309' }}>
          {expiredCount} vehicle{expiredCount === 1 ? ' has' : 's have'} at least one expired
          document. They can still be recorded against a weighment — the expiry is a warning,
          not a block.
        </div>
      )}

      <Notice state={toggleState} />

      {creating && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">New vehicle</h2>
          <VehicleForm transporters={transporters} onDone={() => setCreating(false)} />
        </section>
      )}

      {editing && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">
            Edit {editing.registration_number}
          </h2>
          <VehicleForm transporters={transporters} initial={editing}
                       onDone={() => setEditingId(null)} />
        </section>
      )}

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium">
            {search ? 'No vehicles match that search.' : 'No vehicles yet.'}
          </p>
          <p className="hint mt-1">
            {search ? 'Try a different registration.' : 'Add the vehicles that deliver to your facilities.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Vehicles and document validity</caption>
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <th scope="col" className="text-left font-medium px-4 py-3">Registration</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Type</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Transporter</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Capacity (MT)</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Insurance</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Pollution</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Fitness</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Status</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-b last:border-0"
                    style={{ borderColor: 'rgb(var(--border))', opacity: v.is_active ? 1 : 0.55 }}>
                  <td className="px-4 py-3 font-mono">{v.registration_number}</td>
                  <td className="px-4 py-3 muted">{v.vehicle_type ?? '—'}</td>
                  <td className="px-4 py-3 muted">{v.transporter_name ?? 'Own / unknown'}</td>
                  <td className="px-4 py-3 num">
                    {v.capacity_mt
                      ? Number(v.capacity_mt).toLocaleString('en-IN', {
                          minimumFractionDigits: 3, maximumFractionDigits: 3,
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <ValidityCell date={v.insurance_valid_to} today={today} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <ValidityCell date={v.pollution_valid_to} today={today} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <ValidityCell date={v.fitness_valid_to} today={today} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge">{v.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs"
                              onClick={() => { setEditingId(v.id); setCreating(false); }}>
                        Edit
                      </button>
                      <form action={toggleAction}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="active" value={String(!v.is_active)} />
                        <button type="submit" className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                          {v.is_active ? 'Deactivate' : 'Reactivate'}
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
        Showing {rows.length} of {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}.
      </p>
    </div>
  );
}

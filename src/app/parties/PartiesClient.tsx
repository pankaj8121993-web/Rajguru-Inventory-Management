'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { savePartyAction, togglePartyActiveAction, type ActionState } from './actions';
import type { Party, PartyType } from '@/lib/parties';

interface Props {
  parties: Party[];
  partyTypes: PartyType[];
  brokers: Array<{ id: string; label: string }>;
  includeInactive: boolean;
  activeTypeId: string;
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
      {pending ? 'Saving…' : editing ? 'Save changes' : 'Create party'}
    </button>
  );
}

function Err({ message, testId }: { message?: string; testId?: string }) {
  if (!message) return null;
  return (
    <p className="hint" data-testid={testId} style={{ color: '#b91c1c' }}>
      {message}
    </p>
  );
}

function PartyForm({
  partyTypes, brokers, initial, onDone,
}: {
  partyTypes: PartyType[];
  brokers: Array<{ id: string; label: string }>;
  initial?: Party;
  onDone: () => void;
}) {
  const [state, action] = useActionState(savePartyAction, INITIAL);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initial?.type_ids ?? []);

  useEffect(() => { if (state.ok) onDone(); }, [state.ok, onDone]);
  const err = state.fieldErrors ?? {};

  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  return (
    <form action={action} className="space-y-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Notice state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p_code">Code</label>
          <input id="p_code" name="code" className="field" required maxLength={40}
                 defaultValue={initial?.code ?? ''} placeholder="P0016"
                 aria-invalid={!!err.code} />
          <Err message={err.code} />
        </div>
        <div>
          <label className="label" htmlFor="p_legal">Legal name</label>
          <input id="p_legal" name="legal_name" className="field" required maxLength={200}
                 defaultValue={initial?.legal_name ?? ''} placeholder="Shree Ganesh Traders"
                 aria-invalid={!!err.legal_name} />
          <Err message={err.legal_name} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p_trade">Trade name</label>
          <input id="p_trade" name="trade_name" className="field"
                 defaultValue={initial?.trade_name ?? ''} placeholder="Ganesh Traders" />
        </div>
      </div>

      <fieldset>
        <legend className="label mb-2">
          Party type <span className="muted font-normal">— a party may hold more than one</span>
        </legend>
        <div className="flex flex-wrap gap-2" data-testid="party-types">
          {partyTypes.map((t) => {
            const checked = selectedTypes.includes(t.id);
            return (
              <label
                key={t.id}
                className="badge cursor-pointer select-none"
                style={
                  checked
                    ? { borderColor: 'rgb(var(--accent))', color: 'rgb(var(--accent))' }
                    : undefined
                }
              >
                <input
                  type="checkbox"
                  name="type_ids"
                  value={t.id}
                  checked={checked}
                  onChange={() => toggleType(t.id)}
                  className="sr-only"
                />
                {checked ? '✓ ' : ''}{t.name}
              </label>
            );
          })}
        </div>
        <Err message={err.type_ids} testId="error-types" />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p_gstin">GSTIN</label>
          <input id="p_gstin" name="gstin" className="field font-mono"
                 defaultValue={initial?.gstin ?? ''} placeholder="27AABCK1234M1Z5"
                 aria-invalid={!!err.gstin} />
          {err.gstin
            ? <Err message={err.gstin} testId="error-gstin" />
            : <p className="hint">Optional. Many farmers have none.</p>}
        </div>
        <div>
          <label className="label" htmlFor="p_pan">PAN</label>
          <input id="p_pan" name="pan" className="field font-mono"
                 defaultValue={initial?.pan ?? ''} placeholder="AABCK1234M"
                 aria-invalid={!!err.pan} />
          <Err message={err.pan} testId="error-pan" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p_contact">Contact person</label>
          <input id="p_contact" name="contact_person" className="field"
                 defaultValue={initial?.contact_person ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="p_mobile">Mobile</label>
          <input id="p_mobile" name="mobile" className="field" inputMode="tel"
                 defaultValue={initial?.mobile ?? ''} placeholder="9822011001"
                 aria-invalid={!!err.mobile} />
          <Err message={err.mobile} testId="error-mobile" />
        </div>
        <div>
          <label className="label" htmlFor="p_email">Email</label>
          <input id="p_email" name="email" className="field" inputMode="email"
                 defaultValue={initial?.email ?? ''} aria-invalid={!!err.email} />
          <Err message={err.email} />
        </div>
        <div>
          <label className="label" htmlFor="p_broker">Broker</label>
          <select id="p_broker" name="broker_party_id" className="field"
                  defaultValue={initial?.broker_party_id ?? ''}>
            <option value="">— None —</option>
            {brokers.filter((b) => b.id !== initial?.id).map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-4">
          <label className="label" htmlFor="p_address">Address</label>
          <input id="p_address" name="address" className="field"
                 defaultValue={initial?.address ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="p_village">Village</label>
          <input id="p_village" name="village" className="field"
                 defaultValue={initial?.village ?? ''} placeholder="Ausa" />
        </div>
        <div>
          <label className="label" htmlFor="p_district">District</label>
          <input id="p_district" name="district" className="field"
                 defaultValue={initial?.district ?? ''} placeholder="Latur" />
        </div>
        <div>
          <label className="label" htmlFor="p_state">State</label>
          <input id="p_state" name="state" className="field"
                 defaultValue={initial?.state ?? 'Maharashtra'} />
        </div>
        <div>
          <label className="label" htmlFor="p_pin">Pincode</label>
          <input id="p_pin" name="pincode" className="field num" inputMode="numeric"
                 defaultValue={initial?.pincode ?? ''} placeholder="413512"
                 aria-invalid={!!err.pincode} />
          <Err message={err.pincode} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="p_bank">Bank</label>
          <input id="p_bank" name="bank_name" className="field"
                 defaultValue={initial?.bank_name ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="p_acc">Account number</label>
          <input id="p_acc" name="bank_account_number" className="field font-mono"
                 defaultValue={initial?.bank_account_number ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="p_ifsc">IFSC</label>
          <input id="p_ifsc" name="bank_ifsc" className="field font-mono"
                 defaultValue={initial?.bank_ifsc ?? ''} placeholder="SBIN0001234"
                 aria-invalid={!!err.bank_ifsc} />
          <Err message={err.bank_ifsc} />
        </div>
        <div>
          <label className="label" htmlFor="p_credit">Credit terms (days)</label>
          <input id="p_credit" name="credit_terms_days" className="field num" inputMode="numeric"
                 defaultValue={initial?.credit_terms_days ?? ''}
                 aria-invalid={!!err.credit_terms_days} />
          <Err message={err.credit_terms_days} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="p_agmt">Storage agreement reference</label>
          <input id="p_agmt" name="storage_agreement_ref" className="field"
                 defaultValue={initial?.storage_agreement_ref ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="p_notes">Notes</label>
          <input id="p_notes" name="notes" className="field"
                 defaultValue={initial?.notes ?? ''} />
        </div>
      </div>

      <div className="flex gap-3">
        <Submit editing={!!initial} />
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export default function PartiesClient({
  parties, partyTypes, brokers, includeInactive, activeTypeId,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toggleState, toggleAction] = useActionState(togglePartyActiveAction, INITIAL);

  const rows = search.trim()
    ? parties.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.legal_name.toLowerCase().includes(q) ||
          (p.trade_name ?? '').toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.mobile ?? '').includes(q)
        );
      })
    : parties;

  const editing = editingId ? parties.find((p) => p.id === editingId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="psearch">Search parties</label>
          <input id="psearch" className="field" placeholder="Search by name, code or mobile…"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="sr-only" htmlFor="ptype">Filter by type</label>
          <select
            id="ptype"
            className="field"
            value={activeTypeId}
            onChange={(e) => {
              const params = new URLSearchParams();
              if (e.target.value) params.set('type', e.target.value);
              if (includeInactive) params.set('inactive', '1');
              window.location.href = `/parties${params.toString() ? `?${params}` : ''}`;
            }}
          >
            <option value="">All types</option>
            {partyTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <a className="btn-secondary"
           href={includeInactive ? '/parties' : '/parties?inactive=1'}>
          {includeInactive ? 'Hide inactive' : 'Show inactive'}
        </a>
        <button className="btn-primary"
                onClick={() => { setCreating((v) => !v); setEditingId(null); }}>
          {creating ? 'Close' : '+ New party'}
        </button>
      </div>

      <Notice state={toggleState} />

      {creating && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">New party</h2>
          <PartyForm partyTypes={partyTypes} brokers={brokers}
                     onDone={() => setCreating(false)} />
        </section>
      )}

      {editing && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">Edit {editing.legal_name}</h2>
          <PartyForm partyTypes={partyTypes} brokers={brokers} initial={editing}
                     onDone={() => setEditingId(null)} />
        </section>
      )}

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium">
            {search || activeTypeId ? 'No parties match.' : 'No parties yet.'}
          </p>
          <p className="hint mt-1">
            {search || activeTypeId
              ? 'Try a different search or clear the type filter.'
              : 'Add farmers, traders, brokers, customers and transporters here.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Parties and their types</caption>
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <th scope="col" className="text-left font-medium px-4 py-3">Party</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Code</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Types</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Location</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Mobile</th>
                <th scope="col" className="text-left font-medium px-4 py-3">GSTIN</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Status</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b last:border-0"
                    style={{ borderColor: 'rgb(var(--border))', opacity: p.is_active ? 1 : 0.55 }}>
                  <td className="px-4 py-3">
                    {p.legal_name}
                    {p.trade_name && <span className="muted"> · {p.trade_name}</span>}
                    {p.broker_name && (
                      <div className="hint">via {p.broker_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.type_names.map((n) => (
                        <span key={n} className="badge">{n}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 muted">
                    {[p.village, p.district].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 num font-mono text-xs">{p.mobile ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.gstin ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="badge">{p.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs"
                              onClick={() => { setEditingId(p.id); setCreating(false); }}>
                        Edit
                      </button>
                      <form action={toggleAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={String(!p.is_active)} />
                        <button type="submit" className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                          {p.is_active ? 'Deactivate' : 'Reactivate'}
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
        Showing {rows.length} of {parties.length} part{parties.length === 1 ? 'y' : 'ies'}.
        A party can hold several types — a trader who also stores stock is one record, not two.
      </p>
    </div>
  );
}

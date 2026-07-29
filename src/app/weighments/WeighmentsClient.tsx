'use client';

import { useActionState, useState } from 'react';
import WeighmentForm, { type Pickers } from './WeighmentForm';
import { setStatusAction, resolveDuplicateAction, type ActionState } from './actions';
import { WEIGHMENT_STATUS_LABELS, type WeighmentStatus } from '@/lib/validation/weighment';
import type { WeighmentSlip } from '@/lib/weighment';

interface Props {
  slips: WeighmentSlip[];
  pickers: Pickers;
  tolerancePct: number;
  escalationPct: number;
  today: string;
  activeStatus: string;
  activeDirection: string;
  duplicatesBySlip: Record<string, Array<{
    id: string; matched_slip_no: string; matched_date: string; match_reason: string;
  }>>;
}

const INITIAL: ActionState = { ok: false };

function kg(value: string | null): string {
  if (value === null) return '—';
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 3, maximumFractionDigits: 3,
  });
}

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

export default function WeighmentsClient({
  slips, pickers, tolerancePct, escalationPct, today,
  activeStatus, activeDirection, duplicatesBySlip,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusState, statusAction] = useActionState(setStatusAction, INITIAL);
  const [dupState, dupAction] = useActionState(resolveDuplicateAction, INITIAL);

  function navigate(next: { status?: string; direction?: string }) {
    const params = new URLSearchParams();
    const status = next.status ?? activeStatus;
    const direction = next.direction ?? activeDirection;
    if (status) params.set('status', status);
    if (direction) params.set('direction', direction);
    window.location.href = `/weighments${params.toString() ? `?${params}` : ''}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="field max-w-[180px]" value={activeDirection}
                onChange={(e) => navigate({ direction: e.target.value })}
                aria-label="Filter by direction">
          <option value="">All directions</option>
          <option value="inward">Inward</option>
          <option value="outward">Outward</option>
        </select>
        <select className="field max-w-[220px]" value={activeStatus}
                onChange={(e) => navigate({ status: e.target.value })}
                aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(WEIGHMENT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="btn-primary ml-auto"
                onClick={() => { setCreating((v) => !v); setSavedMessage(null); }}>
          {creating ? 'Close' : '+ New weighment'}
        </button>
      </div>

      {savedMessage && (
        <div data-testid="form-notice" role="status"
             className="rounded-md border px-3 py-2 text-sm"
             style={{ borderColor: 'rgb(var(--accent))', color: 'rgb(var(--accent))' }}>
          {savedMessage}
        </div>
      )}
      <Notice state={statusState} />
      <Notice state={dupState} />

      {creating && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold mb-4">New weighment slip</h2>
          <WeighmentForm
            pickers={pickers}
            tolerancePct={tolerancePct}
            escalationPct={escalationPct}
            today={today}
            onDone={(message) => { setCreating(false); setSavedMessage(message ?? null); }}
          />
        </section>
      )}

      {slips.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-medium">No weighments recorded.</p>
          <p className="hint mt-1">
            Enter your first slip from the paper, photograph or PDF.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Weighment register</caption>
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                <th scope="col" className="text-left font-medium px-4 py-3">Slip</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Date</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Dir</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Vehicle</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Party</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Commodity</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Gross</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Tare</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Net</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Diff</th>
                <th scope="col" className="text-left font-medium px-4 py-3">Status</th>
                <th scope="col" className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slips.map((s) => {
                const dupes = duplicatesBySlip[s.id] ?? [];
                const open = expandedId === s.id;
                const diff = s.net_difference_kg;
                const hasDiff = diff !== null && Number(diff) !== 0;
                return (
                  <>
                    <tr key={s.id} className="border-b"
                        style={{
                          borderColor: 'rgb(var(--border))',
                          opacity: s.status === 'cancelled' ? 0.5 : 1,
                        }}>
                      <td className="px-4 py-3">
                        <button className="font-mono text-xs underline underline-offset-2"
                                onClick={() => setExpandedId(open ? null : s.id)}
                                aria-expanded={open}>
                          {s.slip_no}
                        </button>
                        {s.external_slip_no && (
                          <div className="hint">paper {s.external_slip_no}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 muted">{s.weighment_date}</td>
                      <td className="px-4 py-3">
                        <span className="badge">
                          {s.direction === 'inward' ? 'In' : 'Out'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {s.vehicle_registration ?? '—'}
                      </td>
                      <td className="px-4 py-3 muted">{s.party_name ?? '—'}</td>
                      <td className="px-4 py-3 muted">
                        {s.commodity_name ?? (
                          <span className="badge">Not yet known</span>
                        )}
                        {s.variety_name && <span className="muted"> · {s.variety_name}</span>}
                      </td>
                      <td className="px-4 py-3 num">{kg(s.gross_weight_kg)}</td>
                      <td className="px-4 py-3 num">{kg(s.tare_weight_kg)}</td>
                      <td className="px-4 py-3 num font-medium">
                        {kg(s.calculated_net_weight_kg)}
                      </td>
                      <td className="px-4 py-3 num"
                          style={hasDiff ? { color: '#b45309', fontWeight: 500 } : undefined}>
                        {hasDiff ? kg(diff) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge">
                          {WEIGHMENT_STATUS_LABELS[s.status as WeighmentStatus]}
                        </span>
                        {dupes.length > 0 && (
                          <div className="hint" style={{ color: '#b45309' }}>
                            {dupes.length} duplicate{dupes.length === 1 ? '' : 's'} to review
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {s.status === 'draft' && (
                            <form action={statusAction}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="status" value="awaiting_verification" />
                              <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                                Submit
                              </button>
                            </form>
                          )}
                          {s.status === 'awaiting_verification' && (
                            <form action={statusAction}>
                              <input type="hidden" name="id" value={s.id} />
                              <input type="hidden" name="status" value="verified" />
                              <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                                Verify
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${s.id}-d`} className="border-b"
                          style={{ borderColor: 'rgb(var(--border))' }}>
                        <td colSpan={12} className="px-4 py-4">
                          <div className="grid gap-6 md:grid-cols-3 text-sm">
                            <div>
                              <h3 className="font-medium mb-2">Weights</h3>
                              <dl className="space-y-1">
                                <div className="flex justify-between">
                                  <dt className="muted">Gross</dt>
                                  <dd className="num">{kg(s.gross_weight_kg)} kg</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="muted">Tare</dt>
                                  <dd className="num">{kg(s.tare_weight_kg)} kg</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="muted">Calculated net</dt>
                                  <dd className="num font-medium">
                                    {kg(s.calculated_net_weight_kg)} kg
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="muted">Printed net</dt>
                                  <dd className="num">{kg(s.printed_net_weight_kg)} kg</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="muted">Difference</dt>
                                  <dd className="num">{kg(s.net_difference_kg)} kg</dd>
                                </div>
                              </dl>
                              <p className="hint mt-2">
                                All five values are stored. Neither net overwrites the other.
                              </p>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Details</h3>
                              <dl className="space-y-1">
                                <div className="flex justify-between gap-4">
                                  <dt className="muted">Weighbridge</dt>
                                  <dd>{s.weighbridge_name ?? '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <dt className="muted">Driver</dt><dd>{s.driver_name ?? '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <dt className="muted">Bags</dt>
                                  <dd className="num">{s.bag_count ?? '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <dt className="muted">Invoice</dt><dd>{s.invoice_no ?? '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <dt className="muted">Entered by</dt>
                                  <dd>{s.entry_user_name ?? '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <dt className="muted">Verified by</dt>
                                  <dd>{s.verified_by_name ?? 'Not verified'}</dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Duplicate review</h3>
                              {dupes.length === 0 ? (
                                <p className="hint">No open duplicate reviews.</p>
                              ) : (
                                <ul className="space-y-3">
                                  {dupes.map((d) => (
                                    <li key={d.id}>
                                      <p>
                                        <span className="font-mono text-xs">
                                          {d.matched_slip_no}
                                        </span>{' '}
                                        <span className="muted">{d.matched_date}</span>
                                      </p>
                                      <p className="hint">{d.match_reason}</p>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {([
                                          ['reviewed_accepted', 'Genuine, accept'],
                                          ['confirmed_duplicate', 'Confirm duplicate'],
                                          ['linked', 'Link to earlier'],
                                        ] as const).map(([outcome, label]) => (
                                          <form key={outcome} action={dupAction}>
                                            <input type="hidden" name="review_id" value={d.id} />
                                            <input type="hidden" name="outcome" value={outcome} />
                                            <button className="btn-secondary !min-h-0 !py-1 !px-2 text-xs">
                                              {label}
                                            </button>
                                          </form>
                                        ))}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
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
        Showing {slips.length} weighment{slips.length === 1 ? '' : 's'}. Net weight is
        calculated by the system from gross and tare — it is never typed. A slip can be
        corrected freely while it is a draft; after posting it can only be reversed.
      </p>
    </div>
  );
}

'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveWeighmentAction, type ActionState } from './actions';
import {
  MOVEMENT_DIRECTIONS, SOURCE_CATEGORIES, SOURCE_CATEGORY_LABELS,
  netDifference, differenceSeverity,
} from '@/lib/validation/weighment';

interface Option { id: string; label: string }
interface VarietyOption extends Option { commodity_id: string }

export interface Pickers {
  weighbridges: Option[];
  vehicles: Option[];
  drivers: Option[];
  parties: Option[];
  commodities: Option[];
  varieties: VarietyOption[];
  reasons: Option[];
}

interface Props {
  pickers: Pickers;
  tolerancePct: number;
  escalationPct: number;
  today: string;
  /** Called on a clean save, with the confirmation to show in the register. */
  onDone: (savedMessage?: string) => void;
}

const INITIAL: ActionState = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : 'Save weighment'}
    </button>
  );
}

function Err({ message, testId }: { message?: string; testId?: string }) {
  if (!message) return null;
  return (
    <p className="hint" data-testid={testId} style={{ color: '#b91c1c' }}>{message}</p>
  );
}

export default function WeighmentForm({
  pickers, tolerancePct, escalationPct, today, onDone,
}: Props) {
  const [state, action] = useActionState(saveWeighmentAction, INITIAL);

  const [gross, setGross] = useState('');
  const [tare, setTare] = useState('');
  const [printedNet, setPrintedNet] = useState('');
  const [commodityId, setCommodityId] = useState('');

  useEffect(() => {
    // Close only when saved cleanly, handing the confirmation to the register
    // so the operator still sees the generated slip number — they need it to
    // write on the paper. A save that flagged duplicates keeps the panel open.
    if (state.ok && !state.duplicates?.length) onDone(state.message);
  }, [state.ok, state.message, state.duplicates, onDone]);

  const err = state.fieldErrors ?? {};

  // Net weight is shown live, computed the same way the database will compute
  // it (DR-01). The operator never types it.
  const net = useMemo(
    () => netDifference(gross || null, tare || null, printedNet || null),
    [gross, tare, printedNet],
  );

  const severity = differenceSeverity(net.percent, tolerancePct, escalationPct);
  const varieties = pickers.varieties.filter((v) => v.commodity_id === commodityId);

  const severityStyle =
    severity === 'needs_approval'
      ? { color: '#b91c1c' }
      : severity === 'needs_reason'
        ? { color: '#b45309' }
        : undefined;

  return (
    <form action={action} className="space-y-6">
      {state.message && (
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
      )}

      {!!state.duplicates?.length && (
        <div className="rounded-md border px-3 py-2 text-sm" data-testid="duplicate-warning"
             style={{ borderColor: '#b45309', color: '#b45309' }}>
          <p className="font-medium mb-1">Possible duplicates flagged</p>
          <ul className="list-disc pl-5">
            {state.duplicates.map((d) => (
              <li key={d.id}>{d.slip_no} — {d.match_reason}</li>
            ))}
          </ul>
          <p className="mt-1">
            Resolve each one from the register. Nothing was merged or discarded.
          </p>
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="label mb-2">Slip</legend>
        <div>
          <label className="label" htmlFor="w_direction">Direction</label>
          <select id="w_direction" name="direction" className="field" defaultValue="inward">
            {MOVEMENT_DIRECTIONS.map((d) => (
              <option key={d} value={d}>{d === 'inward' ? 'Inward' : 'Outward'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="w_date">Date</label>
          <input id="w_date" name="weighment_date" type="date" className="field" required
                 defaultValue={today} aria-invalid={!!err.weighment_date} />
          <Err message={err.weighment_date} />
        </div>
        <div>
          <label className="label" htmlFor="w_ext">Slip number on the paper</label>
          <input id="w_ext" name="external_slip_no" className="field font-mono"
                 placeholder="12345" />
          <p className="hint">Ours is generated on save.</p>
        </div>
        <div>
          <label className="label" htmlFor="w_wb">Weighbridge</label>
          <select id="w_wb" name="weighbridge_id" className="field">
            <option value="">— Select —</option>
            {pickers.weighbridges.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* ------------------------------------------------------------------ */}
      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="label mb-2">
          Weights <span className="muted font-normal">— net is calculated, never typed</span>
        </legend>
        <div>
          <label className="label" htmlFor="w_gross">Gross (kg)</label>
          <input id="w_gross" name="gross_weight_kg" className="field num" required
                 inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)}
                 placeholder="0.000" aria-invalid={!!err.gross_weight_kg} />
          <Err message={err.gross_weight_kg} testId="error-gross" />
        </div>
        <div>
          <label className="label" htmlFor="w_tare">Tare (kg)</label>
          <input id="w_tare" name="tare_weight_kg" className="field num" required
                 inputMode="decimal" value={tare} onChange={(e) => setTare(e.target.value)}
                 placeholder="0.000" aria-invalid={!!err.tare_weight_kg} />
          <Err message={err.tare_weight_kg} />
        </div>
        <div>
          <span className="label">Calculated net (kg)</span>
          <output
            data-testid="calculated-net"
            className="field num block"
            style={{ background: 'transparent', fontWeight: 600 }}
          >
            {net.calculated ?? '—'}
          </output>
          <p className="hint">Gross − tare.</p>
        </div>
        <div>
          <label className="label" htmlFor="w_printed">Net printed on slip (kg)</label>
          <input id="w_printed" name="printed_net_weight_kg" className="field num"
                 inputMode="decimal" value={printedNet}
                 onChange={(e) => setPrintedNet(e.target.value)} placeholder="0.000" />
          <p className="hint">Both values are kept.</p>
        </div>
      </fieldset>

      {net.difference !== null && net.difference !== '0.000' && (
        <div className="rounded-md border px-3 py-2 text-sm" data-testid="net-difference"
             style={{ borderColor: severityStyle?.color ?? 'rgb(var(--border))', ...severityStyle }}>
          Difference <strong>{net.difference} kg</strong> ({net.percent}%).{' '}
          {severity === 'within_tolerance' && `Within the ${tolerancePct}% tolerance.`}
          {severity === 'needs_reason' && `Above the ${tolerancePct}% tolerance — give a reason below.`}
          {severity === 'needs_approval' && `Above the ${escalationPct}% escalation threshold — a reason is required and this will need approval.`}
        </div>
      )}

      {severity === 'needs_reason' || severity === 'needs_approval' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="w_reason">Reason for the difference</label>
            <select id="w_reason" name="difference_reason_id" className="field">
              <option value="">— Select —</option>
              {pickers.reasons.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="w_diffremarks">Remarks</label>
            <input id="w_diffremarks" name="difference_remarks" className="field" />
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="label mb-2">Vehicle</legend>
        <div>
          <label className="label" htmlFor="w_vehicle">Vehicle</label>
          <select id="w_vehicle" name="vehicle_id" className="field">
            <option value="">— Select —</option>
            {pickers.vehicles.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="w_trailer">Trailer</label>
          <input id="w_trailer" name="trailer_number" className="field font-mono" />
        </div>
        <div>
          <label className="label" htmlFor="w_driver">Driver</label>
          <select id="w_driver" name="driver_id" className="field">
            <option value="">— Select —</option>
            {pickers.drivers.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="w_bags">Bags</label>
          <input id="w_bags" name="bag_count" className="field num" inputMode="numeric"
                 aria-invalid={!!err.bag_count} />
          <Err message={err.bag_count} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="label mb-2">Party and commodity</legend>
        <div>
          <label className="label" htmlFor="w_party">Party</label>
          <select id="w_party" name="party_id" className="field">
            <option value="">— Select —</option>
            {pickers.parties.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="w_source">Source</label>
          <select id="w_source" name="source_category" className="field">
            <option value="">— Select —</option>
            {SOURCE_CATEGORIES.map((s) => (
              <option key={s} value={s}>{SOURCE_CATEGORY_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="w_commodity">Commodity</label>
          <select id="w_commodity" name="commodity_id" className="field"
                  value={commodityId} onChange={(e) => setCommodityId(e.target.value)}>
            <option value="">— Not yet known —</option>
            {pickers.commodities.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <p className="hint">May be refined later.</p>
        </div>
        <div>
          <label className="label" htmlFor="w_variety">Variety</label>
          <select id="w_variety" name="variety_id" className="field" disabled={!commodityId}>
            <option value="">— Not yet known —</option>
            {varieties.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-4">
        <legend className="label mb-2">Documents</legend>
        <div>
          <label className="label" htmlFor="w_invoice">Invoice</label>
          <input id="w_invoice" name="invoice_no" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="w_challan">Delivery challan</label>
          <input id="w_challan" name="challan_no" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="w_gate">Gate entry</label>
          <input id="w_gate" name="gate_entry_no" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="w_remarks">Remarks</label>
          <input id="w_remarks" name="remarks" className="field" />
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Submit />
        <button type="button" className="btn-secondary" onClick={() => onDone()}>Cancel</button>
      </div>
    </form>
  );
}

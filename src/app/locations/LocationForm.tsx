'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveLocationAction, type ActionState } from './actions';
import { NODE_TYPES, NODE_TYPE_LABELS, STORAGE_NODE_TYPES, type NodeType } from '@/lib/location-types';

interface ParentOption {
  id: string;
  label: string;
  node_type: NodeType;
}

interface Props {
  parentOptions: ParentOption[];
  /** child type -> allowed parent types, and whether it may be a root */
  rules: Record<string, { parents: string[]; canRoot: boolean }>;
  initial?: {
    id: string;
    node_type: NodeType;
    parent_id: string | null;
    code: string;
    name: string;
    description: string | null;
    plot_number: string | null;
    survey_number: string | null;
    length_m: string | null;
    width_m: string | null;
    height_m: string | null;
    area_sqm: string | null;
    approved_capacity_mt: string | null;
    operational_capacity_mt: string | null;
    storage_method: string | null;
    fumigation_suitable: boolean;
    commodity_restrictions: string | null;
    responsible_employee: string | null;
    notes: string | null;
  };
  onDone?: () => void;
}

const INITIAL_STATE: ActionState = { ok: false };

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : editing ? 'Save changes' : 'Create location'}
    </button>
  );
}

export default function LocationForm({ parentOptions, rules, initial, onDone }: Props) {
  const [state, formAction] = useActionState(saveLocationAction, INITIAL_STATE);
  const [nodeType, setNodeType] = useState<NodeType>(initial?.node_type ?? 'godown');
  const [parentId, setParentId] = useState(initial?.parent_id ?? '');

  const rule = rules[nodeType] ?? { parents: [], canRoot: false };
  const available = parentOptions.filter(
    (p) => rule.parents.includes(p.node_type) && p.id !== initial?.id,
  );

  // When the type changes, a previously chosen parent may no longer be legal.
  useEffect(() => {
    if (parentId && !available.some((p) => p.id === parentId)) setParentId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeType]);

  useEffect(() => {
    if (state.ok && onDone) onDone();
  }, [state.ok, onDone]);

  const err = state.fieldErrors ?? {};
  const isStorage = STORAGE_NODE_TYPES.includes(nodeType);

  return (
    <form action={formAction} className="space-y-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="node_type">Location type</label>
          <select
            id="node_type"
            name="node_type"
            className="field"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as NodeType)}
          >
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <p className="hint">
            A {NODE_TYPE_LABELS[nodeType].toLowerCase()} can sit inside:{' '}
            {rule.parents.length
              ? rule.parents.map((p) => NODE_TYPE_LABELS[p as NodeType]).join(', ')
              : '—'}
            {rule.canRoot ? ' (or stand alone)' : ''}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="parent_id">
            Inside {rule.canRoot && <span className="muted font-normal">(optional)</span>}
          </label>
          <select
            id="parent_id"
            name="parent_id"
            className="field"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">
              {rule.canRoot ? '— Top level —' : '— Select a parent —'}
            </option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          {err.parent_id && <p className="hint" style={{ color: '#b91c1c' }}>{err.parent_id}</p>}
        </div>

        <div>
          <label className="label" htmlFor="code">Code</label>
          <input
            id="code" name="code" className="field" required maxLength={40}
            defaultValue={initial?.code ?? ''} placeholder="ALY-G4"
            aria-invalid={!!err.code}
          />
          {err.code
            ? <p className="hint" style={{ color: '#b91c1c' }}>{err.code}</p>
            : <p className="hint">Short unique code staff will recognise.</p>}
        </div>

        <div>
          <label className="label" htmlFor="name">Name</label>
          <input
            id="name" name="name" className="field" required maxLength={120}
            defaultValue={initial?.name ?? ''} placeholder="Godown 4"
            aria-invalid={!!err.name}
          />
          {err.name && <p className="hint" style={{ color: '#b91c1c' }}>{err.name}</p>}
        </div>
      </div>

      {(nodeType === 'plot' || nodeType === 'facility') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="plot_number">Plot number</label>
            <input id="plot_number" name="plot_number" className="field"
                   defaultValue={initial?.plot_number ?? ''} placeholder="P-3" />
          </div>
          <div>
            <label className="label" htmlFor="survey_number">Survey number</label>
            <input id="survey_number" name="survey_number" className="field"
                   defaultValue={initial?.survey_number ?? ''} placeholder="142/2C" />
          </div>
        </div>
      )}

      {isStorage && (
        <>
          <fieldset className="grid gap-4 sm:grid-cols-4">
            <legend className="label mb-2">Dimensions</legend>
            {([
              ['length_m', 'Length (m)'],
              ['width_m', 'Width (m)'],
              ['height_m', 'Height (m)'],
              ['area_sqm', 'Area (m²)'],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <label className="label" htmlFor={field}>{label}</label>
                <input
                  id={field} name={field} className="field num" inputMode="decimal"
                  defaultValue={initial?.[field] ?? ''} placeholder="0.000"
                  aria-invalid={!!err[field]}
                />
                {err[field] && <p className="hint" style={{ color: '#b91c1c' }}>{err[field]}</p>}
              </div>
            ))}
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="label mb-2">Capacity</legend>
            <div>
              <label className="label" htmlFor="approved_capacity_mt">Approved capacity (MT)</label>
              <input
                id="approved_capacity_mt" name="approved_capacity_mt"
                className="field num" inputMode="decimal"
                defaultValue={initial?.approved_capacity_mt ?? ''} placeholder="0.000"
                aria-invalid={!!err.approved_capacity_mt}
              />
              {err.approved_capacity_mt && (
                <p className="hint" style={{ color: '#b91c1c' }}>{err.approved_capacity_mt}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="operational_capacity_mt">Operational capacity (MT)</label>
              <input
                id="operational_capacity_mt" name="operational_capacity_mt"
                className="field num" inputMode="decimal"
                defaultValue={initial?.operational_capacity_mt ?? ''} placeholder="0.000"
                aria-invalid={!!err.operational_capacity_mt}
              />
              <p className="hint">Cannot exceed approved capacity.</p>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="storage_method">Storage method</label>
              <input id="storage_method" name="storage_method" className="field"
                     defaultValue={initial?.storage_method ?? ''} placeholder="Bag stacking" />
            </div>
            <div>
              <label className="label" htmlFor="commodity_restrictions">Commodity restrictions</label>
              <input id="commodity_restrictions" name="commodity_restrictions" className="field"
                     defaultValue={initial?.commodity_restrictions ?? ''}
                     placeholder="No chemicals" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" name="fumigation_suitable" className="h-5 w-5"
              defaultChecked={initial ? initial.fumigation_suitable : true}
            />
            Suitable for fumigation
          </label>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="responsible_employee">Responsible person</label>
          <input id="responsible_employee" name="responsible_employee" className="field"
                 defaultValue={initial?.responsible_employee ?? ''} placeholder="Ramesh Patil" />
        </div>
        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <input id="notes" name="notes" className="field"
                 defaultValue={initial?.notes ?? ''} />
        </div>
      </div>

      <div className="flex gap-3">
        <Submit editing={!!initial?.id} />
        {onDone && (
          <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
        )}
      </div>
    </form>
  );
}

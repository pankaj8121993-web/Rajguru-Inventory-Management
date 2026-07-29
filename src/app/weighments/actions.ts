'use server';

import { revalidatePath } from 'next/cache';
import { friendlyDbError } from '@/lib/db';
import {
  weighmentInputSchema, createWeighment, updateWeighment,
  setWeighmentStatus, resolveDuplicate,
} from '@/lib/weighment';
import type { WeighmentStatus } from '@/lib/validation/weighment';

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Duplicate candidates found on save — surfaced, never auto-resolved. */
  duplicates?: Array<{ id: string; slip_no: string; match_reason: string }>;
}

function fieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

const text = (f: FormData, k: string) => String(f.get(k) ?? '');

export async function saveWeighmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = weighmentInputSchema.safeParse({
    external_slip_no: text(formData, 'external_slip_no'),
    weighbridge_id: text(formData, 'weighbridge_id'),
    weighment_date: text(formData, 'weighment_date'),
    first_weighment_at: text(formData, 'first_weighment_at'),
    second_weighment_at: text(formData, 'second_weighment_at'),
    vehicle_number: text(formData, 'vehicle_number'),
    trailer_number: text(formData, 'trailer_number'),
    driver_name: text(formData, 'driver_name'),
    transporter_party_id: text(formData, 'transporter_party_id'),
    party_id: text(formData, 'party_id'),
    source_category: text(formData, 'source_category'),
    broker_party_id: text(formData, 'broker_party_id'),
    commodity_id: text(formData, 'commodity_id'),
    variety_id: text(formData, 'variety_id'),
    direction: text(formData, 'direction'),
    gross_weight_kg: text(formData, 'gross_weight_kg'),
    tare_weight_kg: text(formData, 'tare_weight_kg'),
    printed_net_weight_kg: text(formData, 'printed_net_weight_kg'),
    bag_count: text(formData, 'bag_count'),
    invoice_no: text(formData, 'invoice_no'),
    challan_no: text(formData, 'challan_no'),
    gate_entry_no: text(formData, 'gate_entry_no'),
    difference_reason_id: text(formData, 'difference_reason_id'),
    difference_remarks: text(formData, 'difference_remarks'),
    remarks: text(formData, 'remarks'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const id = text(formData, 'id');

  try {
    if (id) {
      await updateWeighment(id, parsed.data);
      revalidatePath('/weighments');
      return { ok: true, message: 'Weighment updated.' };
    }

    const created = await createWeighment(parsed.data);
    revalidatePath('/weighments');
    revalidatePath('/');

    if (created.duplicates.length > 0) {
      return {
        ok: true,
        message: `${created.slipNo} saved as draft. ${created.duplicates.length} possible duplicate${
          created.duplicates.length === 1 ? '' : 's'
        } flagged for review — the slip was not merged or discarded.`,
        duplicates: created.duplicates,
      };
    }

    return { ok: true, message: `${created.slipNo} saved as draft.` };
  } catch (error) {
    const message =
      error instanceof Error && !(error as { code?: string }).code
        ? error.message
        : friendlyDbError(error);
    return { ok: false, message };
  }
}

export async function setStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, 'id');
  const status = text(formData, 'status') as WeighmentStatus;
  if (!id || !status) return { ok: false, message: 'Nothing selected.' };

  try {
    await setWeighmentStatus(id, status);
  } catch (error) {
    const message =
      error instanceof Error && !(error as { code?: string }).code
        ? error.message
        : friendlyDbError(error);
    return { ok: false, message };
  }

  revalidatePath('/weighments');
  return { ok: true, message: `Status set to ${status.replace(/_/g, ' ')}.` };
}

export async function resolveDuplicateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const reviewId = text(formData, 'review_id');
  const outcome = text(formData, 'outcome') as
    | 'reviewed_accepted' | 'confirmed_duplicate' | 'cancelled' | 'linked';
  const remarks = text(formData, 'remarks') || null;

  if (!reviewId || !outcome) return { ok: false, message: 'Nothing selected.' };

  try {
    await resolveDuplicate(reviewId, outcome, remarks);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/weighments');
  return {
    ok: true,
    message: outcome === 'confirmed_duplicate'
      ? 'Confirmed duplicate. The slip was cancelled, not deleted.'
      : 'Duplicate review resolved.',
  };
}

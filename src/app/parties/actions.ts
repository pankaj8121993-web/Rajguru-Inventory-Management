'use server';

import { revalidatePath } from 'next/cache';
import { friendlyDbError } from '@/lib/db';
import {
  partyInputSchema, createParty, updateParty, setPartyActive,
} from '@/lib/parties';

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '');
}

export async function savePartyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = partyInputSchema.safeParse({
    code: text(formData, 'code'),
    legal_name: text(formData, 'legal_name'),
    trade_name: text(formData, 'trade_name'),
    type_ids: formData.getAll('type_ids').map(String).filter(Boolean),
    gstin: text(formData, 'gstin'),
    pan: text(formData, 'pan'),
    address: text(formData, 'address'),
    village: text(formData, 'village'),
    district: text(formData, 'district'),
    state: text(formData, 'state'),
    pincode: text(formData, 'pincode'),
    contact_person: text(formData, 'contact_person'),
    mobile: text(formData, 'mobile'),
    email: text(formData, 'email'),
    bank_name: text(formData, 'bank_name'),
    bank_account_number: text(formData, 'bank_account_number'),
    bank_ifsc: text(formData, 'bank_ifsc'),
    credit_terms_days: text(formData, 'credit_terms_days'),
    storage_agreement_ref: text(formData, 'storage_agreement_ref'),
    broker_party_id: text(formData, 'broker_party_id'),
    notes: text(formData, 'notes'),
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
    if (id) await updateParty(id, parsed.data);
    else await createParty(parsed.data);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/parties');
  revalidatePath('/');
  return { ok: true, message: id ? 'Party updated.' : `${parsed.data.legal_name} created.` };
}

export async function togglePartyActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, 'id');
  const active = formData.get('active') === 'true';
  if (!id) return { ok: false, message: 'No party selected.' };

  try {
    await setPartyActive(id, active);
  } catch (error) {
    const message =
      error instanceof Error && !(error as { code?: string }).code
        ? error.message
        : friendlyDbError(error);
    return { ok: false, message };
  }

  revalidatePath('/parties');
  revalidatePath('/');
  return { ok: true, message: active ? 'Party reactivated.' : 'Party deactivated.' };
}

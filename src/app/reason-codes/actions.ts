'use server';

import { revalidatePath } from 'next/cache';
import { friendlyDbError } from '@/lib/db';
import { reasonCodeInputSchema, createReasonCode, setReasonCodeActive } from '@/lib/parties';

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

const text = (f: FormData, k: string) => String(f.get(k) ?? '');

export async function createReasonCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reasonCodeInputSchema.safeParse({
    category_id: text(formData, 'category_id'),
    code: text(formData, 'code'),
    name: text(formData, 'name'),
    description: text(formData, 'description'),
    requires_evidence: formData.get('requires_evidence') === 'on',
    requires_approval: formData.get('requires_approval') === 'on',
    is_exception: formData.get('is_exception') === 'on',
    sort_order: text(formData, 'sort_order'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    await createReasonCode(parsed.data);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/reason-codes');
  return { ok: true, message: `${parsed.data.name} added.` };
}

export async function toggleReasonCodeActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, 'id');
  const active = formData.get('active') === 'true';
  if (!id) return { ok: false, message: 'No reason code selected.' };

  try {
    await setReasonCodeActive(id, active);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/reason-codes');
  return { ok: true, message: active ? 'Reason code reactivated.' : 'Reason code deactivated.' };
}

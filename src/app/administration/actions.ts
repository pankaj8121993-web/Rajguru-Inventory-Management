'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { friendlyDbError } from '@/lib/db';
import { assignRole, setAssignmentActive } from '@/lib/access';

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const optionalNumber = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: 'Must be a number of zero or more',
  });

const assignSchema = z.object({
  userId: z.string().uuid('Select a user'),
  roleId: z.string().uuid('Select a role'),
  locationNodeId: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable(),
  valueLimit: optionalNumber,
  quantityLimitKg: optionalNumber,
  notes: z.string().trim().transform((v) => (v === '' ? null : v)).nullable(),
});

const text = (f: FormData, k: string) => String(f.get(k) ?? '');

export async function assignRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = assignSchema.safeParse({
    userId: text(formData, 'user_id'),
    roleId: text(formData, 'role_id'),
    locationNodeId: text(formData, 'location_node_id'),
    valueLimit: text(formData, 'value_limit'),
    quantityLimitKg: text(formData, 'quantity_limit_kg'),
    notes: text(formData, 'notes'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Please correct the highlighted fields.', fieldErrors };
  }

  try {
    await assignRole(parsed.data);
  } catch (error) {
    const e = error as { code?: string };
    if (e?.code === '23505') {
      return { ok: false, message: 'That user already holds that role at that scope.' };
    }
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/administration');
  return { ok: true, message: 'Role assigned.' };
}

export async function toggleAssignmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, 'id');
  const active = formData.get('active') === 'true';
  if (!id) return { ok: false, message: 'Nothing selected.' };

  try {
    await setAssignmentActive(id, active);
  } catch (error) {
    const message =
      error instanceof Error && !(error as { code?: string }).code
        ? error.message
        : friendlyDbError(error);
    return { ok: false, message };
  }

  revalidatePath('/administration');
  return { ok: true, message: active ? 'Assignment reactivated.' : 'Assignment removed.' };
}

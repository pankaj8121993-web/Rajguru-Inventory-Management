'use server';

import { revalidatePath } from 'next/cache';
import { friendlyDbError } from '@/lib/db';
import {
  locationInputSchema,
  createLocation,
  updateLocation,
  setLocationActive,
} from '@/lib/locations';

/**
 * Server actions for locations.
 *
 * ADR-0004: writes happen server-side only. Zod validates at this boundary;
 * client validation is convenience only and is never trusted.
 */

export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return locationInputSchema.safeParse({
    parent_id: String(formData.get('parent_id') ?? ''),
    node_type: String(formData.get('node_type') ?? ''),
    code: String(formData.get('code') ?? ''),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    plot_number: String(formData.get('plot_number') ?? ''),
    survey_number: String(formData.get('survey_number') ?? ''),
    length_m: String(formData.get('length_m') ?? ''),
    width_m: String(formData.get('width_m') ?? ''),
    height_m: String(formData.get('height_m') ?? ''),
    area_sqm: String(formData.get('area_sqm') ?? ''),
    approved_capacity_mt: String(formData.get('approved_capacity_mt') ?? ''),
    operational_capacity_mt: String(formData.get('operational_capacity_mt') ?? ''),
    storage_method: String(formData.get('storage_method') ?? ''),
    fumigation_suitable: formData.get('fumigation_suitable') === 'on',
    commodity_restrictions: String(formData.get('commodity_restrictions') ?? ''),
    responsible_employee: String(formData.get('responsible_employee') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  });
}

function fieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function saveLocationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const id = String(formData.get('id') ?? '');

  try {
    if (id) {
      await updateLocation(id, parsed.data);
    } else {
      await createLocation(parsed.data);
    }
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/locations');
  revalidatePath('/');
  return {
    ok: true,
    message: id ? 'Location updated.' : `${parsed.data.name} created.`,
  };
}

export async function toggleLocationActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';

  if (!id) return { ok: false, message: 'No location selected.' };

  try {
    await setLocationActive(id, active);
  } catch (error) {
    const message =
      error instanceof Error && !(error as { code?: string }).code
        ? error.message
        : friendlyDbError(error);
    return { ok: false, message };
  }

  revalidatePath('/locations');
  revalidatePath('/');
  return { ok: true, message: active ? 'Location reactivated.' : 'Location deactivated.' };
}

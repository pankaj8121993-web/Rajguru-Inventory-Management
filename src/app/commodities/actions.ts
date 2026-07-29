'use server';

import { revalidatePath } from 'next/cache';
import { friendlyDbError } from '@/lib/db';
import {
  commodityInputSchema,
  varietyInputSchema,
  gradeInputSchema,
  createCommodity,
  updateCommodity,
  setCommodityActive,
  createVariety,
  createGrade,
} from '@/lib/commodities';

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

export async function saveCommodityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = commodityInputSchema.safeParse({
    code: String(formData.get('code') ?? ''),
    name: String(formData.get('name') ?? ''),
    commodity_group_id: String(formData.get('commodity_group_id') ?? ''),
    description: String(formData.get('description') ?? ''),
    standard_unit_id: String(formData.get('standard_unit_id') ?? ''),
    standard_bag_type_id: String(formData.get('standard_bag_type_id') ?? ''),
    standard_moisture_pct: String(formData.get('standard_moisture_pct') ?? ''),
    shelf_life_days: String(formData.get('shelf_life_days') ?? ''),
    fumigation_interval_days: String(formData.get('fumigation_interval_days') ?? ''),
    storage_restrictions: String(formData.get('storage_restrictions') ?? ''),
    insurance_category: String(formData.get('insurance_category') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please correct the highlighted fields.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const id = String(formData.get('id') ?? '');

  try {
    if (id) await updateCommodity(id, parsed.data);
    else await createCommodity(parsed.data);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/commodities');
  revalidatePath('/');
  return { ok: true, message: id ? 'Commodity updated.' : `${parsed.data.name} created.` };
}

export async function toggleCommodityActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';
  if (!id) return { ok: false, message: 'No commodity selected.' };

  try {
    await setCommodityActive(id, active);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/commodities');
  revalidatePath('/');
  return { ok: true, message: active ? 'Commodity reactivated.' : 'Commodity deactivated.' };
}

export async function createVarietyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = varietyInputSchema.safeParse({
    commodity_id: String(formData.get('commodity_id') ?? ''),
    code: String(formData.get('code') ?? ''),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
  });

  if (!parsed.success) {
    return { ok: false, message: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error) };
  }

  try {
    await createVariety(parsed.data);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/commodities');
  return { ok: true, message: `Variety ${parsed.data.name} added.` };
}

export async function createGradeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = gradeInputSchema.safeParse({
    commodity_id: String(formData.get('commodity_id') ?? ''),
    variety_id: String(formData.get('variety_id') ?? ''),
    code: String(formData.get('code') ?? ''),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    sort_order: String(formData.get('sort_order') ?? ''),
  });

  if (!parsed.success) {
    return { ok: false, message: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error) };
  }

  try {
    await createGrade(parsed.data);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/commodities');
  return { ok: true, message: `Grade ${parsed.data.name} added.` };
}

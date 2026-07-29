'use server';

import { revalidatePath } from 'next/cache';
import { friendlyDbError } from '@/lib/db';
import {
  vehicleInputSchema, createVehicle, updateVehicle, setVehicleActive,
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

const text = (f: FormData, k: string) => String(f.get(k) ?? '');

export async function saveVehicleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = vehicleInputSchema.safeParse({
    registration_number: text(formData, 'registration_number'),
    vehicle_type: text(formData, 'vehicle_type'),
    transporter_party_id: text(formData, 'transporter_party_id'),
    capacity_mt: text(formData, 'capacity_mt'),
    trailer_number: text(formData, 'trailer_number'),
    insurance_valid_to: text(formData, 'insurance_valid_to'),
    pollution_valid_to: text(formData, 'pollution_valid_to'),
    fitness_valid_to: text(formData, 'fitness_valid_to'),
    permit_valid_to: text(formData, 'permit_valid_to'),
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
    if (id) await updateVehicle(id, parsed.data);
    else await createVehicle(parsed.data);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/vehicles');
  revalidatePath('/');
  return {
    ok: true,
    message: id ? 'Vehicle updated.' : `${parsed.data.registration_number} added.`,
  };
}

export async function toggleVehicleActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = text(formData, 'id');
  const active = formData.get('active') === 'true';
  if (!id) return { ok: false, message: 'No vehicle selected.' };

  try {
    await setVehicleActive(id, active);
  } catch (error) {
    return { ok: false, message: friendlyDbError(error) };
  }

  revalidatePath('/vehicles');
  return { ok: true, message: active ? 'Vehicle reactivated.' : 'Vehicle deactivated.' };
}

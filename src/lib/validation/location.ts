/**
 * Location input validation.
 *
 * Deliberately NOT `server-only`: these schemas are the single definition of
 * what a valid location is, shared by the server action, tests and (where
 * useful) the client. Server-side validation remains the authoritative one.
 */

import { z } from 'zod';
import { NODE_TYPES } from '../location-types';

/** Empty string from an HTML form means "not provided", not zero. */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

const optionalNumeric = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: 'Must be a number of zero or more',
  });

export const locationInputSchema = z.object({
  parent_id: z.string().uuid().nullable().or(z.literal('').transform(() => null)),
  node_type: z.enum(NODE_TYPES),
  code: z.string().trim().min(1, 'Code is required').max(40, 'Code is too long'),
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  description: optionalText,
  plot_number: optionalText,
  survey_number: optionalText,
  length_m: optionalNumeric,
  width_m: optionalNumeric,
  height_m: optionalNumeric,
  area_sqm: optionalNumeric,
  approved_capacity_mt: optionalNumeric,
  operational_capacity_mt: optionalNumeric,
  storage_method: optionalText,
  fumigation_suitable: z.boolean(),
  commodity_restrictions: optionalText,
  responsible_employee: optionalText,
  notes: optionalText,
});

export type LocationInput = z.infer<typeof locationInputSchema>;

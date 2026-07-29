/**
 * Commodity, variety and grade input validation.
 *
 * Not `server-only` — shared by the server actions and the unit tests.
 */

import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: 'Invalid selection',
  });

const optionalPositiveInt = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || (Number.isInteger(Number(v)) && Number(v) > 0), {
    message: 'Must be a whole number greater than zero',
  });

export const commodityInputSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(40, 'Code is too long'),
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  commodity_group_id: optionalUuid,
  description: optionalText,
  standard_unit_id: optionalUuid,
  standard_bag_type_id: optionalUuid,
  standard_moisture_pct: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine(
      (v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      { message: 'Moisture must be between 0 and 100' },
    ),
  shelf_life_days: optionalPositiveInt,
  fumigation_interval_days: optionalPositiveInt,
  storage_restrictions: optionalText,
  insurance_category: optionalText,
  notes: optionalText,
});

export type CommodityInput = z.infer<typeof commodityInputSchema>;

export const varietyInputSchema = z.object({
  commodity_id: z.string().uuid(),
  code: z.string().trim().min(1, 'Code is required').max(40),
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: optionalText,
});

export type VarietyInput = z.infer<typeof varietyInputSchema>;

export const gradeInputSchema = z.object({
  commodity_id: z.string().uuid(),
  variety_id: optionalUuid,
  code: z.string().trim().min(1, 'Code is required').max(40),
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: optionalText,
  sort_order: z
    .string()
    .trim()
    .transform((v) => (v === '' ? '0' : v))
    .refine((v) => Number.isInteger(Number(v)), { message: 'Must be a whole number' }),
});

export type GradeInput = z.infer<typeof gradeInputSchema>;

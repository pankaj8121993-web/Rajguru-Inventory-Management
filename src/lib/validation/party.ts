/**
 * Party, vehicle and reason-code input validation.
 *
 * Not `server-only` — shared by the server actions and the unit tests.
 *
 * Statutory identifiers are format-checked but never mandatory. A farmer
 * selling at the mandi gate often has neither a GSTIN nor a PAN, and refusing
 * to record them would be exactly the false precision the product forbids
 * (blueprint §2.4).
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

/** Uppercases and strips spaces before checking — operators type either way. */
function normalisedPattern(pattern: RegExp, message: string) {
  return z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v.toUpperCase().replace(/\s+/g, '')))
    .nullable()
    .refine((v) => v === null || pattern.test(v), { message });
}

export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const MOBILE_PATTERN = /^[6-9][0-9]{9}$/;
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
export const VEHICLE_PATTERN = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

const optionalMobile = z
  .string()
  .trim()
  .transform((v) => {
    if (v === '') return null;
    // Accept +91, 0 prefixes and separators; store the bare 10 digits.
    const digits = v.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
    return digits;
  })
  .nullable()
  .refine((v) => v === null || MOBILE_PATTERN.test(v), {
    message: 'Enter a 10-digit Indian mobile number',
  });

export const partyInputSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(40, 'Code is too long'),
  legal_name: z.string().trim().min(1, 'Legal name is required').max(200),
  trade_name: optionalText,
  type_ids: z
    .array(z.string().uuid())
    .min(1, 'Select at least one party type'),
  gstin: normalisedPattern(GSTIN_PATTERN, 'GSTIN must be 15 characters, e.g. 27AABCK1234M1Z5'),
  pan: normalisedPattern(PAN_PATTERN, 'PAN must be 10 characters, e.g. AABCK1234M'),
  address: optionalText,
  village: optionalText,
  district: optionalText,
  state: optionalText,
  pincode: normalisedPattern(PINCODE_PATTERN, 'Pincode must be 6 digits'),
  contact_person: optionalText,
  mobile: optionalMobile,
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
      message: 'Enter a valid email address',
    }),
  bank_name: optionalText,
  bank_account_number: optionalText,
  bank_ifsc: normalisedPattern(IFSC_PATTERN, 'IFSC must be 11 characters, e.g. SBIN0001234'),
  credit_terms_days: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => v === null || (Number.isInteger(Number(v)) && Number(v) >= 0), {
      message: 'Credit terms must be a whole number of days',
    }),
  storage_agreement_ref: optionalText,
  broker_party_id: optionalUuid,
  notes: optionalText,
});

export type PartyInput = z.infer<typeof partyInputSchema>;

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), { message: 'Invalid date' });

export const vehicleInputSchema = z.object({
  registration_number: z
    .string()
    .trim()
    .min(1, 'Registration number is required')
    .transform((v) => v.toUpperCase().replace(/[\s-]/g, ''))
    .refine((v) => VEHICLE_PATTERN.test(v), {
      message: 'Enter a valid registration, e.g. MH24AB1234',
    }),
  vehicle_type: optionalText,
  transporter_party_id: optionalUuid,
  capacity_mt: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: 'Capacity must be a number of zero or more',
    }),
  trailer_number: optionalText,
  insurance_valid_to: optionalDate,
  pollution_valid_to: optionalDate,
  fitness_valid_to: optionalDate,
  permit_valid_to: optionalDate,
  notes: optionalText,
});

export type VehicleInput = z.infer<typeof vehicleInputSchema>;

export const reasonCodeInputSchema = z.object({
  category_id: z.string().uuid('Select a category'),
  code: z.string().trim().min(1, 'Code is required').max(40),
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: optionalText,
  requires_evidence: z.boolean(),
  requires_approval: z.boolean(),
  is_exception: z.boolean(),
  sort_order: z
    .string()
    .trim()
    .transform((v) => (v === '' ? '0' : v))
    .refine((v) => Number.isInteger(Number(v)), { message: 'Must be a whole number' }),
});

export type ReasonCodeInput = z.infer<typeof reasonCodeInputSchema>;

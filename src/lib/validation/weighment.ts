/**
 * Weighment slip input validation.
 *
 * Not `server-only` — shared by the server action and the unit tests.
 *
 * The user never supplies a net weight: it is a generated column in the
 * database (DR-01). The form collects gross, tare and the net *printed on the
 * slip*, and the system computes and compares (DR-02).
 */

import { z } from 'zod';

export const MOVEMENT_DIRECTIONS = ['inward', 'outward'] as const;
export type MovementDirection = (typeof MOVEMENT_DIRECTIONS)[number];

export const SOURCE_CATEGORIES = [
  'farmer', 'trader', 'broker', 'auction', 'government',
  'storage_customer', 'processor', 'transfer', 'processing_return', 'other',
] as const;
export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

export const SOURCE_CATEGORY_LABELS: Record<SourceCategory, string> = {
  farmer: 'Farmer',
  trader: 'Trader',
  broker: 'Broker',
  auction: 'Auction',
  government: 'Government',
  storage_customer: 'Storage customer',
  processor: 'Processor',
  transfer: 'Internal transfer',
  processing_return: 'Processing return',
  other: 'Other',
};

export const WEIGHMENT_STATUSES = [
  'draft', 'awaiting_document', 'awaiting_verification', 'verified',
  'partially_allocated', 'fully_allocated', 'posted',
  'disputed', 'reversed', 'cancelled',
] as const;
export type WeighmentStatus = (typeof WEIGHMENT_STATUSES)[number];

export const WEIGHMENT_STATUS_LABELS: Record<WeighmentStatus, string> = {
  draft: 'Draft',
  awaiting_document: 'Awaiting document',
  awaiting_verification: 'Awaiting verification',
  verified: 'Verified',
  partially_allocated: 'Partially allocated',
  fully_allocated: 'Fully allocated',
  posted: 'Posted',
  disputed: 'Disputed',
  reversed: 'Reversed',
  cancelled: 'Cancelled',
};

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

/** A weight in kilograms. Kept as a string so it never touches float maths. */
function weight(message: string, { required }: { required: boolean }) {
  return z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => (required ? v !== null : true), { message })
    .refine((v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: 'Must be a weight of zero or more',
    })
    .refine((v) => v === null || /^\d+(\.\d{1,3})?$/.test(v), {
      message: 'Up to three decimal places',
    });
}

export const weighmentInputSchema = z
  .object({
    external_slip_no: optionalText,
    weighbridge_id: optionalUuid,
    weighment_date: z
      .string()
      .trim()
      .min(1, 'Date is required')
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' }),
    first_weighment_at: optionalText,
    second_weighment_at: optionalText,

    // Typed, not chosen from a master. A truck nobody has seen before arrives
    // at the gate every day and must be recordable immediately, so this is
    // deliberately permissive about format.
    vehicle_number: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : v.toUpperCase().replace(/[\s-]/g, '')))
      .nullable()
      .refine((v) => v === null || (v.length >= 4 && v.length <= 20), {
        message: 'Enter a vehicle number between 4 and 20 characters',
      }),
    trailer_number: optionalText,
    driver_name: optionalText,
    transporter_party_id: optionalUuid,

    party_id: optionalUuid,
    source_category: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .refine((v) => v === null || (SOURCE_CATEGORIES as readonly string[]).includes(v), {
        message: 'Invalid source',
      }),
    broker_party_id: optionalUuid,

    commodity_id: optionalUuid,
    variety_id: optionalUuid,

    direction: z.enum(MOVEMENT_DIRECTIONS),

    gross_weight_kg: weight('Gross weight is required', { required: true }),
    tare_weight_kg: weight('Tare weight is required', { required: true }),
    printed_net_weight_kg: weight('', { required: false }),

    bag_count: z
      .string()
      .trim()
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .refine((v) => v === null || (Number.isInteger(Number(v)) && Number(v) >= 0), {
        message: 'Bag count must be a whole number',
      }),

    invoice_no: optionalText,
    challan_no: optionalText,
    gate_entry_no: optionalText,

    difference_reason_id: optionalUuid,
    difference_remarks: optionalText,
    remarks: optionalText,
  })
  // A gross at or below tare is a transcription error, not a weighment.
  .refine(
    (v) =>
      v.gross_weight_kg === null ||
      v.tare_weight_kg === null ||
      Number(v.gross_weight_kg) > Number(v.tare_weight_kg),
    { message: 'Gross weight must be greater than tare weight', path: ['gross_weight_kg'] },
  );

export type WeighmentInput = z.infer<typeof weighmentInputSchema>;

/**
 * Net weight difference between what the system calculates and what the slip
 * says (DR-02).
 *
 * Returns strings, not numbers — the caller decides how to display them, and
 * nothing here rounds a weight through a float.
 */
export function netDifference(
  grossKg: string | null,
  tareKg: string | null,
  printedNetKg: string | null,
): { calculated: string | null; difference: string | null; percent: string | null } {
  if (grossKg === null || tareKg === null) {
    return { calculated: null, difference: null, percent: null };
  }

  // Work in integer grams so the arithmetic is exact at the stored precision.
  const toGrams = (v: string) => Math.round(Number(v) * 1000);
  const calculatedGrams = toGrams(grossKg) - toGrams(tareKg);
  const calculated = (calculatedGrams / 1000).toFixed(3);

  if (printedNetKg === null) return { calculated, difference: null, percent: null };

  const differenceGrams = calculatedGrams - toGrams(printedNetKg);
  const difference = (differenceGrams / 1000).toFixed(3);
  const percent =
    calculatedGrams === 0
      ? '0.000'
      : ((Math.abs(differenceGrams) / calculatedGrams) * 100).toFixed(3);

  return { calculated, difference, percent };
}

/** Whether a difference needs a reason, or approval, given the tolerances. */
export function differenceSeverity(
  percent: string | null,
  tolerancePct: number,
  escalationPct: number,
): 'none' | 'within_tolerance' | 'needs_reason' | 'needs_approval' {
  if (percent === null) return 'none';
  const p = Number(percent);
  if (p === 0) return 'none';
  if (p <= tolerancePct) return 'within_tolerance';
  if (p <= escalationPct) return 'needs_reason';
  return 'needs_approval';
}

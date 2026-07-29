import { describe, it, expect } from 'vitest';
import {
  partyInputSchema,
  vehicleInputSchema,
  reasonCodeInputSchema,
} from '../validation/party';

/**
 * Party, vehicle and reason-code validation.
 *
 * The recurring theme: statutory identifiers are format-checked when supplied
 * and simply absent when they are not. A farmer at the mandi gate often has
 * neither a GSTIN nor a PAN, and refusing the record would be the false
 * precision the product exists to avoid (blueprint §2.4).
 */

const TYPE_ID = '11111111-1111-4111-8111-111111111111';

const baseParty = {
  code: 'P0100',
  legal_name: 'Shree Ganesh Traders',
  trade_name: '',
  type_ids: [TYPE_ID],
  gstin: '',
  pan: '',
  address: '',
  village: '',
  district: '',
  state: '',
  pincode: '',
  contact_person: '',
  mobile: '',
  email: '',
  bank_name: '',
  bank_account_number: '',
  bank_ifsc: '',
  credit_terms_days: '',
  storage_agreement_ref: '',
  broker_party_id: '',
  notes: '',
};

describe('party input', () => {
  it('accepts a farmer with no GSTIN, PAN or bank details', () => {
    const result = partyInputSchema.safeParse({
      ...baseParty,
      code: 'P0101',
      legal_name: 'Sanjay Bhaurao Patil',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gstin).toBeNull();
      expect(result.data.pan).toBeNull();
    }
  });

  it('requires at least one party type', () => {
    const result = partyInputSchema.safeParse({ ...baseParty, type_ids: [] });
    expect(result.success).toBe(false);
  });

  it('accepts several party types — a trader may also store stock', () => {
    const second = '22222222-2222-4222-8222-222222222222';
    const result = partyInputSchema.parse({ ...baseParty, type_ids: [TYPE_ID, second] });
    expect(result.type_ids).toHaveLength(2);
  });

  it('accepts a valid GSTIN and uppercases it', () => {
    const result = partyInputSchema.parse({ ...baseParty, gstin: '27aabck1234m1z5' });
    expect(result.gstin).toBe('27AABCK1234M1Z5');
  });

  it('rejects a malformed GSTIN', () => {
    for (const bad of ['27AABCK1234M1Z', 'AABCK1234M1Z5', '27AABCK1234M1X5', '123']) {
      expect(partyInputSchema.safeParse({ ...baseParty, gstin: bad }).success).toBe(false);
    }
  });

  it('accepts a valid PAN and rejects a malformed one', () => {
    expect(partyInputSchema.parse({ ...baseParty, pan: 'aabck1234m' }).pan).toBe('AABCK1234M');
    expect(partyInputSchema.safeParse({ ...baseParty, pan: 'AABCK1234' }).success).toBe(false);
  });

  it('normalises a mobile number written with +91, spaces or a leading zero', () => {
    for (const input of ['+91 98220 11001', '098220-11001', '9822011001', '91 9822011001']) {
      const result = partyInputSchema.parse({ ...baseParty, mobile: input });
      expect(result.mobile).toBe('9822011001');
    }
  });

  it('rejects a mobile number that is not a 10-digit Indian number', () => {
    for (const bad of ['12345', '1234567890', '5822011001']) {
      expect(partyInputSchema.safeParse({ ...baseParty, mobile: bad }).success).toBe(false);
    }
  });

  it('validates IFSC format', () => {
    expect(partyInputSchema.parse({ ...baseParty, bank_ifsc: 'sbin0001234' }).bank_ifsc)
      .toBe('SBIN0001234');
    expect(partyInputSchema.safeParse({ ...baseParty, bank_ifsc: 'SBIN1001234' }).success)
      .toBe(false);
  });

  it('validates pincode', () => {
    expect(partyInputSchema.safeParse({ ...baseParty, pincode: '413512' }).success).toBe(true);
    expect(partyInputSchema.safeParse({ ...baseParty, pincode: '013512' }).success).toBe(false);
  });

  it('rejects negative credit terms', () => {
    expect(partyInputSchema.safeParse({ ...baseParty, credit_terms_days: '-5' }).success)
      .toBe(false);
  });

  it('leaves unstated credit terms null, not zero', () => {
    // "No credit terms agreed" and "zero days credit" are different facts.
    expect(partyInputSchema.parse(baseParty).credit_terms_days).toBeNull();
  });
});

const baseVehicle = {
  registration_number: 'MH24AB1234',
  vehicle_type: '',
  transporter_party_id: '',
  capacity_mt: '',
  trailer_number: '',
  insurance_valid_to: '',
  pollution_valid_to: '',
  fitness_valid_to: '',
  permit_valid_to: '',
  notes: '',
};

describe('vehicle input', () => {
  it('normalises a registration written with spaces or dashes', () => {
    for (const input of ['MH 24 AB 1234', 'mh-24-ab-1234', 'mh24ab1234']) {
      expect(vehicleInputSchema.parse({ ...baseVehicle, registration_number: input })
        .registration_number).toBe('MH24AB1234');
    }
  });

  it('accepts the shorter district-code format', () => {
    expect(vehicleInputSchema.safeParse({ ...baseVehicle, registration_number: 'MH1AB1234' })
      .success).toBe(true);
  });

  it('rejects a malformed registration', () => {
    for (const bad of ['1234', 'MHABCD', 'M24AB1234', 'MH24AB12']) {
      expect(vehicleInputSchema.safeParse({ ...baseVehicle, registration_number: bad })
        .success).toBe(false);
    }
  });

  it('accepts a vehicle with no documents recorded', () => {
    const result = vehicleInputSchema.parse(baseVehicle);
    expect(result.insurance_valid_to).toBeNull();
    expect(result.capacity_mt).toBeNull();
  });

  it('accepts an already-expired document date', () => {
    // Expiry is a warning, never a block — a vehicle at the gate with a lapsed
    // certificate must still be recordable.
    const result = vehicleInputSchema.safeParse({
      ...baseVehicle,
      insurance_valid_to: '2020-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative capacity', () => {
    expect(vehicleInputSchema.safeParse({ ...baseVehicle, capacity_mt: '-1' }).success)
      .toBe(false);
  });
});

describe('reason code input', () => {
  const base = {
    category_id: TYPE_ID,
    code: 'FORKLIFT',
    name: 'Forklift damage',
    description: '',
    requires_evidence: true,
    requires_approval: true,
    is_exception: false,
    sort_order: '',
  };

  it('accepts a complete reason code', () => {
    expect(reasonCodeInputSchema.safeParse(base).success).toBe(true);
  });

  it('defaults a blank sort order to zero', () => {
    expect(reasonCodeInputSchema.parse(base).sort_order).toBe('0');
  });

  it('requires a category', () => {
    expect(reasonCodeInputSchema.safeParse({ ...base, category_id: '' }).success).toBe(false);
  });

  it('requires a code and a name', () => {
    expect(reasonCodeInputSchema.safeParse({ ...base, code: '  ' }).success).toBe(false);
    expect(reasonCodeInputSchema.safeParse({ ...base, name: '' }).success).toBe(false);
  });
});

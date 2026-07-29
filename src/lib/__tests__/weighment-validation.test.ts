import { describe, it, expect } from 'vitest';
import {
  weighmentInputSchema, netDifference, differenceSeverity,
} from '../validation/weighment';

/**
 * Weighment validation and net-weight arithmetic.
 *
 * The central rule: the operator supplies gross, tare and the net printed on
 * the slip. The system computes the net and the difference (DR-01, DR-02) and
 * never rounds a weight through a float (NFR-01).
 */

const base = {
  external_slip_no: '',
  weighbridge_id: '',
  weighment_date: '2026-07-29',
  first_weighment_at: '',
  second_weighment_at: '',
  vehicle_id: '',
  trailer_number: '',
  driver_id: '',
  transporter_party_id: '',
  party_id: '',
  source_category: '',
  broker_party_id: '',
  commodity_id: '',
  variety_id: '',
  direction: 'inward',
  gross_weight_kg: '24500.000',
  tare_weight_kg: '9800.000',
  printed_net_weight_kg: '',
  bag_count: '',
  invoice_no: '',
  challan_no: '',
  gate_entry_no: '',
  difference_reason_id: '',
  difference_remarks: '',
  remarks: '',
};

describe('weighment input', () => {
  it('accepts a minimal inward slip', () => {
    expect(weighmentInputSchema.safeParse(base).success).toBe(true);
  });

  it('accepts a slip with no commodity — it may be identified later', () => {
    // Blueprint §2.4: never force the operator to invent what is not yet known.
    const result = weighmentInputSchema.parse(base);
    expect(result.commodity_id).toBeNull();
    expect(result.variety_id).toBeNull();
  });

  it('rejects a gross weight at or below tare', () => {
    for (const gross of ['9800.000', '5000.000']) {
      expect(weighmentInputSchema.safeParse({ ...base, gross_weight_kg: gross }).success)
        .toBe(false);
    }
  });

  it('requires gross and tare', () => {
    expect(weighmentInputSchema.safeParse({ ...base, gross_weight_kg: '' }).success).toBe(false);
    expect(weighmentInputSchema.safeParse({ ...base, tare_weight_kg: '' }).success).toBe(false);
  });

  it('rejects more than three decimal places on a weight', () => {
    expect(weighmentInputSchema.safeParse({ ...base, gross_weight_kg: '24500.0001' }).success)
      .toBe(false);
  });

  it('keeps weights as exact strings, never numbers', () => {
    const result = weighmentInputSchema.parse({ ...base, gross_weight_kg: '24500.125' });
    expect(result.gross_weight_kg).toBe('24500.125');
    expect(typeof result.gross_weight_kg).toBe('string');
  });

  it('rejects a fractional bag count', () => {
    expect(weighmentInputSchema.safeParse({ ...base, bag_count: '294.5' }).success).toBe(false);
  });

  it('rejects an invalid direction', () => {
    expect(weighmentInputSchema.safeParse({ ...base, direction: 'sideways' }).success)
      .toBe(false);
  });
});

describe('net weight arithmetic', () => {
  it('computes net as gross minus tare', () => {
    expect(netDifference('24500.000', '9800.000', null).calculated).toBe('14700.000');
  });

  it('is exact where floating point would drift', () => {
    // 0.1 + 0.2 !== 0.3 in binary floating point. Weights must not be subject
    // to that, so the arithmetic runs in integer grams (NFR-01).
    expect(netDifference('10.300', '10.100', null).calculated).toBe('0.200');
    expect(netDifference('1000.100', '1000.000', null).calculated).toBe('0.100');
    expect(netDifference('0.300', '0.100', null).calculated).toBe('0.200');
  });

  it('reports the difference against the printed net', () => {
    const r = netDifference('24500.000', '9800.000', '14680.000');
    expect(r.calculated).toBe('14700.000');
    expect(r.difference).toBe('20.000');
  });

  it('reports a negative difference when the slip reads higher', () => {
    expect(netDifference('24500.000', '9800.000', '14720.000').difference).toBe('-20.000');
  });

  it('gives no difference when no printed net was supplied', () => {
    const r = netDifference('24500.000', '9800.000', null);
    expect(r.difference).toBeNull();
    expect(r.percent).toBeNull();
  });

  it('computes the difference as a percentage of the calculated net', () => {
    const r = netDifference('24500.000', '9800.000', '14553.000');
    expect(r.difference).toBe('147.000');
    expect(Number(r.percent)).toBeCloseTo(1.0, 3);
  });
});

describe('difference severity', () => {
  const tolerance = 0.5;
  const escalation = 2.0;

  it('treats an exact match as no difference', () => {
    expect(differenceSeverity('0.000', tolerance, escalation)).toBe('none');
  });

  it('passes a difference within tolerance', () => {
    expect(differenceSeverity('0.300', tolerance, escalation)).toBe('within_tolerance');
    expect(differenceSeverity('0.500', tolerance, escalation)).toBe('within_tolerance');
  });

  it('requires a reason beyond tolerance', () => {
    expect(differenceSeverity('1.000', tolerance, escalation)).toBe('needs_reason');
    expect(differenceSeverity('2.000', tolerance, escalation)).toBe('needs_reason');
  });

  it('requires approval beyond the escalation threshold', () => {
    expect(differenceSeverity('2.001', tolerance, escalation)).toBe('needs_approval');
    expect(differenceSeverity('10.000', tolerance, escalation)).toBe('needs_approval');
  });
});

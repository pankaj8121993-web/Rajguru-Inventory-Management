import { describe, it, expect } from 'vitest';
import { locationInputSchema } from '../validation/location';
import { commodityInputSchema, gradeInputSchema } from '../validation/commodity';

/**
 * Validation unit tests.
 *
 * These cover the rules the database cannot express as constraints, and the
 * form-to-domain conversion where an empty field must mean "not provided"
 * rather than zero — a distinction the whole "no false accuracy" principle
 * depends on (blueprint 2.4).
 */

const baseLocation = {
  parent_id: '',
  node_type: 'godown',
  code: 'ALY-G9',
  name: 'Godown 9',
  description: '',
  plot_number: '',
  survey_number: '',
  length_m: '',
  width_m: '',
  height_m: '',
  area_sqm: '',
  approved_capacity_mt: '',
  operational_capacity_mt: '',
  storage_method: '',
  fumigation_suitable: true,
  commodity_restrictions: '',
  responsible_employee: '',
  notes: '',
};

describe('location input', () => {
  it('accepts a minimal godown', () => {
    const result = locationInputSchema.safeParse(baseLocation);
    expect(result.success).toBe(true);
  });

  it('treats an empty capacity as not provided, never as zero', () => {
    const result = locationInputSchema.parse(baseLocation);
    // A blank capacity must be null. Coercing it to 0 would assert the godown
    // holds nothing, which is a different and false claim.
    expect(result.approved_capacity_mt).toBeNull();
    expect(result.length_m).toBeNull();
  });

  it('keeps a supplied capacity as an exact decimal string', () => {
    const result = locationInputSchema.parse({
      ...baseLocation,
      approved_capacity_mt: '2400.125',
    });
    // NFR-01: quantities never pass through JavaScript number arithmetic.
    expect(result.approved_capacity_mt).toBe('2400.125');
    expect(typeof result.approved_capacity_mt).toBe('string');
  });

  it('rejects a negative capacity', () => {
    const result = locationInputSchema.safeParse({
      ...baseLocation,
      approved_capacity_mt: '-1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a blank code', () => {
    expect(locationInputSchema.safeParse({ ...baseLocation, code: '   ' }).success).toBe(false);
  });

  it('rejects an unknown node type', () => {
    expect(
      locationInputSchema.safeParse({ ...baseLocation, node_type: 'silo' }).success,
    ).toBe(false);
  });

  it('converts an empty parent to null so a top-level node is possible', () => {
    const result = locationInputSchema.parse({ ...baseLocation, node_type: 'facility' });
    expect(result.parent_id).toBeNull();
  });

  it('trims whitespace from code and name', () => {
    const result = locationInputSchema.parse({
      ...baseLocation,
      code: '  ALY-G9  ',
      name: '  Godown 9  ',
    });
    expect(result.code).toBe('ALY-G9');
    expect(result.name).toBe('Godown 9');
  });
});

const baseCommodity = {
  code: 'SOYA',
  name: 'Soyabean',
  commodity_group_id: '',
  description: '',
  standard_unit_id: '',
  standard_bag_type_id: '',
  standard_moisture_pct: '',
  shelf_life_days: '',
  fumigation_interval_days: '',
  storage_restrictions: '',
  insurance_category: '',
  notes: '',
};

describe('commodity input', () => {
  it('accepts a minimal commodity', () => {
    expect(commodityInputSchema.safeParse(baseCommodity).success).toBe(true);
  });

  it('rejects moisture above 100 percent', () => {
    const result = commodityInputSchema.safeParse({
      ...baseCommodity,
      standard_moisture_pct: '150',
    });
    expect(result.success).toBe(false);
  });

  it('accepts moisture at the boundaries', () => {
    for (const value of ['0', '100']) {
      expect(
        commodityInputSchema.safeParse({ ...baseCommodity, standard_moisture_pct: value }).success,
      ).toBe(true);
    }
  });

  it('rejects a zero or fractional fumigation interval', () => {
    for (const value of ['0', '-5', '1.5']) {
      expect(
        commodityInputSchema.safeParse({ ...baseCommodity, fumigation_interval_days: value })
          .success,
      ).toBe(false);
    }
  });

  it('leaves an unstated moisture as null rather than zero', () => {
    const result = commodityInputSchema.parse(baseCommodity);
    // "Moisture not measured" and "moisture is 0%" are different facts.
    expect(result.standard_moisture_pct).toBeNull();
  });

  it('rejects a malformed group id', () => {
    expect(
      commodityInputSchema.safeParse({ ...baseCommodity, commodity_group_id: 'not-a-uuid' })
        .success,
    ).toBe(false);
  });
});

describe('grade input', () => {
  const commodityId = '11111111-1111-4111-8111-111111111111';

  it('defaults a blank sort order to zero', () => {
    const result = gradeInputSchema.parse({
      commodity_id: commodityId,
      variety_id: '',
      code: 'FAQ',
      name: 'Fair Average Quality',
      description: '',
      sort_order: '',
    });
    expect(result.sort_order).toBe('0');
    expect(result.variety_id).toBeNull();
  });

  it('rejects a non-integer sort order', () => {
    const result = gradeInputSchema.safeParse({
      commodity_id: commodityId,
      variety_id: '',
      code: 'FAQ',
      name: 'Fair Average Quality',
      description: '',
      sort_order: 'first',
    });
    expect(result.success).toBe(false);
  });
});

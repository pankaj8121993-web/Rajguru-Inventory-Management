/**
 * Location types and labels shared between server and client.
 *
 * This module is deliberately NOT `server-only`: client components need the
 * node-type list and its display labels. It must never import from `db.ts` or
 * hold any data-access code — that stays in `locations.ts` (ADR-0004).
 */

export const NODE_TYPES = [
  'facility', 'plot', 'godown', 'building', 'open_yard',
  'floor', 'section', 'bay', 'zone', 'stack', 'bin', 'heap',
  'loading_point', 'unloading_point', 'gate', 'weighbridge',
  'restricted_area', 'fumigation_zone', 'fire_safety_zone',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  facility: 'Facility',
  plot: 'Plot',
  godown: 'Godown',
  building: 'Building',
  open_yard: 'Open Yard',
  floor: 'Floor',
  section: 'Section',
  bay: 'Bay',
  zone: 'Zone',
  stack: 'Stack',
  bin: 'Bin',
  heap: 'Heap',
  loading_point: 'Loading Point',
  unloading_point: 'Unloading Point',
  gate: 'Gate',
  weighbridge: 'Weighbridge',
  restricted_area: 'Restricted Area',
  fumigation_zone: 'Fumigation Zone',
  fire_safety_zone: 'Fire Safety Zone',
};

/**
 * Node types that hold stock and therefore have dimensions and capacity.
 * Used to decide which fields the location form shows.
 */
export const STORAGE_NODE_TYPES: readonly NodeType[] = [
  'godown', 'building', 'open_yard', 'floor', 'section',
  'bay', 'zone', 'stack', 'bin', 'heap',
];

export interface LocationNode {
  id: string;
  parent_id: string | null;
  node_type: NodeType;
  code: string;
  name: string;
  description: string | null;
  plot_number: string | null;
  survey_number: string | null;
  length_m: string | null;
  width_m: string | null;
  height_m: string | null;
  area_sqm: string | null;
  approved_capacity_mt: string | null;
  operational_capacity_mt: string | null;
  storage_method: string | null;
  fumigation_suitable: boolean;
  commodity_restrictions: string | null;
  operational_status: string;
  responsible_employee: string | null;
  is_active: boolean;
  notes: string | null;
  path: string;
  child_count: number;
}

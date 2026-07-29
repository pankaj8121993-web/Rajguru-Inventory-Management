import { listLocations } from '@/lib/locations';
import { NODE_TYPES } from '@/lib/location-types';
import { query } from '@/lib/db';
import LocationsClient from './LocationsClient';

export const dynamic = 'force-dynamic';

interface RuleRow {
  child_type: string;
  parent_type: string | null;
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const params = await searchParams;
  const includeInactive = params.inactive === '1';

  const [nodes, ruleRows] = await Promise.all([
    listLocations({ includeInactive }),
    query<RuleRow>('select child_type::text, parent_type::text from location_node_type_rules'),
  ]);

  // Shape the placement rules for the form: which parents each type allows,
  // and whether it may stand alone at the top level.
  const rules: Record<string, { parents: string[]; canRoot: boolean }> = {};
  for (const t of NODE_TYPES) rules[t] = { parents: [], canRoot: false };
  for (const r of ruleRows) {
    if (!rules[r.child_type]) rules[r.child_type] = { parents: [], canRoot: false };
    if (r.parent_type === null) rules[r.child_type].canRoot = true;
    else rules[r.child_type].parents.push(r.parent_type);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
        <p className="muted text-sm mt-1">
          Facilities, plots, godowns, yards, bays, stacks and bins. Stock can be
          recorded at any level — an exact stack is not required.
        </p>
      </div>
      <LocationsClient nodes={nodes} rules={rules} includeInactive={includeInactive} />
    </div>
  );
}

import {
  listCommodities, listVarieties, listGrades,
  listCommodityGroups, listUnits, listBagTypes,
  type Variety, type Grade,
} from '@/lib/commodities';
import CommoditiesClient from './CommoditiesClient';

export const dynamic = 'force-dynamic';

export default async function CommoditiesPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const params = await searchParams;
  const includeInactive = params.inactive === '1';

  const [commodities, groups, units, bagTypes] = await Promise.all([
    listCommodities({ includeInactive }),
    listCommodityGroups(),
    listUnits(),
    listBagTypes(),
  ]);

  // Varieties and grades for the expandable rows.
  const detail: Record<string, { varieties: Variety[]; grades: Grade[] }> = {};
  await Promise.all(
    commodities.map(async (c) => {
      const [varieties, grades] = await Promise.all([listVarieties(c.id), listGrades(c.id)]);
      detail[c.id] = { varieties, grades };
    }),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commodities</h1>
        <p className="muted text-sm mt-1">
          Materials, their varieties and grades. Nothing here is hard-coded —
          add whatever your operation actually handles.
        </p>
      </div>
      <CommoditiesClient
        commodities={commodities}
        groups={groups}
        units={units}
        bagTypes={bagTypes}
        detail={detail}
        includeInactive={includeInactive}
      />
    </div>
  );
}

import {
  listWeighments, weighmentPickers, getTolerances, listOpenDuplicates,
} from '@/lib/weighment';
import type { MovementDirection, WeighmentStatus } from '@/lib/validation/weighment';
import WeighmentsClient from './WeighmentsClient';

export const dynamic = 'force-dynamic';

export default async function WeighmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; direction?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status ?? '') as WeighmentStatus | '';
  const direction = (params.direction ?? '') as MovementDirection | '';

  const [slips, pickers, tolerances] = await Promise.all([
    listWeighments({
      status: status || undefined,
      direction: direction || undefined,
    }),
    weighmentPickers(),
    getTolerances(),
  ]);

  // Open duplicate reviews per slip, so the register can show what needs
  // resolving without a second round trip per row.
  const duplicatesBySlip: Record<string, Awaited<ReturnType<typeof listOpenDuplicates>>> = {};
  await Promise.all(
    slips
      .filter((s) => s.open_duplicates > 0)
      .map(async (s) => {
        duplicatesBySlip[s.id] = await listOpenDuplicates(s.id);
      }),
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Weighments</h1>
        <p className="muted text-sm mt-1">
          Manual entry from the paper, photographed or PDF slip. Gross and tare are
          typed; the net is calculated. The net printed on the slip is kept alongside
          it so the two can be compared, never merged.
        </p>
      </div>
      <WeighmentsClient
        slips={slips}
        pickers={pickers}
        tolerancePct={tolerances.tolerancePct}
        escalationPct={tolerances.escalationPct}
        today={today}
        activeStatus={status}
        activeDirection={direction}
        duplicatesBySlip={duplicatesBySlip}
      />
    </div>
  );
}

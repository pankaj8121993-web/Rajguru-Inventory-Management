import { listReasonCodes, listReasonCategories } from '@/lib/parties';
import ReasonCodesClient from './ReasonCodesClient';

export const dynamic = 'force-dynamic';

export default async function ReasonCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const params = await searchParams;
  const includeInactive = params.inactive === '1';

  const [codes, categories] = await Promise.all([
    listReasonCodes({ includeInactive }),
    listReasonCategories(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reason codes</h1>
        <p className="muted text-sm mt-1">
          The mandatory vocabularies behind gain, loss, damage, adjustment, override,
          correction and reclassification. Add your own — nothing here is hard-coded.
        </p>
      </div>
      <ReasonCodesClient codes={codes} categories={categories} includeInactive={includeInactive} />
    </div>
  );
}

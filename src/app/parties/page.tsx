import { listParties, listPartyTypes, listBrokers } from '@/lib/parties';
import PartiesClient from './PartiesClient';

export const dynamic = 'force-dynamic';

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string; type?: string }>;
}) {
  const params = await searchParams;
  const includeInactive = params.inactive === '1';
  const typeId = params.type ?? '';

  const [parties, partyTypes, brokers] = await Promise.all([
    listParties({ includeInactive, typeId: typeId || undefined }),
    listPartyTypes(),
    listBrokers(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parties</h1>
        <p className="muted text-sm mt-1">
          Farmers, traders, brokers, customers, transporters and agencies. GSTIN and
          PAN are optional — many farmers have neither, and the system records what
          is actually known.
        </p>
      </div>
      <PartiesClient
        parties={parties}
        partyTypes={partyTypes}
        brokers={brokers}
        includeInactive={includeInactive}
        activeTypeId={typeId}
      />
    </div>
  );
}

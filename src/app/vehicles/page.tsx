import { listVehicles, listTransporters } from '@/lib/parties';
import VehiclesClient from './VehiclesClient';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const params = await searchParams;
  const includeInactive = params.inactive === '1';

  const [vehicles, transporters] = await Promise.all([
    listVehicles({ includeInactive }),
    listTransporters(),
  ]);

  // Passed from the server so expiry maths is identical on both sides of
  // hydration; computing "today" in the browser would differ by timezone.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
        <p className="muted text-sm mt-1">
          Trucks, trailers and tractors, with document validity. An expired
          certificate is flagged, never blocked — a vehicle at the gate must still
          be recordable.
        </p>
      </div>
      <VehiclesClient
        vehicles={vehicles}
        transporters={transporters}
        includeInactive={includeInactive}
        today={today}
      />
    </div>
  );
}

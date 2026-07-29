import Link from 'next/link';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Counts {
  facilities: string;
  plots: string;
  godowns: string;
  yards: string;
  bays: string;
  stacks: string;
  commodities: string;
  varieties: string;
  grades: string;
  audit: string;
}

interface CapacityRow {
  name: string;
  code: string;
  approved: string | null;
  operational: string | null;
}

function mt(value: string | null): string {
  if (value === null) return '—';
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 3, maximumFractionDigits: 3,
  });
}

export default async function DashboardPage() {
  const [counts] = await query<Counts>(`
    select
      (select count(*) from location_nodes where node_type='facility'  and is_active)::text as facilities,
      (select count(*) from location_nodes where node_type='plot'      and is_active)::text as plots,
      (select count(*) from location_nodes where node_type='godown'    and is_active)::text as godowns,
      (select count(*) from location_nodes where node_type='open_yard' and is_active)::text as yards,
      (select count(*) from location_nodes where node_type='bay'       and is_active)::text as bays,
      (select count(*) from location_nodes where node_type='stack'     and is_active)::text as stacks,
      (select count(*) from commodities where is_active)::text as commodities,
      (select count(*) from varieties   where is_active)::text as varieties,
      (select count(*) from grades      where is_active)::text as grades,
      (select count(*) from audit_events)::text as audit
  `);

  const storage = await query<CapacityRow>(`
    select name, code,
           approved_capacity_mt as approved,
           operational_capacity_mt as operational
      from location_nodes
     where node_type in ('godown','open_yard') and is_active
     order by code
  `);

  const totalApproved = storage.reduce((s, r) => s + Number(r.approved ?? 0), 0);
  const totalOperational = storage.reduce((s, r) => s + Number(r.operational ?? 0), 0);

  const tiles = [
    { label: 'Facilities', value: counts.facilities, href: '/locations' },
    { label: 'Plots', value: counts.plots, href: '/locations' },
    { label: 'Godowns', value: counts.godowns, href: '/locations' },
    { label: 'Open yards', value: counts.yards, href: '/locations' },
    { label: 'Bays', value: counts.bays, href: '/locations' },
    { label: 'Stacks', value: counts.stacks, href: '/locations' },
    { label: 'Commodities', value: counts.commodities, href: '/commodities' },
    { label: 'Varieties', value: counts.varieties, href: '/commodities' },
    { label: 'Grades', value: counts.grades, href: '/commodities' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="muted text-sm mt-1">Master data currently configured.</p>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            data-testid={`tile-${t.label.toLowerCase().replace(/ /g, '-')}`}
            className="card p-4 hover:opacity-80 transition-opacity"
          >
            <div className="text-2xl font-semibold num text-left">{t.value}</div>
            <div className="muted text-sm mt-1">{t.label}</div>
          </Link>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="text-lg font-semibold mb-1">Storage capacity</h2>
        <p className="hint mb-4">
          Configured capacity only. No stock has been recorded — the stock ledger
          arrives in Phase 6.
        </p>
        {storage.length === 0 ? (
          <p className="hint">No godowns or yards configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                  <th scope="col" className="text-left font-medium py-2">Location</th>
                  <th scope="col" className="text-left font-medium py-2">Code</th>
                  <th scope="col" className="text-right font-medium py-2">Approved (MT)</th>
                  <th scope="col" className="text-right font-medium py-2">Operational (MT)</th>
                </tr>
              </thead>
              <tbody>
                {storage.map((r) => (
                  <tr key={r.code} className="border-b last:border-0"
                      style={{ borderColor: 'rgb(var(--border))' }}>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 font-mono text-xs">{r.code}</td>
                    <td className="py-2 num">{mt(r.approved)}</td>
                    <td className="py-2 num">{mt(r.operational)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-2" colSpan={2}>Total</td>
                  <td className="py-2 num">{mt(String(totalApproved))}</td>
                  <td className="py-2 num">{mt(String(totalOperational))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold mb-2">Where this is up to</h2>
        <p className="text-sm">
          Master data for locations and commodities is working. Weighment,
          inward, provisional stock and the stock ledger are not built yet —
          see <code className="text-xs">docs/09-ai-governance/CURRENT_STATE.md</code>.
        </p>
        <p className="hint mt-2">
          {counts.audit} audit event{counts.audit === '1' ? '' : 's'} recorded.
          Every change writes one, in the same transaction as the change itself.
        </p>
      </section>
    </div>
  );
}

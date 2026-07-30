import Link from 'next/link';
import Icon from '@/components/Icon';
import {
  stockTotals, commodityStock, locationOccupancy,
  provisionalSegments, openWork, recentMovements,
} from '@/lib/stock';

export const dynamic = 'force-dynamic';

/** Kilograms to tonnes, for display only. Arithmetic stays in the database. */
function mt(kg: string | number | null, dp = 3): string {
  if (kg === null) return '—';
  return (Number(kg) / 1000).toLocaleString('en-IN', {
    minimumFractionDigits: dp, maximumFractionDigits: dp,
  });
}

function pct(part: string | number, whole: string | number): number {
  const w = Number(whole);
  if (!w) return 0;
  return Math.round((Number(part) / w) * 100);
}

const TXN_LABELS: Record<string, string> = {
  inward: 'Inward', outward: 'Outward', internal_transfer: 'Transfer',
  identification: 'Identified', classification: 'Reclassified',
  location_refinement: 'Location refined', adjustment: 'Adjustment',
  gain: 'Gain', loss: 'Loss', damage: 'Damage', reversal: 'Reversal',
};

export default async function DashboardPage() {
  const [totals, commodities, occupancy, provisional, work, movements] = await Promise.all([
    stockTotals(), commodityStock(), locationOccupancy(),
    provisionalSegments(), openWork(), recentMovements(8),
  ]);

  const hasStock = Number(totals.total_kg) > 0;
  const provisionalPct = pct(totals.provisional_kg, totals.total_kg);
  const totalCapacityMt = occupancy.reduce(
    (s, r) => s + Number(r.operational_capacity_mt ?? 0), 0,
  );
  // A real occupancy of 0.4% must not be rendered as "0%" — that reads as empty
  // when it is not. Small non-zero shares keep a decimal.
  const usedRaw = totalCapacityMt ? (Number(totals.total_kg) / 1000 / totalCapacityMt) * 100 : 0;
  const usedLabel = usedRaw === 0 ? '0'
    : usedRaw < 10 ? usedRaw.toFixed(1)
    : String(Math.round(usedRaw));

  const attention = [
    work.unposted_verified && {
      tone: 'warn' as const,
      text: `${work.unposted_verified} verified weighment${work.unposted_verified === 1 ? '' : 's'} not yet turned into stock`,
      href: '/weighments',
    },
    work.open_duplicates && {
      tone: 'crit' as const,
      text: `${work.open_duplicates} possible duplicate${work.open_duplicates === 1 ? '' : 's'} to resolve`,
      href: '/weighments',
    },
    work.awaiting_verification && {
      tone: 'info' as const,
      text: `${work.awaiting_verification} weighment${work.awaiting_verification === 1 ? '' : 's'} awaiting verification`,
      href: '/weighments',
    },
    work.draft_weighments && {
      tone: 'info' as const,
      text: `${work.draft_weighments} draft weighment${work.draft_weighments === 1 ? '' : 's'}`,
      href: '/weighments',
    },
  ].filter(Boolean) as Array<{ tone: 'warn' | 'info' | 'crit'; text: string; href: string }>;

  return (
    <>
      <h1 className="page-h">Stock Dashboard</h1>
      <p className="page-sub">
        Live book stock from the ledger, with identification and location certainty shown
        alongside it. Every figure here comes from a posted transaction — nothing is
        estimated.
      </p>

      <div className="kpis">
        <div className="kpi" style={{ '--bloom': 'rgb(var(--accent-soft))' } as React.CSSProperties}>
          <span className="kpi-ico" style={{ background: 'rgb(var(--accent-soft))', color: 'rgb(var(--accent))' }}>
            <Icon name="box" className="" />
          </span>
          <div className="kpi-label">Total book stock</div>
          <div className="kpi-value">{mt(totals.total_kg)}<span className="kpi-unit">MT</span></div>
          <div className="kpi-note">
            {totals.segment_count} segment{totals.segment_count === 1 ? '' : 's'} across{' '}
            {totals.lot_count} lot{totals.lot_count === 1 ? '' : 's'}
          </div>
        </div>

        <div className="kpi" style={{ '--bloom': 'rgb(var(--positive-soft))' } as React.CSSProperties}>
          <span className="kpi-ico" style={{ background: 'rgb(var(--positive-soft))', color: 'rgb(var(--positive))' }}>
            <Icon name="check" className="" />
          </span>
          <div className="kpi-label">Fully identified</div>
          <div className="kpi-value">{mt(totals.identified_kg)}<span className="kpi-unit">MT</span></div>
          <div className="kpi-note">
            {pct(totals.identified_kg, totals.total_kg)}% of stock has a final lot
          </div>
        </div>

        <div className="kpi" style={{ '--bloom': 'rgb(var(--warning-soft))' } as React.CSSProperties}>
          <span className="kpi-ico" style={{ background: 'rgb(var(--warning-soft))', color: 'rgb(var(--warning))' }}>
            <Icon name="help" className="" />
          </span>
          <div className="kpi-label">Provisional stock</div>
          <div className="kpi-value">{mt(totals.provisional_kg)}<span className="kpi-unit">MT</span></div>
          <div className="kpi-note">
            {totals.provisional_segments} segment
            {totals.provisional_segments === 1 ? '' : 's'} with no final lot yet
          </div>
        </div>

        <div className="kpi" style={{ '--bloom': 'rgb(var(--advisory-soft))' } as React.CSSProperties}>
          <span className="kpi-ico" style={{ background: 'rgb(var(--advisory-soft))', color: 'rgb(var(--advisory))' }}>
            <Icon name="map" className="" />
          </span>
          <div className="kpi-label">Location not exact</div>
          <div className="kpi-value">
            {totals.imprecise_segments}<span className="kpi-unit">of {totals.segment_count}</span>
          </div>
          <div className="kpi-note">Known only to facility, plot or godown level</div>
        </div>

      </div>

      {attention.length > 0 && (
        <>
          <h2 className="section-h">Needs attention</h2>
          <p className="section-sub">Work sitting between the weighbridge and the ledger.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {attention.map((a) => (
              <Link key={a.text} href={a.href} className={`notice notice-${a.tone}`}
                    style={{ margin: 0, flex: '1 1 258px' }}>
                {a.text} <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="section-h">Commodity-wise stock</h2>
      <p className="section-sub">
        Identified and provisional shown side by side, because they are not the same thing.
      </p>

      {!hasStock ? (
        <div className="panel">
          <div className="empty">
            <p className="empty-t">No stock recorded yet.</p>
            <p className="hint" style={{ margin: '6px auto 0' }}>
              Stock appears here once a verified weighment is posted as inward.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid', gap: 12, marginBottom: 4,
          gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
        }}>
          {commodities.map((c) => {
            const provPct = pct(c.provisional_kg, c.total_kg);
            return (
              <div className="panel" key={c.commodity} style={{ marginBottom: 0 }}>
                <div className="panel-h" style={{ paddingBottom: 11 }}>
                  <div>
                    <h3>{c.commodity}</h3>
                    <span className="sub">
                      {c.group_name ?? 'Ungrouped'} · {c.segment_count} segment
                      {c.segment_count === 1 ? '' : 's'} · {c.location_count} location
                      {c.location_count === 1 ? '' : 's'}
                    </span>
                  </div>
                  {provPct > 0 && (
                    <span className="chip chip-warn" style={{ marginLeft: 'auto' }}>
                      {provPct}% provisional
                    </span>
                  )}
                </div>
                <div className="panel-b" style={{ paddingTop: 13 }}>
                  <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
                    <div>
                      <div className="sm muted">Book stock</div>
                      <div style={{ fontSize: 19, fontWeight: 660, fontVariantNumeric: 'tabular-nums' }}>
                        {mt(c.total_kg)} <span className="sm muted">MT</span>
                      </div>
                    </div>
                    <div>
                      <div className="sm muted">With a final lot</div>
                      <div style={{ fontSize: 19, fontWeight: 660, fontVariantNumeric: 'tabular-nums' }}>
                        {mt(c.identified_kg)} <span className="sm muted">MT</span>
                      </div>
                    </div>
                  </div>
                  <div className={`meter${provPct > 50 ? ' is-warn' : ''}`}>
                    <span style={{ width: `${100 - provPct}%` }} />
                  </div>
                  <div className="sm muted" style={{ marginTop: 6 }}>
                    {c.lot_count} lot{c.lot_count === 1 ? '' : 's'}
                    {provPct > 0 && ` · ${mt(c.provisional_kg)} MT awaiting identification`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="section-h">Godown occupancy</h2>
      <p className="section-sub">
        Stock recorded at a bay or stack is rolled up to the godown that contains it.
      </p>
      <div className="panel">
        <div className="panel-h">
          <h3>Across both facilities</h3>
          <span className="chip">
            {usedLabel}% of {totalCapacityMt.toLocaleString('en-IN')} MT operational capacity
          </span>
          <span className="chip" style={{ marginLeft: 'auto' }}>
            {occupancy.filter((o) => Number(o.stock_kg) > 0).length} of {occupancy.length} in use
          </span>
        </div>
        <div className="scroll">
          <table>
            <caption className="sr">Occupancy by godown and open yard</caption>
            <thead>
              <tr>
                <th>Location</th>
                <th>Type</th>
                <th className="r">Stock (MT)</th>
                <th className="r">Operational (MT)</th>
                <th style={{ width: 176 }}>Used</th>
              </tr>
            </thead>
            <tbody>
              {occupancy.map((o) => {
                const cap = Number(o.operational_capacity_mt ?? 0);
                const raw = cap ? (Number(o.stock_kg) / 1000 / cap) * 100 : 0;
                const used = Math.round(raw);
                const label = raw === 0 ? '0' : raw < 10 ? raw.toFixed(1) : String(used);
                const tone = used > 100 ? ' is-crit' : used > 85 ? ' is-warn' : '';
                return (
                  <tr key={o.id}>
                    <td>
                      {o.name}
                      <span className="sub">{o.path}</span>
                    </td>
                    <td className="muted">
                      {o.node_type === 'open_yard' ? 'Open yard' : 'Godown'}
                    </td>
                    <td className="r num">{mt(o.stock_kg)}</td>
                    <td className="r num muted">
                      {o.operational_capacity_mt
                        ? Number(o.operational_capacity_mt).toLocaleString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <div className={`meter${tone}`}>
                        <span style={{ width: `${Math.min(used, 100)}%` }} />
                      </div>
                      <span className="sm muted">{label}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {provisional.length > 0 && (
        <>
          <h2 className="section-h">Stock awaiting identification or placement</h2>
          <p className="section-sub">
            Real stock whose lot or exact location is not yet established. Ageing matters —
            the longer it sits, the harder it becomes to resolve.
          </p>
          <div className="panel">
            <div className="scroll">
              <table>
                <caption className="sr">Provisional and imprecisely located segments</caption>
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Commodity</th>
                    <th>Identification</th>
                    <th>Location</th>
                    <th className="r">Quantity (MT)</th>
                    <th className="r">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {provisional.map((s) => (
                    <tr key={s.id}>
                      <td className="mono sm">
                        {s.segment_no}
                        {s.party && <span className="sub">{s.party}</span>}
                      </td>
                      <td>{s.commodity ?? <span className="chip">Not yet known</span>}</td>
                      <td>
                        <span className={
                          s.identification_status === 'final_lot' ? 'chip chip-good' : 'chip chip-warn'
                        }>
                          {s.identification_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {s.location_path}
                        <span className="sub">{s.location_precision.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="r num strong">{mt(s.quantity_kg)}</td>
                      <td className="r num">
                        <span className={s.age_days > 14 ? 'chip chip-warn' : 'chip'}>
                          {s.age_days}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel-f">
              {provisionalPct}% of book stock has no final lot. That is normal at inward and a
              problem only if it stays that way.
            </div>
          </div>
        </>
      )}

      {movements.length > 0 && (
        <>
          <h2 className="section-h">Recent ledger entries</h2>
          <p className="section-sub">
            Append-only. Nothing here can be edited or deleted — corrections are contra
            entries.
          </p>
          <div className="panel">
            <div className="scroll">
              <table>
                <caption className="sr">Recent stock ledger entries</caption>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Segment</th>
                    <th>Commodity</th>
                    <th>Location</th>
                    <th className="r">Quantity (MT)</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={`${m.txn_no}-${i}`}>
                      <td className="mono sm">{m.txn_no}</td>
                      <td>
                        <span className="chip chip-info">
                          {TXN_LABELS[m.txn_type] ?? m.txn_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="muted">{m.effective_date}</td>
                      <td className="mono sm">{m.segment_no}</td>
                      <td>{m.commodity ?? <span className="muted">—</span>}</td>
                      <td className="muted sm">{m.location_path}</td>
                      <td className="r num strong"
                          style={Number(m.quantity_kg) < 0 ? { color: 'rgb(var(--critical))' } : undefined}>
                        {Number(m.quantity_kg) > 0 ? '+' : ''}{mt(m.quantity_kg)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

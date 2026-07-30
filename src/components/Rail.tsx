'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { NAV } from '@/lib/nav';

/**
 * The product map.
 *
 * Modules that are not built yet are shown and labelled with the phase that
 * delivers them, rather than hidden. Anyone opening the app can see the whole
 * shape of the platform and exactly how far the work has reached — which is
 * more useful than a short list that implies the product is smaller than it is.
 */
export default function Rail({ readyCount, totalCount }: { readyCount: number; totalCount: number }) {
  const path = usePathname();
  const pct = Math.round((readyCount / totalCount) * 100);

  return (
    <aside className="rail">
      <div className="rail-brand">
        <span className="rail-mark" aria-hidden="true">RF</span>
        <span className="rail-brand-text">
          <span className="rail-name">Rajguru Foods</span>
          <span className="rail-tag">Inventory &amp; Warehouse Control</span>
        </span>
      </div>

      <nav className="rail-nav" aria-label="Modules">
        {NAV.map((group) => (
          <div className="rail-group" key={group.label}>
            <p className="rail-group-label">{group.label}</p>
            {group.items.map((item) =>
              item.ready ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rail-link"
                  aria-current={path === item.href ? 'page' : undefined}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.href}
                  className="rail-link is-soon"
                  title={`Planned for phase ${item.phase}`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  <span className="rail-soon">P{item.phase}</span>
                </span>
              ),
            )}
          </div>
        ))}
      </nav>

      <div className="rail-foot">
        {readyCount} of {totalCount} modules built
        <span className="rail-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      </div>
    </aside>
  );
}

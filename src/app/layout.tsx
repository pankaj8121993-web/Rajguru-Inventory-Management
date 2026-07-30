import type { Metadata } from 'next';
import Rail from '@/components/Rail';
import { navProgress } from '@/lib/nav';
import { currentActor } from '@/lib/db';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rajguru Foods — Inventory & Warehouse Control',
  description: 'Stock, warehouse, insurance and spatial inventory management',
};

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase();
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { ready, total } = navProgress();
  const actor = await currentActor().catch(() => ({ id: '', label: 'Not signed in' }));

  return (
    <html lang="en">
      <body>
        <div className="app">
          <Rail readyCount={ready} totalCount={total} />
          <div className="col">
            <header className="topbar">
              <div>
                <div className="topbar-title">Aliyabad &amp; Murud</div>
                <div className="topbar-sub">Latur, Maharashtra · 2 facilities</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="chip chip-warn" title="Authentication is not built yet">
                  No sign-in yet
                </span>
                <span className="who">
                  <span className="who-av" aria-hidden="true">{initials(actor.label)}</span>
                  <span>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>
                      {actor.label}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: 'rgb(var(--muted))' }}>
                      Acting user
                    </span>
                  </span>
                </span>
              </div>
            </header>
            <main className="page">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

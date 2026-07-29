import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rajguru Foods — Inventory Management',
  description: 'Stock, warehouse, insurance and spatial inventory management',
};

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/locations', label: 'Locations' },
  { href: '/commodities', label: 'Commodities' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b surface" style={{ borderColor: 'rgb(var(--border))' }}>
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="font-semibold tracking-tight">
              Rajguru Foods
            </Link>
            <nav className="flex gap-1" aria-label="Main">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm hover:opacity-70"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <span className="ml-auto badge" title="Development build — not authenticated">
              Phase 3 · dev
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

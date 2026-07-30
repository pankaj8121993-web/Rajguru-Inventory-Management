/**
 * The product map.
 *
 * Every module the blueprint calls for appears here, grouped the way the
 * business thinks about the work. Items that are not built yet are shown and
 * marked, rather than hidden — the point of the sidebar is that anyone can see
 * the whole shape of the platform and where the work has reached.
 */

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Built and working against the real database. */
  ready?: boolean;
  /** Which phase delivers it, for the "coming" tooltip. */
  phase?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Stock Dashboard', href: '/', icon: 'home', ready: true },
      { label: 'Stock Enquiry', href: '/stock', icon: 'search', ready: true },
      { label: 'Exceptions', href: '/exceptions', icon: 'alert', phase: 12 },
    ],
  },
  {
    label: 'Receipt & Weighment',
    items: [
      { label: 'Weighments', href: '/weighments', icon: 'scale', ready: true },
      { label: 'Day-wise Bulk Entry', href: '/weighments/bulk', icon: 'grid', phase: 4 },
      { label: 'Inward', href: '/inward', icon: 'download', phase: 5 },
      { label: 'Opening Stock', href: '/opening-stock', icon: 'layers', phase: 13 },
    ],
  },
  {
    label: 'Lots & Warehouse',
    items: [
      { label: 'Lots', href: '/lots', icon: 'box', phase: 6 },
      { label: 'Provisional Stock', href: '/provisional', icon: 'help', ready: true },
      { label: 'Identify & Allocate', href: '/identify', icon: 'target', phase: 5 },
      { label: 'Transfers', href: '/transfers', icon: 'transfer', phase: 7 },
      { label: 'Lot Split / Merge', href: '/lot-operations', icon: 'split', phase: 5 },
      { label: 'Godown 2D Map', href: '/warehouse-map', icon: 'map', phase: 11 },
    ],
  },
  {
    label: 'Dispatch',
    items: [
      { label: 'Outward', href: '/outward', icon: 'upload', phase: 7 },
      { label: 'Reservations', href: '/reservations', icon: 'lock', phase: 7 },
      { label: 'Ownership Transfer', href: '/ownership', icon: 'swap', phase: 7 },
    ],
  },
  {
    label: 'Quality & Risk',
    items: [
      { label: 'Quality', href: '/quality', icon: 'flask', phase: 8 },
      { label: 'Fumigation', href: '/fumigation', icon: 'shield', phase: 8 },
      { label: 'Physical Verification', href: '/verification', icon: 'check', phase: 9 },
      { label: 'Gain & Loss', href: '/gain-loss', icon: 'delta', phase: 9 },
      { label: 'Insurance', href: '/insurance', icon: 'umbrella', phase: 10 },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { label: 'Locations', href: '/locations', icon: 'building', ready: true },
      { label: 'Commodities', href: '/commodities', icon: 'wheat', ready: true },
      { label: 'Parties', href: '/parties', icon: 'users', ready: true },
      { label: 'Reason Codes', href: '/reason-codes', icon: 'tag', ready: true },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users & Roles', href: '/administration', icon: 'key', ready: true },
      { label: 'Approvals', href: '/approvals', icon: 'stamp', phase: 3 },
      { label: 'Reports', href: '/reports', icon: 'report', phase: 12 },
    ],
  },
];

/** Total built versus planned, for the sidebar footer. */
export function navProgress(): { ready: number; total: number } {
  const items = NAV.flatMap((g) => g.items);
  return { ready: items.filter((i) => i.ready).length, total: items.length };
}

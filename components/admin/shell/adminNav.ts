import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  DollarSign,
  Settings,
  Bell,
  Star,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

export interface AdminNavGroup {
  id: 'daily' | 'people' | 'money' | 'setup' | 'handoff';
  label: string;
  items: AdminNavItem[];
}

const overview: AdminNavItem = {
  href: '/admin',
  label: 'Overview',
  icon: LayoutDashboard,
  match: (p) => p === '/admin',
};
const jobs: AdminNavItem = {
  href: '/admin/jobs',
  label: 'Jobs & Calendar',
  icon: Calendar,
  match: (p) => p.startsWith('/admin/jobs'),
};
const customers: AdminNavItem = {
  href: '/admin/customers',
  label: 'Customers & Properties',
  icon: UserCircle,
  match: (p) => p.startsWith('/admin/customers'),
};
const cleaners: AdminNavItem = {
  href: '/admin/cleaners',
  label: 'Cleaning Specialists',
  icon: Users,
  match: (p) => p.startsWith('/admin/cleaners'),
};
const quality: AdminNavItem = {
  href: '/admin/feedback',
  label: 'Quality & Reports',
  icon: Star,
  match: (p) => p.startsWith('/admin/feedback'),
};
const finance: AdminNavItem = {
  href: '/admin/invoices',
  label: 'Finance',
  icon: DollarSign,
  match: (p) =>
    p.startsWith('/admin/payouts') ||
    p.startsWith('/admin/taxes') ||
    p.startsWith('/admin/invoices') ||
    p.startsWith('/admin/profitability') ||
    p.startsWith('/admin/tips'),
};
const communications: AdminNavItem = {
  href: '/admin/notifications',
  label: 'Communications',
  icon: Bell,
  match: (p) =>
    p.startsWith('/admin/notifications') ||
    p.startsWith('/admin/lead-center') ||
    p.startsWith('/admin/inbox') ||
    p.startsWith('/admin/contact'),
};
const settings: AdminNavItem = {
  href: '/admin/settings',
  label: 'Settings',
  icon: Settings,
  match: (p) =>
    p.startsWith('/admin/settings') ||
    p.startsWith('/admin/branches') ||
    p.startsWith('/admin/map'),
};

/**
 * Handoff §6 / reference/admin-jobs.html — eight primary sections.
 * Role- and branch-scoped filtering is applied in AdminShell.
 */
export const ADMIN_HANDOFF_NAV: AdminNavItem[] = [
  overview,
  jobs,
  customers,
  cleaners,
  quality,
  finance,
  communications,
  settings,
];

/** Flat handoff nav as a single unlabeled group for NavLinks rendering. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { id: 'handoff', label: '', items: ADMIN_HANDOFF_NAV },
];

export const ADMIN_NAV: AdminNavItem[] = ADMIN_HANDOFF_NAV;

/** Which handoff nav item is active for a pathname (at most one). */
export function activeAdminNavItem(
  pathname: string
): AdminNavItem | undefined {
  return ADMIN_HANDOFF_NAV.find((item) =>
    item.match ? item.match(pathname) : pathname === item.href
  );
}

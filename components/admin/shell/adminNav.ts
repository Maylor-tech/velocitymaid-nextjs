import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  MapPin,
  Map,
  DollarSign,
  Settings,
  Target,
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
  id: 'daily' | 'people' | 'money' | 'setup';
  label: string;
  items: AdminNavItem[];
}

const dashboard: AdminNavItem = {
  href: '/admin',
  label: 'Dashboard',
  icon: LayoutDashboard,
  match: (p) => p === '/admin',
};
const jobs: AdminNavItem = {
  href: '/admin/jobs',
  label: 'Jobs',
  icon: Calendar,
  match: (p) => p.startsWith('/admin/jobs'),
};
const leadCenter: AdminNavItem = {
  href: '/admin/lead-center',
  label: 'Lead Center',
  icon: Target,
  match: (p) => p.startsWith('/admin/lead-center'),
};
const customers: AdminNavItem = {
  href: '/admin/customers',
  label: 'Customers',
  icon: UserCircle,
  match: (p) => p.startsWith('/admin/customers'),
};
const cleaners: AdminNavItem = {
  href: '/admin/cleaners',
  label: 'Cleaners',
  icon: Users,
  match: (p) => p.startsWith('/admin/cleaners'),
};
const invoices: AdminNavItem = {
  href: '/admin/invoices',
  label: 'Invoices',
  icon: DollarSign,
  match: (p) =>
    p.startsWith('/admin/payouts') ||
    p.startsWith('/admin/taxes') ||
    p.startsWith('/admin/invoices'),
};
const profitability: AdminNavItem = {
  href: '/admin/profitability',
  label: 'Profitability',
  icon: DollarSign,
  match: (p) => p.startsWith('/admin/profitability'),
};
const tips: AdminNavItem = {
  href: '/admin/tips',
  label: 'Tips',
  icon: DollarSign,
  match: (p) => p.startsWith('/admin/tips'),
};
const branches: AdminNavItem = {
  href: '/admin/branches',
  label: 'Branches',
  icon: MapPin,
  match: (p) => p.startsWith('/admin/branches'),
};
const map: AdminNavItem = {
  href: '/admin/map',
  label: 'Map',
  icon: Map,
  match: (p) => p.startsWith('/admin/map'),
};
const notifications: AdminNavItem = {
  href: '/admin/notifications',
  label: 'Notifications',
  icon: Bell,
  match: (p) => p.startsWith('/admin/notifications'),
};
const feedback: AdminNavItem = {
  href: '/admin/feedback',
  label: 'Feedback',
  icon: Star,
  match: (p) => p.startsWith('/admin/feedback'),
};
const settings: AdminNavItem = {
  href: '/admin/settings',
  label: 'Settings',
  icon: Settings,
  match: (p) =>
    p.startsWith('/admin/settings') ||
    p.startsWith('/admin/contact') ||
    p.startsWith('/admin/inbox'),
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { id: 'daily', label: 'Daily', items: [dashboard, jobs, leadCenter] },
  { id: 'people', label: 'People', items: [customers, cleaners] },
  { id: 'money', label: 'Money', items: [invoices, profitability, tips] },
  { id: 'setup', label: 'Setup', items: [branches, map, notifications, feedback, settings] },
];

export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

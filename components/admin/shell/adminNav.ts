import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Settings,
  Target,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: (p) => p === '/admin',
  },
  {
    href: '/admin/lead-center',
    label: 'Lead Center',
    icon: Target,
    match: (p) => p.startsWith('/admin/lead-center'),
  },
  {
    href: '/admin/jobs',
    label: 'Jobs',
    icon: Calendar,
    match: (p) => p.startsWith('/admin/jobs'),
  },
  {
    href: '/admin/cleaners',
    label: 'Cleaners',
    icon: Users,
    match: (p) => p.startsWith('/admin/cleaners'),
  },
  {
    href: '/admin/branches',
    label: 'Branches',
    icon: MapPin,
    match: (p) => p.startsWith('/admin/branches'),
  },
  {
    href: '/admin/invoices',
    label: 'Invoices',
    icon: DollarSign,
    match: (p) =>
      p.startsWith('/admin/payouts') ||
      p.startsWith('/admin/taxes') ||
      p.startsWith('/admin/invoices'),
  },
  {
    href: '/admin/contact',
    label: 'Settings',
    icon: Settings,
    match: (p) => p.startsWith('/admin/contact') || p.startsWith('/admin/inbox'),
  },
];

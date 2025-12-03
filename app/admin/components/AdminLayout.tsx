'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertCircle,
  Settings,
  Search
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Operations', icon: LayoutDashboard },
    { href: '/admin/branches', label: 'Branches', icon: Building2 },
    { href: '/dashboard/profit', label: 'Profitability', icon: TrendingUp },
    { href: '/dashboard/payouts', label: 'Payouts', icon: DollarSign },
    { href: '/dashboard/complaints', label: 'Complaints', icon: AlertCircle },
    { href: '/dashboard/incentives', label: 'Incentives', icon: Users },
  ];

  // Check if we're on a branches sub-page
  const isBranchesPage = pathname?.startsWith('/admin/branches');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">VelocityMaid</span>
          </Link>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {isBranchesPage && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/admin/branches/test-zip"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    pathname === '/admin/branches/test-zip'
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Search className="w-5 h-5" />
                  Test ZIP Routing
                </Link>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


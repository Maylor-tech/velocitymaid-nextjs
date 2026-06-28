'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import {
  Calendar,
  Settings,
  LogOut,
  Phone,
  MessageSquare,
  CreditCard,
  Home,
} from 'lucide-react';
import type { MarketSupportContact } from '@/lib/customer/marketSupport';
import {
  NEW_JERSEY_SUPPORT,
} from '@/lib/customer/marketSupport';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const DEFAULT_SUPPORT: MarketSupportContact = NEW_JERSEY_SUPPORT;

const NAV_ITEMS = [
  { href: '/customer/jobs', label: 'Home', icon: Home, match: (p: string) => p === '/customer/jobs' || p === '/customer' },
  { href: '/customer/jobs', label: 'My Bookings', icon: Calendar, match: (p: string) => p.startsWith('/customer/jobs') },
  { href: '/customer/payments', label: 'Payments', icon: CreditCard, match: (p: string) => p.startsWith('/customer/payments') },
  { href: '/customer/profile', label: 'Profile', icon: Settings, match: (p: string) => p.startsWith('/customer/profile') },
] as const;

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [support, setSupport] = useState<MarketSupportContact>(DEFAULT_SUPPORT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerInfo();

    const maxLoadingTimeout = setTimeout(() => {
      if (loading && !customer) {
        router.push('/customer/login');
      }
    }, 10000);

    return () => clearTimeout(maxLoadingTimeout);
  }, [loading, customer, router]);

  const fetchCustomerInfo = async () => {
    try {
      const response = await fetch('/api/customer/me');

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/customer/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.authenticated && data.customer) {
        setCustomer(data.customer);
        if (data.support) setSupport(data.support);
      } else {
        router.push('/customer/login');
      }
    } catch {
      router.push('/customer/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
      router.push('/customer/login');
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vm-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-vm-cyan" />
          <p className="mt-4 text-vm-muted font-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-vm-surface flex items-center justify-center">
        <button
          type="button"
          onClick={() => { window.location.href = '/customer/login'; }}
          className="px-4 py-2 bg-vm-navy text-vm-white rounded-lg font-body"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const initials = `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-vm-surface flex flex-col">
      {/* Navy header */}
      <header className="bg-vm-navy text-vm-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6 lg:gap-10">
              <Link href="/customer/jobs" className="shrink-0">
                <BrandLogo theme="dark" size="portal" showTagline={false} />
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.match(pathname);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`px-4 py-2 text-sm font-heading font-semibold transition-colors border-b-2 ${
                        isActive
                          ? 'text-vm-cyan border-vm-cyan'
                          : 'text-vm-white/70 border-transparent hover:text-vm-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-vm-cyan/20 text-vm-cyan text-sm font-heading font-bold"
                title={`${customer.firstName} ${customer.lastName}`}
              >
                {initials}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-vm-white/70 hover:text-vm-white text-sm font-body"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Support footer */}
      <footer className="border-t border-vm-navy/10 bg-vm-white px-4 sm:px-6 lg:px-8 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-body text-vm-muted">
            <strong className="text-vm-text">Support</strong> · {support.marketLabel}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`mailto:${support.email}`}
              className="flex items-center gap-2 text-sm text-vm-cyan-dark font-body font-medium"
            >
              {support.email}
            </a>
            <a
              href={`tel:${support.phoneTel}`}
              className="flex items-center gap-2 text-sm text-vm-muted font-body font-medium"
            >
              <Phone className="w-4 h-4" />
              {support.phoneDisplay}
              {support.market === 'new-jersey' ? ' (Vermont line)' : ''}
            </a>
            {support.whatsappUrl && (
              <a
                href={support.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-vm-success font-body font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav — 4 items */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-vm-navy/10 bg-vm-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-body font-medium ${
                  isActive ? 'text-vm-cyan-dark' : 'text-vm-muted'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-vm-cyan-dark' : ''}`} />
                {item.label === 'My Bookings' ? 'Bookings' : item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

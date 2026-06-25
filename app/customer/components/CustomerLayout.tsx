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
  MessageSquare
} from 'lucide-react';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerInfo();
    
    // 🚨 SAFETY FIX: Maximum loading timeout - if auth check takes too long, redirect to login
    const maxLoadingTimeout = setTimeout(() => {
      if (loading && !customer) {
        console.warn('[CUSTOMER LAYOUT] Auth check timeout - redirecting to login');
        router.push('/customer/login');
      }
    }, 10000); // 10 seconds max
    
    return () => {
      clearTimeout(maxLoadingTimeout);
    };
  }, [loading, customer, router]);

  const fetchCustomerInfo = async () => {
    try {
      const response = await fetch('/api/customer/me');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - redirect to login
          router.push('/customer/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.authenticated && data.customer) {
        setCustomer(data.customer);
      } else {
        console.error('Failed to fetch customer:', data.error || 'Not authenticated');
        router.push('/customer/login');
        return;
      }
    } catch (error) {
      console.error('Error fetching customer info:', error);
      router.push('/customer/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
      router.push('/customer/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vm-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-vm-cyan"></div>
          <p className="mt-4 text-vm-muted font-body">Loading...</p>
          <p className="mt-2 text-xs text-vm-muted/70 font-body">If this takes too long, you'll be redirected to login</p>
        </div>
      </div>
    );
  }

  // 🚨 SAFETY FIX: If not authenticated and not loading, redirect to login
  if (!customer && !loading) {
    return (
      <div className="min-h-screen bg-vm-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-vm-muted font-body mb-4">Unable to load customer information.</p>
          <button
            onClick={() => {
              window.location.href = '/customer/login';
            }}
            className="px-4 py-2 bg-vm-navy text-vm-white rounded-lg hover:bg-vm-navy/90 transition-colors font-body"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/customer/jobs', label: 'My Jobs', icon: Calendar },
    { href: '/customer/profile', label: 'Profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-vm-surface">
      {/* Top Navigation */}
      <nav className="bg-vm-white border-b border-vm-navy/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/customer/jobs">
                <BrandLogo theme="light" size="portal" showTagline={false} />
              </Link>
              <div className="hidden md:flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                        isActive
                          ? 'bg-vm-navy/10 text-vm-navy'
                          : 'text-vm-muted hover:bg-vm-navy/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/19732809190"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-vm-muted hover:bg-vm-surface rounded-lg transition-colors text-sm font-body font-medium"
                title="WhatsApp Support"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Support</span>
              </a>
              <Link
                href="/book"
                className="bg-vm-navy text-vm-white font-body font-bold uppercase tracking-wider text-xs px-6 py-3 rounded shadow-md hover:bg-vm-navy/90 btn-tactile"
              >
                Book a Service
              </Link>
              <span className="text-sm text-vm-muted font-body hidden lg:inline">
                {customer?.firstName} {customer?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-vm-muted hover:bg-vm-surface rounded-lg transition-colors text-sm font-body font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-vm-white border-b border-vm-navy/10">
        <div className="px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-vm-navy/10 text-vm-navy'
                    : 'text-vm-muted hover:bg-vm-navy/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/book"
            className="flex items-center gap-2 px-4 py-2 bg-vm-navy text-vm-white rounded-lg font-heading font-semibold text-sm whitespace-nowrap hover:bg-vm-navy/90 transition-colors ml-auto"
          >
            Book a Service
          </Link>
        </div>
      </div>

      {/* Support Banner */}
      <div className="flex bg-vm-navy/5 border-b border-vm-navy/10 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <p className="text-sm font-body font-medium text-vm-text">
            <strong>Need help?</strong> For same-day changes, call or WhatsApp us.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="tel:9732809190"
              className="flex items-center gap-2 text-sm text-vm-cyan hover:text-vm-cyan-dark font-body font-medium"
            >
              <Phone className="w-4 h-4" />
              (973) 280-9190
            </a>
            <a
              href="https://wa.me/19732809190"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-body font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

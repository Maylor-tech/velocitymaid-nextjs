'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
      const data = await response.json();

      // API returns { authenticated: true, customer: {...} } on success
      // or { authenticated: false } when not logged in
      if (data.authenticated && data.customer) {
        setCustomer(data.customer);
      } else {
        console.error('Failed to fetch customer:', data.error || 'Not authenticated');
        // Redirect to login if not authenticated
        router.push('/customer/login');
        return;
      }
    } catch (error) {
      console.error('Error fetching customer info:', error);
      // On network errors, redirect to login
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <p className="mt-2 text-xs text-gray-400">If this takes too long, you'll be redirected to login</p>
        </div>
      </div>
    );
  }

  // 🚨 SAFETY FIX: If not authenticated and not loading, redirect to login
  if (!customer && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load customer information.</p>
          <button
            onClick={() => {
              window.location.href = '/customer/login';
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/customer/jobs" className="text-xl font-bold text-blue-600">
                VelocityMaid
              </Link>
              <div className="hidden md:flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="tel:9732809190"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Call Support"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">(973) 280-9190</span>
              </a>
              <a
                href="https://wa.me/19732809190"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="WhatsApp Support"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Support</span>
              </a>
              <span className="text-sm text-gray-600 hidden sm:inline">
                {customer?.firstName} {customer?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Support Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-blue-800">
            <strong>Need help?</strong> For urgent same-day changes, please call us directly.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="tel:9732809190"
              className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              <Phone className="w-4 h-4" />
              (973) 280-9190
            </a>
            <a
              href="https://wa.me/19732809190"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium"
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


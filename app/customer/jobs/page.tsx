'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface CustomerJob {
  id: string;
  number?: string;
  status: string;
  serviceType?: string;
  scheduledDate?: string;
  timeWindow?: string;
  address: string;
  price: number | null;
  branchName?: string;
  cleaner?: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  paymentStatus?: 'UNPAID' | 'PAID' | 'DEPOSIT_PAID' | 'BALANCE_DUE' | 'REFUNDED' | 'PARTIAL';
  rating?: {
    score: number;
    comment?: string;
  } | null;
}

export default function CustomerJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingJobs, setUpcomingJobs] = useState<CustomerJob[]>([]);
  const [pastJobs, setPastJobs] = useState<CustomerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);

  // 🚨 SAFETY FIX: Verify authentication before loading jobs
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/customer/me');
        const data = await response.json();
        
        if (!data.authenticated) {
          // Not authenticated - redirect to login
          router.replace('/customer/login?redirect=/customer/jobs');
          return;
        }
        
        // Store customer name for welcome message
        if (data.customer?.firstName) {
          setCustomerName(data.customer.firstName);
        }
        
        setAuthChecked(true);
      } catch (err) {
        console.error('Auth check failed:', err);
        // On error, redirect to login
        router.replace('/customer/login?redirect=/customer/jobs');
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Only fetch jobs if auth is verified
    if (authChecked) {
      fetchJobs();
    }
  }, [activeTab, authChecked]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const [upcomingRes, pastRes] = await Promise.all([
        fetch('/api/customer/jobs?type=upcoming'),
        fetch('/api/customer/jobs?type=past'),
      ]);

      const upcomingData = await upcomingRes.json();
      const pastData = await pastRes.json();

      if (upcomingData.success) {
        setUpcomingJobs(upcomingData.jobs || []);
      }

      if (pastData.success) {
        setPastJobs(pastData.jobs || []);
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      assigned: { color: 'bg-vm-cyan/15 text-vm-navy', icon: User, label: 'Cleaner assigned' },
      pending: { color: 'bg-vm-warning-bg text-yellow-800', icon: Clock, label: 'Pending confirmation' },
      in_progress: { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'In Progress' },
      completed: { color: 'bg-vm-success-bg text-vm-success', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-vm-danger-bg text-red-800', icon: XCircle, label: 'Cancelled' },
      reschedule_requested: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Reschedule Requested' },
      cancel_requested: { color: 'bg-vm-danger-bg text-red-800', icon: XCircle, label: 'Cancel Requested' },
    };

    const config = statusConfig[status.toLowerCase()] || {
      color: 'bg-vm-surface text-vm-text',
      icon: AlertCircle,
      label: status,
    };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;

    const config: Record<string, { color: string; label: string }> = {
      UNPAID: { color: 'bg-vm-danger-bg text-red-800', label: 'Unpaid' },
      PAID: { color: 'bg-vm-success-bg text-vm-success', label: 'Paid' },
      DEPOSIT_PAID: { color: 'bg-vm-cyan/15 text-vm-navy', label: 'Deposit Paid' },
      BALANCE_DUE: { color: 'bg-orange-100 text-orange-800', label: 'Balance Due' },
      REFUNDED: { color: 'bg-vm-surface text-vm-text', label: 'Refunded' },
      PARTIAL: { color: 'bg-vm-warning-bg text-yellow-800', label: 'Partial' },
    };

    const paymentConfig = config[status] || { color: 'bg-vm-surface text-vm-text', label: status };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.color}`}>
        {paymentConfig.label}
      </span>
    );
  };

  const jobs = activeTab === 'upcoming' ? upcomingJobs : pastJobs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-vm-navy mb-1">
            {customerName ? `Welcome back, ${customerName}` : 'My Jobs'}
          </h1>
          <p className="text-vm-muted font-body">
            {activeTab === 'upcoming' 
              ? "Here's a quick view of your upcoming cleanings."
              : "View your past cleaning appointments."}
          </p>
        </div>
        {activeTab === 'upcoming' && (
          <Link
            href="/book"
            className="hidden md:flex items-center gap-2 px-4 py-2 border-2 border-vm-cyan text-vm-cyan rounded-lg font-heading font-semibold hover:bg-vm-surface transition-colors text-sm"
          >
            Book a new cleaning
          </Link>
        )}
      </div>

        {/* Tabs */}
        <div className="border-b border-vm-navy/10">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-body font-medium border-b-2 transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-vm-cyan text-vm-cyan'
                  : 'border-transparent text-vm-muted hover:text-vm-navy'
              }`}
            >
              Upcoming ({upcomingJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 font-body font-medium border-b-2 transition-colors ${
                activeTab === 'past'
                  ? 'border-vm-cyan text-vm-cyan'
                  : 'border-transparent text-vm-muted hover:text-vm-navy'
              }`}
            >
              Past Jobs ({pastJobs.length})
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {(!authChecked || loading) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-vm-cyan" />
            <span className="ml-3 text-vm-muted font-body">
              {!authChecked ? 'Verifying access...' : 'Loading jobs...'}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* What's happening now? Helper */}
        {!loading && !error && activeTab === 'upcoming' && upcomingJobs.length > 0 && (
          <div className="bg-vm-cyan/10 border border-vm-cyan/20 rounded-lg p-4">
            <p className="text-sm text-vm-navy font-body">
              <strong>What's happening now?</strong> We're confirming details and assigning a vetted cleaner. You'll get updates by email or SMS.
            </p>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="bg-vm-white rounded-xl shadow-sm border border-vm-navy/10 p-12 text-center">
                <Calendar className="w-12 h-12 text-vm-muted mx-auto mb-4" />
                <h2 className="text-xl font-heading font-semibold text-vm-navy mb-2">
                  {activeTab === 'upcoming' 
                    ? "No upcoming cleanings yet" 
                    : "No past cleanings yet"}
                </h2>
                {activeTab === 'upcoming' ? (
                  <>
                    <p className="text-vm-muted font-body mb-6">
                      Book in minutes and we'll take care of the rest.
                    </p>
                    <Link
                      href="/book"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-vm-navy text-vm-white rounded-lg hover:bg-vm-navy/90 transition-colors font-heading font-semibold"
                    >
                      Book a Service
                    </Link>
                  </>
                ) : (
                  <p className="text-vm-muted font-body">
                    Your completed cleanings will appear here.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/customer/jobs/${job.id}`}
                    className="bg-vm-white rounded-xl shadow-sm border border-vm-navy/10 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-lg font-heading font-semibold text-vm-navy">
                            {job.serviceType || 'Cleaning Service'}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(job.status)}
                            {getPaymentStatusBadge(job.paymentStatus)}
                          </div>
                        </div>
                        {job.status.toLowerCase() === 'pending' && (
                          <p className="text-xs text-vm-muted font-body mt-1 ml-0">We're assigning your cleaner.</p>
                        )}
                        {job.number && (
                          <p className="text-sm text-vm-muted font-body mt-1">Job #{job.number}</p>
                        )}
                      </div>
                      {job.price !== null && (
                        <div className="text-right">
                          <p className="text-lg font-heading font-bold text-vm-navy">{formatCurrency(job.price)}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-vm-text font-body">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(job.scheduledDate)}</span>
                      </div>
                      {job.timeWindow && (
                        <div className="flex items-center gap-2 text-vm-text font-body">
                          <Clock className="w-4 h-4" />
                          <span>{job.timeWindow}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-vm-text font-body">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{job.address}</span>
                      </div>
                    </div>

                    {job.paymentStatus === 'BALANCE_DUE' && (
                      <p className="mt-3 text-sm font-medium text-orange-700">
                        Your service is complete — tap to pay the remaining balance securely.
                      </p>
                    )}
                    {job.status.toLowerCase() === 'assigned' && job.paymentStatus === 'DEPOSIT_PAID' && (
                      <p className="mt-3 text-sm text-vm-cyan font-body">
                        Your cleaner is assigned. Tap for details and updates.
                      </p>
                    )}

                    {job.cleaner && (
                      <div className="mt-4 pt-4 border-t border-vm-navy/10 flex items-center gap-3">
                        <div className="w-8 h-8 bg-vm-cyan/15 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-vm-cyan" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-vm-navy font-body">{job.cleaner.name}</p>
                          <p className="text-xs text-vm-muted font-body">Assigned Cleaner</p>
                        </div>
                      </div>
                    )}

                    {job.rating && (
                      <div className="mt-4 pt-4 border-t border-vm-navy/10">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={i < job.rating!.score ? 'text-vm-cyan' : 'text-vm-muted/40'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-vm-muted font-body">Rated</span>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}









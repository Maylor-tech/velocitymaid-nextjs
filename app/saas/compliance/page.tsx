'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { isPublicDemoMode } from '@/lib/env/publicFlags';

interface ComplianceMetrics {
  total: number;
  verified: number;
  pending: number;
  expired: number;
}

interface ComplianceItem {
  id: string;
  contractorName: string;
  documentType: string;
  status: 'verified' | 'pending' | 'expired';
  expiryDate?: string;
  lastUpdated: string;
}

export default function CompliancePage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    total: 0,
    verified: 0,
    pending: 0,
    expired: 0,
  });
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoadError(null);
      const response = await fetch('/api/saas/compliance');
      if (response.status === 401) {
        router.push('/saas/login');
        return;
      }
      if (!response.ok) {
        if (isPublicDemoMode) {
          setMetrics({ total: 0, verified: 0, pending: 0, expired: 0 });
          setItems([]);
          return;
        }
        setLoadError('Unable to load compliance data. Please try again later.');
        setMetrics({ total: 0, verified: 0, pending: 0, expired: 0 });
        setItems([]);
        return;
      }
      const data = await response.json();
      setMetrics(data.metrics || { total: 0, verified: 0, pending: 0, expired: 0 });
      setItems(data.items || []);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      if (isPublicDemoMode) {
        setMetrics({ total: 0, verified: 0, pending: 0, expired: 0 });
        setItems([]);
        return;
      }
      setLoadError('Unable to load compliance data. Please try again later.');
      setMetrics({ total: 0, verified: 0, pending: 0, expired: 0 });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-vm-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-vm-success-bg text-green-800">
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-vm-warning-bg text-yellow-800">
            Pending
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-vm-danger-bg text-red-800">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vm-navy mx-auto mb-4"></div>
          <p className="text-vm-muted">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/saas" className="flex items-center space-x-2">
              <Sparkles className="w-7 h-7 text-vm-cyan-dark" />
              <span className="text-xl font-bold text-vm-text">VelocityMaid</span>
            </Link>
            <Link
              href="/saas/dashboard"
              className="text-vm-muted hover:text-vm-text"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vm-text">Compliance Tracking</h1>
          <p className="text-vm-muted mt-2">Stay audit-ready with automatic compliance document tracking</p>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        )}

        {/* Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-vm-cyan-dark mr-3" />
              <div>
                <p className="text-sm text-vm-muted">Total Documents</p>
                <p className="text-2xl font-bold text-vm-text">{metrics.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-vm-muted">Verified</p>
                <p className="text-2xl font-bold text-vm-text">{metrics.verified}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-vm-muted">Pending</p>
                <p className="text-2xl font-bold text-vm-text">{metrics.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-vm-muted">Expired</p>
                <p className="text-2xl font-bold text-vm-text">{metrics.expired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-vm-text">Compliance Documents</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Contractor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-vm-muted">
                      No compliance documents yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-vm-text">
                        {item.contractorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-text">
                        {item.documentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-muted">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-muted">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


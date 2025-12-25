"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, XCircle, DollarSign, Filter, User } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import Toast from '../../components/Toast';

interface Payout {
  id: string;
  cleaner: {
    id: string;
    name: string | null;
    email: string;
  };
  branch: {
    id: string;
    name: string;
  };
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
  country: string;
}

export default function JamaicaPayoutsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchPayouts();
    }
  }, [selectedBranchId, statusFilter]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches');
      const data = await response.json();
      if (data.success) {
        // Filter to only Jamaica branches
        const jamaicaBranches = data.branches.filter((b: Branch) => b.country === 'JM');
        setBranches(jamaicaBranches);
        if (jamaicaBranches.length > 0) {
          setSelectedBranchId(jamaicaBranches[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching branches:', err);
      setError(err.message || 'Failed to load branches');
    }
  };

  const fetchPayouts = async () => {
    if (!selectedBranchId) return;

    setLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await fetch(
        `/api/admin/payouts/jamaica/list?branchId=${selectedBranchId}${status ? `&status=${status}` : ''}`
      );
      const data = await response.json();
      if (data.success) {
        setPayouts(data.payouts);
      } else {
        setError(data.error || 'Failed to load payouts');
      }
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    if (!confirm('Are you sure you want to approve this payout?')) return;

    setProcessing(payoutId);
    try {
      const response = await fetch('/api/admin/payouts/jamaica/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });

      const data = await response.json();
      if (data.success) {
        setToastMessage('Payout approved successfully');
        setShowToast(true);
        fetchPayouts();
      } else {
        setError(data.error || 'Failed to approve payout');
        setShowToast(true);
      }
    } catch (err: any) {
      console.error('Error approving payout:', err);
      setError(err.message || 'Failed to approve payout');
      setShowToast(true);
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    if (!confirm('Are you sure you want to mark this payout as paid?')) return;

    setProcessing(payoutId);
    try {
      const response = await fetch('/api/admin/payouts/jamaica/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      });

      const data = await response.json();
      if (data.success) {
        setToastMessage('Payout marked as paid successfully');
        setShowToast(true);
        fetchPayouts();
      } else {
        setError(data.error || 'Failed to mark payout as paid');
        setShowToast(true);
      }
    } catch (err: any) {
      console.error('Error marking payout as paid:', err);
      setError(err.message || 'Failed to mark payout as paid');
      setShowToast(true);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            Jamaica Payouts
          </h1>
          <p className="text-gray-600">
            Manage payouts for Jamaica (JMD) branches
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payouts List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading payouts...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600">No payouts found for this branch and status.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cleaner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payout.cleaner.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">{payout.cleaner.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payout.periodStart)} – {formatDate(payout.periodEnd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        JMD ${payout.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payout.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {payout.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(payout.id)}
                              disabled={processing === payout.id}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {processing === payout.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </button>
                          )}
                          {payout.status === 'APPROVED' && (
                            <button
                              onClick={() => handleMarkPaid(payout.id)}
                              disabled={processing === payout.id}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {processing === payout.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Mark Paid'
                              )}
                            </button>
                          )}
                          {payout.status === 'PAID' && (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Paid
                            </span>
                          )}
                          <Link
                            href={`/admin/cleaners/${payout.cleaner.id}`}
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            View Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      <Toast
        message={toastMessage || error || ''}
        type={error ? 'error' : 'success'}
        visible={showToast}
        onClose={() => {
          setShowToast(false);
          setError(null);
          setToastMessage('');
        }}
      />
    </AdminLayout>
  );
}


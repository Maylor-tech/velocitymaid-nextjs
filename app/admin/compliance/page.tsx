"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import KpiCard from '@/components/admin/ui/KpiCard';
import {
  Shield,
  AlertTriangle,
  UserX,
  FileWarning,
  Users,
  Loader2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface ComplianceOverview {
  branch: {
    id: string | null;
    name: string | null;
  };
  cleanerCompliance: {
    totalCleaners: number;
    suspendedCleaners: number;
    missingDocuments: number;
    trainingPending: number;
    highSeverityIssues: number;
  };
  customerRisk: {
    totalCustomers: number;
    blockedCustomers: number;
    highRiskCustomers: number;
    averageRiskScore: number | null;
  };
  issues: {
    openIssues: number;
    resolvedIssuesLast30Days: number;
    bySeverity: Array<{ severity: number; count: number }>;
  };
  complaints: {
    openComplaints: number;
    avgSeverityLast30Days: number | null;
    complaintsLast30Days: number;
  };
  riskReport: {
    topRiskCustomers: Array<{
      customerId: string;
      name: string;
      riskScore: number;
      riskFlags: string[];
    }>;
    topRiskCleaners: Array<{
      cleanerId: string;
      name: string;
      warningCount: number;
      openIssues: number;
    }>;
  };
  revokedCertificatesCount: number;
  lastRevokedCertificates: Array<{
    id: string;
    certificateId: string;
    status: string;
    revokedAt: string | null;
    cleaner: {
      id: string;
      name: string | null;
      email: string | null;
      role: string | null;
      isSuspended: boolean;
      warningCount: number;
    } | null;
  }>;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
}

export default function CompliancePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [overview, setOverview] = useState<ComplianceOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/admin/branches');
      const data = await res.json();
      if (data.success && data.branches) {
        setBranches(data.branches);
      }
    } catch (err: any) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedBranchId !== 'all') {
        params.set('branchId', selectedBranchId);
      }

      const res = await fetch(`/api/admin/compliance/overview?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setOverview(data);
      } else {
        throw new Error(data.error || 'Failed to load compliance overview');
      }
    } catch (err: any) {
      console.error('Error fetching compliance overview:', err);
      setError(err.message || 'Failed to load compliance overview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compliance & Risk Management</h1>
            <p className="text-gray-600 mt-1">Monitor compliance issues, risk scores, and audit trails</p>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading compliance data...</span>
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

        {/* Overview Content */}
        {!loading && !error && overview && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                label="Suspended Cleaners"
                value={overview.cleanerCompliance.suspendedCleaners}
                icon={<UserX className="w-5 h-5" />}
                highlight={overview.cleanerCompliance.suspendedCleaners > 0}
              />
              <KpiCard
                label="Blocked Customers"
                value={overview.customerRisk.blockedCustomers}
                icon={<Users className="w-5 h-5" />}
                highlight={overview.customerRisk.blockedCustomers > 0}
              />
              <KpiCard
                label="Open Compliance Issues"
                value={overview.issues.openIssues}
                icon={<FileWarning className="w-5 h-5" />}
                highlight={overview.issues.openIssues > 0}
              />
              <KpiCard
                label="Open Complaints"
                value={overview.complaints.openComplaints}
                icon={<AlertTriangle className="w-5 h-5" />}
                highlight={overview.complaints.openComplaints > 0}
              />
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm text-gray-500 mb-1">Revoked Certificates</p>
                <p className="text-2xl font-semibold text-red-600">
                  {overview.revokedCertificatesCount}
                </p>
                <p className="text-xs text-gray-500">
                  Cleaners who lost training clearance
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Issues by Severity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Severity</h3>
                <div className="space-y-3">
                  {overview.issues.bySeverity.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No open issues</p>
                  ) : (
                    overview.issues.bySeverity.map((item) => (
                      <div key={item.severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.severity >= 4
                                ? 'bg-red-500'
                                : item.severity === 3
                                ? 'bg-orange-500'
                                : 'bg-yellow-500'
                            }`}
                          />
                          <span className="text-sm text-gray-700">Severity {item.severity}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Complaints Trend (Placeholder) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints Trend (Last 30 Days)</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Chart placeholder - Complaints trend visualization</p>
                </div>
              </div>
            </div>

            {/* Risk Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Risk Customers */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risk Customers</h3>
                {overview.riskReport.topRiskCustomers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No high-risk customers</p>
                ) : (
                  <div className="space-y-3">
                    {overview.riskReport.topRiskCustomers.map((customer) => (
                      <div
                        key={customer.customerId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {customer.riskFlags.length > 0
                              ? customer.riskFlags.join(', ')
                              : 'No specific flags'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-red-600">
                            Risk: {customer.riskScore}
                          </span>
                          <a
                            href={`/admin/customers/${customer.customerId}`}
                            className="text-xs text-primary-600 hover:text-primary-800"
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Risk Cleaners */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risk Cleaners</h3>
                {overview.riskReport.topRiskCleaners.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No high-risk cleaners</p>
                ) : (
                  <div className="space-y-3">
                    {overview.riskReport.topRiskCleaners.map((cleaner) => (
                      <div
                        key={cleaner.cleanerId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{cleaner.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {cleaner.warningCount > 0 && `${cleaner.warningCount} warnings`}
                            {cleaner.openIssues > 0 &&
                              ` • ${cleaner.openIssues} open issue${cleaner.openIssues > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-amber-600">
                            {cleaner.warningCount} warnings
                          </span>
                          <a
                            href={`/admin/cleaners/${cleaner.cleanerId}`}
                            className="text-xs text-primary-600 hover:text-primary-800"
                          >
                            View →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Cleaners</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overview.cleanerCompliance.totalCleaners}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Missing Documents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overview.cleanerCompliance.missingDocuments}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Training Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overview.cleanerCompliance.trainingPending}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overview.customerRisk.averageRiskScore !== null
                      ? overview.customerRisk.averageRiskScore
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Certificate Revocations */}
            <section className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Recent Certificate Revocations
              </h3>
              {overview.lastRevokedCertificates.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No revoked certificates in the recent period.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-white">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Certificate
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Cleaner
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Revoked At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {overview.lastRevokedCertificates.map((cert) => (
                        <tr key={cert.id}>
                          <td className="px-4 py-2">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {cert.certificateId}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {cert.cleaner
                              ? cert.cleaner.name || cert.cleaner.email || 'Unknown cleaner'
                              : 'Unknown cleaner'}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {cert.revokedAt
                              ? new Date(cert.revokedAt).toLocaleString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}


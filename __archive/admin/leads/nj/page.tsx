"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import LeadManagementClient from './components/LeadManagementClient';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  zip: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  urgency: string | null;
  homeType: string | null;
  leadScore: number;
  leadTier: string;
  riskFlags: string[];
  status: string;
  depositPaid: boolean;
  createdAt: string;
}

interface Stats {
  total: number;
  tierA: number;
  tierB: number;
  tierC: number;
  new: number;
  active: number;
  qualified: number;
  rejected: number;
}

export default function NJLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    tierA: 0,
    tierB: 0,
    tierC: 0,
    new: 0,
    active: 0,
    qualified: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch New Jersey branch ID
    fetch('/api/admin/branches')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const njBranch = data.branches.find(
            (b: any) => b.slug === 'new-jersey' || b.slug === 'newark'
          );
          if (njBranch) {
            setBranchId(njBranch.id);
            loadLeads(njBranch.id);
          } else {
            setError('New Jersey branch not found');
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching branches:', err);
        setError('Failed to load branch information');
        setLoading(false);
      });
  }, []);

  const loadLeads = async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/leads?branchId=${branchId}`);
      const data = await response.json();

      if (data.success) {
        setLeads(data.leads || []);
        setStats(data.stats || stats);
      } else {
        throw new Error(data.error || 'Failed to fetch leads');
      }
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !branchId) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => branchId && loadLeads(branchId)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!branchId) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Branch not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Jersey Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track leads for New Jersey branch</p>
        </div>
        <LeadManagementClient
          branchId={branchId}
          initialLeads={leads}
          initialStats={stats}
        />
      </div>
    </AdminLayout>
  );
}

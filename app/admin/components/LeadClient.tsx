"use client";

import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, XCircle, DollarSign, TrendingUp, Users } from 'lucide-react';

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

interface LeadClientProps {
  branchId: string;
  branchName?: string;
  initialLeads: Lead[];
  initialStats: {
    total: number;
    tierA: number;
    tierB: number;
    tierC: number;
    new: number;
    active: number;
    qualified: number;
    rejected: number;
  };
}

export default function LeadClient({
  branchId,
  branchName = 'Branch',
  initialLeads,
  initialStats,
}: LeadClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [stats, setStats] = useState(initialStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        lead =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(lead => lead.leadTier === tierFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Sort
    if (sortBy === 'score') {
      filtered = [...filtered].sort((a, b) => b.leadScore - a.leadScore);
    } else {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return filtered;
  }, [leads, searchTerm, tierFilter, statusFilter, sortBy]);

  const handleApprove = async (leadId: string) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId }),
      });

      const data = await response.json();
      if (data.success) {
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: 'QUALIFIED' } : l));
        setStats({
          ...stats,
          qualified: stats.qualified + 1,
          active: stats.active - 1,
        });
      }
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (leadId: string) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId }),
      });

      const data = await response.json();
      if (data.success) {
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: 'REJECTED' } : l));
        setStats({
          ...stats,
          rejected: stats.rejected + 1,
          active: stats.active - 1,
        });
      }
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUALIFIED': return 'bg-green-100 text-green-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'NEW': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tier A</p>
              <p className="text-2xl font-bold text-green-600">{stats.tierA}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="text-2xl font-bold text-green-600">{stats.qualified}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="A">Tier A</option>
            <option value="B">Tier B</option>
            <option value="C">Tier C</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="ACTIVE">Active</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'date')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="score">Sort by Score</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                    {lead.email && (
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(lead.leadTier)}`}>
                      Tier {lead.leadTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.leadScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {lead.status !== 'QUALIFIED' && lead.status !== 'REJECTED' && (
                      <>
                        <button
                          onClick={() => handleApprove(lead.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(lead.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No leads found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


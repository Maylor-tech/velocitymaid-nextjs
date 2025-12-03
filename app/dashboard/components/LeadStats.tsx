'use client';

import { Users, TrendingUp, DollarSign, CheckCircle2 } from 'lucide-react';

interface LeadStats {
  leadsThisWeek: number;
  tierA: number;
  tierB: number;
  tierC: number;
  conversionRate: number;
}

interface LeadStatsProps {
  stats: LeadStats;
}

export default function LeadStats({ stats }: LeadStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Qualification - New Jersey</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Leads This Week</p>
          <p className="text-2xl font-bold text-gray-900">{stats.leadsThisWeek}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Tier A</p>
          <p className="text-2xl font-bold text-green-600">{stats.tierA}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Tier B</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.tierB}</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Tier C</p>
          <p className="text-2xl font-bold text-orange-600">{stats.tierC}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold text-purple-600">{stats.conversionRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}


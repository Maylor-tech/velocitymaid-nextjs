"use client";

import { useState } from 'react';
import { MessageSquare, Clock, MapPin, TrendingUp, Send } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  zip: string | null;
  leadTier: string;
  leadScore: number;
  urgency: string | null;
  afterHoursMessage: string | null;
  createdAt: string;
}

interface MorningQueueClientProps {
  branchId: string;
  initialLeads: Lead[];
}

export default function MorningQueueClient({
  branchId,
  initialLeads,
}: MorningQueueClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleReplyNow = async (leadId: string) => {
    setReplyingTo(leadId);
    
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/reply-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId }),
      });

      const data = await response.json();
      if (data.success) {
        // Remove lead from queue
        setLeads(leads.filter(l => l.id !== leadId));
        alert('Morning follow-up sent successfully!');
      } else {
        alert(`Failed to send: ${data.error}`);
      }
    } catch (error) {
      console.error('Reply now error:', error);
      alert('Failed to send follow-up');
    } finally {
      setReplyingTo(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-yellow-100 text-yellow-800';
      case 'C':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Waiting</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tier A</p>
              <p className="text-2xl font-bold text-green-600">
                {leads.filter(l => l.leadTier === 'A').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tier B</p>
              <p className="text-2xl font-bold text-yellow-600">
                {leads.filter(l => l.leadTier === 'B').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tier C</p>
              <p className="text-2xl font-bold text-orange-600">
                {leads.filter(l => l.leadTier === 'C').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
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
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                      {lead.zip && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {lead.zip}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(lead.leadTier)}`}>
                        Tier {lead.leadTier}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Score: {lead.leadScore}
                      </div>
                      {lead.urgency && (
                        <div className="text-xs text-gray-500">
                          {lead.urgency}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(lead.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-md">
                      {lead.afterHoursMessage ? (
                        <div className="bg-gray-50 rounded p-2 text-xs">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-600 mb-1">After-Hours Message:</p>
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {lead.afterHoursMessage.substring(0, 150)}
                                {lead.afterHoursMessage.length > 150 ? '...' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No message stored</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleReplyNow(lead.id)}
                      disabled={replyingTo === lead.id}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {replyingTo === lead.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Reply Now
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No leads waiting for morning follow-up. Great job! 🎉
          </div>
        )}
      </div>
    </div>
  );
}


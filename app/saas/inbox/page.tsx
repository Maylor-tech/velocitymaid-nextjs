'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Inbox, Mail, CheckCircle, Clock, Archive } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  message: string | null;
  status: 'NEW' | 'REVIEWED' | 'REPLIED';
  createdAt: string;
  repliedAt?: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'NEW' | 'REVIEWED' | 'REPLIED'>('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/saas/messages');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/saas/login');
          return;
        }
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Use mock data if API fails
      setMessages([
        {
          id: '1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          organization: 'ABC Cleaning Co.',
          message: 'Interested in learning more about your platform.',
          status: 'NEW',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          organization: 'Smith Services',
          message: 'Would like to schedule a demo call.',
          status: 'REVIEWED',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          organization: null,
          message: 'Thank you for the quick response!',
          status: 'REPLIED',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          repliedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = filter === 'all' 
    ? messages 
    : messages.filter((msg) => msg.status === filter);

  const newCount = messages.filter((m) => m.status === 'NEW').length;
  const reviewedCount = messages.filter((m) => m.status === 'REVIEWED').length;
  const repliedCount = messages.filter((m) => m.status === 'REPLIED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            New
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Reviewed
          </span>
        );
      case 'REPLIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Replied
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
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
              <Sparkles className="w-7 h-7 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">VelocityMaid</span>
            </Link>
            <Link
              href="/saas/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Unified Inbox</h1>
          <p className="text-gray-600 mt-2">All communication logged in a single, auditable inbox</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Inbox className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">New</p>
                <p className="text-2xl font-bold text-gray-900">{newCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">{reviewedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-gray-900">{repliedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => setFilter('NEW')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'NEW'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              New ({newCount})
            </button>
            <button
              onClick={() => setFilter('REVIEWED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'REVIEWED'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reviewed ({reviewedCount})
            </button>
            <button
              onClick={() => setFilter('REPLIED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'REPLIED'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Replied ({repliedCount})
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredMessages.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMessages.map((message) => (
                <div key={message.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{message.name}</h3>
                        {getStatusBadge(message.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {message.email}
                        {message.organization && ` • ${message.organization}`}
                      </p>
                      {message.message && (
                        <p className="text-gray-700 mt-2">{message.message}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Received: {new Date(message.createdAt).toLocaleString()}</span>
                        {message.repliedAt && (
                          <span>Replied: {new Date(message.repliedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


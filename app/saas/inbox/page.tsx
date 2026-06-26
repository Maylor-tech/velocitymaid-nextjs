'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Inbox, Mail, CheckCircle, Clock, Archive } from 'lucide-react';
import Link from 'next/link';
import { isPublicDemoMode } from '@/lib/env/publicFlags';

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'NEW' | 'REVIEWED' | 'REPLIED'>('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoadError(null);
      const response = await fetch('/api/saas/messages');
      if (response.status === 401) {
        router.push('/saas/login');
        return;
      }
      if (!response.ok) {
        if (isPublicDemoMode) {
          setMessages([]);
          return;
        }
        setLoadError('Unable to load messages. Please try again later.');
        setMessages([]);
        return;
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (isPublicDemoMode) {
        setMessages([]);
        return;
      }
      setLoadError('Unable to load messages. Please try again later.');
      setMessages([]);
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-vm-cyan-tint text-blue-800">
            New
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-vm-warning-bg text-yellow-800">
            Reviewed
          </span>
        );
      case 'REPLIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-vm-success-bg text-vm-success">
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vm-navy mx-auto mb-4"></div>
          <p className="text-vm-muted">Loading messages...</p>
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
          <h1 className="text-3xl font-bold text-vm-text">Unified Inbox</h1>
          <p className="text-vm-muted mt-2">All communication logged in a single, auditable inbox</p>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Inbox className="w-8 h-8 text-vm-cyan-dark mr-3" />
              <div>
                <p className="text-sm text-vm-muted">Total Messages</p>
                <p className="text-2xl font-bold text-vm-text">{messages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-vm-muted">New</p>
                <p className="text-2xl font-bold text-vm-text">{newCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-vm-muted">Reviewed</p>
                <p className="text-2xl font-bold text-vm-text">{reviewedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-vm-success mr-3" />
              <div>
                <p className="text-sm text-vm-muted">Replied</p>
                <p className="text-2xl font-bold text-vm-text">{repliedCount}</p>
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
                  ? 'bg-vm-navy text-white'
                  : 'bg-gray-100 text-vm-text hover:bg-gray-200'
              }`}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => setFilter('NEW')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'NEW'
                  ? 'bg-vm-navy text-white'
                  : 'bg-gray-100 text-vm-text hover:bg-gray-200'
              }`}
            >
              New ({newCount})
            </button>
            <button
              onClick={() => setFilter('REVIEWED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'REVIEWED'
                  ? 'bg-vm-navy text-white'
                  : 'bg-gray-100 text-vm-text hover:bg-gray-200'
              }`}
            >
              Reviewed ({reviewedCount})
            </button>
            <button
              onClick={() => setFilter('REPLIED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'REPLIED'
                  ? 'bg-vm-navy text-white'
                  : 'bg-gray-100 text-vm-text hover:bg-gray-200'
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
              <Inbox className="w-12 h-12 text-vm-muted mx-auto mb-4" />
              <p className="text-vm-muted">No messages found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMessages.map((message) => (
                <div key={message.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-vm-text">{message.name}</h3>
                        {getStatusBadge(message.status)}
                      </div>
                      <p className="text-sm text-vm-muted mb-1">
                        {message.email}
                        {message.organization && ` • ${message.organization}`}
                      </p>
                      {message.message && (
                        <p className="text-vm-text mt-2">{message.message}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-3 text-xs text-vm-muted">
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


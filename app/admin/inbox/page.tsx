/**
 * Admin Inbox Page
 * 
 * /admin/inbox
 * 
 * Centralized inbox for all contact messages
 * Governance-first design, audit-ready
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Building2, Users, Briefcase } from "lucide-react";

interface ContactMessage {
  id: string;
  role: string;
  name: string;
  email: string;
  organization: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

function statusColor(status: string) {
  if (status === "NEW") return "bg-blue-100 text-blue-800";
  if (status === "REVIEWED") return "bg-yellow-100 text-yellow-800";
  if (status === "REPLIED") return "bg-green-100 text-green-800";
  if (status === "ARCHIVED") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

function roleIcon(role: string) {
  if (role === "Investor") return <Briefcase className="w-4 h-4" />;
  if (role === "Partner / Operator") return <Building2 className="w-4 h-4" />;
  return <Users className="w-4 h-4" />;
}

export default function AdminInboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"NEW" | "REVIEWED" | "REPLIED" | "ARCHIVED" | "ALL">("ALL");

  useEffect(() => {
    // Check for status query param from dashboard on initial load
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      if (statusParam && ["NEW", "REVIEWED", "REPLIED", "ARCHIVED"].includes(statusParam)) {
        setActiveTab(statusParam as typeof activeTab);
      }
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusParam = activeTab !== "ALL" ? `?status=${activeTab}` : "";
      const res = await fetch(`/api/admin/contact-messages${statusParam}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        throw new Error(data.error || "Failed to fetch messages");
      }
    } catch (err: any) {
      console.error("Failed to fetch messages:", err);
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "ALL" as const, label: "All", count: null },
    { id: "NEW" as const, label: "New", count: messages.filter(m => m.status === "NEW").length },
    { id: "REVIEWED" as const, label: "Reviewed", count: messages.filter(m => m.status === "REVIEWED").length },
    { id: "REPLIED" as const, label: "Replied", count: messages.filter(m => m.status === "REPLIED").length },
    { id: "ARCHIVED" as const, label: "Archived", count: messages.filter(m => m.status === "ARCHIVED").length },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-md bg-red-50 border border-red-200 p-6">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const filteredMessages = activeTab === "ALL" 
    ? messages 
    : messages.filter(m => m.status === activeTab);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Inbox</h1>
        <p className="mt-2 text-sm text-gray-600">
          VelocityMaid treats communication as governance, not correspondence.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Message List */}
      <div className="divide-y border border-gray-200 rounded-md bg-white">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-500">No messages in this category.</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <button
              key={message.id}
              onClick={() => router.push(`/admin/inbox/${message.id}`)}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-1">
                    {roleIcon(message.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {message.name}
                      </p>
                      <span className="text-xs text-gray-500">({message.role})</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {message.organization || message.email}
                    </p>
                    {message.message && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {message.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor(
                      message.status
                    )}`}
                  >
                    {message.status}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}


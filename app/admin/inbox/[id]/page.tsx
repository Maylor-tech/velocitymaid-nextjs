/**
 * Admin Inbox Message Detail Page
 * 
 * /admin/inbox/[id]
 * 
 * Thread view for a single contact message
 * Governance-first, audit-ready
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, Send, CheckCircle2, Archive } from "lucide-react";

interface ContactReply {
  id: string;
  body: string;
  repliedByAdminId: string | null;
  sentViaEmail: boolean;
  createdAt: string;
}

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
  replies: ContactReply[];
}

export default function AdminInboxDetailPage() {
  const router = useRouter();
  const params = useParams();
  const messageId = params.id as string;

  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchMessage();
  }, [messageId]);

  const fetchMessage = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/contact-messages/${messageId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch message");
      }

      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
      } else {
        throw new Error(data.error || "Failed to fetch message");
      }
    } catch (err: any) {
      console.error("Failed to fetch message:", err);
      setError(err.message || "Failed to load message");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${messageId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: replyText.trim(),
          sendEmail: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send reply");
      }

      setReplyText("");
      fetchMessage(); // Refresh to show new reply
    } catch (err: any) {
      console.error("Failed to send reply:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${messageId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      fetchMessage(); // Refresh to show updated status
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-md bg-red-50 border border-red-200 p-6">
          <p className="text-red-800">{error || "Message not found"}</p>
          <button
            onClick={() => router.push("/admin/inbox")}
            className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Back to inbox
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/inbox"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to inbox
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Message Thread</h1>
      </div>

      {/* Original Message */}
      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-900">
                FROM: {message.name} ({message.role})
              </p>
              {message.organization && (
                <p className="text-sm text-gray-600">ORG: {message.organization}</p>
              )}
            </div>
            <span className="text-xs text-gray-500">
              RECEIVED: {new Date(message.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="text-sm text-gray-600">{message.email}</p>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-900 mb-2">MESSAGE:</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {message.message || "(No message provided)"}
          </p>
        </div>
      </div>

      {/* Replies */}
      {message.replies && message.replies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">REPLIES:</h2>
          <div className="space-y-4">
            {message.replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-gray-50 border border-gray-200 rounded-md p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">Admin</span>
                    {reply.sentViaEmail && (
                      <span className="text-xs text-gray-500">• Sent via email</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(reply.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                  {reply.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Box */}
      {message.status !== "ARCHIVED" && (
        <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Reply Box</h3>
          <textarea
            rows={6}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 mb-4"
            disabled={sendingReply}
          />
          <div className="flex items-center space-x-3">
            <button
              onClick={sendReply}
              disabled={sendingReply || !replyText.trim()}
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingReply ? "Sending…" : "Send Email"}
            </button>
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                defaultChecked
                className="mr-2"
                disabled={sendingReply}
              />
              Send via email
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {message.status === "NEW" && (
          <button
            onClick={() => updateStatus("REVIEWED")}
            disabled={updatingStatus}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Reviewed
          </button>
        )}
        {message.status !== "ARCHIVED" && (
          <button
            onClick={() => updateStatus("ARCHIVED")}
            disabled={updatingStatus}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </button>
        )}
      </div>
    </div>
  );
}


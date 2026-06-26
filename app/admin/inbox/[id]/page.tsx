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
import { Loader2, ArrowLeft, Mail, Send, CheckCircle2, Archive, Eye, MessageSquare } from "lucide-react";

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
  const [replySubject, setReplySubject] = useState("");
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    fetchMessage();
  }, [messageId]);

  const fetchMessage = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/messages/${messageId}`, {
        cache: "no-store",
        credentials: "include",
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

  const markAsRead = async () => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/messages/${messageId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to mark as read");
      }

      const data = await res.json();
      if (data.success && data.message) {
        setMessage(data.message); // Update message state
      } else {
        fetchMessage(); // Fallback: refresh to show updated status
      }
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent("messageStatusUpdated"));
    } catch (err: any) {
      console.error("Failed to mark as read:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/messages/${messageId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          body: replyText.trim(),
          subject: replySubject.trim() || undefined,
          sendEmail: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send reply");
      }

      // Success - show toast (simple alert for now)
      alert("Reply sent");
      
      setReplyText("");
      setReplySubject("");
      setShowReplyComposer(false);
      fetchMessage(); // Refresh to show new reply
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent("messageStatusUpdated"));
    } catch (err: any) {
      console.error("Failed to send reply:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const archiveMessage = async () => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/messages/${messageId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to archive message");
      }

      setShowArchiveConfirm(false);
      fetchMessage(); // Refresh to show updated status
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent("messageStatusUpdated"));
      
      // Optionally redirect back to inbox
      setTimeout(() => {
        router.push("/admin/inbox");
      }, 1000);
    } catch (err: any) {
      console.error("Failed to archive:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  function statusColor(status: string) {
    if (status === "NEW") return "bg-vm-cyan-tint text-blue-800";
    if (status === "REVIEWED") return "bg-vm-warning-bg text-yellow-800";
    if (status === "REPLIED") return "bg-vm-success-bg text-vm-success";
    if (status === "ARCHIVED") return "bg-gray-100 text-vm-text";
    return "bg-gray-100 text-vm-text";
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      NEW: "Unopened",
      REVIEWED: "Read, no reply yet",
      REPLIED: "Responded",
      ARCHIVED: "Closed / stored",
    };
    return labels[status] || status;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-vm-muted" />
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
          className="flex items-center text-sm text-vm-muted hover:text-vm-text mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to inbox
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-vm-text">Message Thread</h1>
          
          {/* Status Badge - Always Visible */}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor(
              message.status
            )}`}
          >
            {message.status} — {statusLabel(message.status)}
          </span>
        </div>
      </div>

      {/* Action Buttons - Top Right */}
      {message.status !== "ARCHIVED" && (
        <div className="flex items-center justify-end space-x-3 mb-6">
          {message.status === "NEW" && (
            <button
              onClick={markAsRead}
              disabled={updatingStatus}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-vm-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4 mr-2" />
              Mark as Read
            </button>
          )}
          <button
            onClick={() => setShowReplyComposer(!showReplyComposer)}
            disabled={updatingStatus || sendingReply}
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Reply
          </button>
          <button
            onClick={() => setShowArchiveConfirm(true)}
            disabled={updatingStatus || sendingReply}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-vm-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </button>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-vm-text mb-2">Archive this conversation?</h3>
            <p className="text-sm text-vm-muted mb-6">
              This will mark the conversation as archived. It will be removed from the main inbox but remain accessible via filter/search. The conversation history will never be deleted.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-medium text-vm-text hover:text-vm-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={archiveMessage}
                disabled={updatingStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original Message */}
      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-vm-text">
                FROM: {message.name} ({message.role})
              </p>
              {message.organization && (
                <p className="text-sm text-vm-muted">ORG: {message.organization}</p>
              )}
            </div>
            <span className="text-xs text-vm-muted">
              RECEIVED: {new Date(message.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="text-sm text-vm-muted">{message.email}</p>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium text-vm-text mb-2">MESSAGE:</p>
          <p className="text-sm text-vm-text whitespace-pre-wrap">
            {message.message || "(No message provided)"}
          </p>
        </div>
      </div>

      {/* Replies */}
      {message.replies && message.replies.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-vm-text mb-4">REPLIES:</h2>
          <div className="space-y-4">
            {message.replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-gray-50 border border-gray-200 rounded-md p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-vm-success" />
                    <span className="text-xs font-medium text-vm-text">Admin</span>
                    {reply.sentViaEmail && (
                      <span className="text-xs text-vm-muted">• Sent via email</span>
                    )}
                  </div>
                  <span className="text-xs text-vm-muted">
                    {new Date(reply.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-vm-text whitespace-pre-wrap mt-2">
                  {reply.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Reply Composer */}
      {showReplyComposer && message.status !== "ARCHIVED" && (
        <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
          <h3 className="text-sm font-medium text-vm-text mb-4">Reply</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-vm-text mb-1">
                Subject
              </label>
              <input
                type="text"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Re: Your message to VelocityMaid"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={sendingReply}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-vm-text mb-1">
                Message
              </label>
              <textarea
                rows={6}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={sendingReply}
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReplyComposer(false);
                  setReplyText("");
                  setReplySubject("");
                }}
                disabled={sendingReply}
                className="px-4 py-2 text-sm font-medium text-vm-text hover:text-vm-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={sendingReply || !replyText.trim()}
                className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingReply ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


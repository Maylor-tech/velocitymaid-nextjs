/**
 * Admin Contact Messages Page
 * 
 * /admin/contact
 * 
 * Admin-only page to review contact form submissions
 * Read-only, clean presentation
 */

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ContactReply {
  id: string;
  body: string;
  repliedByAdminId: string;
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
  replies: ContactReply[];
}

function statusColor(status: string) {
  if (status === "NEW") return "bg-vm-cyan-tint text-blue-800";
  if (status === "REVIEWED") return "bg-vm-warning-bg text-yellow-800";
  return "bg-vm-success-bg text-vm-success";
}

interface ReplyTemplate {
  id: string;
  title: string;
  role: string;
  body: string;
}

function ReplyBox({
  id,
  messageRole,
  onReplySent,
}: {
  id: string;
  messageRole: string;
  onReplySent: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);

  useEffect(() => {
    if (open) {
      // Fetch templates filtered by message role
      const roleParam = encodeURIComponent(messageRole);
      fetch(`/api/admin/contact-reply-templates?role=${roleParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTemplates(data.templates || []);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch templates:", err);
        });
    }
  }, [open, messageRole]);

  async function sendReply() {
    if (!text.trim()) {
      setError("Please enter a reply message");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/contact-messages/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send reply");
      }

      // Success - close box and refresh
      setOpen(false);
      setText("");
      setTemplates([]); // Clear templates on close
      onReplySent();
    } catch (err: any) {
      console.error("Failed to send reply:", err);
      setError(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-vm-muted hover:text-vm-text hover:underline"
      >
        Reply
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {templates.length > 0 && (
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          onChange={(e) => {
            const selected = templates.find((t) => t.id === e.target.value);
            if (selected) {
              setText(selected.body);
              setError(null);
            }
            // Reset select to placeholder
            e.target.value = "";
          }}
          defaultValue=""
          disabled={sending}
        >
          <option value="">Insert a reply template…</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      )}
      <textarea
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        placeholder="Write a reply…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        disabled={sending}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={sendReply}
          disabled={sending || !text.trim()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Sending…" : "Send reply"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setText("");
            setError(null);
          }}
          disabled={sending}
          className="text-sm text-vm-muted hover:text-vm-text hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/contact-messages", {
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

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      // Refresh messages to show updated status
      fetchMessages();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-vm-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-md bg-red-50 border border-red-200 p-6">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-vm-text">
        Contact Messages
      </h1>

      <p className="mt-2 text-vm-muted">
        Review contact form submissions from prospective clients, partners, and hosts.
      </p>

      <div className="mt-8 divide-y border border-gray-200 rounded-md">
        {messages.length === 0 ? (
          <div className="p-6 text-sm text-vm-muted text-center">
            No messages yet.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-vm-text">
                  {message.name}{" "}
                  <span className="text-sm text-vm-muted">({message.role})</span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColor(
                    message.status
                  )}`}
                >
                  {message.status}
                </span>
              </div>
              <div className="text-sm text-vm-muted mt-1">
                {message.email} {message.organization ? `· ${message.organization}` : ""}
              </div>
              {message.message && (
                <p className="mt-2 text-sm text-vm-text whitespace-pre-wrap">
                  {message.message}
                </p>
              )}
              {message.replies && message.replies.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
                  {message.replies.map((reply) => (
                    <div key={reply.id} className="text-sm">
                      <div className="text-xs text-vm-muted mb-1">
                        Reply sent {new Date(reply.createdAt).toLocaleString()}
                      </div>
                      <p className="text-vm-text whitespace-pre-wrap">
                        {reply.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-vm-muted">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
                <div className="space-x-2">
                  {message.status === "NEW" && (
                    <button
                      onClick={() => updateStatus(message.id, "REVIEWED")}
                      className="text-sm text-vm-muted hover:text-vm-text hover:underline"
                    >
                      Mark reviewed
                    </button>
                  )}
                  {message.status !== "REPLIED" && (
                    <>
                      <ReplyBox
                        id={message.id}
                        messageRole={message.role}
                        onReplySent={fetchMessages}
                      />
                      <button
                        onClick={() => updateStatus(message.id, "REPLIED")}
                        className="text-sm text-vm-muted hover:text-vm-text hover:underline"
                      >
                        Mark replied
                      </button>
                    </>
                  )}
                  <a
                    href={`/api/admin/contact-messages/${message.id}/export`}
                    className="text-sm text-vm-muted hover:text-vm-text hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Export PDF
                  </a>
                </div>
              </div>
              <InternalNotesBox messageId={message.id} notes={message.internalNotes || []} onNoteAdded={fetchMessages} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InternalNotesBox({
  messageId,
  notes,
  onNoteAdded,
}: {
  messageId: string;
  notes: ContactInternalNote[];
  onNoteAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveNote() {
    if (!text.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${messageId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to save note");
      }

      setText("");
      setOpen(false);
      onNoteAdded();
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      {notes.length > 0 && (
        <div className="mb-3 space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="text-sm italic text-vm-muted">
              <div className="text-xs text-vm-muted mb-1">
                {new Date(note.createdAt).toLocaleString()}
              </div>
              <p className="whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>
      )}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-vm-muted hover:text-vm-text hover:underline"
        >
          + Add internal note (not sent)
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Internal note (not sent to contact)…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            disabled={saving}
          />
          <div className="flex gap-2">
            <button
              onClick={saveNote}
              disabled={saving || !text.trim()}
              className="rounded-md bg-gray-900 px-3 py-1 text-xs text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save note"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setText("");
              }}
              disabled={saving}
              className="text-xs text-vm-muted hover:text-vm-text hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



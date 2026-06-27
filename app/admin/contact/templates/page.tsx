/**
 * Admin Reply Templates Management Page
 * 
 * /admin/contact/templates
 * 
 * Admin-only page to manage reply templates
 */

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ReplyTemplate {
  id: string;
  title: string;
  role: string;
  body: string;
  createdAt: string;
}

export default function ReplyTemplatesPage() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/contact-reply-templates");
      if (!res.ok) throw new Error("Failed to fetch templates");

      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        throw new Error(data.error || "Failed to fetch templates");
      }
    } catch (err: any) {
      console.error("Failed to fetch templates:", err);
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/admin/contact-reply-templates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete template");
      }

      fetchTemplates();
    } catch (err: any) {
      console.error("Failed to delete template:", err);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-vm-text">
            Reply Templates
          </h1>
          <p className="mt-2 text-vm-muted">
            Manage reply templates for contact messages.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Create Template
        </button>
      </div>

      {showCreate && (
        <TemplateForm
          onSave={() => {
            setShowCreate(false);
            fetchTemplates();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="mt-8 space-y-4">
        {templates.length === 0 ? (
          <div className="p-6 text-sm text-vm-muted text-center border border-gray-200 rounded-md">
            No templates yet. Create your first template above.
          </div>
        ) : (
          templates.map((template) =>
            editing === template.id ? (
              <TemplateForm
                key={template.id}
                template={template}
                onSave={() => {
                  setEditing(null);
                  fetchTemplates();
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div
                key={template.id}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-vm-text">
                        {template.title}
                      </h3>
                      <span className="text-xs text-vm-muted bg-gray-100 px-2 py-1 rounded">
                        {template.role}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-vm-text whitespace-pre-wrap">
                      {template.body}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditing(template.id)}
                      className="text-sm text-vm-muted hover:text-vm-text hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-sm text-red-600 hover:text-red-900 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

function TemplateForm({
  template,
  onSave,
  onCancel,
}: {
  template?: ReplyTemplate;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(template?.title || "");
  const [role, setRole] = useState(template?.role || "All");
  const [body, setBody] = useState(template?.body || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert("Title and body are required");
      return;
    }

    setSaving(true);
    try {
      const url = template
        ? `/api/admin/contact-reply-templates/${template.id}`
        : "/api/admin/contact-reply-templates";
      const method = template ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, role, body }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save template");
      }

      onSave();
    } catch (err: any) {
      console.error("Failed to save template:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-md p-4 mb-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-vm-text">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vm-text">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          >
            <option value="All">All</option>
            <option value="Investor">Investor</option>
            <option value="Partner / Operator">Partner / Operator</option>
            <option value="Advisor">Advisor</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-vm-text">
            Body
          </label>
          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : template ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-vm-text hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}


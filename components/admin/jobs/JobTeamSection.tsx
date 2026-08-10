'use client';

/**
 * Admin Job Team editor — persists via PUT /api/admin/jobs/[jobId]/team only.
 * Primary = cleanerIds[0] (portal/payout). Assistants = participation rows only.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Users, X } from 'lucide-react';
import {
  draftFromOrderedIds,
  validateAndBuildCleanerIds,
  type JobTeamDraft,
} from '@/lib/cleaners/jobTeamAssignment';

type CleanerOption = {
  id: string;
  name: string | null;
  email: string;
};

type TeamMember = {
  id: string;
  name: string | null;
  publicDisplayName?: string | null;
};

type Props = {
  jobId: string;
  cleaners: CleanerOption[];
  disabled?: boolean;
  onSaved?: (payload: {
    team: TeamMember[];
    primaryCleanerId: string | null;
  }) => void;
  onToast?: (message: string, type: 'success' | 'error') => void;
};

function labelFor(c: CleanerOption): string {
  return c.name?.trim() || c.email;
}

export default function JobTeamSection({
  jobId,
  cleaners,
  disabled = false,
  onSaved,
  onToast,
}: Props) {
  const [draft, setDraft] = useState<JobTeamDraft>({
    primaryCleanerId: null,
    assistantCleanerIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/team`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load job team');
      }
      const ids = (data.team as TeamMember[]).map((m) => m.id);
      setDraft(draftFromOrderedIds(ids));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load job team');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const assistantOptions = useMemo(() => {
    return cleaners.filter(
      (c) => c.id !== draft.primaryCleanerId && !draft.assistantCleanerIds.includes(c.id)
    );
  }, [cleaners, draft.primaryCleanerId, draft.assistantCleanerIds]);

  const primaryOptions = useMemo(() => {
    // Primary select shows all cleaners; choosing someone already assistant
    // will move them to primary and drop from assistants on change.
    return cleaners;
  }, [cleaners]);

  const setPrimary = (id: string) => {
    const nextPrimary = id || null;
    setDraft((prev) => ({
      primaryCleanerId: nextPrimary,
      assistantCleanerIds: nextPrimary
        ? prev.assistantCleanerIds.filter((a) => a !== nextPrimary)
        : [],
    }));
  };

  const addAssistant = (id: string) => {
    if (!id) return;
    setDraft((prev) => {
      if (!prev.primaryCleanerId) return prev;
      if (id === prev.primaryCleanerId) return prev;
      if (prev.assistantCleanerIds.includes(id)) return prev;
      return {
        ...prev,
        assistantCleanerIds: [...prev.assistantCleanerIds, id],
      };
    });
  };

  const removeAssistant = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      assistantCleanerIds: prev.assistantCleanerIds.filter((a) => a !== id),
    }));
  };

  const clearTeam = () => {
    setDraft({ primaryCleanerId: null, assistantCleanerIds: [] });
  };

  const save = async () => {
    const validated = validateAndBuildCleanerIds(draft);
    if (!validated.ok) {
      onToast?.(validated.error, 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/team`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerIds: validated.cleanerIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save job team');
      }
      const team = (data.team as TeamMember[]) || [];
      setDraft(draftFromOrderedIds(team.map((m) => m.id)));
      onSaved?.({
        team,
        primaryCleanerId: validated.cleanerIds[0] ?? null,
      });
      onToast?.(
        validated.cleanerIds.length === 0
          ? 'Job team cleared.'
          : 'Job team saved. Primary cleaner owns portal access and payout.',
        'success'
      );
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : 'Failed to save job team', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-2 mb-2">
        <Users className="h-5 w-5 text-vm-navy mt-0.5" />
        <div>
          <h2 className="text-xl font-semibold text-vm-text">Job Team</h2>
          <p className="mt-1 text-sm text-vm-muted">
            Primary cleaner owns the cleaner portal and payout. Additional team members are
            participation records only.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-vm-cyan" />
        </div>
      ) : loadError ? (
        <div className="mt-4">
          <p className="text-sm text-vm-danger">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadTeam()}
            className="mt-2 text-sm font-semibold text-vm-navy underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className={`mt-4 space-y-4 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-vm-text mb-1">
              Primary cleaner
            </label>
            <select
              value={draft.primaryCleanerId ?? ''}
              onChange={(e) => setPrimary(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={saving || disabled}
            >
              <option value="">— None (empty team) —</option>
              {primaryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {labelFor(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-1">
              Team members (assistants)
            </label>
            {draft.assistantCleanerIds.length === 0 ? (
              <p className="text-sm text-vm-muted mb-2">No assisting cleaners yet.</p>
            ) : (
              <ul className="mb-2 space-y-2">
                {draft.assistantCleanerIds.map((id, index) => {
                  const c = cleaners.find((x) => x.id === id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-vm-muted">
                          Team member {index + 1}
                        </span>
                        <p className="text-sm font-medium text-vm-text">
                          {c ? labelFor(c) : id}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssistant(id)}
                        className="rounded-lg border border-gray-200 p-1.5 text-vm-muted hover:text-vm-danger"
                        aria-label={`Remove ${c ? labelFor(c) : 'team member'}`}
                        disabled={saving || disabled}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <select
              value=""
              onChange={(e) => {
                addAssistant(e.target.value);
                e.target.value = '';
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              disabled={
                saving ||
                disabled ||
                !draft.primaryCleanerId ||
                assistantOptions.length === 0
              }
            >
              <option value="">
                {!draft.primaryCleanerId
                  ? 'Select a primary cleaner first'
                  : assistantOptions.length === 0
                    ? 'No more cleaners available'
                    : 'Add team member…'}
              </option>
              {assistantOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {labelFor(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-dashed border-gray-200 bg-vm-surface/40 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-vm-muted mb-1">
              Current order
            </p>
            {!draft.primaryCleanerId ? (
              <p className="text-sm text-vm-muted">Empty team</p>
            ) : (
              <ol className="list-decimal list-inside text-sm text-vm-text space-y-0.5">
                <li>
                  <span className="font-semibold">Primary cleaner:</span>{' '}
                  {labelFor(
                    cleaners.find((c) => c.id === draft.primaryCleanerId) || {
                      id: draft.primaryCleanerId,
                      name: null,
                      email: draft.primaryCleanerId,
                    }
                  )}
                </li>
                {draft.assistantCleanerIds.map((id) => (
                  <li key={id}>
                    <span className="font-semibold">Team member:</span>{' '}
                    {labelFor(
                      cleaners.find((c) => c.id === id) || {
                        id,
                        name: null,
                        email: id,
                      }
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || disabled}
              className="inline-flex items-center gap-2 px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save job team
            </button>
            <button
              type="button"
              onClick={clearTeam}
              disabled={saving || disabled || (!draft.primaryCleanerId && draft.assistantCleanerIds.length === 0)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-vm-text hover:bg-gray-50 disabled:opacity-50"
            >
              Clear team
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

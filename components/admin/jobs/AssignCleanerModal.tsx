"use client";

import { useState, useEffect } from 'react';
import { X, Search, User, Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Cleaner, Job } from './types';

interface AssignCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onSelectCleaner: (cleaner: Cleaner) => void;
  onOpenProfile: (cleaner: Cleaner) => void;
}

export default function AssignCleanerModal({
  isOpen,
  onClose,
  job,
  onSelectCleaner,
  onOpenProfile,
}: AssignCleanerModalProps) {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cleaners from API when modal opens
  useEffect(() => {
    if (!isOpen || !job) return;

    const controller = new AbortController();

    async function loadCleaners() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('jobId', job.id);
        if (job.branchId) params.set('branchId', job.branchId);

        const res = await fetch(`/api/admin/cleaners?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load cleaners');
        const data = await res.json();

        // Adjust based on actual shape of data
        let list: Cleaner[] = data.cleaners ?? data ?? [];

        // Phase 4 Part B: Sort by V3 assignment score if available, otherwise use matchScore
        list = list
          .map((c: any) => ({
            ...c,
            matchScore: c.matchScore ?? c.match_score ?? null,
          }))
          .sort((a, b) => {
            // Prefer V3 assignment score
            const scoreA = a.assignmentScore?.total ?? a.matchScore ?? 0;
            const scoreB = b.assignmentScore?.total ?? b.matchScore ?? 0;
            return scoreB - scoreA;
          });

        if (list.length > 0) {
          // Use V3 score for recommendation if available
          const topScore = list[0].assignmentScore?.total ?? list[0].matchScore ?? 0;
          list = list.map((c) => ({
            ...c,
            isRecommended:
              (c.assignmentScore?.total ?? c.matchScore ?? 0) === topScore && topScore > 0,
          }));
        }

        setCleaners(list);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError(err.message || 'Failed to load cleaners');
      } finally {
        setIsLoading(false);
      }
    }

    loadCleaners();
    return () => controller.abort();
  }, [isOpen, job]);

  // Filter cleaners by search term
  const filteredCleaners = cleaners.filter((cleaner) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      cleaner.name.toLowerCase().includes(term) ||
      cleaner.email?.toLowerCase().includes(term) ||
      cleaner.city?.toLowerCase().includes(term) ||
      cleaner.specialties?.some((s) => s.toLowerCase().includes(term))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-vm-border">
          <div>
            <h2 className="text-xl font-semibold text-vm-text">
              Assign Cleaner
            </h2>
            {job && (
              <p className="text-sm text-vm-muted mt-1">
                Job: {job.customerName} - {job.address}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-vm-muted" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-vm-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vm-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cleaners by name, email, city, or specialty..."
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vm-cyan focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-vm-surface rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Cleaners List */}
          {!isLoading && !error && filteredCleaners.length === 0 && (
            <div className="text-center py-12">
              <p className="text-vm-muted">
                {search ? 'No cleaners match your search' : 'No cleaners available'}
              </p>
            </div>
          )}

          {!isLoading && !error && filteredCleaners.length > 0 && (
            <div className="space-y-3">
              {filteredCleaners.map((cleaner) => (
                <div
                  key={cleaner.id}
                  className="bg-vm-surface rounded-lg p-4 hover:bg-gray-100 transition-colors border border-vm-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {cleaner.avatarUrl ? (
                          <img
                            src={cleaner.avatarUrl}
                            alt={cleaner.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-vm-surface flex items-center justify-center">
                            <User className="w-6 h-6 text-vm-cyan-dark" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-vm-text">{cleaner.name}</h3>
                          {cleaner.isRecommended && (
                            <span className="px-2 py-0.5 bg-vm-success-bg text-green-700 text-xs font-semibold rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        {cleaner.email && (
                          <p className="text-sm text-vm-muted truncate">{cleaner.email}</p>
                        )}
                        {cleaner.city && (
                          <p className="text-xs text-vm-muted">{cleaner.city}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          {cleaner.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium text-vm-text">
                                {cleaner.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {cleaner.completedJobs !== undefined && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-vm-muted">
                                {cleaner.completedJobs} jobs
                              </span>
                            </div>
                          )}
                          {/* Phase 4 Part B: Show V3 assignment score */}
                          {cleaner.assignmentScore ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 bg-vm-surface text-vm-cyan-dark rounded-full font-medium">
                                Score {cleaner.assignmentScore.total}/100
                              </span>
                              {cleaner.level && (
                                <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full font-medium">
                                  {cleaner.level.label}
                                </span>
                              )}
                            </div>
                          ) : cleaner.matchScore !== undefined && cleaner.matchScore > 0 ? (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                              Match {cleaner.matchScore}/100
                            </span>
                          ) : null}
                        </div>
                        {cleaner.specialties && cleaner.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cleaner.specialties.map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-vm-surface text-vm-cyan-dark text-xs rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        )}
                        {cleaner.availability === false && cleaner.reason && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {cleaner.reason}
                          </p>
                        )}
                        {cleaner.timeConflict && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠ Time conflict with another job
                          </p>
                        )}
                        {/* Phase 4 Part B: Show score breakdown */}
                        {cleaner.assignmentScore && (
                          <div className="mt-2 p-2 bg-white rounded border border-vm-border">
                            <p className="text-xs font-semibold text-vm-text mb-1">
                              Assignment Score Breakdown
                            </p>
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-vm-muted">Availability:</span>
                                <span className="font-medium">{cleaner.assignmentScore.breakdown.availability}/30</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vm-muted">Distance:</span>
                                <span className="font-medium">{cleaner.assignmentScore.breakdown.distance}/20</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vm-muted">Level:</span>
                                <span className="font-medium">{cleaner.assignmentScore.breakdown.level}/20</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-vm-muted">Performance:</span>
                                <span className="font-medium">{cleaner.assignmentScore.breakdown.performance}/20</span>
                              </div>
                              <div className="flex justify-between col-span-2">
                                <span className="text-vm-muted">Compliance:</span>
                                <span className="font-medium">{cleaner.assignmentScore.breakdown.compliance}/10</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onOpenProfile(cleaner)}
                        className="text-sm text-vm-cyan-dark hover:text-vm-navy font-medium px-3 py-1.5 hover:bg-vm-surface rounded-lg transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => onSelectCleaner(cleaner)}
                        disabled={cleaner.availability === false}
                        className="inline-flex items-center rounded-full bg-vm-navy px-3 py-1.5 text-sm font-semibold text-white hover:bg-vm-navy disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-vm-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-vm-text hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

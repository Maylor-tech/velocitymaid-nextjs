"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Star,
  Clock,
  TrendingUp,
  Shield,
  AlertTriangle,
  WalletCards,
  CheckCircle2,
  FileWarning,
  User as UserIcon,
  Loader2,
  ExternalLink,
  Edit,
  GraduationCap,
  Calendar,
  Award,
  Gift,
  Plus,
} from 'lucide-react';
import { Cleaner, CleanerProfileDetails } from './types';
import AvailabilityEditorModal from './AvailabilityEditorModal';
import AddIncentiveModal from './AddIncentiveModal';
import { getLevelBadgeColor } from '@/lib/cleaner-level';

interface CleanerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cleaner: Cleaner | null;
  onAssign: (cleaner: Cleaner) => void;
}

export default function CleanerProfileDrawer({
  isOpen,
  onClose,
  cleaner,
  onAssign,
}: CleanerProfileDrawerProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<CleanerProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<{
    overallStatus: string;
    lastModuleSlug: string | null;
    updatedAt: string;
  } | null>(null);
  const [certification, setCertification] = useState<{
    status: string;
    modulesCompleted: number;
    modulesTotal: number;
    quizScore: number | null;
    certifiedAt: string | null;
    modules?: Array<{
      slug: string;
      title: string;
      completed: boolean;
      quizScore: number | null;
    }>;
  } | null>(null);
  const [updatingTraining, setUpdatingTraining] = useState(false);
  const [certificates, setCertificates] = useState<Array<{
    id: string;
    certificateId: string;
    status: string;
    issuedAt: string;
    revokedAt: string | null;
    trainingStatus: {
      id: string;
      overallStatus: string;
    } | null;
  }>>([]);
  const [certActionLoadingId, setCertActionLoadingId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    workingDays: string[];
    timeRanges: Array<{ start: string; end: string }>;
    maxDailyJobs: number;
    blackoutDates: string[];
    isActive: boolean;
  } | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [documents, setDocuments] = useState<{
    id: { url: string | null; status: string; uploadedAt: string | null };
    references: { url: string | null; status: string; uploadedAt: string | null };
    policeRecord: { url: string | null; status: string; uploadedAt: string | null };
    proofOfAddress: { url: string | null; status: string; uploadedAt: string | null };
    selfie: { url: string | null; status: string; uploadedAt: string | null };
  } | null>(null);
  const [incentives, setIncentives] = useState<Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    earnedAt: string | null;
    createdAt: string;
  }>>([]);
  const [isAddIncentiveModalOpen, setIsAddIncentiveModalOpen] = useState(false);
  const [cleanerCompliance, setCleanerCompliance] = useState<{
    isSuspended: boolean;
    warningCount: number;
    complianceStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
    issues: Array<{
      id: string;
      type: string;
      severity: number;
      status: string;
      summary: string;
      createdAt: string;
    }>;
  } | null>(null);
  const [updatingCompliance, setUpdatingCompliance] = useState(false);

  // Load certificates function
  const loadCertificates = useCallback(async (cleanerId: string) => {
    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}/certificates`);
      const data = await res.json();
      if (data.success && data.certificates) {
        setCertificates(data.certificates);
      }
    } catch (e) {
      console.error('Failed to load certificates', e);
    }
  }, []);

  // Fetch detailed profile when drawer opens
  useEffect(() => {
    if (!isOpen || !cleaner) return;

    const controller = new AbortController();

    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/cleaners/${cleaner.id}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load cleaner profile');
        const data = await res.json();

        // Adapt to actual API shape
        const normalized: CleanerProfileDetails = {
          cleaner: {
            ...(data.cleaner ?? data),
            id: (data.cleaner ?? data).id,
          },
          ratingsSummary: data.ratings
            ? {
                averageRating: data.ratings.average ?? null,
                totalRatings: data.ratings.count ?? 0,
                recentRatings: (data.ratings.recent ?? []).map((r: any) => ({
                  rating: r.rating,
                  comment: r.comment ?? null,
                  customerName: r.customerName ?? null,
                  createdAt: r.createdAt,
                })),
              }
            : undefined,
          performance: data.performance
            ? {
                completionRate: data.performance.completionRate ?? null,
                productivityScore: data.performance.productivityScore ?? null,
              }
            : undefined,
          payouts: data.payouts
            ? {
                totalPaid: data.payouts.totalPaid ?? 0,
                recentPayouts: (data.payouts.latest ?? []).map((p: any) => ({
                  id: p.id,
                  amount: p.totalAmount ?? 0,
                  currency: p.currency ?? 'USD',
                  period: `${new Date(p.periodStart).toLocaleDateString()} - ${new Date(p.periodEnd).toLocaleDateString()}`,
                  status: p.status ?? 'PENDING',
                })),
              }
            : undefined,
          compliance: data.compliance
            ? {
                status: data.compliance.status ?? 'COMPLIANT',
                issues: data.compliance.issues ?? [],
              }
            : undefined,
          level: data.level || undefined,
        };

        setProfile(normalized);

        // Also fetch training status
        try {
          const trainingRes = await fetch(`/api/admin/cleaners/${cleaner.id}/training`, {
            signal: controller.signal,
          });
          if (trainingRes.ok) {
            const trainingData = await trainingRes.json();
            if (trainingData.success && trainingData.trainingStatus) {
              setTrainingStatus(trainingData.trainingStatus);
            }
            if (trainingData.success && trainingData.certification) {
              setCertification(trainingData.certification);
            }
          }
        } catch (trainingErr) {
          // Training status is optional, don't fail the whole load
          console.warn('Failed to load training status:', trainingErr);
        }

        // Also fetch certificates
        await loadCertificates(cleaner.id);

        // Also fetch availability
        try {
          const availabilityRes = await fetch(`/api/admin/cleaners/${cleaner.id}/availability`, {
            signal: controller.signal,
          });
          if (availabilityRes.ok) {
            const availabilityData = await availabilityRes.json();
            if (availabilityData.success && availabilityData.availability) {
              setAvailability(availabilityData.availability);
            }
          }
        } catch (availabilityErr) {
          // Availability is optional, don't fail the whole load
          console.warn('Failed to load availability:', availabilityErr);
        }

        // Also fetch documents
        try {
          const documentsRes = await fetch(`/api/admin/cleaners/${cleaner.id}/documents`, {
            signal: controller.signal,
          });
          if (documentsRes.ok) {
            const documentsData = await documentsRes.json();
            if (documentsData.success && documentsData.documents) {
              setDocuments(documentsData.documents);
            }
          }
        } catch (documentsErr) {
          // Documents are optional, don't fail the whole load
          console.warn('Failed to load documents:', documentsErr);
        }

        // Also fetch incentives (Phase 4 Part C)
        try {
          const incentivesRes = await fetch(`/api/admin/cleaners/${cleaner.id}/incentives`, {
            signal: controller.signal,
          });
          if (incentivesRes.ok) {
            const incentivesData = await incentivesRes.json();
            if (incentivesData.success && incentivesData.incentives) {
              setIncentives(incentivesData.incentives);
            }
          }
        } catch (incentivesErr) {
          // Incentives are optional, don't fail the whole load
          console.warn('Failed to load incentives:', incentivesErr);
        }

        // Also fetch compliance status (Phase 5 Step 3)
        try {
          const complianceRes = await fetch(`/api/admin/cleaners/${cleaner.id}/compliance`, {
            signal: controller.signal,
          });
          if (complianceRes.ok) {
            const complianceData = await complianceRes.json();
            if (complianceData.success) {
              setCleanerCompliance({
                isSuspended: complianceData.isSuspended,
                warningCount: complianceData.warningCount,
                complianceStatus: complianceData.complianceStatus,
                issues: complianceData.issues || [],
              });
            }
          }
        } catch (complianceErr) {
          // Compliance is optional, don't fail the whole load
          console.warn('Failed to load compliance:', complianceErr);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError(err.message || 'Failed to load cleaner profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
    return () => controller.abort();
  }, [isOpen, cleaner, loadCertificates]);

  // Certificate action handler (revoke/restore)
  async function handleCertificateAction(
    certId: string,
    action: 'revoke' | 'restore',
  ) {
    if (!cleaner) return;

    const verb = action === 'revoke' ? 'revoke this certificate' : 'restore this certificate';

    const confirmed = window.confirm(`Are you sure you want to ${verb}?`);
    if (!confirmed) return;

    try {
      setCertActionLoadingId(certId);
      const res = await fetch(
        `/api/admin/cleaners/${cleaner.id}/certificates/${certId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to update certificate');
        return;
      }

      await loadCertificates(cleaner.id);
    } catch (error) {
      console.error('Certificate action error:', error);
      alert('Failed to update certificate');
    } finally {
      setCertActionLoadingId(null);
    }
  }

  const handleUpdateTrainingStatus = async (newStatus: string) => {
    if (!cleaner) return;

    setUpdatingTraining(true);
    try {
      const res = await fetch(`/api/admin/cleaners/${cleaner.id}/training`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overallStatus: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update training status');
      const data = await res.json();

      if (data.success) {
        setTrainingStatus(data.trainingStatus);
      }
    } catch (err: any) {
      console.error('Error updating training status:', err);
      alert('Failed to update training status. Please try again.');
    } finally {
      setUpdatingTraining(false);
    }
  };

  const getTrainingStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-vm-warning-bg text-yellow-800', label: 'Pending' },
      IN_REVIEW: { color: 'bg-vm-cyan-tint text-blue-800', label: 'In Review' },
      PASSED: { color: 'bg-vm-success-bg text-vm-success', label: 'Passed' },
      ACTIVE: { color: 'bg-purple-100 text-purple-800', label: 'Active' },
      NOT_STARTED: { color: 'bg-vm-surface text-vm-text', label: 'Not Started' },
    };

    const config = statusConfig[status] || { color: 'bg-vm-surface text-vm-text', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!isOpen || !cleaner) return null;

  const stats = profile?.performance;
  const compliance = profile?.compliance;
  const payouts = profile?.payouts;
  const ratings = profile?.ratingsSummary;
  const level = profile?.level;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="relative w-full max-w-md bg-white shadow-xl border-l border-vm-border flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-vm-border">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {cleaner.avatarUrl ? (
              <img
                src={cleaner.avatarUrl}
                alt={cleaner.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-vm-surface flex items-center justify-center">
                <span className="text-2xl font-semibold text-vm-cyan-dark">
                  {cleaner.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-vm-text">{cleaner.name}</h2>
              <div className="flex items-center gap-1 mt-1">
                {ratings?.averageRating ? (
                  <>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-vm-text">
                      {ratings.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-vm-muted ml-2">
                      ({ratings.totalRatings} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-vm-muted">Not yet rated</span>
                )}
              </div>
              {cleaner.completedJobs !== undefined && (
                <p className="text-xs text-vm-muted mt-1">
                  {cleaner.completedJobs} completed jobs
                </p>
              )}
              {level && (
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getLevelBadgeColor(
                      level.level
                    )}`}
                  >
                    <Award className="w-3 h-3" />
                    Level {level.level} - {level.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-vm-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-vm-surface rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Profile Content */}
          {!isLoading && !error && profile && (
            <>
              {/* Cleaner Compliance Status - Phase 5 Step 3 */}
              {cleanerCompliance && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-3">
                    Compliance Status
                  </h3>
                  <div className="bg-vm-surface rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-vm-cyan-dark" />
                        <span className="text-sm font-semibold text-vm-text">Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cleanerCompliance.complianceStatus === 'COMPLIANT' ? (
                          <span className="px-3 py-1 bg-vm-success-bg text-vm-success text-xs font-semibold rounded-full">
                            Compliant
                          </span>
                        ) : cleanerCompliance.complianceStatus === 'AT_RISK' ? (
                          <span className="px-3 py-1 bg-vm-warning-bg text-yellow-800 text-xs font-semibold rounded-full">
                            At Risk
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-vm-danger-bg text-red-800 text-xs font-semibold rounded-full">
                            Non-Compliant
                          </span>
                        )}
                        {cleanerCompliance.isSuspended && (
                          <span className="px-3 py-1 bg-vm-danger-bg text-red-800 text-xs font-semibold rounded-full">
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-vm-border">
                      <span className="text-xs text-vm-muted">Warning Count</span>
                      <span className="text-sm font-semibold text-vm-text">
                        {cleanerCompliance.warningCount}
                      </span>
                    </div>
                    {cleanerCompliance.issues.length > 0 && (
                      <div className="pt-2 border-t border-vm-border">
                        <p className="text-xs font-semibold text-vm-text mb-2">Recent Issues</p>
                        <div className="space-y-2">
                          {cleanerCompliance.issues.slice(0, 5).map((issue) => (
                            <div
                              key={issue.id}
                              className="flex items-start justify-between p-2 bg-white rounded border border-vm-border"
                            >
                              <div className="flex-1">
                                <p className="text-xs font-medium text-vm-text">{issue.summary}</p>
                                <p className="text-xs text-vm-muted mt-1">
                                  {new Date(issue.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  issue.severity >= 4
                                    ? 'bg-vm-danger-bg text-red-800'
                                    : issue.severity === 3
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-vm-warning-bg text-yellow-800'
                                }`}
                              >
                                {issue.severity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-vm-border">
                      <button
                        onClick={async () => {
                          if (!cleaner) return;
                          setUpdatingCompliance(true);
                          try {
                            const res = await fetch(`/api/admin/cleaners/${cleaner.id}/compliance`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                isSuspended: !cleanerCompliance.isSuspended,
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              if (data.success) {
                                // Refresh compliance
                                const complianceRes = await fetch(
                                  `/api/admin/cleaners/${cleaner.id}/compliance`
                                );
                                if (complianceRes.ok) {
                                  const complianceData = await complianceRes.json();
                                  if (complianceData.success) {
                                    setCleanerCompliance({
                                      isSuspended: complianceData.isSuspended,
                                      warningCount: complianceData.warningCount,
                                      complianceStatus: complianceData.complianceStatus,
                                      issues: complianceData.issues || [],
                                    });
                                  }
                                }
                              }
                            }
                          } catch (err) {
                            console.error('Error updating compliance:', err);
                          } finally {
                            setUpdatingCompliance(false);
                          }
                        }}
                        disabled={updatingCompliance}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          cleanerCompliance.isSuspended
                            ? 'bg-vm-success text-white hover:bg-vm-success'
                            : 'bg-vm-danger text-white hover:bg-vm-danger'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingCompliance ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : cleanerCompliance.isSuspended ? (
                          'Unsuspend Cleaner'
                        ) : (
                          'Suspend Cleaner'
                        )}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Compliance & Documents Section - Phase 3 Part D */}
              {compliance && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-3">
                    Compliance & Documents
                  </h3>
                  <div className="bg-vm-surface rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {compliance.status === 'COMPLIANT' ? (
                        <>
                          <Shield className="h-5 w-5 text-vm-success" />
                          <span className="px-3 py-1 bg-vm-success-bg text-vm-success text-sm font-semibold rounded-full">
                            Compliant
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-sm font-semibold rounded-full">
                            {compliance.status === 'MISSING_TRAINING'
                              ? 'Missing Training'
                              : 'Missing Documents'}
                          </span>
                        </>
                      )}
                    </div>
                    {compliance.issues.length > 0 && (
                      <ul className="space-y-1">
                        {compliance.issues.map((issue, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-vm-text"
                          >
                            <FileWarning className="mt-0.5 h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Documents List */}
                    {documents && (
                      <div className="pt-3 border-t border-vm-border space-y-2">
                        <p className="text-xs font-semibold text-vm-text mb-2">Documents</p>
                        {[
                          { key: 'id', label: 'ID Document' },
                          { key: 'references', label: 'References' },
                          { key: 'policeRecord', label: 'Police Record' },
                          { key: 'proofOfAddress', label: 'Proof of Address' },
                          { key: 'selfie', label: 'Selfie Verification' },
                        ].map((doc) => {
                          const docData = documents[doc.key as keyof typeof documents];
                          const getStatusBadge = (status: string) => {
                            if (status === 'APPROVED')
                              return (
                                <span className="px-2 py-0.5 bg-vm-success-bg text-vm-success text-[10px] font-medium rounded">
                                  Approved
                                </span>
                              );
                            if (status === 'SUBMITTED')
                              return (
                                <span className="px-2 py-0.5 bg-vm-cyan-tint text-blue-800 text-[10px] font-medium rounded">
                                  Submitted
                                </span>
                              );
                            return (
                              <span className="px-2 py-0.5 bg-vm-surface text-vm-muted text-[10px] font-medium rounded">
                                Missing
                              </span>
                            );
                          };

                          return (
                            <div
                              key={doc.key}
                              className="flex items-center justify-between p-2 bg-white rounded border border-vm-border"
                            >
                              <div className="flex items-center gap-2">
                                <FileWarning className="w-3.5 h-3.5 text-vm-muted" />
                                <span className="text-xs text-vm-text">{doc.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(docData.status)}
                                {docData.url && (
                                  <a
                                    href={docData.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-vm-cyan-dark hover:text-vm-navy"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Availability Section - Phase 3 Part C */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted">
                    Availability
                  </h3>
                  {availability && (
                    <button
                      onClick={() => setIsAvailabilityModalOpen(true)}
                      className="p-1.5 text-vm-cyan-dark hover:bg-vm-surface rounded-lg transition-colors"
                      title="Edit availability"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {availability ? (
                  <div className="bg-vm-surface rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-vm-cyan-dark" />
                        <span className="text-sm font-semibold text-vm-text">Status</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          availability.isActive
                            ? 'bg-vm-success-bg text-vm-success'
                            : 'bg-vm-surface text-vm-text'
                        }`}
                      >
                        {availability.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-vm-muted mb-1">Working Days</p>
                      <div className="flex flex-wrap gap-1">
                        {availability.workingDays.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-0.5 bg-vm-surface text-vm-cyan-dark text-xs rounded"
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-vm-muted mb-1">Time Ranges</p>
                      <div className="space-y-1">
                        {availability.timeRanges.map((range, idx) => (
                          <p key={idx} className="text-xs text-vm-text">
                            {range.start} - {range.end}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-vm-border">
                      <span className="text-xs text-vm-muted">Max Daily Jobs</span>
                      <span className="text-sm font-semibold text-vm-text">
                        {availability.maxDailyJobs}
                      </span>
                    </div>
                    {availability.blackoutDates.length > 0 && (
                      <div>
                        <p className="text-xs text-vm-muted mb-1">
                          Blackout Dates ({availability.blackoutDates.length})
                        </p>
                        <p className="text-xs text-vm-muted">
                          {availability.blackoutDates
                            .slice(0, 3)
                            .map((d) => new Date(d).toLocaleDateString())
                            .join(', ')}
                          {availability.blackoutDates.length > 3 && '...'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-vm-surface rounded-lg p-4 text-center">
                    <p className="text-sm text-vm-muted">No availability settings</p>
                    <button
                      onClick={() => setIsAvailabilityModalOpen(true)}
                      className="mt-2 text-xs text-vm-cyan-dark hover:text-vm-navy"
                    >
                      Set Availability
                    </button>
                  </div>
                )}
              </section>

              {/* VelocityMaid certification (MVP) */}
              {certification && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-3">
                    VelocityMaid Certification
                  </h3>
                  <div className="bg-vm-surface rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-vm-text">Status</span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          certification.status === 'CERTIFIED'
                            ? 'bg-vm-success-bg text-vm-success'
                            : certification.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-vm-surface text-vm-text'
                        }`}
                      >
                        {certification.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-vm-muted">
                      Modules: {certification.modulesCompleted} / {certification.modulesTotal}
                    </p>
                    {certification.quizScore != null && (
                      <p className="text-xs text-vm-muted">Quiz score: {certification.quizScore}%</p>
                    )}
                    {certification.certifiedAt && (
                      <p className="text-xs text-vm-muted">
                        Certified: {new Date(certification.certifiedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Training Status Section - Phase 3 Part B */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted">
                    Training Status
                  </h3>
                  {trainingStatus && (
                    <button
                      onClick={() => {
                        const currentStatus = trainingStatus.overallStatus;
                        const statuses = ['PENDING', 'IN_REVIEW', 'PASSED', 'ACTIVE'];
                        const currentIndex = statuses.indexOf(currentStatus);
                        const nextStatus = statuses[currentIndex + 1] || statuses[0];
                        handleUpdateTrainingStatus(nextStatus);
                      }}
                      disabled={updatingTraining}
                      className="p-1.5 text-vm-cyan-dark hover:bg-vm-surface rounded-lg transition-colors disabled:opacity-50"
                      title="Update training status"
                    >
                      {updatingTraining ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Edit className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {trainingStatus ? (
                  <div className="bg-vm-surface rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-vm-cyan-dark" />
                        <span className="text-sm font-semibold text-vm-text">Status</span>
                      </div>
                      {getTrainingStatusBadge(trainingStatus.overallStatus)}
                    </div>
                    {trainingStatus.lastModuleSlug && (
                      <p className="text-xs text-vm-muted mt-2">
                        Last module: {trainingStatus.lastModuleSlug}
                      </p>
                    )}
                    <p className="text-xs text-vm-muted mt-1">
                      Updated: {new Date(trainingStatus.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3 pt-3 border-t border-vm-border">
                      <p className="text-xs text-vm-muted mb-2">Quick Update:</p>
                      <div className="flex flex-wrap gap-2">
                        {['PENDING', 'IN_REVIEW', 'PASSED', 'ACTIVE'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateTrainingStatus(status)}
                            disabled={updatingTraining || trainingStatus.overallStatus === status}
                            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                              trainingStatus.overallStatus === status
                                ? 'bg-vm-navy text-white'
                                : 'bg-white text-vm-text hover:bg-gray-100 border border-gray-300'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-vm-surface rounded-lg p-4 text-center">
                    <p className="text-sm text-vm-muted">No training status recorded</p>
                  </div>
                )}
              </section>

              {/* Training Certificates */}
              <section className="mt-6 border-t pt-4">
                <h3 className="text-md font-semibold mb-2">Training Certificates</h3>

                {certificates.length === 0 && (
                  <p className="text-sm text-vm-muted">No certificates issued.</p>
                )}

                <div className="space-y-2">
                  {certificates.map((cert) => {
                    const isRevoked = cert.status === 'REVOKED';
                    return (
                      <div
                        key={cert.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between rounded border p-3 bg-vm-surface"
                      >
                        <div>
                          <p className="font-medium">
                            Certificate: {cert.certificateId}
                          </p>
                          <p className="text-sm text-vm-muted">
                            Training Status: {cert.trainingStatus?.overallStatus ?? 'N/A'}
                          </p>
                          <p className="text-xs text-vm-muted">
                            Issued: {new Date(cert.issuedAt).toLocaleString()}
                            {cert.revokedAt && (
                              <> · Revoked: {new Date(cert.revokedAt).toLocaleString()}</>
                            )}
                          </p>
                        </div>

                        <div className="mt-2 md:mt-0 flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              isRevoked
                                ? 'bg-vm-danger-bg text-red-700'
                                : 'bg-vm-success-bg text-vm-success'
                            }`}
                          >
                            {isRevoked ? 'Revoked' : 'Active'}
                          </span>

                          <button
                            onClick={() =>
                              handleCertificateAction(cert.id, isRevoked ? 'restore' : 'revoke')
                            }
                            disabled={certActionLoadingId === cert.id}
                            className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
                              isRevoked
                                ? 'bg-vm-navy text-white hover:bg-vm-navy'
                                : 'bg-vm-danger text-white hover:bg-vm-danger'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {certActionLoadingId === cert.id
                              ? 'Working...'
                              : isRevoked
                              ? 'Restore'
                              : 'Revoke'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Cleaner Level Section - Phase 3 Part E */}
              {level && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-3">
                    Cleaner Level
                  </h3>
                  <div className="bg-vm-surface rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-vm-cyan-dark" />
                        <div>
                          <p className="text-sm font-semibold text-vm-text">
                            Level {level.level} - {level.label}
                          </p>
                          <p className="text-xs text-vm-muted">{level.description}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelBadgeColor(
                          level.level
                        )}`}
                      >
                        {level.label}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-vm-border">
                      <p className="text-xs font-semibold text-vm-text mb-2">Requirements</p>
                      <ul className="space-y-1">
                        {level.requirements.map((req, idx) => (
                          <li key={idx} className="text-xs text-vm-muted flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-vm-success mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-3 border-t border-vm-border">
                      <p className="text-xs font-semibold text-vm-text mb-2">Benefits</p>
                      <ul className="space-y-1">
                        {level.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-xs text-vm-muted flex items-start gap-2">
                            <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* Scorecard Section */}
              {stats && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-3">
                    Performance Scorecard
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {/* Completion Rate */}
                    <div className="bg-vm-surface rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-vm-cyan-dark" />
                          <span className="text-sm font-semibold text-vm-text">
                            Completion Rate
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-vm-text">
                          {stats.completionRate !== null
                            ? `${stats.completionRate.toFixed(0)}%`
                            : '--'}
                        </span>
                      </div>
                      {stats.completionRate !== null && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-vm-navy h-2 rounded-full"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Productivity Score */}
                    <div className="bg-vm-surface rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-vm-success" />
                          <span className="text-sm font-semibold text-vm-text">
                            Productivity Score
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-vm-text">
                          {stats.productivityScore !== null
                            ? `${stats.productivityScore.toFixed(0)}/100`
                            : '--'}
                        </span>
                      </div>
                      {stats.productivityScore !== null && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-vm-navy h-2 rounded-full"
                            style={{ width: `${stats.productivityScore}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Customer Rating */}
                    {ratings && (
                      <div className="bg-vm-surface rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm font-semibold text-vm-text">
                              Customer Rating
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-vm-text">
                            {ratings.averageRating !== null
                              ? ratings.averageRating.toFixed(1)
                              : '--'}
                          </span>
                        </div>
                        <p className="text-xs text-vm-muted">
                          {ratings.totalRatings} reviews
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Ratings List */}
              {ratings && ratings.recentRatings.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-3">
                    Recent Ratings
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ratings.recentRatings.slice(0, 3).map((r, idx) => (
                      <div key={idx} className="rounded-lg border border-vm-border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < r.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-vm-muted'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-vm-muted">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {r.customerName && (
                          <p className="text-xs font-semibold text-vm-text">
                            {r.customerName}
                          </p>
                        )}
                        {r.comment && (
                          <p className="mt-1 text-xs text-vm-muted">"{r.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Incentives Section - Phase 4 Part C */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted">
                    Incentives
                  </h3>
                  {cleaner && (
                    <button
                      onClick={() => setIsAddIncentiveModalOpen(true)}
                      className="p-1.5 text-vm-cyan-dark hover:bg-vm-surface rounded-lg transition-colors"
                      title="Add incentive"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {incentives.length === 0 ? (
                  <div className="bg-vm-surface rounded-lg p-4 text-center">
                    <p className="text-sm text-vm-muted">No incentives recorded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incentives.map((inc) => {
                      const getStatusBadge = (status: string) => {
                        if (status === 'EARNED')
                          return (
                            <span className="px-2 py-0.5 bg-vm-success-bg text-vm-success text-xs font-medium rounded">
                              Earned
                            </span>
                          );
                        if (status === 'REVOKED')
                          return (
                            <span className="px-2 py-0.5 bg-vm-danger-bg text-red-800 text-xs font-medium rounded">
                              Revoked
                            </span>
                          );
                        return (
                          <span className="px-2 py-0.5 bg-vm-warning-bg text-yellow-800 text-xs font-medium rounded">
                            Pending
                          </span>
                        );
                      };

                      return (
                        <div
                          key={inc.id}
                          className="bg-vm-surface rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Gift className="w-4 h-4 text-vm-cyan-dark" />
                            <div>
                              <p className="text-sm font-medium text-vm-text">{inc.description}</p>
                              <p className="text-xs text-vm-muted">
                                {new Date(inc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-vm-text">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: inc.currency,
                                maximumFractionDigits: 0,
                              }).format(inc.amount)}
                            </span>
                            {getStatusBadge(inc.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Incentives Section - Phase 4 Part C */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted">
                    Incentives
                  </h3>
                  {cleaner && (
                    <button
                      onClick={() => setIsAddIncentiveModalOpen(true)}
                      className="p-1.5 text-vm-cyan-dark hover:bg-vm-surface rounded-lg transition-colors"
                      title="Add incentive"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {incentives.length === 0 ? (
                  <div className="bg-vm-surface rounded-lg p-4 text-center">
                    <p className="text-sm text-vm-muted">No incentives recorded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incentives.map((inc) => {
                      const getStatusBadge = (status: string) => {
                        if (status === 'EARNED')
                          return (
                            <span className="px-2 py-0.5 bg-vm-success-bg text-vm-success text-xs font-medium rounded">
                              Earned
                            </span>
                          );
                        if (status === 'REVOKED')
                          return (
                            <span className="px-2 py-0.5 bg-vm-danger-bg text-red-800 text-xs font-medium rounded">
                              Revoked
                            </span>
                          );
                        return (
                          <span className="px-2 py-0.5 bg-vm-warning-bg text-yellow-800 text-xs font-medium rounded">
                            Pending
                          </span>
                        );
                      };

                      return (
                        <div
                          key={inc.id}
                          className="bg-vm-surface rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Gift className="w-4 h-4 text-vm-cyan-dark" />
                            <div>
                              <p className="text-sm font-medium text-vm-text">{inc.description}</p>
                              <p className="text-xs text-vm-muted">
                                {new Date(inc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-vm-text">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: inc.currency,
                                maximumFractionDigits: 0,
                              }).format(inc.amount)}
                            </span>
                            {getStatusBadge(inc.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Payout Summary - Phase 4 Part E */}
              {payouts && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-3">
                    Payout Summary
                  </h3>
                  <div className="space-y-3">
                    {/* Last 30 Days Earned */}
                    <div className="rounded-lg border border-vm-border p-3">
                      <p className="text-xs text-vm-muted mb-1">Last 30 Days Earned</p>
                      <p className="text-lg font-semibold text-vm-text">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(payouts.totalPaid)}
                      </p>
                    </div>

                    {/* Pending Payout */}
                    <div className="rounded-lg border border-vm-border p-3">
                      <p className="text-xs text-vm-muted mb-1">Pending Payout</p>
                      <p className="text-lg font-semibold text-amber-600">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(0)}
                      </p>
                    </div>

                    {/* Bonus Total */}
                    <div className="rounded-lg border border-vm-border p-3">
                      <p className="text-xs text-vm-muted mb-1">Bonus Total</p>
                      <p className="text-sm font-semibold text-vm-success">
                        +{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(0)}
                      </p>
                    </div>

                    {/* Deductions */}
                    <div className="rounded-lg border border-vm-border p-3">
                      <p className="text-xs text-vm-muted mb-1">Deductions</p>
                      <p className="text-sm font-semibold text-red-600">
                        -{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(0)}
                      </p>
                    </div>

                    {/* Total Paid (All Time) */}
                    <div className="rounded-lg border border-vm-border p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WalletCards className="h-5 w-5 text-vm-cyan-dark" />
                        <div>
                          <p className="text-xs text-vm-muted">Total Paid (All Time)</p>
                          <p className="text-sm font-semibold text-vm-text">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(payouts.totalPaid)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {payouts.recentPayouts.length > 0 && (
                      <div className="rounded-lg border border-vm-border p-3">
                        <p className="text-xs font-semibold text-vm-text mb-2">
                          Recent Payouts
                        </p>
                        <ul className="space-y-2 max-h-28 overflow-y-auto">
                          {payouts.recentPayouts.slice(0, 3).map((p) => (
                            <li
                              key={p.id}
                              className="flex items-center justify-between text-xs bg-vm-surface rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="font-medium text-vm-text">
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: p.currency,
                                    maximumFractionDigits: 0,
                                  }).format(p.amount)}
                                </p>
                                <p className="text-vm-muted">{p.period}</p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  p.status === 'PAID'
                                    ? 'bg-vm-success-bg text-vm-success'
                                    : p.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-vm-surface text-vm-muted'
                                }`}
                              >
                                {p.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Availability Editor Modal */}
        {cleaner && (
          <AvailabilityEditorModal
            isOpen={isAvailabilityModalOpen}
            onClose={() => setIsAvailabilityModalOpen(false)}
            cleanerId={cleaner.id}
            onSave={() => {
              // Refresh availability after save
              if (cleaner) {
                fetch(`/api/admin/cleaners/${cleaner.id}/availability`)
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.success && data.availability) {
                      setAvailability(data.availability);
                    }
                  })
                  .catch(console.error);
              }
            }}
          />
        )}

        {/* Footer CTA */}
        <div className="p-6 border-t border-vm-border bg-vm-surface space-y-3">
          <button
            onClick={() => {
              if (cleaner) {
                onClose();
                router.push(`/admin/cleaners/${cleaner.id}`);
              }
            }}
            className="w-full px-4 py-2 text-vm-cyan-dark border border-vm-navy rounded-lg font-medium hover:bg-vm-surface transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Full Scorecard
          </button>
          <button
            disabled={!cleaner}
            onClick={() => cleaner && onAssign(cleaner)}
            className="w-full px-4 py-3 bg-vm-navy text-white rounded-lg font-semibold hover:bg-vm-navy transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5" />
            Assign This Cleaner
          </button>
        </div>
      </aside>
    </div>
  );
}

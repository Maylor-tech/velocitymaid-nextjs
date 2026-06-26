"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, User } from 'lucide-react';
import Link from 'next/link';
import {
  TalentApplicationView,
  parseTalentApplicationData,
} from '@/components/admin/cleaners/TalentApplicationView';
import {
  CLEANER_APPLICATION_STATUS_LABELS,
  isOpenCleanerApplication,
} from '@/lib/cleaners/applicationStatus';

interface CleanerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string | null;
  experienceLevel: string | null;
  daysAvailable: any;
  notes: string | null;
  status: string;
  preferredName?: string | null;
  applicationData?: unknown;
  createdAt: string;
  updatedAt: string;
  applicantFitScore: number | null;
  areaOfResidence: string | null;
  canTravelToVillas: boolean;
  weekendAbility: boolean;
  idUploadUrl: string | null;
  referencesUploadUrl: string | null;
  Branch: {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    country: string;
  };
}

export default function CleanerApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [application, setApplication] = useState<CleanerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/cleaners/applications/${id}`);
      const data = await response.json();

      if (data.success) {
        setApplication(data.application);
      } else {
        throw new Error(data.error || 'Failed to fetch application');
      }
    } catch (err: any) {
      console.error('Error fetching application:', err);
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this application and create a user account?')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/cleaners/applications/${id}/approve`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setToastMessage('Application approved and user account created');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchApplication();
      } else {
        throw new Error(data.error || 'Failed to approve application');
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to approve application');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Reject this application?')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/cleaners/applications/${id}/reject`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setToastMessage('Application rejected');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchApplication();
      } else {
        throw new Error(data.error || 'Failed to reject application');
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to reject application');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    if (application?.notes) setAdminNotes(application.notes);
  }, [application?.notes]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      const response = await fetch(`/api/admin/cleaners/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update status');
      setApplication(data.application);
      setToastMessage('Status updated');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to update status');
      setToastType('error');
      setShowToast(true);
    } finally {
      setStatusUpdating(false);
    }
  };

  const saveAdminNotes = async () => {
    try {
      setNotesSaving(true);
      const response = await fetch(`/api/admin/cleaners/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save notes');
      setApplication(data.application);
      setToastMessage('Notes saved');
      setToastType('success');
      setShowToast(true);
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to save notes');
      setToastType('error');
      setShowToast(true);
    } finally {
      setNotesSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'APPROVED':
        return 'bg-vm-success-bg text-vm-success';
      case 'REJECTED':
        return 'bg-vm-danger-bg text-red-800';
      case 'REVIEWING':
      case 'TRAINING_INVITED':
        return 'bg-vm-cyan-tint text-vm-navy';
      default:
        return 'bg-vm-warning-bg text-yellow-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-vm-muted">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin/cleaners/applications"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error || 'Application not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Toast Notification */}
        {showToast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              toastType === 'success' ? 'bg-vm-success text-white' : 'bg-vm-danger text-white'
            }`}
          >
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/cleaners/applications"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-vm-text mb-2">{application.name}</h1>
              <p className="text-vm-muted">Application Details</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(application.status)}`}>
                {CLEANER_APPLICATION_STATUS_LABELS[application.status] || application.status}
              </span>
              <select
                value={application.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg border border-vm-border px-3 py-1.5 font-body text-sm text-vm-navy"
              >
                {Object.entries(CLEANER_APPLICATION_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isOpenCleanerApplication(application.status) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleStatusChange('REVIEWING')}
              disabled={processing || statusUpdating}
              className="rounded-lg border border-vm-border px-4 py-2 font-body text-sm text-vm-navy"
            >
              Mark reviewing
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('TRAINING_INVITED')}
              disabled={processing || statusUpdating}
              className="rounded-lg border border-vm-cyan bg-vm-cyan-tint px-4 py-2 font-body text-sm text-vm-navy"
            >
              Invite to training
            </button>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 px-4 py-2 bg-vm-success text-white rounded-lg hover:bg-vm-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Approve Application
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 min-w-[140px] px-4 py-2 bg-vm-danger text-white rounded-lg hover:bg-vm-danger disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </>
              )}
            </button>
          </div>
        )}

        {/* Application Details */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-vm-text mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-vm-muted mt-0.5" />
                <div>
                  <p className="text-sm text-vm-muted">Email</p>
                  <p className="text-vm-text">{application.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-vm-muted mt-0.5" />
                <div>
                  <p className="text-sm text-vm-muted">Phone</p>
                  <p className="text-vm-text">{application.phone}</p>
                </div>
              </div>
              {application.whatsappNumber && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-vm-muted mt-0.5" />
                  <div>
                    <p className="text-sm text-vm-muted">WhatsApp</p>
                    <p className="text-vm-text">{application.whatsappNumber}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-vm-muted mt-0.5" />
                <div>
                  <p className="text-sm text-vm-muted">Branch</p>
                  <p className="text-vm-text">{application.Branch.name}</p>
                  <p className="text-sm text-vm-muted">{application.Branch.city}, {application.Branch.state}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-vm-text mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Application Details
            </h2>
            <div className="space-y-4">
              {application.experienceLevel && (
                <div>
                  <p className="text-sm text-vm-muted">Experience Level</p>
                  <p className="text-vm-text">{application.experienceLevel}</p>
                </div>
              )}
              {application.areaOfResidence && (
                <div>
                  <p className="text-sm text-vm-muted">Area of Residence</p>
                  <p className="text-vm-text">{application.areaOfResidence}</p>
                </div>
              )}
              {application.applicantFitScore !== null && (
                <div>
                  <p className="text-sm text-vm-muted">Applicant Fit Score</p>
                  <p className="text-vm-text">{application.applicantFitScore}/100</p>
                </div>
              )}
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-vm-muted">Can Travel to Villas</p>
                  <p className="text-vm-text">{application.canTravelToVillas ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-vm-muted">Weekend Availability</p>
                  <p className="text-vm-text">{application.weekendAbility ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {application.daysAvailable && (
                <div>
                  <p className="text-sm text-vm-muted">Days Available</p>
                  <p className="text-vm-text">
                    {Array.isArray(application.daysAvailable)
                      ? application.daysAvailable.join(', ')
                      : JSON.stringify(application.daysAvailable)}
                  </p>
                </div>
              )}
              {application.notes && (
                <div>
                  <p className="text-sm text-vm-muted">Notes</p>
                  <p className="text-vm-text whitespace-pre-wrap">{application.notes}</p>
                </div>
              )}
            </div>
          </div>

          {parseTalentApplicationData(application.applicationData) && (
            <TalentApplicationView data={parseTalentApplicationData(application.applicationData)!} />
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-vm-text mb-4">Admin notes</h2>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy"
              placeholder="Internal notes for Brian and Caryll…"
            />
            <button
              type="button"
              disabled={notesSaving}
              onClick={saveAdminNotes}
              className="mt-3 rounded-lg bg-vm-navy px-4 py-2 font-body text-sm text-white disabled:opacity-60"
            >
              {notesSaving ? 'Saving…' : 'Save notes'}
            </button>
          </div>

          {/* Documents */}
          {(application.idUploadUrl || application.referencesUploadUrl) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-vm-text mb-4">Documents</h2>
              <div className="space-y-2">
                {application.idUploadUrl && (
                  <div>
                    <p className="text-sm text-vm-muted mb-1">ID Document</p>
                    <a
                      href={application.idUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View ID Document
                    </a>
                  </div>
                )}
                {application.referencesUploadUrl && (
                  <div>
                    <p className="text-sm text-vm-muted mb-1">References</p>
                    <a
                      href={application.referencesUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View References
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-vm-text mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-vm-muted">Applied</p>
                <p className="text-vm-text">{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-vm-muted">Last Updated</p>
                <p className="text-vm-text">{formatDate(application.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


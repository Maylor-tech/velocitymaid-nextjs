"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, User } from 'lucide-react';
import Link from 'next/link';

interface CleanerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string | null;
  experienceLevel: string | null;
  daysAvailable: any;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
          <p className="mt-4 text-gray-600">Loading application...</p>
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
              toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{application.name}</h1>
              <p className="text-gray-600">Application Details</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
              {application.status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {application.status === 'PENDING' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex gap-4">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{application.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{application.phone}</p>
                </div>
              </div>
              {application.whatsappNumber && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <p className="text-gray-900">{application.whatsappNumber}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="text-gray-900">{application.Branch.name}</p>
                  <p className="text-sm text-gray-500">{application.Branch.city}, {application.Branch.state}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Application Details
            </h2>
            <div className="space-y-4">
              {application.experienceLevel && (
                <div>
                  <p className="text-sm text-gray-500">Experience Level</p>
                  <p className="text-gray-900">{application.experienceLevel}</p>
                </div>
              )}
              {application.areaOfResidence && (
                <div>
                  <p className="text-sm text-gray-500">Area of Residence</p>
                  <p className="text-gray-900">{application.areaOfResidence}</p>
                </div>
              )}
              {application.applicantFitScore !== null && (
                <div>
                  <p className="text-sm text-gray-500">Applicant Fit Score</p>
                  <p className="text-gray-900">{application.applicantFitScore}/100</p>
                </div>
              )}
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-gray-500">Can Travel to Villas</p>
                  <p className="text-gray-900">{application.canTravelToVillas ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weekend Availability</p>
                  <p className="text-gray-900">{application.weekendAbility ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {application.daysAvailable && (
                <div>
                  <p className="text-sm text-gray-500">Days Available</p>
                  <p className="text-gray-900">
                    {Array.isArray(application.daysAvailable)
                      ? application.daysAvailable.join(', ')
                      : JSON.stringify(application.daysAvailable)}
                  </p>
                </div>
              )}
              {application.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{application.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          {(application.idUploadUrl || application.referencesUploadUrl) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
              <div className="space-y-2">
                {application.idUploadUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ID Document</p>
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
                    <p className="text-sm text-gray-500 mb-1">References</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Applied</p>
                <p className="text-gray-900">{formatDate(application.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-gray-900">{formatDate(application.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


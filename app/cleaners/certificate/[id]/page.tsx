'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, CheckCircle2, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CertificateData {
  id: string;
  certificateId: string;
  cleanerName: string;
  branchName: string;
  issuedAt: string;
  verificationUrl: string;
}

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const certificateId = params.id as string;

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId]);

  const fetchCertificate = async () => {
    try {
      const response = await fetch(`/api/training/certificate/${certificateId}`);
      const result = await response.json();

      if (result.success) {
        setCertificate(result.certificate);
      } else {
        if (result.error === 'Not authenticated') {
          router.push('/cleaners/login');
        } else {
          setError(result.error || 'Failed to load certificate');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/training/certificate/${certificateId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VelocityMaid-Certificate-${certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-vm-muted">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Certificate not found'}</p>
          <Link
            href="/cleaners/dashboard"
            className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cleaners/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Certificate Display */}
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-yellow-400 p-12 mb-6">
          <div className="text-center">
            {/* Logo/Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-vm-text mb-2">VelocityMaid</h1>
              <p className="text-xl text-vm-muted">Jamaica Branch</p>
            </div>

            {/* Certificate Title */}
            <div className="mb-8">
              <Award className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-vm-text mb-2">Certificate of Completion</h2>
              <p className="text-lg text-vm-muted">Professional Cleaning Training Program</p>
            </div>

            {/* Recipient Name */}
            <div className="mb-8 py-6 border-t-2 border-b-2 border-gray-300">
              <p className="text-sm text-vm-muted mb-2">This is to certify that</p>
              <p className="text-4xl font-bold text-blue-900 mb-2">{certificate.cleanerName}</p>
              <p className="text-sm text-vm-muted">has successfully completed</p>
              <p className="text-xl font-semibold text-vm-text mt-2">
                All Required Training Modules
              </p>
              <p className="text-sm text-vm-muted mt-1">for VelocityMaid Jamaica Operations</p>
            </div>

            {/* Details */}
            <div className="mb-8 grid grid-cols-2 gap-6 text-left max-w-md mx-auto">
              <div>
                <p className="text-sm text-vm-muted mb-1">Branch</p>
                <p className="font-semibold text-vm-text">{certificate.branchName}</p>
              </div>
              <div>
                <p className="text-sm text-vm-muted mb-1">Date Issued</p>
                <p className="font-semibold text-vm-text">{issuedDate}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-vm-muted mb-1">Certificate ID</p>
                <p className="font-mono font-semibold text-vm-text">{certificate.certificateId}</p>
              </div>
            </div>

            {/* Verification QR Code Placeholder */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg inline-block">
              <p className="text-xs text-vm-muted mb-2">Verify at:</p>
              <p className="text-xs font-mono text-blue-600 break-all">
                {certificate.verificationUrl}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-300">
              <div className="flex justify-between items-end max-w-md mx-auto">
                <div className="text-center">
                  <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
                  <p className="text-sm text-vm-muted">Training Manager</p>
                </div>
                <div className="text-center">
                  <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
                  <p className="text-sm text-vm-muted">Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-6 py-3 bg-vm-navy text-white rounded-lg hover:bg-vm-navy disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download PDF
              </>
            )}
          </button>
          <Link
            href={certificate.verificationUrl}
            target="_blank"
            className="px-6 py-3 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 flex items-center gap-2 font-medium"
          >
            <CheckCircle2 className="w-5 h-5" />
            Verify Certificate
          </Link>
        </div>
      </div>
    </div>
  );
}



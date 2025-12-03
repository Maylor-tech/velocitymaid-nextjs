/**
 * Public Certificate Verification Page
 * 
 * /verify/certificate/[id]
 * 
 * Public page to verify certificate validity
 */

import { prisma } from '@/lib/prisma';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const certificateId = params.id;

  const certificate = await prisma.trainingCertificate.findUnique({
    where: { certificateId },
    include: {
      cleaner: {
        include: {
          primaryBranch: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      },
      trainingStatus: true,
    },
  });

  if (!certificate) {
    notFound();
  }

  // Get completed modules count
  const allLessons = await prisma.trainingLesson.findMany({
    where: { module: { isActive: true } },
  });

  const completedProgress = await prisma.lessonProgress.findMany({
    where: {
      cleanerId: certificate.cleanerId,
      status: 'COMPLETED',
    },
  });

  const isValid = certificate.status === 'ACTIVE' && 
                  certificate.trainingStatus?.overallStatus === 'PASSED';

  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
            <p className="text-gray-600">VelocityMaid Jamaica Training Program</p>
          </div>

          {/* Status */}
          <div className={`mb-8 p-6 rounded-lg ${
            isValid 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-4">
              {isValid ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                  <h2 className="text-2xl font-bold text-green-900">Valid Certificate</h2>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-red-600" />
                  <h2 className="text-2xl font-bold text-red-900">Invalid Certificate</h2>
                </>
              )}
            </div>
            {!isValid && (
              <p className="text-center text-red-800">
                This certificate is {certificate.status === 'REVOKED' ? 'revoked' : 'not valid'}.
              </p>
            )}
          </div>

          {/* Certificate Details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Award className="w-6 h-6 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Certificate ID</p>
                <p className="font-mono font-semibold text-gray-900">{certificate.certificateId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Cleaner Name</p>
                <p className="font-semibold text-gray-900">{certificate.cleaner.name || 'Unknown'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Branch</p>
                <p className="font-semibold text-gray-900">
                  {certificate.cleaner.primaryBranch?.name || 'Unknown'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Date Issued</p>
                <p className="font-semibold text-gray-900">{issuedDate}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="font-semibold text-gray-900 capitalize">{certificate.status.toLowerCase()}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Training Completion</p>
              <p className="font-semibold text-gray-900">
                {completedProgress.length} of {allLessons.length} lessons completed
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${allLessons.length > 0 ? (completedProgress.length / allLessons.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              This certificate was issued by VelocityMaid for completion of the Jamaica Training Program.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              For questions, contact support@velocitymaid.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


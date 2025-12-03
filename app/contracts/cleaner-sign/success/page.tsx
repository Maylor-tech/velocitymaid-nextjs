'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, FileText } from 'lucide-react';
import Link from 'next/link';

export default function CleanerSignSuccessPage() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
          Contract Signed Successfully!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your Cleaner Agreement has been generated and saved. Our team will review and contact you within 24-48 hours.
        </p>
        {contractId && (
          <div className="mb-8">
            <a
              href={`/api/contracts/view/${contractId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F8C548] text-[#0A3D2F] rounded-xl font-semibold hover:bg-[#F5B835] transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Contract PDF
            </a>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cleaners/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A3D2F] text-white rounded-xl font-semibold hover:bg-[#083025] transition-colors"
          >
            <FileText className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VillaSignSuccessContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get('contractId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-vm-success mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
          Partnership Agreement Signed!
        </h1>
        <p className="text-lg text-vm-muted mb-8">
          Your Villa Partnership Agreement has been generated and saved. Our team will review and contact you within 24-48 hours.
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
            href="/villa-partnership"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A3D2F] text-white rounded-xl font-semibold hover:bg-[#083025] transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Partnership
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VillaSignSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A3D2F]" />
      </div>
    }>
      <VillaSignSuccessContent />
    </Suspense>
  );
}


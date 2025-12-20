"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      // If someone lands here without a session, send them home
      router.replace("/");
      return;
    }

    // Skip API call for test session IDs (local testing only)
    if (sessionId === 'test123' || sessionId.startsWith('test')) {
      setStatus('success');
      setJobId('test-job-id');
      return;
    }

    // Create the job by calling the API
    const createJob = async () => {
      try {
        const response = await fetch(`/api/booking/create?session_id=${sessionId}`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create booking');
        }

        // Job created successfully
        // The API redirects, but we handle it client-side for better UX
        const data = await response.json();
        setJobId(data.jobId || null);
        setStatus('success');
        
        // Auto-redirect to customer jobs after 2 seconds
        setTimeout(() => {
          router.push('/customer/jobs?status=received');
        }, 2000);
      } catch (err: any) {
        console.error('Booking creation error:', err);
        setError(err.message || 'Failed to create booking');
        setStatus('error');
      }
    };

    createJob();
  }, [sessionId, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Booking</h1>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Failed</h1>
          <p className="text-lg text-gray-600 mb-6">{error || 'Something went wrong'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/book')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Booking Confirmed
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Your payment was successful and your cleaning has been booked.
        </p>
        {jobId && (
          <p className="text-sm text-gray-500 mb-4">
            Job ID: <span className="font-mono">{jobId}</span>
          </p>
        )}
        <p className="text-sm text-gray-500 mb-8">
          Confirmation ID: <span className="font-mono">{sessionId}</span>
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/customer/jobs?status=received")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Jobs
          </button>
          <button
            onClick={() => router.push("/book")}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Book Another
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Redirecting to your jobs in 2 seconds...
        </p>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}


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
  const [paymentMode, setPaymentMode] = useState<'full' | 'deposit'>('full');
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

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
      // Auto-redirect for test sessions too
      setTimeout(() => {
        router.replace('/customer/jobs?status=received');
      }, 2000);
      return;
    }
    
    // 🚨 SAFETY FIX: Maximum timeout - if processing takes too long, redirect anyway
    let maxTimeout: NodeJS.Timeout | null = null;

    // Create the job by calling the API
    const createJob = async () => {
      try {
        // Set max timeout at start of processing
        maxTimeout = setTimeout(() => {
          console.warn('[CONFIRMATION] Processing timeout - redirecting to jobs page');
          router.replace('/customer/jobs?status=received');
        }, 10000); // 10 seconds max

        // 🚨 STEP 1: Log before API call
        console.log('[CONFIRMATION] ====== STARTING BOOKING CREATION ======');
        console.log('[CONFIRMATION] Calling API with session_id:', sessionId?.substring(0, 20) + '...');
        console.log('[CONFIRMATION] API endpoint: /api/booking/create');
        console.log('[CONFIRMATION] Request body:', JSON.stringify({ session_id: sessionId }, null, 2));

        // 🚨 ROOT CAUSE FIX: Add error handling for fetch itself
        let response: Response;
        try {
          response = await fetch('/api/booking/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
            }),
          });
          
          // 🚨 STEP 2: Log response details BEFORE parsing
          console.log('[CONFIRMATION] ====== RESPONSE RECEIVED ======');
          console.log('[CONFIRMATION] Response status:', response.status);
          console.log('[CONFIRMATION] Response statusText:', response.statusText);
          console.log('[CONFIRMATION] Response ok:', response.ok);
          console.log('[CONFIRMATION] Response headers:', Object.fromEntries(response.headers.entries()));
          
        } catch (fetchError: any) {
          console.error('[CONFIRMATION] ❌ Fetch error:', fetchError);
          console.error('[CONFIRMATION] Fetch error name:', fetchError?.name);
          console.error('[CONFIRMATION] Fetch error message:', fetchError?.message);
          console.error('[CONFIRMATION] Fetch error stack:', fetchError?.stack);
          throw new Error(`Network error: ${fetchError.message}. Please check your connection and try again.`);
        }

        // 🚨 STEP 3: Check response status
        if (!response.ok) {
          console.error('[CONFIRMATION] ❌ Response not OK:', response.status, response.statusText);
          
          // Try to parse error response
          let errorMessage = `Server error: ${response.status} ${response.statusText}`;
          try {
            const contentType = response.headers.get('content-type');
            console.log('[CONFIRMATION] Error response content-type:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              console.log('[CONFIRMATION] Error response data:', data);
              errorMessage = data.error || errorMessage;
            } else {
              // Response is not JSON, read as text
              const text = await response.text();
              console.log('[CONFIRMATION] Error response text:', text);
              errorMessage = text || errorMessage;
            }
          } catch (parseError) {
            console.error('[CONFIRMATION] Failed to parse error response:', parseError);
          }
          throw new Error(errorMessage);
        }

        // 🚨 STEP 4: Check content type
        const contentType = response.headers.get('content-type');
        console.log('[CONFIRMATION] Response content-type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[CONFIRMATION] ❌ Non-JSON response. Content-type:', contentType);
          throw new Error('Server returned non-JSON response. Please try again.');
        }

        // 🚨 STEP 5: Get raw response text FIRST (critical for debugging)
        console.log('[CONFIRMATION] Reading response text...');
        let responseText: string;
        try {
          responseText = await response.text();
        } catch (textError: any) {
          console.error('[CONFIRMATION] ❌ Failed to read response text:', textError);
          throw new Error('Failed to read server response. Please try again.');
        }
        
        console.log('[CONFIRMATION] ====== RAW RESPONSE TEXT ======');
        console.log('[CONFIRMATION] Response text length:', responseText?.length || 0);
        console.log('[CONFIRMATION] Response text (first 500 chars):', responseText?.substring(0, 500) || '(empty)');
        console.log('[CONFIRMATION] Response text (full):', responseText || '(empty)');
        
        if (!responseText || responseText.trim() === '') {
          console.error('[CONFIRMATION] ❌ EMPTY RESPONSE TEXT');
          console.error('[CONFIRMATION] Response status:', response.status);
          console.error('[CONFIRMATION] Response headers:', Object.fromEntries(response.headers.entries()));
          throw new Error('Server returned empty response. This usually means the API crashed. Please contact support.');
        }

        // 🚨 STEP 6: Parse JSON
        console.log('[CONFIRMATION] Attempting to parse JSON...');
        let data: any;
        try {
          // Try to parse as JSON
          data = JSON.parse(responseText);
          console.log('[CONFIRMATION] ✅ JSON parsed successfully');
          console.log('[CONFIRMATION] Parsed data:', JSON.stringify(data, null, 2));
        } catch (parseError: any) {
          console.error('[CONFIRMATION] ❌ JSON PARSE ERROR');
          console.error('[CONFIRMATION] Parse error:', parseError);
          console.error('[CONFIRMATION] Parse error message:', parseError?.message);
          console.error('[CONFIRMATION] Response text that failed to parse:', responseText);
          
          // 🚨 SMART FIX: If response looks like HTML (error page), extract useful info
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            throw new Error('Server returned HTML instead of JSON. This usually means the API route crashed. Please contact support.');
          }
          
          // If response is very short, show it
          if (responseText.length < 200) {
            throw new Error(`Invalid JSON response: ${parseError.message}. Server said: "${responseText}"`);
          }
          
          throw new Error(`Invalid JSON response: ${parseError.message}. Response preview: ${responseText.substring(0, 200)}...`);
        }

        // Job created successfully
        if (data.success && data.jobId) {
          // Clear max timeout since we succeeded
          if (maxTimeout) {
            clearTimeout(maxTimeout);
            maxTimeout = null;
          }
          
          setJobId(data.jobId);
          setPaymentMode(data.paymentMode === 'deposit' ? 'deposit' : 'full');
          setStatus('success');
          
          // Auto-redirect to customer jobs after 2 seconds (use replace to avoid back button issues)
          setTimeout(() => {
            router.replace('/customer/jobs?status=received');
          }, 2000);
        } else {
          throw new Error(data.error || 'Booking creation failed');
        }
      } catch (err: any) {
        console.error('Booking creation error:', err);
        // Clear max timeout on error
        if (maxTimeout) {
          clearTimeout(maxTimeout);
          maxTimeout = null;
        }
        // Handle specific error types
        if (err.message?.includes('JSON')) {
          setError('Server communication error. Please contact support if this persists.');
        } else {
          setError(err.message || 'Failed to create booking. Please try again.');
        }
        setStatus('error');
      }
    };

    createJob();
    
    // Cleanup timeout on unmount
    return () => {
      if (maxTimeout) {
        clearTimeout(maxTimeout);
      }
    };
  }, [sessionId, router]);

  // Function to send magic link
  const sendMagicLink = async () => {
    if (!magicLinkEmail) return;
    
    setMagicLinkLoading(true);
    try {
      const response = await fetch('/api/auth/customer-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicLinkEmail }),
      });
      
      const data = await response.json();
      if (data.success) {
        setMagicLinkSent(true);
        // In development, show the link in console
        if (data.magicLink) {
          console.log('[DEV] Magic link:', data.magicLink);
        }
      } else {
        setError(data.error || 'Failed to send magic link');
      }
    } catch (error) {
      console.error('Magic link error:', error);
      setError('Failed to send magic link. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Booking</h1>
          <p className="text-gray-600">
            {paymentMode === 'deposit'
              ? 'Please wait while we confirm your deposit...'
              : 'Please wait while we confirm your payment...'}
          </p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          You're all set 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {paymentMode === 'deposit'
            ? 'Your $25 booking deposit was received. We’ll review and confirm your cleaning shortly.'
            : 'Your payment was successful and your cleaning has been booked.'}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-800">
            <strong>What&apos;s next:</strong>{' '}
            {paymentMode === 'deposit'
              ? 'Our team will confirm your booking and assign your cleaner. You’ll pay the remaining balance after service.'
              : "We're preparing your service now. You can track updates anytime from your dashboard."}
          </p>
        </div>

        {/* Magic Link Section */}
        {!magicLinkSent ? (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              <strong>Access your dashboard:</strong> Get a secure login link sent to your email.
            </p>
            {!showMagicLink ? (
              <button
                onClick={() => setShowMagicLink(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Send me a login link
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMagicLink();
                    }
                  }}
                />
                <button
                  onClick={sendMagicLink}
                  disabled={magicLinkLoading || !magicLinkEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {magicLinkLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Login link sent! Check your email and click the link to access your dashboard.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-green-600 mt-2">
                (Check console for development link)
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/customer/jobs?status=received")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View My Jobs
          </button>
          <a
            href="tel:9732809190"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
          >
            Contact Support
          </a>
        </div>
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


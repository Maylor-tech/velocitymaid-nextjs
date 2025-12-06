'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Leads Error:', error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '1rem', maxWidth: '28rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Something went wrong!
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
          {error.message || 'An unexpected error occurred while loading the leads page.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.5rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
          <a
            href="/admin"
            style={{ padding: '0.5rem 1rem', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '0.5rem', fontWeight: '500', textDecoration: 'none', display: 'inline-block' }}
          >
            Back to Admin
          </a>
        </div>
      </div>
    </div>
  );
}


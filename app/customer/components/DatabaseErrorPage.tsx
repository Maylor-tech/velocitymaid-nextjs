'use client';

export default function DatabaseErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-vm-text mb-4">Service Temporarily Unavailable</h1>
        <p className="text-vm-muted mb-6">
          We're experiencing database connectivity issues. Please try again in a few moments.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}


















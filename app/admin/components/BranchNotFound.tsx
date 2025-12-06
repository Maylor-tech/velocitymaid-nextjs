"use client";

import { AlertCircle } from 'lucide-react';

interface BranchNotFoundProps {
  slug: string;
  backHref?: string;
}

export default function BranchNotFound({ slug, backHref = '/admin/leads' }: BranchNotFoundProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4 max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Branch Not Found</h1>
        <p className="text-gray-600 mb-4">
          The branch &quot;{slug}&quot; could not be found in the database.
        </p>
        <a
          href={backHref}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Back to Leads
        </a>
      </div>
    </div>
  );
}


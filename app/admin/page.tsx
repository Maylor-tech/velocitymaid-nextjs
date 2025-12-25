"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from './components/AdminLayout';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to jobs board as default admin page
    router.replace('/admin/jobs');
  }, [router]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Redirecting to Jobs Board...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
















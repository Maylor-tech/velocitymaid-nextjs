'use client';

import { useCallback } from 'react';
import { CustomerDocList } from '@/components/customer/CustomerDocList';

export default function CustomerServicesPage() {
  const mapRows = useCallback((d: { jobs?: Array<{ id: string; serviceType?: string; address?: string; preferredDate?: string; status?: string }> }) => {
    return (d.jobs || []).map((j) => ({
      id: j.id,
      label: j.serviceType || 'Cleaning service',
      sublabel: j.address,
      date: j.preferredDate ? new Date(j.preferredDate).toLocaleDateString() : undefined,
      href: `/customer/jobs/${j.id}`,
      status: j.status,
    }));
  }, []);

  return (
    <CustomerDocList
      title="My Services"
      empty="No services yet. Book your first cleaning to get started."
      fetchUrl="/api/customer/jobs?type=all"
      mapRows={mapRows as (data: unknown) => ReturnType<typeof mapRows>}
    />
  );
}

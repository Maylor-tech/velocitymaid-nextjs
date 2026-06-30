'use client';

import { CustomerMapView } from '@/components/admin/map/CustomerMapView';

export default function AdminCustomerMapPage() {
  return (
    <div className="min-h-screen bg-vm-surface">
      <div className="border-b border-vm-border bg-vm-white px-4 py-3">
        <h1 className="font-heading text-xl font-bold text-vm-navy">Customer Map</h1>
        <p className="font-body text-sm text-vm-muted">
          Active properties color-coded by branch and Vermont travel zone.
        </p>
      </div>
      <CustomerMapView />
    </div>
  );
}

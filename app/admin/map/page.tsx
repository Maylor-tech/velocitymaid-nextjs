'use client';

import { CustomerMapView } from '@/components/admin/map/CustomerMapView';

export default function AdminCustomerMapPage() {
  return (
    <div className="min-h-screen bg-vm-surface">
      <div className="border-b border-vm-border bg-vm-white px-4 py-3">
        <h1 className="font-heading text-xl font-bold text-vm-navy">Customer Map</h1>
        <p className="font-body text-sm text-vm-muted">
          Customer and lead pins, travel zones, and a Missing location worklist with
          one-click geocode.
        </p>
      </div>
      <CustomerMapView />
    </div>
  );
}

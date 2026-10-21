"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PropertyReservations } from "@/components/admin/properties/PropertyReservations";

export default function PropertyReservationsPage() {
  const params = useParams<{ propertyId: string }>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-2 text-sm text-vm-navy">
        <ArrowLeft className="h-4 w-4" />
        Customers
      </Link>
      <PropertyReservations propertyId={params.propertyId} />
    </div>
  );
}

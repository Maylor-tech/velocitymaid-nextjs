"use client";

import { useParams } from "next/navigation";
import { PropertyServiceAgreementForm } from "@/components/admin/properties/PropertyServiceAgreementForm";

export default function PropertyServiceAgreementPage() {
  const params = useParams<{ propertyId: string }>();
  return <PropertyServiceAgreementForm propertyId={params.propertyId} />;
}

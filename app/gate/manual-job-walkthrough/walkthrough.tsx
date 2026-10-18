"use client";

import { useMemo } from "react";
import { ManualJobForm } from "@/app/admin/jobs/new/page";

const TINA_ID = "1233f6e1-5463-4a19-a35f-fbca5fe54725";
const SNOW_TRAK_ID = "cmuoajao80003ku0447slewk1";
const GROUT_ID = "property-grout-fixture";

const tina = {
  id: TINA_ID,
  firstName: "Tina",
  lastName: "Martin",
  email: "tmrmar01@aol.com",
  phone: "203-536-1602",
  travelZone: "ZONE_B",
  Property: [
    {
      id: SNOW_TRAK_ID,
      name: "Ludlow Property",
      address: "18 Snow Trak North",
      city: "Ludlow",
      state: "VT",
      bedrooms: 3,
      bathrooms: 2.5,
      useType: "RESIDENTIAL",
      ResidentialProfile: {
        agreedPrice: 250,
        serviceType: "Residential Maintenance Cleaning",
      },
    },
    {
      id: GROUT_ID,
      name: "Grout fixture",
      address: "354 Grout Road",
      city: "Perkinsville",
      state: "VT",
      bedrooms: 3,
      bathrooms: 3,
      useType: null,
      ResidentialProfile: null,
    },
  ],
};

function mockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function mockFetcher(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method ?? "GET";

  if (url.includes("/api/admin/customers?") && url.includes("q=")) {
    return mockResponse({ success: true, customers: [tina] });
  }
  if (url.includes(`/api/admin/customers/${TINA_ID}`)) {
    return mockResponse({ success: true, customer: tina });
  }
  if (url.includes("/api/admin/pricing/protect-preview")) {
    const payload = JSON.parse(String(init?.body ?? "{}")) as { operationalSubtotal?: number };
    return mockResponse({
      success: true,
      customerPrice: payload.operationalSubtotal ?? 0,
      processingAllowanceEstimated: 0,
      warning: null,
    });
  }
  if (url.includes("/api/admin/jobs/create-manual") && method === "GET") {
    return mockResponse({
      success: true,
      sameDayJobs: [
        {
          id: "job-existing",
          jobReference: "VM-FIXTURE-1",
          status: "RECEIVED",
          serviceType: "Vacation Rental Turnover",
        },
      ],
    });
  }
  if (url.includes("/api/admin/jobs/create-manual") && method === "POST") {
    return mockResponse({
      success: true,
      jobId: "mock-not-saved",
      status: "RECEIVED",
    });
  }
  return mockResponse({ success: false, error: `Unmocked ${method} ${url}` }, 404);
}

export function ManualJobWalkthrough() {
  const fetcher = useMemo(() => mockFetcher, []);
  return (
    <main>
      <p className="bg-vm-surface px-6 pt-4 font-body text-sm text-vm-muted">
        Mocked walkthrough. Nothing is written to the database. The $250 price and second property are fixtures.
      </p>
      <ManualJobForm fetcher={fetcher} />
    </main>
  );
}

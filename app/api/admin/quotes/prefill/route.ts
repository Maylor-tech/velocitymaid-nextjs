export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";

function formatCurrency(amount: number | null | undefined, currency = "USD"): string {
  if (amount == null || Number.isNaN(amount)) {
    return "";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatJobDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const customerId = request.nextUrl.searchParams.get("customerId");
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          Customer: true,
        },
      });

      if (!job) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }

      const customer = job.Customer;
      const firstName =
        customer?.firstName ||
        job.customerName?.split(" ")[0] ||
        "";
      const lastName =
        customer?.lastName ||
        job.customerName?.split(" ").slice(1).join(" ") ||
        "";
      const fullName =
        [firstName, lastName].filter(Boolean).join(" ") ||
        job.customerName ||
        "";

      const quotedOrTotal =
        job.quotedTotal != null
          ? Number(job.quotedTotal)
          : job.totalPrice != null
            ? Number(job.totalPrice)
            : null;

      return NextResponse.json({
        success: true,
        data: {
          customerId: customer?.id ?? null,
          clientFirstName: firstName,
          clientFullName: fullName,
          clientEmail: customer?.email ?? "",
          clientPhone: customer?.phone ?? "",
          propertyAddress:
            job.address ||
            customer?.defaultAddress ||
            [customer?.addressLine1, customer?.city, customer?.state]
              .filter(Boolean)
              .join(", ") ||
            "",
          serviceDate: formatJobDate(job.preferredDate),
          startTime: job.preferredTime || "",
          serviceTitle: job.serviceType || "",
          totalDue: formatCurrency(quotedOrTotal, job.currency || "USD"),
          lineItems: job.serviceType
            ? [
                {
                  label: job.serviceType,
                  amount: formatCurrency(quotedOrTotal, job.currency || "USD"),
                },
              ]
            : [],
        },
      });
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Customer not found" },
          { status: 404 }
        );
      }

      const fullName = `${customer.firstName} ${customer.lastName}`.trim();
      const propertyAddress =
        customer.defaultAddress ||
        [customer.addressLine1, customer.city, customer.state]
          .filter(Boolean)
          .join(", ") ||
        "";

      return NextResponse.json({
        success: true,
        data: {
          customerId: customer.id,
          clientFirstName: customer.firstName,
          clientFullName: fullName,
          clientEmail: customer.email,
          clientPhone: customer.phone || "",
          propertyAddress,
          serviceDate: "",
          startTime: "",
          serviceTitle: "",
          totalDue: "",
          lineItems: [],
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "customerId or jobId query param required" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("[admin/quotes/prefill]", error);
    const message =
      error instanceof Error ? error.message : "Failed to load prefill data";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

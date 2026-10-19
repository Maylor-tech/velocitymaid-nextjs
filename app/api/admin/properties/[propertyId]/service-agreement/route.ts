export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin editor for one property's service package and payment preference.
 * Writes those agreement rows only. Jobs, invoices, payments, and payouts
 * stay untouched, and no guest stay QR is created.
 */

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { isServiceCategory, serviceTypesFor } from "@/lib/admin/manualJobCreate";
import {
  ServicePackageValidationError,
  assertSeasonalRatesDoNotOverlap,
  parseCalendarDay,
  validatePaymentPreference,
  type ServiceRateRecord,
} from "@/lib/properties/servicePackage";

type RouteContext = { params: { propertyId: string } };

function money(value: unknown, label: string): number {
  if (value == null || value === "") {
    throw new ServicePackageValidationError(`${label} is required.`, "PACKAGE_PRICE");
  }
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ServicePackageValidationError(`${label} must be zero or greater.`, "PACKAGE_PRICE");
  }
  return Math.round(amount * 100) / 100;
}

function moneyOrNull(value: unknown, label: string): number | null {
  if (value == null || value === "") return null;
  return money(value, label);
}

function decimal(amount: number): Prisma.Decimal {
  return new Prisma.Decimal(amount.toFixed(2));
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(request, "ADMIN");
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: {
        id: true,
        name: true,
        address: true,
        customerId: true,
        ServicePackages: { include: { Rates: { orderBy: { startsOn: "asc" } } } },
        PaymentPreference: true,
      },
    });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, property });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : "Failed to load the service agreement";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireRole(request, "ADMIN");
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const packageBody = body.package;
    const preferenceBody = body.paymentPreference;
    if (!packageBody && !preferenceBody) {
      return NextResponse.json(
        { success: false, error: "Save a service package or a payment preference." },
        { status: 400 }
      );
    }

    let packageAudit: Prisma.InputJsonObject | null = null;
    let preferenceAudit: Prisma.InputJsonObject | null = null;

    if (packageBody) {
      if (!isServiceCategory(packageBody.serviceCategory)) {
        throw new ServicePackageValidationError(
          "Choose residential or vacation-rental.",
          "PACKAGE_CATEGORY"
        );
      }
      const serviceType = String(packageBody.serviceType || "").trim();
      if (!serviceTypesFor(packageBody.serviceCategory).includes(serviceType)) {
        throw new ServicePackageValidationError(
          "Choose a service type for that category.",
          "PACKAGE_SERVICE_TYPE"
        );
      }
      const customerPrice = money(packageBody.customerPrice, "Customer price");
      const operationalPrice = moneyOrNull(packageBody.operationalPrice, "Operational price");
      const ratesInput = Array.isArray(packageBody.rates) ? packageBody.rates : [];
      const rates: ServiceRateRecord[] = ratesInput.map((rate: Record<string, unknown>) => ({
        id: randomUUID(),
        label: String(rate.label || "").trim(),
        customerPrice: money(rate.customerPrice, "Seasonal customer price"),
        operationalPrice: moneyOrNull(rate.operationalPrice, "Seasonal operational price"),
        startsOn: parseCalendarDay(String(rate.startsOn || "")),
        endsOn:
          rate.endsOn == null || rate.endsOn === ""
            ? null
            : parseCalendarDay(String(rate.endsOn)),
        active: rate.active !== false,
      }));
      if (rates.some((rate) => !rate.label)) {
        throw new ServicePackageValidationError("Each seasonal rate needs a label.", "SEASONAL_RATE_DATE");
      }
      assertSeasonalRatesDoNotOverlap(rates);

      const saved = await prisma.$transaction(async (tx) => {
        const existing = await tx.propertyServicePackage.findFirst({
          where: {
            propertyId: property.id,
            serviceCategory: packageBody.serviceCategory,
            serviceType,
          },
          select: { id: true },
        });
        const pkg = existing
          ? await tx.propertyServicePackage.update({
              where: { id: existing.id },
              data: {
                customerPrice: decimal(customerPrice),
                operationalPrice: operationalPrice == null ? null : decimal(operationalPrice),
                includedScope: String(packageBody.includedScope || "").trim() || null,
                exclusions: String(packageBody.exclusions || "").trim() || null,
                active: packageBody.active !== false,
              },
            })
          : await tx.propertyServicePackage.create({
              data: {
                id: randomUUID(),
                propertyId: property.id,
                serviceCategory: packageBody.serviceCategory,
                serviceType,
                customerPrice: decimal(customerPrice),
                operationalPrice: operationalPrice == null ? null : decimal(operationalPrice),
                includedScope: String(packageBody.includedScope || "").trim() || null,
                exclusions: String(packageBody.exclusions || "").trim() || null,
                active: packageBody.active !== false,
              },
            });
        await tx.propertyServiceRate.deleteMany({ where: { packageId: pkg.id } });
        if (rates.length > 0) {
          await tx.propertyServiceRate.createMany({
            data: rates.map((rate) => ({
              id: rate.id,
              packageId: pkg.id,
              label: rate.label,
              customerPrice: decimal(rate.customerPrice),
              operationalPrice:
                rate.operationalPrice == null ? null : decimal(rate.operationalPrice),
              startsOn: new Date(`${rate.startsOn}T00:00:00.000Z`),
              endsOn: rate.endsOn ? new Date(`${rate.endsOn}T00:00:00.000Z`) : null,
              active: rate.active,
            })),
          });
        }
        return pkg;
      });
      packageAudit = {
        packageId: saved.id,
        serviceCategory: packageBody.serviceCategory,
        serviceType,
        customerPrice,
        operationalPrice,
        rateCount: rates.length,
      };
    }

    if (preferenceBody) {
      const preference = validatePaymentPreference({
        propertyId: property.id,
        allowedMethods: Array.isArray(preferenceBody.allowedMethods)
          ? preferenceBody.allowedMethods
          : [],
        preferredMethod: String(preferenceBody.preferredMethod || ""),
      });
      await prisma.propertyPaymentPreference.upsert({
        where: { propertyId: property.id },
        create: {
          id: randomUUID(),
          propertyId: property.id,
          allowedMethods: preference.allowedMethods,
          preferredMethod: preference.preferredMethod,
        },
        update: {
          allowedMethods: preference.allowedMethods,
          preferredMethod: preference.preferredMethod,
        },
      });
      preferenceAudit = {
        allowedMethods: preference.allowedMethods,
        preferredMethod: preference.preferredMethod,
      };
    }

    const packageAuditId = packageAudit
      ? await logAuditEntry({
          actorId: auth.userId,
          actorRole: "ADMIN",
          action: "SERVICE_PACKAGE_UPSERTED",
          entityType: "Property",
          entityId: property.id,
          description: "Saved a property service package without changing existing jobs.",
          changes: packageAudit,
        })
      : null;
    const rateAuditId =
      packageAudit && Number(packageAudit.rateCount) > 0
        ? await logAuditEntry({
            actorId: auth.userId,
            actorRole: "ADMIN",
            action: "SERVICE_RATE_UPSERTED",
            entityType: "Property",
            entityId: property.id,
            description: "Saved seasonal rates for a property service package.",
            changes: packageAudit,
          })
        : null;
    const preferenceAuditId = preferenceAudit
      ? await logAuditEntry({
          actorId: auth.userId,
          actorRole: "ADMIN",
          action: "PAYMENT_PREFERENCE_UPDATED",
          entityType: "Property",
          entityId: property.id,
          description: "Saved the property payment preference.",
          changes: preferenceAudit,
        })
      : null;

    return NextResponse.json({
      success: true,
      propertyId: property.id,
      packageAuditId,
      rateAuditId,
      preferenceAuditId,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    if (error instanceof ServicePackageValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to save the service agreement";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

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
} from "@/lib/properties/servicePackage";

type PreparedRate = {
  id: string | null;
  label: string;
  customerPrice: number;
  operationalPrice: number | null;
  startsOn: string;
  endsOn: string | null;
  active: boolean;
};

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

const PACKAGE_IDENTITY_CONFLICT =
  "This property already has a package for that service. Edit that package instead.";

function isPackageIdentityConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];
  if (fields.includes("property_service_packages_identity_key")) return true;
  return (
    fields.includes("propertyId") &&
    fields.includes("serviceCategory") &&
    fields.includes("serviceType")
  );
}

function sameInstant(stored: Date, submitted: string | null): boolean {
  if (!submitted) return false;
  const submittedTime = new Date(submitted).getTime();
  return Number.isFinite(submittedTime) && stored.getTime() === submittedTime;
}

function preparePackage(packageBody: {
  serviceCategory?: unknown;
  serviceType?: unknown;
  customerPrice?: unknown;
  operationalPrice?: unknown;
  includedScope?: unknown;
  exclusions?: unknown;
  active?: unknown;
  updatedAt?: unknown;
  id?: unknown;
  rates?: unknown;
}) {
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
  const rates: PreparedRate[] = ratesInput.map(
    (rate: Record<string, unknown>) => ({
      id: typeof rate.id === "string" && rate.id.trim() ? rate.id.trim() : null,
      label: String(rate.label || "").trim(),
      customerPrice: money(rate.customerPrice, "Seasonal customer price"),
      operationalPrice: moneyOrNull(rate.operationalPrice, "Seasonal operational price"),
      startsOn: parseCalendarDay(String(rate.startsOn || "")),
      endsOn:
        rate.endsOn == null || rate.endsOn === "" ? null : parseCalendarDay(String(rate.endsOn)),
      active: rate.active !== false,
    })
  );
  if (rates.some((rate) => !rate.label)) {
    throw new ServicePackageValidationError("Each seasonal rate needs a label.", "SEASONAL_RATE_DATE");
  }
  assertSeasonalRatesDoNotOverlap(rates.map((rate) => ({ ...rate, id: rate.id ?? "new" })));
  return {
    serviceCategory: packageBody.serviceCategory,
    serviceType,
    customerPrice,
    operationalPrice,
    packageId: typeof packageBody.id === "string" && packageBody.id.trim() ? packageBody.id.trim() : null,
    updatedAt: typeof packageBody.updatedAt === "string" ? packageBody.updatedAt : null,
    rates,
    data: {
      customerPrice: decimal(customerPrice),
      operationalPrice: operationalPrice == null ? null : decimal(operationalPrice),
      includedScope: String(packageBody.includedScope || "").trim() || null,
      exclusions: String(packageBody.exclusions || "").trim() || null,
      active: packageBody.active !== false,
    },
  };
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

    const preparedPackage = packageBody ? preparePackage(packageBody) : null;
    const preparedPreference = preferenceBody
      ? validatePaymentPreference({
          propertyId: property.id,
          allowedMethods: Array.isArray(preferenceBody.allowedMethods)
            ? preferenceBody.allowedMethods
            : [],
          preferredMethod: String(preferenceBody.preferredMethod || ""),
        })
      : null;

    const saved = await prisma.$transaction(async (tx) => {
      let packageAudit: Prisma.InputJsonObject | null = null;
      if (preparedPackage) {
        const existing = await tx.propertyServicePackage.findFirst({
          where: preparedPackage.packageId
            ? { id: preparedPackage.packageId, propertyId: property.id }
            : {
                propertyId: property.id,
                serviceCategory: preparedPackage.serviceCategory,
                serviceType: preparedPackage.serviceType,
              },
          include: { Rates: { select: { id: true } } },
        });
        if (preparedPackage.packageId && !existing) {
          throw new ServicePackageValidationError(
            "That package is no longer on this property. Reload it before saving again.",
            "AGREEMENT_STALE"
          );
        }
        if (existing && !sameInstant(existing.updatedAt, preparedPackage.updatedAt)) {
          throw new ServicePackageValidationError(
            "This agreement changed while you were editing it. Reload it before saving again.",
            "AGREEMENT_STALE"
          );
        }
        const pkg = existing
          ? existing
          : await tx.propertyServicePackage.create({
              data: {
                id: randomUUID(),
                propertyId: property.id,
                serviceCategory: preparedPackage.serviceCategory,
                serviceType: preparedPackage.serviceType,
                ...preparedPackage.data,
              },
            });
        if (existing) {
          const updated = await tx.propertyServicePackage.updateMany({
            where: { id: existing.id, updatedAt: existing.updatedAt },
            data: {
              serviceCategory: preparedPackage.serviceCategory,
              serviceType: preparedPackage.serviceType,
              ...preparedPackage.data,
            },
          });
          if (updated.count !== 1) {
            throw new ServicePackageValidationError(
              "This agreement changed while you were editing it. Reload it before saving again.",
              "AGREEMENT_STALE"
            );
          }
        }
        const existingIds = new Set((existing?.Rates ?? []).map((rate) => rate.id));
        const keptIds: string[] = [];
        for (const rate of preparedPackage.rates) {
          const rateData = {
            label: rate.label,
            customerPrice: decimal(rate.customerPrice),
            operationalPrice: rate.operationalPrice == null ? null : decimal(rate.operationalPrice),
            startsOn: new Date(`${rate.startsOn}T00:00:00.000Z`),
            endsOn: rate.endsOn ? new Date(`${rate.endsOn}T00:00:00.000Z`) : null,
            active: rate.active,
          };
          if (rate.id && existingIds.has(rate.id)) {
            await tx.propertyServiceRate.update({ where: { id: rate.id }, data: rateData });
            keptIds.push(rate.id);
          } else {
            const id = randomUUID();
            await tx.propertyServiceRate.create({
              data: { id, packageId: pkg.id, ...rateData },
            });
            keptIds.push(id);
          }
        }
        const removedIds = [...existingIds].filter((id) => !keptIds.includes(id));
        if (removedIds.length > 0) {
          await tx.propertyServiceRate.deleteMany({
            where: { packageId: pkg.id, id: { in: removedIds } },
          });
        }
        packageAudit = {
          packageId: pkg.id,
          serviceCategory: preparedPackage.serviceCategory,
          serviceType: preparedPackage.serviceType,
          customerPrice: preparedPackage.customerPrice,
          operationalPrice: preparedPackage.operationalPrice,
          rateCount: preparedPackage.rates.length,
        };
      }
      let preferenceAudit: Prisma.InputJsonObject | null = null;
      if (preparedPreference) {
        await tx.propertyPaymentPreference.upsert({
          where: { propertyId: property.id },
          create: {
            id: randomUUID(),
            propertyId: property.id,
            allowedMethods: preparedPreference.allowedMethods,
            preferredMethod: preparedPreference.preferredMethod,
          },
          update: {
            allowedMethods: preparedPreference.allowedMethods,
            preferredMethod: preparedPreference.preferredMethod,
          },
        });
        preferenceAudit = {
          allowedMethods: preparedPreference.allowedMethods,
          preferredMethod: preparedPreference.preferredMethod,
        };
      }
      return { packageAudit, preferenceAudit };
    });
    const packageAudit = saved.packageAudit;
    const preferenceAudit = saved.preferenceAudit;

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
      const status = error.code === "AGREEMENT_STALE" ? 409 : 400;
      return NextResponse.json({ success: false, error: error.message }, { status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      if (!isPackageIdentityConflict(error)) throw error;
      return NextResponse.json({ success: false, error: PACKAGE_IDENTITY_CONFLICT }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to save the service agreement";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { RESIDENTIAL_PRICING_BASES } from "@/lib/residentialIntake/constants";

type RouteContext = { params: { propertyId: string } };

function parseHours(value: unknown): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return new Prisma.Decimal(n);
}

function parseMoney(value: unknown): Prisma.Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return new Prisma.Decimal(n);
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(_request, "ADMIN");
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      include: { ResidentialProfile: true },
    });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, property });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(request, "ADMIN");
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const estimatedLaborHours = parseHours(body.estimatedLaborHours);
    const agreedPrice = parseMoney(body.agreedPrice);
    if (body.estimatedLaborHours !== undefined && estimatedLaborHours === undefined) {
      return NextResponse.json({ success: false, error: "Invalid estimated labor hours" }, { status: 400 });
    }
    if (body.agreedPrice !== undefined && agreedPrice === undefined) {
      return NextResponse.json({ success: false, error: "Invalid agreed price" }, { status: 400 });
    }
    if (
      body.pricingBasis !== undefined &&
      body.pricingBasis !== null &&
      body.pricingBasis !== "" &&
      !(RESIDENTIAL_PRICING_BASES as readonly string[]).includes(body.pricingBasis)
    ) {
      return NextResponse.json({ success: false, error: "Invalid pricing basis" }, { status: 400 });
    }

    const data = {
      estimatedLaborHours,
      agreedPrice,
      pricingBasis: body.pricingBasis === "" ? null : body.pricingBasis,
      includedScope:
        body.includedScope === undefined ? undefined : body.includedScope?.trim() || null,
      exclusions: body.exclusions === undefined ? undefined : body.exclusions?.trim() || null,
      preExistingConditionNotes:
        body.preExistingConditionNotes === undefined
          ? undefined
          : body.preExistingConditionNotes?.trim() || null,
      approvedAddOns: body.approvedAddOns === undefined ? undefined : body.approvedAddOns,
    };

    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    const profile = await prisma.propertyResidentialProfile.upsert({
      where: { propertyId: params.propertyId },
      create: { propertyId: params.propertyId, ...cleaned },
      update: cleaned,
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

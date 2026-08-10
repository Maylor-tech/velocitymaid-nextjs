export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { nextVmReference } from '@/lib/billing/numbering';
import { awaitJobGoogleSync } from '@/lib/google/jobGoogleSync';
import { parseServiceDateInput } from '@/lib/dates/serviceDate';
import {
  buildHostCleaningJobNotes,
  buildPropertyDefaultsForJob,
  HOST_CLEANING_SERVICE_TYPES,
  loadOwnedProperty,
} from '@/lib/properties/propertyService';

type RouteContext = { params: { propertyId: string } };

/**
 * POST /api/customer/properties/[propertyId]/cleanings
 *
 * Host Add Cleaning — creates a Job occurrence linked to Property.
 * Snapshots Property.address onto Job.address; awaits Google sync in-request
 * (serverless fire-and-forget is unreliable). Job commit still succeeds if Google fails.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const property = await loadOwnedProperty(
      prisma,
      params.propertyId,
      session.customerId
    );
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const serviceType =
      typeof body.serviceType === 'string' ? body.serviceType.trim() : '';
    const preferredDateRaw =
      typeof body.preferredDate === 'string' ? body.preferredDate.trim() : '';
    const preferredTime =
      typeof body.preferredTime === 'string' ? body.preferredTime.trim() : '';
    const sameDayTurnover = Boolean(body.sameDayTurnover);
    const checkInDeadline =
      typeof body.checkInDeadline === 'string'
        ? body.checkInDeadline.trim()
        : '';
    const jobSpecificNotes =
      typeof body.jobSpecificNotes === 'string'
        ? body.jobSpecificNotes.trim()
        : '';

    if (!preferredDateRaw) {
      return NextResponse.json(
        { success: false, error: 'preferredDate is required' },
        { status: 400 }
      );
    }
    const preferredDate = parseServiceDateInput(preferredDateRaw);
    if (!preferredDate) {
      return NextResponse.json(
        { success: false, error: 'preferredDate is invalid' },
        { status: 400 }
      );
    }

    if (
      !serviceType ||
      !(HOST_CLEANING_SERVICE_TYPES as readonly string[]).includes(serviceType)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid serviceType' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        branchId: true,
        Branch: { select: { id: true, slug: true } },
      },
    });
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fail closed: require Customer.branchId — never silently default to Vermont.
    const branchId = customer.branchId;
    if (!branchId || !customer.Branch) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Your account is not linked to a service branch. Please contact VelocityMaid support before scheduling a cleaning.',
          code: 'BRANCH_NOT_CONFIGURED',
        },
        { status: 400 }
      );
    }

    const defaults = buildPropertyDefaultsForJob(property);
    const customerName =
      `${customer.firstName} ${customer.lastName}`.trim() || session.email;
    const internalNotes = buildHostCleaningJobNotes({
      preferredDate,
      preferredTime: preferredTime || null,
      serviceType,
      sameDayTurnover,
      checkInDeadline: checkInDeadline || null,
      jobSpecificNotes: jobSpecificNotes || null,
    });

    const jobReference = await nextVmReference();

    const job = await prisma.job.create({
      data: {
        id: randomUUID(),
        jobReference,
        Branch: { connect: { id: branchId } },
        Customer: { connect: { id: customer.id } },
        Property: { connect: { id: property.id } },
        customerName,
        address: defaults.address,
        serviceLocation: defaults.serviceLocation,
        serviceType,
        preferredDate,
        preferredTime: preferredTime || null,
        currency: 'USD',
        status: 'RECEIVED',
        paymentStatus: 'PENDING',
        internalNotes,
        marketLabel: customer.Branch.slug || null,
      },
      select: {
        id: true,
        jobReference: true,
        propertyId: true,
        address: true,
        preferredDate: true,
        preferredTime: true,
        serviceType: true,
        status: true,
        branchId: true,
      },
    });

    // Await so Vercel does not freeze the function before Drive/Calendar run.
    // Job row already committed; never fail the HTTP response on Google errors.
    try {
      await awaitJobGoogleSync(job.id);
    } catch (syncError) {
      console.error(
        '[customer/properties/:id/cleanings] Google sync failed after job create',
        syncError
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        jobReference: job.jobReference,
        propertyId: job.propertyId,
        address: job.address,
        preferredDate: job.preferredDate?.toISOString() ?? null,
        preferredTime: job.preferredTime,
        serviceType: job.serviceType,
        status: job.status,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create cleaning';
    console.error('[customer/properties/:id/cleanings]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Create Lead
 * POST /api/leads/create
 *
 * Creates a new lead, scores it, and triggers market-specific follow-up.
 *
 * New Jersey (quote-first): persist Lead + Elaine/ops/company/admin notify only.
 * Scoring is stored for internal review — it must not trigger deposit URLs,
 * Customer auto-create, nurture, WhatsApp booking/deposit CTAs, or Stripe.
 *
 * Other markets: existing Tier C deposit + Tier A/B customer/nurture + WhatsApp.
 */

import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLeadScore } from '@/lib/leadScoring';
import { NJ_BRANCH_SLUG, NJ_OPS_ASSIGNEE } from '@/lib/markets/newJersey';
import { notifyNjLeadFollowUp } from '@/lib/markets/notifyNjLeadFollowUp';

function newLeadId(): string {
  return 'c' + randomBytes(12).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      zip,
      city,
      addressLine,
      bedrooms,
      bathrooms,
      urgency,
      homeType,
      previousService,
      referralSource,
      source,
      serviceType,
      frequency,
      preferredDate,
      pets,
      branch,
    } = body;

    if (!name || !phone || !zip || !urgency) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, ZIP, and urgency are required' },
        { status: 400 }
      );
    }

    const branchSlug = branch || NJ_BRANCH_SLUG;
    const isNj = branchSlug === NJ_BRANCH_SLUG;

    if (isNj) {
      if (
        !email ||
        !city ||
        !addressLine ||
        !serviceType ||
        !frequency ||
        !preferredDate ||
        !referralSource ||
        bedrooms == null ||
        bathrooms == null ||
        !homeType
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'NJ quotes require email, source, city, address, service type, home details, frequency, and preferred date',
          },
          { status: 400 }
        );
      }
    }

    const branchRecord = await prisma.branch.findUnique({
      where: { slug: branchSlug },
    });

    if (!branchRecord) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    const scoringResult = calculateLeadScore({
      bedrooms,
      bathrooms,
      zip,
      urgency,
      previousService,
      homeType,
      referralSource,
    });

    const preferredDateParsed = preferredDate
      ? new Date(preferredDate)
      : null;
    const preferredDateValid =
      preferredDateParsed && !Number.isNaN(preferredDateParsed.getTime())
        ? preferredDateParsed
        : null;

    const now = new Date();
    const lead = await prisma.lead.create({
      data: {
        id: newLeadId(),
        branchId: branchRecord.id,
        name,
        phone,
        email: email || null,
        zip,
        city: city || null,
        addressLine: addressLine || null,
        bedrooms: bedrooms ?? null,
        bathrooms: bathrooms ?? null,
        pets: Boolean(pets),
        urgency,
        homeType: homeType || null,
        serviceType: serviceType || null,
        frequency: frequency || null,
        preferredDate: preferredDateValid,
        previousService: previousService || false,
        referralSource: referralSource || null,
        source: source || (isNj ? 'nj-lead-api' : null),
        followUpStatus: 'NEW',
        opsAssignee: isNj ? NJ_OPS_ASSIGNEE : null,
        leadScore: scoringResult.leadScore,
        leadTier: scoringResult.leadTier,
        riskFlags: scoringResult.riskFlags,
        status: 'NEW',
        updatedAt: now,
      },
    });

    let depositUrl: string | null = null;

    // NJ quote-first: no deposit, WhatsApp, Customer, or nurture automation.
    // Scoring remains on the Lead for ops review only.
    if (!isNj) {
      if (scoringResult.leadTier === 'C') {
        try {
          const depositResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/leads/deposit/generate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ leadId: lead.id }),
            }
          );
          const depositData = await depositResponse.json();
          if (depositData.success) {
            depositUrl = depositData.depositUrl;
            await prisma.lead.update({
              where: { id: lead.id },
              data: { depositUrl },
            });
          }
        } catch (error) {
          console.error('Failed to generate deposit URL:', error);
        }
      }

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/whatsapp/lead`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId: lead.id }),
          }
        );
      } catch (error) {
        console.error('Failed to send WhatsApp auto-response:', error);
      }
    }

    if (isNj) {
      // Await on Vercel so emails/admin notify are not frozen after the response.
      try {
        await notifyNjLeadFollowUp({
          leadId: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          zip: lead.zip,
          addressLine: lead.addressLine,
          serviceType: lead.serviceType,
          frequency: lead.frequency,
          preferredDate: lead.preferredDate
            ? lead.preferredDate.toISOString().slice(0, 10)
            : null,
          bedrooms: lead.bedrooms,
          bathrooms: lead.bathrooms,
          homeType: lead.homeType,
          referralSource: lead.referralSource,
          source: lead.source,
          followUpStatus: lead.followUpStatus,
        });
      } catch (err) {
        console.error('NJ ops follow-up notify failed:', err);
      }
    }

    if (
      !isNj &&
      (scoringResult.leadTier === 'A' || scoringResult.leadTier === 'B')
    ) {
      let customer = await prisma.customer.findFirst({
        where: {
          phone,
          branchId: branchRecord.id,
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            id: newLeadId(),
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            email: email || `${phone}@temp.velocitymaid.com`,
            phone,
            branchId: branchRecord.id,
            homeZipCode: zip,
            leadStatus: 'NEW',
            whatsappOptIn: true,
            updatedAt: new Date(),
          },
        });
      }

      await prisma.lead.update({
        where: { id: lead.id },
        data: { customerId: customer.id },
      });

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/nurture/scheduler`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: customer.id,
              branchId: branchRecord.id,
            }),
          }
        );
      } catch (error) {
        console.error('Failed to trigger nurture sequence:', error);
      }
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        leadScore: scoringResult.leadScore,
        leadTier: scoringResult.leadTier,
        status: lead.status,
        followUpStatus: lead.followUpStatus,
        opsAssignee: lead.opsAssignee,
        depositUrl,
      },
      scoring: {
        score: scoringResult.leadScore,
        tier: scoringResult.leadTier,
        riskFlags: scoringResult.riskFlags,
        reasoning: scoringResult.reasoning,
      },
    });
  } catch (error: unknown) {
    console.error('Create lead error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create lead';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

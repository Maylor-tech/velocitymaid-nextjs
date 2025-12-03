/**
 * Create Lead
 * POST /api/leads/create
 * 
 * Creates a new lead, scores it, and triggers automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLeadScore } from '@/lib/leadScoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      zip,
      bedrooms,
      bathrooms,
      urgency,
      homeType,
      previousService,
      referralSource,
      branch,
    } = body;

    // Validations
    if (!name || !phone || !zip || !urgency) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, ZIP, and urgency are required' },
        { status: 400 }
      );
    }

    // Get branch
    const branchRecord = await prisma.branch.findUnique({
      where: { slug: branch || 'new-jersey' },
    });

    if (!branchRecord) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Calculate lead score
    const scoringResult = calculateLeadScore({
      bedrooms,
      bathrooms,
      zip,
      urgency,
      previousService,
      homeType,
      referralSource,
    });

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        branchId: branchRecord.id,
        name,
        phone,
        email: email || null,
        zip,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        urgency,
        homeType: homeType || null,
        previousService: previousService || false,
        referralSource: referralSource || null,
        leadScore: scoringResult.leadScore,
        leadTier: scoringResult.leadTier,
        riskFlags: scoringResult.riskFlags,
        status: 'NEW',
      },
    });

    // Generate deposit URL for Tier C leads
    let depositUrl: string | null = null;
    if (scoringResult.leadTier === 'C') {
      const depositResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/leads/deposit/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const depositData = await depositResponse.json();
      if (depositData.success) {
        depositUrl = depositData.depositUrl;
        await prisma.lead.update({
          where: { id: lead.id },
          data: { depositUrl },
        });
      }
    }

    // Trigger WhatsApp auto-response
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/whatsapp/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
    } catch (error) {
      console.error('Failed to send WhatsApp auto-response:', error);
    }

    // Add to nurture sequence for Tier A and B
    if (scoringResult.leadTier === 'A' || scoringResult.leadTier === 'B') {
      // Create customer record for nurture sequence
      let customer = await prisma.customer.findFirst({
        where: {
          phone,
          branchId: branchRecord.id,
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            email: email || `${phone}@temp.velocitymaid.com`,
            phone,
            branchId: branchRecord.id,
            homeZipCode: zip,
            leadStatus: 'NEW',
            whatsappOptIn: true,
          },
        });
      }

      // Link lead to customer
      await prisma.lead.update({
        where: { id: lead.id },
        data: { customerId: customer.id },
      });

      // Trigger nurture sequence
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/nurture/scheduler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: customer.id,
            branchId: branchRecord.id,
          }),
        });
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
        depositUrl,
      },
      scoring: {
        score: scoringResult.leadScore,
        tier: scoringResult.leadTier,
        riskFlags: scoringResult.riskFlags,
        reasoning: scoringResult.reasoning,
      },
    });
  } catch (error: any) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}


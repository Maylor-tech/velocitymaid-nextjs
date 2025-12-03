/**
 * Nurture Sequence Scheduler
 * POST /api/automations/nurture/scheduler
 * 
 * Schedules nurture messages for a customer
 * Called when a new lead is created
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, branchId } = body;

    if (!customerId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and Branch ID are required' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        referralLinks: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get or create referral code
    let referralCode = customer.referralLinks[0]?.code;
    if (!referralCode) {
      const branchPrefix = customer.branch?.slug === 'new-jersey' ? 'NJ' : 'VM';
      referralCode = `${branchPrefix}-${customerId.substring(0, 8).toUpperCase()}`;
      
      await prisma.referralLink.create({
        data: {
          customerId,
          branchId,
          code: referralCode,
          isActive: true,
        },
      });
    }

    // Create nurture sequence
    const sequence = await prisma.nurtureSequence.upsert({
      where: { customerId },
      create: {
        customerId,
        branchId,
        currentDay: 0,
        referralCode,
        isActive: true,
      },
      update: {
        isActive: true,
        pausedAt: null,
      },
    });

    // Trigger Day 0 immediately
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/nurture/day0`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, branchId }),
      });
    } catch (error) {
      console.error('Failed to trigger Day 0:', error);
    }

    // Schedule future messages (in production, use a job queue like Bull or similar)
    // For now, we'll use a cron job approach
    const schedule = [
      { day: 1, hours: 24 },
      { day: 2, hours: 48 },
      { day: 3, hours: 72 },
      { day: 4, hours: 96 },
      { day: 5, hours: 120 },
      { day: 6, hours: 144 },
      { day: 7, hours: 168 },
    ];

    // In production, schedule these with a job queue
    // For now, return success and let cron job handle it
    console.log('Nurture sequence scheduled:', {
      customerId,
      sequenceId: sequence.id,
      schedule,
    });

    return NextResponse.json({
      success: true,
      sequence: {
        id: sequence.id,
        currentDay: sequence.currentDay,
        scheduledDays: schedule.map(s => s.day),
      },
    });
  } catch (error: any) {
    console.error('Schedule nurture sequence error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule nurture sequence' },
      { status: 500 }
    );
  }
}


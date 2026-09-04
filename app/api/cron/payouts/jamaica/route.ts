export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Weekly Jamaica Payouts Cron Job
 * 
 * GET /api/cron/payouts/jamaica
 * 
 * Runs weekly to auto-generate payouts for all active cleaners in Jamaica branches
 * Should be called by a cron service (e.g., Vercel Cron, external scheduler)
 * 
 * Security: Should be protected with a secret token in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPayout } from '@/app/services/payouts/jamaicaPayoutService';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { getCleanerPaymentMethod } from '@/app/services/payouts/jamaicaPayoutService';

// Verify cron secret token (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-here';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (basic security)
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '') || request.nextUrl.searchParams.get('secret');

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate period (last 14 days)
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 14);

    // Get all Jamaica branches
    const jamaicaBranches = await prisma.branch.findMany({
      where: {
        country: 'JM',
        currency: 'JMD',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (jamaicaBranches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active Jamaica branches found',
        payoutsCreated: 0,
      });
    }

    const results = {
      payoutsCreated: 0,
      payoutsFailed: 0,
      errors: [] as string[],
    };

    // Process each branch
    for (const branch of jamaicaBranches) {
      try {
        // Get all active cleaners for this branch
        const cleaners = await prisma.user.findMany({
          where: {
            role: 'CLEANER',
            UserBranch: {
              some: {
                branchId: branch.id,
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        // Create payout for each cleaner
        for (const cleaner of cleaners) {
          try {
            // Check if payout already exists for this period
            const existingPayout = await prisma.jamaicaPayout.findFirst({
              where: {
                cleanerId: cleaner.id,
                branchId: branch.id,
                periodStart: {
                  gte: periodStart,
                },
                periodEnd: {
                  lte: periodEnd,
                },
              },
            });

            if (existingPayout) {
              console.log(`Payout already exists for cleaner ${cleaner.id} in branch ${branch.id}`);
              continue;
            }

            // Create payout
            const payout = await createPayout(
              cleaner.id,
              branch.id,
              periodStart,
              periodEnd
            );

            results.payoutsCreated++;

            // Send WhatsApp notification (non-blocking)
            try {
              const paymentMethod = await getCleanerPaymentMethod(cleaner.id);
              const whatsappNumber = paymentMethod?.whatsappNumber || null;

              if (whatsappNumber && payout.totalAmount > 0) {
                const periodStartFormatted = periodStart.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const periodEndFormatted = periodEnd.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                const message = `Hi ${cleaner.name || 'there'}, your payout for ${periodStartFormatted} – ${periodEndFormatted} has been created:\n\nAmount: JMD $${payout.totalAmount.toLocaleString()}\nStatus: Pending approval`;

                await sendWhatsAppMessage(whatsappNumber, message);
              }
            } catch (whatsappError) {
              console.error(`Failed to send WhatsApp for cleaner ${cleaner.id}:`, whatsappError);
              // Don't fail the payout creation if WhatsApp fails
            }
          } catch (payoutError: unknown) {
            console.error(`Failed to create payout for cleaner ${cleaner.id}:`, payoutError);
            results.payoutsFailed++;
            results.errors.push(`Cleaner ${cleaner.id}: ${(payoutError instanceof Error ? payoutError.message : undefined)}`);
          }
        }
      } catch (branchError: unknown) {
        console.error(`Error processing branch ${branch.id}:`, branchError);
        results.errors.push(`Branch ${branch.id}: ${(branchError instanceof Error ? branchError.message : undefined)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly payout generation completed',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      ...results,
    });
  } catch (error: unknown) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : undefined) || 'Failed to run cron job' },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that use POST
export async function POST(request: NextRequest) {
  return GET(request);
}


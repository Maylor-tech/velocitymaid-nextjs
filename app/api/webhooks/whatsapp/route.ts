export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * WhatsApp Webhook Endpoint
 * 
 * Handles webhook verification and inbound messages from Meta WhatsApp Cloud API
 */

import { NextRequest, NextResponse } from 'next/server';
import { replyWithBookingLink, replyWithCleanerApply, replyWithGeneralHelp, parseJobReply } from '@/app/services/whatsappService';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'velocitymaid-webhook';

/**
 * GET - Webhook verification (required by Meta)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the webhook
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  // Verification failed
  console.error('WhatsApp webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * POST - Handle inbound messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle webhook verification (Meta sends this on webhook setup)
    if (body.object === 'whatsapp_business_account') {
      // This is a webhook setup event, acknowledge it
      return NextResponse.json({ success: true });
    }

    // Handle incoming messages and status updates
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            // Handle incoming messages
            if (change.value?.messages && change.value.messages.length > 0) {
              for (const message of change.value.messages) {
                await handleInboundMessage(message);
              }
            }
            
            // Handle status updates (delivered, read, etc.) - just log for now
            if (change.value?.statuses && change.value.statuses.length > 0) {
              for (const status of change.value.statuses) {
                console.log(`WhatsApp message status: ${status.status} for message ${status.id}`);
              }
            }
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}

/**
 * Handle individual inbound message
 */
async function handleInboundMessage(message: any) {
  try {
    const from = message.from; // User's phone number
    const text = message.text?.body || '';
    const normalizedText = text.toLowerCase().trim();

    console.log(`Received WhatsApp message from ${from}: ${text}`);

    // Check if this is a job reply (YES/NO)
    const jobReply = parseJobReply(text);
    if (jobReply) {
      await handleJobReply(from, jobReply, text);
      return;
    }

    // Route message based on content
    if (normalizedText === 'book' || normalizedText.includes('clean') || normalizedText.includes('booking') || normalizedText.includes('schedule')) {
      // User wants to book a cleaning
      await replyWithBookingLink(from, 'port-antonio');
      return;
    }

    if (normalizedText === 'apply' || normalizedText.includes('job') || normalizedText.includes('work') || normalizedText.includes('cleaner')) {
      // User wants to apply as cleaner
      await replyWithCleanerApply(from, 'port-antonio');
      return;
    }

    if (normalizedText === 'help' || normalizedText === 'hi' || normalizedText === 'hello' || normalizedText === 'hey') {
      // General help request
      await replyWithGeneralHelp(from);
      return;
    }

    // Default: send general help
    await replyWithGeneralHelp(from);
  } catch (error: any) {
    console.error('Error handling inbound message:', error);
    // Don't throw - we don't want to break the webhook
  }
}

/**
 * Handle job acceptance/decline reply
 */
async function handleJobReply(cleanerPhone: string, reply: 'YES' | 'NO', originalMessage: string) {
  try {
    // Find cleaner application by phone number
    const normalizedPhone = cleanerPhone.replace(/[^0-9]/g, '');
    const cleanerApplication = await prisma.cleanerApplication.findFirst({
      where: {
        phone: {
          contains: normalizedPhone,
        },
      },
    });

    if (!cleanerApplication) {
      console.log(`Cleaner application not found for phone: ${cleanerPhone}`);
      return;
    }

    // Find cleaner by email
    const cleaner = await prisma.user.findFirst({
      where: {
        role: 'CLEANER',
        email: cleanerApplication.email,
      },
      include: {
        primaryBranch: {
          select: {
            country: true,
            slug: true,
          },
        },
      },
    });

    if (!cleaner) {
      console.log(`Cleaner not found for phone: ${cleanerPhone}`);
      return;
    }

    // Check if Jamaica branch (only process job replies for Jamaica)
    const isJamaicaBranch =
      cleaner.primaryBranch?.country === 'Jamaica' ||
      cleaner.primaryBranch?.country === 'JM' ||
      cleaner.primaryBranch?.slug === 'port-antonio';

    if (!isJamaicaBranch) {
      // Not a Jamaica cleaner, ignore job reply
      return;
    }

    // Find pending job assigned to this cleaner
    // Try to extract job ID from message or find most recent pending job
    const jobIdMatch = originalMessage.match(/Job ID:\s*([a-zA-Z0-9-]+)/i);
    let job = null;

    if (jobIdMatch) {
      job = await prisma.job.findUnique({
        where: { id: jobIdMatch[1] },
        include: {
          branch: {
            select: {
              country: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // Find most recent pending job assigned to this cleaner
      job = await prisma.job.findFirst({
        where: {
          assignedCleanerId: cleaner.id,
          status: 'pending',
        },
        include: {
          branch: {
            select: {
              country: true,
              slug: true,
            },
          },
        },
        orderBy: {
          assignedAt: 'desc',
        },
      });
    }

    if (!job) {
      await sendWhatsAppMessage(
        cleanerPhone,
        'Sorry, I couldn\'t find the job you\'re replying to. Please contact support if you need assistance.'
      );
      return;
    }

    // Verify job is for Jamaica branch
    const isJamaicaJob =
      job.branch.country === 'Jamaica' ||
      job.branch.country === 'JM' ||
      job.branch.slug === 'port-antonio';

    if (!isJamaicaJob) {
      return; // Don't process non-Jamaica jobs
    }

    if (reply === 'YES') {
      // Accept job
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'ACCEPTED',
        },
      });

      await sendWhatsAppMessage(
        cleanerPhone,
        `✅ Job accepted! You've been assigned to this cleaning job. We'll send you more details soon.`
      );

      // TODO: Notify admin that job was accepted
      console.log(`Job ${job.id} accepted by cleaner ${cleaner.id}`);
    } else if (reply === 'NO') {
      // Decline job
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'DECLINED',
          assignedCleanerId: null,
          assignedAt: null,
        },
      });

      await sendWhatsAppMessage(
        cleanerPhone,
        `Job declined. We'll find another cleaner for this job. Thank you for letting us know!`
      );

      // TODO: Notify admin that job was declined
      console.log(`Job ${job.id} declined by cleaner ${cleaner.id}`);
    }
  } catch (error: any) {
    console.error('Error handling job reply:', error);
    // Don't throw - we don't want to break the webhook
  }
}


/**
 * Training Notification Service
 * 
 * Sends WhatsApp notifications for training-related events
 */

import { sendWhatsAppMessage } from './whatsappService';
import { prisma } from '@/lib/prisma';

/**
 * Send training notification when cleaner is approved
 */
export async function sendTrainingWelcomeNotification(
  cleanerId: string,
  cleanerPhone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trainingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://velocitymaid.com'}/cleaners/training`;
    
    const message = `Welcome to VelocityMaid Port Antonio! 🇯🇲

Please start your training here: ${trainingUrl}

Complete all modules before your first job. If you have questions, reply to this message.`;

    const result = await sendWhatsAppMessage(cleanerPhone, message);
    return result;
  } catch (error: any) {
    console.error('Error sending training welcome notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Send reminder if training not started within 24 hours
 */
export async function sendTrainingReminderNotification(
  cleanerId: string,
  cleanerPhone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trainingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://velocitymaid.com'}/cleaners/training`;
    
    const message = `Reminder: Start Your VelocityMaid Training 📚

You haven't started your training yet. Complete all modules to start receiving jobs.

Start here: ${trainingUrl}

Questions? Reply to this message.`;

    const result = await sendWhatsAppMessage(cleanerPhone, message);
    return result;
  } catch (error: any) {
    console.error('Error sending training reminder:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Send notification when first module is completed
 */
export async function sendFirstModuleCompletedNotification(
  cleanerId: string,
  cleanerPhone: string,
  moduleTitle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trainingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://velocitymaid.com'}/cleaners/training`;
    
    const message = `Great progress! 🎉

You've completed your first training module: "${moduleTitle}"

Keep going! Complete all modules to start receiving jobs.

Continue training: ${trainingUrl}`;

    const result = await sendWhatsAppMessage(cleanerPhone, message);
    return result;
  } catch (error: any) {
    console.error('Error sending first module completed notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Send notification when all modules are completed
 */
export async function sendAllModulesCompletedNotification(
  cleanerId: string,
  cleanerPhone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = `Congratulations! 🎊

You've completed all training modules! You're now certified and ready to start receiving jobs.

You'll be notified when jobs are assigned to you.`;

    const result = await sendWhatsAppMessage(cleanerPhone, message);
    return result;
  } catch (error: any) {
    console.error('Error sending all modules completed notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Send notification when admin marks training as PASSED
 */
export async function sendTrainingPassedNotification(
  cleanerId: string,
  cleanerPhone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const message = `Training Approved! ✅

Your training has been reviewed and approved. You're now certified and ready to start receiving jobs.

You'll be notified when jobs are assigned to you.`;

    const result = await sendWhatsAppMessage(cleanerPhone, message);
    return result;
  } catch (error: any) {
    console.error('Error sending training passed notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
}

/**
 * Check and send reminder if training not started within 24 hours
 */
export async function checkAndSendTrainingReminder(cleanerId: string): Promise<void> {
  try {
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId },
      include: {
        primaryBranch: {
          select: { country: true, slug: true },
        },
        trainingStatus: true,
      },
    });

    if (!cleaner) return;

    // Only for Jamaica branch
    const isJamaicaBranch =
      cleaner.primaryBranch?.country === 'Jamaica' ||
      cleaner.primaryBranch?.country === 'JM' ||
      cleaner.primaryBranch?.slug === 'port-antonio';

    if (!isJamaicaBranch) return;

    // Check if training not started
    if (!cleaner.trainingStatus || cleaner.trainingStatus.overallStatus === 'NOT_STARTED') {
      // Check if 24 hours have passed since account creation
      const hoursSinceCreation = (Date.now() - cleaner.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCreation >= 24) {
        // Get cleaner phone from application or user data
        const application = await prisma.cleanerApplication.findFirst({
          where: {
            email: cleaner.email,
            branch: {
              country: { in: ['Jamaica', 'JM'] },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const phone = application?.phone || null;
        if (phone) {
          await sendTrainingReminderNotification(cleanerId, phone);
        }
      }
    }
  } catch (error) {
    console.error('Error checking training reminder:', error);
    // Don't throw - this is a background check
  }
}



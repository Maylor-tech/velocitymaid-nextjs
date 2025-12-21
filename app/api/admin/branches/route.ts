export const runtime = "nodejs";
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

/**
 * List Branches API
 * 
 * GET /api/admin/branches
 * 
 * Returns all branches
 */
export async function GET(request: NextRequest) {
  // TODO: Add admin authentication check
  try {
    const branches = await prisma.branch.findMany({
      include: {
        User_Branch_managerIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        PricingModel: {
          select: {
            id: true,
            name: true,
          },
        },
        BranchServiceArea: {
          select: {
            zipCode: true,
            city: true,
            state: true,
          },
        },
        _count: {
          select: {
            Job: true,
            CleanerApplication: true,
            Customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      success: true,
      branches,
      count: branches.length,
    });
  } catch (error: any) {
    console.error('BRANCH_FETCH_ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

/**
 * Create Branch API
 * 
 * POST /api/admin/branches
 * 
 * Body: {
 *   name, slug, country, state, city, regionLabel, timezone,
 *   primaryPhone, whatsappNumber, managerId, pricingModelId,
 *   zipCodes: string[],
 *   bookingEmail, supportEmail, maxDailyJobs,
 *   bookingWebhookUrl, reminderWebhookUrl, reviewWebhookUrl,
 *   whatsappTemplateBooking, whatsappTemplateReminder, whatsappTemplateReview,
 *   cloneDefaultPackages: boolean,
 *   templateBranchId?: string,
 *   status: 'ACTIVE' | 'COMING_SOON' | 'PAUSED',
 *   generateLandingPage: boolean,
 *   enableBookings: boolean
 * }
 */
export async function POST(request: NextRequest) {
  // TODO: Add admin authentication check
  // if (!isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      country,
      state,
      city,
      regionLabel,
      timezone,
      primaryPhone,
      whatsappNumber,
      managerId,
      pricingModelId,
      zipCodes,
      bookingEmail,
      supportEmail,
      maxDailyJobs,
      bookingWebhookUrl,
      reminderWebhookUrl,
      reviewWebhookUrl,
      whatsappTemplateBooking,
      whatsappTemplateReminder,
      whatsappTemplateReview,
      cloneDefaultPackages,
      templateBranchId,
      status,
      generateLandingPage,
      enableBookings,
    } = body;

    // Validate required fields
    if (!name || !slug || !country || !state || !city || !timezone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingBranch = await prisma.branch.findUnique({
      where: { slug },
    });
    if (existingBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch slug already exists' },
        { status: 400 }
      );
    }

    // Create branch with related data in a transaction
    const branch = await prisma.$transaction(async (tx) => {
      // Create branch
      const newBranch = await tx.branch.create({
        data: {
          name,
          slug,
          country,
          state,
          city,
          regionLabel: regionLabel || null,
          timezone,
          primaryPhone,
          whatsappNumber,
          managerId: managerId || null,
          pricingModelId: pricingModelId || null,
          status: status || 'COMING_SOON',
        },
      });

      // Create branch config
      await tx.branchConfig.create({
        data: {
          branchId: newBranch.id,
          bookingEmail: bookingEmail || null,
          supportEmail: supportEmail || null,
          maxDailyJobs: maxDailyJobs || null,
        },
      });

      // Create automation config
      await tx.branchAutomationConfig.create({
        data: {
          branchId: newBranch.id,
          bookingWebhookUrl: bookingWebhookUrl || null,
          reminderWebhookUrl: reminderWebhookUrl || null,
          reviewWebhookUrl: reviewWebhookUrl || null,
          whatsappTemplateBooking: whatsappTemplateBooking || null,
          whatsappTemplateReminder: whatsappTemplateReminder || null,
          whatsappTemplateReview: whatsappTemplateReview || null,
        },
      });

      // Create service areas for each ZIP code
      if (zipCodes && Array.isArray(zipCodes)) {
        const zipCodeData = zipCodes
          .map((zip: string) => zip.trim())
          .filter((zip: string) => zip.length > 0)
          .map((zip: string) => ({
            branchId: newBranch.id,
            zipCode: zip,
            priority: 1,
          }));

        if (zipCodeData.length > 0) {
          await tx.branchServiceArea.createMany({
            data: zipCodeData,
            skipDuplicates: true,
          });
        }
      }

      // Clone default packages if requested
      if (cloneDefaultPackages) {
        let sourcePackages: any[] = [];
        
        if (templateBranchId) {
          // Clone from template branch
          sourcePackages = await tx.branchServicePackage.findMany({
            where: { branchId: templateBranchId },
          });
        } else {
          // Use default packages
          sourcePackages = [
            { code: 'STANDARD_CLEAN', name: 'Standard Clean', defaultDurationHours: 2, basePrice: 80, description: null },
            { code: 'DEEP_CLEAN', name: 'Deep Clean', defaultDurationHours: 4, basePrice: 150, description: null },
            { code: 'MOVE_IN_OUT', name: 'Move In/Out Clean', defaultDurationHours: 6, basePrice: 250, description: null },
          ];
        }

        await tx.branchServicePackage.createMany({
          data: sourcePackages.map((pkg) => ({
            branchId: newBranch.id,
            code: pkg.code,
            name: pkg.name,
            description: pkg.description || null,
            defaultDurationHours: pkg.defaultDurationHours,
            basePrice: pkg.basePrice,
            isActive: true,
          })),
        });
      }

      // Generate landing page content if requested
      if (generateLandingPage) {
        await tx.branchLandingContent.create({
          data: {
            branchId: newBranch.id,
            headline: `Professional Cleaning Services in ${city}, ${state}`,
            subheadline: `Experience the VelocityMaid difference in ${city}. Trusted, reliable, and thorough cleaning services.`,
            seoTitle: `Professional Cleaning Services in ${city}, ${state} | VelocityMaid`,
            seoDescription: `Book professional cleaning services in ${city}, ${state}. Fast, reliable, and affordable. Get your free quote today!`,
          },
        });
      }

      return newBranch;
    });

    // Update manager's primaryBranchId and create UserBranch entry
    if (managerId) {
      await prisma.user.update({
        where: { id: managerId },
        data: { primaryBranchId: branch.id },
      });
      
      await prisma.userBranch.upsert({
        where: {
          userId_branchId: {
            userId: managerId,
            branchId: branch.id,
          },
        },
        create: {
          userId: managerId,
          branchId: branch.id,
        },
        update: {},
      });
    }

    return NextResponse.json({
      success: true,
      branch,
      message: 'Branch created successfully',
    });
  } catch (error: any) {
    console.error('Create branch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create branch' },
      { status: 500 }
    );
  }
}


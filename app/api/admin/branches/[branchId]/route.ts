export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';

import { randomUUID } from "crypto";
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;

    const branch = await prisma.branch.findUnique({
      where: { slug },
      include: {
        User_Branch_managerIdToUser: {
          select: { id: true, name: true, email: true },
        },
        PricingModel: {
          select: { id: true, name: true },
        },
        BranchServiceArea: {
          orderBy: { zipCode: 'asc' },
        },
        BranchServicePackage: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        BranchConfig: true,
        BranchAutomationConfig: true,
        BranchLandingContent: true,
        _count: {
          select: {
            Job: true,
            UserBranch: true,
            Customer: true,
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      branch,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('Get branch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch branch' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const body = await request.json();

    const {
      name,
      regionLabel,
      primaryPhone,
      whatsappNumber,
      currency,
      bookingEmail,
      supportEmail,
      maxDailyJobs,
      status,
      zipCodes,
      headline,
      subheadline,
      seoTitle,
      seoDescription,
    } = body;

    // Update branch
    const branch = await prisma.$transaction(async (tx) => {
      const updatedBranch = await tx.branch.update({
        where: { slug },
        data: {
          ...(name && { name }),
          ...(regionLabel !== undefined && { regionLabel }),
          ...(primaryPhone && { primaryPhone }),
          ...(whatsappNumber && { whatsappNumber }),
          ...(currency && { currency }),
          ...(status && { status }),
        },
      });

      // Update config
      if (bookingEmail !== undefined || supportEmail !== undefined || maxDailyJobs !== undefined) {
        await tx.branchConfig.upsert({
          where: { branchId: updatedBranch.id },
          create: {
            id: randomUUID(),
            branchId: updatedBranch.id,
            bookingEmail: bookingEmail || null,
            supportEmail: supportEmail || null,
            maxDailyJobs: maxDailyJobs ? parseInt(maxDailyJobs) : null,
            updatedAt: new Date(),
          },
          update: {
            ...(bookingEmail !== undefined && { bookingEmail: bookingEmail || null }),
            ...(supportEmail !== undefined && { supportEmail: supportEmail || null }),
            ...(maxDailyJobs !== undefined && { maxDailyJobs: maxDailyJobs ? parseInt(maxDailyJobs) : null }),
          },
        });
      }

      // Update service areas if provided
      if (zipCodes && Array.isArray(zipCodes)) {
        // Delete existing service areas
        await tx.branchServiceArea.deleteMany({
          where: { branchId: updatedBranch.id },
        });

        // Create new service areas
        const zipCodeData = zipCodes
          .map((zip: string) => zip.trim())
          .filter((zip: string) => zip.length > 0)
          .map((zip: string) => ({
            id: randomUUID(),
            branchId: updatedBranch.id,
            zipCode: zip,
            priority: 1,
            updatedAt: new Date(),
          }));

        if (zipCodeData.length > 0) {
          await tx.branchServiceArea.createMany({
            data: zipCodeData,
            skipDuplicates: true,
          });
        }
      }

      // Update landing content
      if (headline !== undefined || subheadline !== undefined || seoTitle !== undefined || seoDescription !== undefined) {
        await tx.branchLandingContent.upsert({
          where: { branchId: updatedBranch.id },
          create: {
            id: randomUUID(),
            branchId: updatedBranch.id,
            headline: headline || null,
            subheadline: subheadline || null,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            updatedAt: new Date(),
          },
          update: {
            ...(headline !== undefined && { headline: headline || null }),
            ...(subheadline !== undefined && { subheadline: subheadline || null }),
            ...(seoTitle !== undefined && { seoTitle: seoTitle || null }),
            ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
          },
        });
      }

      return updatedBranch;
    });

    return NextResponse.json({
      success: true,
      branch,
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('Update branch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update branch' },
      { status: 500 }
    );
  }
}

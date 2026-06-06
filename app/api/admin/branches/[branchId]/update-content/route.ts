export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

/**
 * Update Branch Landing Content API
 * 
 * PATCH /api/admin/branches/[slug]/update-content
 * 
 * Updates the BranchLandingContent for a branch
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const body = await request.json();

    // Find branch
    const branch = await prisma.branch.findUnique({
      where: { slug },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Update or create landing content
    const landingContent = await prisma.branchLandingContent.upsert({
      where: { branchId: branch.id },
      create: {
        branchId: branch.id,
        headline: body.headline || null,
        subheadline: body.subheadline || null,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        heroImageUrl: body.heroImageUrl || null,
        localCtaLabel: body.localCtaLabel || null,
        testimonials: body.testimonials ? JSON.parse(JSON.stringify(body.testimonials)) : null,
        faqEntries: body.faqEntries ? JSON.parse(JSON.stringify(body.faqEntries)) : null,
      },
      update: {
        ...(body.headline !== undefined && { headline: body.headline }),
        ...(body.subheadline !== undefined && { subheadline: body.subheadline }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDescription !== undefined && { seoDescription: body.seoDescription }),
        ...(body.heroImageUrl !== undefined && { heroImageUrl: body.heroImageUrl }),
        ...(body.localCtaLabel !== undefined && { localCtaLabel: body.localCtaLabel }),
        ...(body.testimonials !== undefined && { testimonials: JSON.parse(JSON.stringify(body.testimonials)) }),
        ...(body.faqEntries !== undefined && { faqEntries: JSON.parse(JSON.stringify(body.faqEntries)) }),
      },
    });

    return NextResponse.json({
      success: true,
      landingContent,
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Update landing content error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update landing content' },
      { status: 500 }
    );
  }
}


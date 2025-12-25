export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateApplicantFitScore } from '@/utils/applicantScore';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      whatsappNumber,
      country,
      branchId,
      experienceLevel,
      areaOfResidence,
      daysAvailable,
      weekendAbility,
      canTravelToVillas,
      idUploadUrl,
      referencesUploadUrl,
      notes,
    } = body;

    // Basic validation - name, email, phone are REQUIRED
    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, email, and phone are required' },
        { status: 400 }
      );
    }

    // CRITICAL: country is REQUIRED - Phase 0 architecture requires country selection first
    if (!country || typeof country !== 'string' || country.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Country selection is required. Please select a country.' },
        { status: 400 }
      );
    }

    // CRITICAL: branchId is REQUIRED - every cleaner application MUST belong to a branch
    if (!branchId || typeof branchId !== 'string' || branchId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Branch selection is required. Please select a branch.' },
        { status: 400 }
      );
    }

    // Verify branch exists and is valid
    const branch = await prisma.branch.findUnique({
      where: { id: branchId.trim() },
      select: { id: true, status: true, slug: true, country: true },
    });

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Invalid branch selected. Please select a valid branch.' },
        { status: 400 }
      );
    }

    // Verify branch country matches selected country (Phase 0 architecture requirement)
    const branchCountry = branch.country || '';
    const countryMatch = 
      (country === 'Jamaica' && (branchCountry === 'Jamaica' || branchCountry === 'JM')) ||
      (country === 'USA' && (branchCountry === 'USA' || branchCountry === 'US' || branchCountry === 'United States'));
    
    if (!countryMatch) {
      return NextResponse.json(
        { success: false, error: 'Selected branch does not match selected country. Please verify your selections.' },
        { status: 400 }
      );
    }

    if (branch.status !== 'ACTIVE' && branch.status !== 'COMING_SOON') {
      return NextResponse.json(
        { success: false, error: 'Branch is not accepting applications' },
        { status: 400 }
      );
    }

    // Calculate applicant fit score (for Jamaica branches)
    let applicantFitScore: number | null = null;
    const isJamaicaBranch =
      branch.country === 'Jamaica' ||
      branch.country === 'JM' ||
      branch.slug === 'port-antonio';

    if (isJamaicaBranch) {
      applicantFitScore = await calculateApplicantFitScore({
        daysAvailable: daysAvailable || null,
        weekendAbility: weekendAbility || false,
        canTravelToVillas: canTravelToVillas || false,
        areaOfResidence: areaOfResidence || null,
        experienceLevel: experienceLevel || null,
        phone: whatsappNumber || phone,
        branchId: branchId.trim(),
      });
    }

    // Create application - branchId is REQUIRED and validated above
    const application = await prisma.cleanerApplication.create({
      data: {
        name,
        email,
        phone,
        whatsappNumber: whatsappNumber || null,
        branchId: branchId.trim(), // REQUIRED - validated and verified above
        experienceLevel: experienceLevel || null,
        areaOfResidence: areaOfResidence || null,
        daysAvailable: daysAvailable ? JSON.parse(JSON.stringify(daysAvailable)) : null,
        weekendAbility: weekendAbility || false,
        canTravelToVillas: canTravelToVillas || false,
        idUploadUrl: idUploadUrl || null,
        referencesUploadUrl: referencesUploadUrl || null,
        applicantFitScore,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    // Send WhatsApp messages based on score (Jamaica only)
    if (isJamaicaBranch && (whatsappNumber || phone)) {
      const whatsappPhone = whatsappNumber || phone;
      
      try {
        if (applicantFitScore !== null) {
          if (applicantFitScore >= 70) {
            // Strong applicant - send interview link
            const interviewMessage = `🎉 Great news! Your application looks strong!\n\nWe'd like to schedule an interview with you.\n\nBook your interview time here:\nhttps://velocitymaid.com/jamaica/interview\n\nWe'll be in touch soon!`;
            await sendWhatsAppMessage(whatsappPhone, interviewMessage);
          } else if (applicantFitScore < 40) {
            // Weak applicant - polite rejection
            const rejectionMessage = `Thank you for your interest in joining VelocityMaid.\n\nAfter reviewing your application, we don't have a position that matches your profile at this time. We'll keep your application on file for future opportunities.\n\nThank you for considering VelocityMaid!`;
            await sendWhatsAppMessage(whatsappPhone, rejectionMessage);
          } else {
            // Moderate - standard message
            const standardMessage = `Thank you for applying to VelocityMaid!\n\nWe've received your application and will review it carefully. We'll be in touch within 2-3 business days.\n\nThank you for your interest!`;
            await sendWhatsAppMessage(whatsappPhone, standardMessage);
          }
        } else {
          // Fallback if score calculation failed
          const standardMessage = `Thank you for applying to VelocityMaid!\n\nWe've received your application and will review it carefully. We'll be in touch within 2-3 business days.\n\nThank you for your interest!`;
          await sendWhatsAppMessage(whatsappPhone, standardMessage);
        }
      } catch (whatsappError) {
        // Log but don't fail the application submission
        console.error('Failed to send WhatsApp message:', whatsappError);
      }
    }

    return NextResponse.json({
      success: true,
      application,
      applicantFitScore,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    console.error('Cleaner application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}




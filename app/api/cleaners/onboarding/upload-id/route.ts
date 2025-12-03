import { NextRequest, NextResponse } from 'next/server';

/**
 * Upload Cleaner ID API
 * 
 * POST /api/cleaners/onboarding/upload-id
 * 
 * Handles ID document uploads for cleaner verification
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add cleaner authentication check
    
    const formData = await request.formData();
    const idType = formData.get('idType') as string;
    const idFront = formData.get('idFront') as File | null;
    const idBack = formData.get('idBack') as File | null;

    if (!idFront) {
      return NextResponse.json(
        { success: false, error: 'Front of ID is required' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (idFront.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    if (idBack && idBack.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Back file size must be less than 5MB' },
        { status: 400 }
      );
    }

    // TODO: Upload to secure storage (S3, etc.)
    // For now, just validate and return success
    // In production, you would:
    // 1. Upload to S3 or similar
    // 2. Store file URLs in database
    // 3. Trigger ID verification service
    
    const fileInfo = {
      idType,
      frontFileName: idFront.name,
      frontSize: idFront.size,
      backFileName: idBack?.name || null,
      backSize: idBack?.size || null,
      uploadedAt: new Date().toISOString(),
    };

    // TODO: Store in database
    // await storeCleanerID(cleanerId, fileInfo);

    return NextResponse.json({
      success: true,
      message: 'ID uploaded successfully',
      fileInfo,
    });
  } catch (error: any) {
    console.error('Upload ID error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload ID' },
      { status: 500 }
    );
  }
}




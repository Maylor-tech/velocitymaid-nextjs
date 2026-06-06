export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'; // Required for file system operations (if using alternative storage)

/**
 * File Upload API for Cleaner Application
 * POST /api/cleaners/apply/upload
 * 
 * ⚠️ NOTE: This route currently returns an error because Vercel serverless functions
 * cannot write to the filesystem. To enable file uploads, you need to:
 * 
 * Option 1: Use Vercel Blob Storage
 * Option 2: Use AWS S3 or similar cloud storage
 * Option 3: Use a different hosting solution that supports file writes
 * 
 * For now, this route is disabled to prevent build failures.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Return error - file uploads not supported on Vercel serverless
  return NextResponse.json(
    { 
      success: false, 
      error: 'File uploads are currently disabled. Please contact support for alternative upload methods.' 
    },
    { status: 503 }
  );

  /* 
  // DISABLED: File system operations don't work on Vercel serverless
  // To re-enable, implement cloud storage (Vercel Blob, S3, etc.)
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images and PDFs are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // TODO: Implement cloud storage upload here
    // Example: Upload to Vercel Blob Storage or S3
    
    return NextResponse.json({
      success: false,
      error: 'File uploads not yet implemented with cloud storage',
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
  */
}


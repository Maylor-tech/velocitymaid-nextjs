/**
 * Sign Contract API
 * POST /api/contracts/sign
 * 
 * Marks contract as signed and saves signature
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, signature, name, phone, email } = body;

    if (!contractId || !signature || !name) {
      return NextResponse.json(
        { success: false, error: 'Contract ID, signature, and name are required' },
        { status: 400 }
      );
    }

    // Get existing contract first
    const existingContract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Update contract
    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signedBy: name,
        phone: phone || null,
        email: email || null,
        metadata: {
          ...((existingContract.metadata as any) || {}),
          signature,
        },
      },
    });

    // TODO: Send admin notification (email + WhatsApp)
    // TODO: Upload PDF to Supabase Storage

    return NextResponse.json({
      success: true,
      contract,
    });
  } catch (error: any) {
    console.error('Sign contract error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sign contract' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    const auth = await requireAuth(req);

    if (!auth.tenantId) {
      return NextResponse.json(
        { error: 'User must be associated with a tenant', requestId },
        { status: 400 }
      );
    }

    // Fetch contact messages for this tenant
    const messages = await prisma.contactMessage.findMany({
      where: {
        tenantId: auth.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        message: true,
        status: true,
        createdAt: true,
        repliedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      name: msg.name,
      email: msg.email,
      organization: msg.organization,
      message: msg.message,
      status: msg.status,
      createdAt: msg.createdAt.toISOString(),
      repliedAt: msg.repliedAt ? msg.repliedAt.toISOString() : undefined,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error fetching messages:`, error);
    
    // If it's a NextResponse (from requireAuth), re-throw it
    if (error instanceof NextResponse) {
      throw error;
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages', requestId },
      { status: 500 }
    );
  }
}


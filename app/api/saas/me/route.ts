import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Get current SaaS user and tenant information
 * 
 * GET /api/saas/me
 */
export async function GET(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    let auth;
    try {
      auth = await requireAuth(req);
    } catch (authError: any) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return NextResponse.json(
        { error: 'Authentication required', requestId },
        { status: 401 }
      );
    }

    if (!auth.tenantId) {
      return NextResponse.json(
        { error: 'User is not associated with a tenant', requestId },
        { status: 403 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      include: {
        subscription: true,
      },
    });

    if (!tenant) {
      console.error(`[${requestId}] Tenant not found for user: ${auth.userId}, tenantId: ${auth.tenantId}`);
      return NextResponse.json(
        { error: 'Tenant not found', requestId },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      subscription: tenant.subscription ? {
        id: tenant.subscription.id,
        stripeCustomerId: tenant.subscription.stripeCustomerId,
        stripeSubscriptionId: tenant.subscription.stripeSubscriptionId,
        stripePriceId: tenant.subscription.stripePriceId,
        stripeCurrentPeriodEnd: tenant.subscription.stripeCurrentPeriodEnd?.toISOString(),
      } : null,
      requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error fetching tenant data:`, error);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Failed to fetch tenant data'
      : error.message || 'Failed to fetch tenant data';
    
    return NextResponse.json(
      { error: errorMessage, requestId },
      { status: error.status || 500 }
    );
  }
}


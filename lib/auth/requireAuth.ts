/**
 * Authentication utility for SaaS multi-tenancy
 *
 * Gets the authenticated user and their associated tenant.
 * Tenant id lives on the SaaS JWT payload — User has no tenantId column.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
export interface AuthContext {
  userId: string;
  email: string;
  tenantId: string | null;
  role: UserRole;
}

/**
 * Get authenticated user and their tenant
 *
 * SaaS authentication uses the SaaS JWT, then the legacy saas_user_id cookie.
 * Admin portal cookies and identity headers are not accepted here.
 *
 * @param request - NextRequest object
 * @returns AuthContext with user info and tenantId
 * @throws NextResponse with 401 if not authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<AuthContext> {
  const cookieStore = await cookies();
  const saasUserId = cookieStore.get('saas_user_id')?.value;
  void request;

  // Check for SaaS JWT token (new method)
  const saasToken = cookieStore.get('saas_token')?.value;
  if (saasToken) {
    try {
      const { verifyToken } = await import('@/lib/auth/jwt');
      const payload = await verifyToken(saasToken);

      if (payload && payload.tenantId) {
        const user = await prisma.user.findUnique({
          where: {
            id: payload.userId,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        if (user) {
          return {
            userId: user.id,
            email: user.email,
            tenantId: payload.tenantId,
            role: user.role,
          };
        }
      }
    } catch {
      console.warn('JWT verification failed, trying legacy auth');
    }
  }

  // Legacy: Check for SaaS user session (backward compatibility)
  if (saasUserId) {
    const user = await prisma.user.findUnique({
      where: {
        id: saasUserId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (user) {
      return {
        userId: user.id,
        email: user.email,
        tenantId: null,
        role: user.role,
      };
    }
  }

  const response = NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
  throw response;
}

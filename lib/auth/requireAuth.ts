/**
 * Authentication utility for SaaS multi-tenancy
 * 
 * Gets the authenticated user and their associated tenant
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
 * This function checks for admin authentication via cookies/headers
 * and returns the user along with their tenantId
 * 
 * @param request - NextRequest object
 * @returns AuthContext with user info and tenantId
 * @throws NextResponse with 401 if not authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<AuthContext> {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  const saasUserId = cookieStore.get("saas_user_id")?.value;
  const adminId = 
    cookieStore.get("adminId")?.value || 
    cookieStore.get("adminSession")?.value ||
    (request?.headers.get("x-admin-id")) ||
    (request?.headers.get("authorization")?.replace("Bearer ", ""));
  
  // Simple local-only auth: if admin_session cookie is "true", allow access
  if (adminSession === "true") {
    // For local admin, try to find or create a default tenant
    const defaultTenant = await prisma.tenant.findFirst({
      where: { name: "Default Tenant" },
    });
    
    return {
      userId: "local-admin",
      email: "maylortech007@gmail.com",
      tenantId: defaultTenant?.id || null,
      role: UserRole.ADMIN,
    };
  }
  
  // Check for SaaS JWT token (new method)
  const saasToken = cookieStore.get("saas_token")?.value;
  if (saasToken) {
    try {
      const { verifyToken } = await import('@/lib/auth/jwt');
      const payload = await verifyToken(saasToken);
      
      if (payload && payload.tenantId) {
        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
          where: {
            id: payload.userId,
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            role: true,
            tenantId: true,
          },
        });

        if (user && user.tenantId === payload.tenantId) {
          return {
            userId: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
          };
        }
      }
    } catch (jwtError) {
      // JWT verification failed, fall through to legacy check
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
        tenantId: true,
      },
    });

    if (user && user.tenantId) {
      return {
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      };
    }
  }
  
  if (!adminId) {
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
    throw response;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: adminId,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
    },
  });

  if (!user) {
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
    throw response;
  }

  return {
    userId: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  };
}


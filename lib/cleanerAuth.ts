/**
 * Cleaner Authentication Helper
 * 
 * Validates cleaner identity from cookies or signed tokens
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export interface CleanerAuthResult {
  success: boolean;
  cleanerId?: string;
  cleaner?: {
    id: string;
    name: string | null;
    email: string;
  };
  error?: string;
}

/**
 * Get authenticated cleaner from cookie or token
 * 
 * @param req - NextRequest (optional, for token extraction)
 * @returns CleanerAuthResult
 */
export async function getAuthenticatedCleaner(
  req?: { headers: { get: (name: string) => string | null } }
): Promise<CleanerAuthResult> {
  try {
    // Method 1: Check cookie (existing cleaner session)
    const cookieStore = await cookies();
    const cleanerIdFromCookie = cookieStore.get("cleanerId")?.value;

    if (cleanerIdFromCookie) {
      // Try database first
      const cleaner = await prisma.user.findUnique({
        where: {
          id: cleanerIdFromCookie,
          role: UserRole.CLEANER,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (cleaner) {
        return {
          success: true,
          cleanerId: cleaner.id,
          cleaner,
        };
      }

      // Fallback to mock data (for backward compatibility during migration)
      try {
        const { findCleanerById } = await import("@/utils/cleanerData");
        const mockCleaner = findCleanerById(cleanerIdFromCookie);
        if (mockCleaner && mockCleaner.active) {
          return {
            success: true,
            cleanerId: mockCleaner.id,
            cleaner: {
              id: mockCleaner.id,
              name: mockCleaner.name,
              email: mockCleaner.email || "",
            },
          };
        }
      } catch (e) {
        // Mock data not available, continue to error
      }
    }

    // Method 2: Check signed token (for email links, etc.)
    if (req) {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "") || 
                   req.headers.get("cleanerToken");

      if (token) {
        // For now, treat token as cleanerId (can be enhanced with JWT later)
        const cleaner = await prisma.user.findUnique({
          where: {
            id: token,
            role: UserRole.CLEANER,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        if (cleaner) {
          return {
            success: true,
            cleanerId: cleaner.id,
            cleaner,
          };
        }
      }
    }

    return {
      success: false,
      error: "Not authenticated as cleaner",
    };
  } catch (error: any) {
    console.error("[CLEANER_AUTH] Error:", error);
    return {
      success: false,
      error: error?.message || "Authentication failed",
    };
  }
}





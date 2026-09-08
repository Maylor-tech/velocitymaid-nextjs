/**
 * Cleaner authentication. Session cookie cleanerId must be a real active
 * CLEANER User.id. Hash / arbitrary cookies do not authenticate.
 */

import { cookies } from "next/headers";
import { prisma } from "./prisma";
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

type CookieReader = { get(name: string): { value: string } | undefined };

function readCleanerIdCookie(
  cookieStore: CookieReader,
  req?: { cookies?: CookieReader; headers: { get: (name: string) => string | null } }
): string | undefined {
  return cookieStore.get("cleanerId")?.value || req?.cookies?.get("cleanerId")?.value;
}

async function loadActiveCleaner(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
      role: UserRole.CLEANER,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function getAuthenticatedCleaner(
  req?: { headers: { get: (name: string) => string | null }; cookies?: CookieReader }
): Promise<CleanerAuthResult> {
  try {
    const cookieStore = await cookies();
    const cleanerIdFromCookie = readCleanerIdCookie(cookieStore, req);

    if (cleanerIdFromCookie) {
      const cleaner = await loadActiveCleaner(cleanerIdFromCookie);
      if (cleaner) {
        return {
          success: true,
          cleanerId: cleaner.id,
          cleaner,
        };
      }
      return {
        success: false,
        error: "Not authenticated as cleaner",
      };
    }

    if (req) {
      const authHeader = req.headers.get("Authorization");
      const token =
        authHeader?.replace("Bearer ", "") || req.headers.get("cleanerToken");

      if (token) {
        const cleaner = await loadActiveCleaner(token);
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
  } catch (error: unknown) {
    console.error("[CLEANER_AUTH] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

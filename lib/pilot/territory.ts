/**
 * Phase M: Miami Pilot - Territory Definition
 * 
 * Locks service area to specific ZIP codes and service hours.
 * "One city. One standard. One source of truth."
 */

import { prisma } from "@/lib/prisma";

export interface TerritoryValidation {
  valid: boolean;
  error?: string;
  zipCode?: string;
  serviceHours?: {
    requested: string;
    allowed: { start: string; end: string };
  };
}

/**
 * Miami-Dade Core ZIP Codes (10-15 ZIPs max)
 * Start tight, expand only after proving operations
 */
export const MIAMI_PILOT_ZIP_CODES = [
  "33101", // Downtown Miami
  "33125", // Little Havana
  "33126", // West Flagler
  "33127", // Allapattah
  "33130", // Brickell
  "33131", // Coconut Grove
  "33132", // Coral Gables
  "33133", // Coral Gables
  "33134", // Coral Gables
  "33135", // West Miami
  "33136", // Coral Gables
  "33137", // North Miami
  "33138", // North Miami Beach
  "33139", // Miami Beach
  "33140", // Miami Beach
] as const;

/**
 * Service Hours: 8am-6pm (reduce edge cases)
 */
export const MIAMI_PILOT_SERVICE_HOURS = {
  start: "08:00", // 8am
  end: "18:00",   // 6pm
} as const;

/**
 * Validate ZIP code is in Miami pilot territory
 */
export function validateZipCode(zipCode: string): boolean {
  return MIAMI_PILOT_ZIP_CODES.includes(zipCode as any);
}

/**
 * Validate service time is within allowed hours
 */
export function validateServiceHours(requestedTime: string): boolean {
  const [hours, minutes] = requestedTime.split(":").map(Number);
  const requestedMinutes = hours * 60 + minutes;
  
  const [startHours, startMinutes] = MIAMI_PILOT_SERVICE_HOURS.start.split(":").map(Number);
  const startMinutesTotal = startHours * 60 + startMinutes;
  
  const [endHours, endMinutes] = MIAMI_PILOT_SERVICE_HOURS.end.split(":").map(Number);
  const endMinutesTotal = endHours * 60 + endMinutes;
  
  return requestedMinutes >= startMinutesTotal && requestedMinutes <= endMinutesTotal;
}

/**
 * Validate territory for a job
 * Checks ZIP code and service hours
 */
export async function validateTerritory(
  branchId: string,
  zipCode: string,
  preferredTime?: string | null
): Promise<TerritoryValidation> {
  // Check if branch is Miami pilot
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      slug: true,
      city: true,
      BranchServiceArea: {
        select: {
          zipCode: true,
        },
      },
    },
  });

  if (!branch) {
    return {
      valid: false,
      error: "Branch not found",
    };
  }

  // For Miami pilot, check ZIP whitelist
  if (branch.slug === "miami" || branch.city.toLowerCase() === "miami") {
    if (!validateZipCode(zipCode)) {
      return {
        valid: false,
        error: `ZIP code ${zipCode} is not in Miami pilot service area`,
        zipCode,
      };
    }

    // Check service hours if time provided
    if (preferredTime) {
      // Extract start time from various formats:
      // "09:00-12:00" -> "09:00"
      // "09:00 AM - 12:00 PM" -> "09:00"
      // "09:00" -> "09:00"
      let timeOnly = preferredTime.trim();
      
      // If it contains a dash, extract the start time (before the dash)
      if (timeOnly.includes("-")) {
        timeOnly = timeOnly.split("-")[0].trim();
      }
      
      // Remove AM/PM if present
      timeOnly = timeOnly.replace(/\s*(AM|PM)/i, "").trim();
      
      // Validate the extracted start time
      if (!validateServiceHours(timeOnly)) {
        return {
          valid: false,
          error: `Service time ${preferredTime} is outside allowed hours (${MIAMI_PILOT_SERVICE_HOURS.start}-${MIAMI_PILOT_SERVICE_HOURS.end})`,
          zipCode,
          serviceHours: {
            requested: preferredTime,
            allowed: {
              start: MIAMI_PILOT_SERVICE_HOURS.start,
              end: MIAMI_PILOT_SERVICE_HOURS.end,
            },
          },
        };
      }
    }
  } else {
    // For other branches, check BranchServiceArea
    const serviceArea = branch.BranchServiceArea.find((area) => area.zipCode === zipCode);
    if (!serviceArea) {
      return {
        valid: false,
        error: `ZIP code ${zipCode} is not in ${branch.city} service area`,
        zipCode,
      };
    }
  }

  return {
    valid: true,
    zipCode,
  };
}

/**
 * Get allowed ZIP codes for a branch
 */
export async function getAllowedZipCodes(branchId: string): Promise<string[]> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      slug: true,
      city: true,
      BranchServiceArea: {
        select: {
          zipCode: true,
        },
      },
    },
  });

  if (!branch) {
    return [];
  }

  // For Miami pilot, return hardcoded list
  if (branch.slug === "miami" || branch.city.toLowerCase() === "miami") {
    return [...MIAMI_PILOT_ZIP_CODES];
  }

  // For other branches, return from BranchServiceArea
  return branch.BranchServiceArea.map((area) => area.zipCode);
}

/**
 * Get service hours for a branch
 */
export async function getServiceHours(branchId: string): Promise<{ start: string; end: string }> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      slug: true,
      city: true,
    },
  });

  if (!branch) {
    return {
      start: "09:00",
      end: "17:00",
    };
  }

  // For Miami pilot, return hardcoded hours
  if (branch.slug === "miami" || branch.city.toLowerCase() === "miami") {
    return {
      start: MIAMI_PILOT_SERVICE_HOURS.start,
      end: MIAMI_PILOT_SERVICE_HOURS.end,
    };
  }

  // For other branches, return default or from config
  return {
    start: "09:00",
    end: "17:00",
  };
}




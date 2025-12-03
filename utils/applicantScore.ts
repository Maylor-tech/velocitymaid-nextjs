/**
 * Applicant Fit Score Calculator
 * 
 * Computes fit score from:
 * - Availability (days available)
 * - Weekend ability
 * - Villa travel ability
 * - Residence location match (service areas)
 * - Experience level
 * - Phone number validity
 * 
 * Score range: 0-100
 */

import { prisma } from '@/lib/prisma';

interface ApplicantData {
  daysAvailable: string[] | null;
  weekendAbility: boolean;
  canTravelToVillas: boolean;
  areaOfResidence: string | null;
  experienceLevel: string | null;
  phone: string;
  branchId: string;
}

/**
 * Calculate applicant fit score
 */
export async function calculateApplicantFitScore(
  data: ApplicantData
): Promise<number> {
  let score = 0;

  // 1. Availability (max 25 points)
  if (data.daysAvailable && Array.isArray(data.daysAvailable)) {
    const daysCount = data.daysAvailable.length;
    if (daysCount >= 5) {
      score += 25;
    } else if (daysCount >= 3) {
      score += 15;
    } else if (daysCount >= 1) {
      score += 5;
    }
  }

  // 2. Weekend Ability (max 15 points)
  if (data.weekendAbility) {
    score += 15;
  }

  // 3. Villa Travel Ability (max 20 points)
  if (data.canTravelToVillas) {
    score += 20;
  }

  // 4. Residence Location Match (max 20 points)
  if (data.areaOfResidence) {
    try {
      const branch = await prisma.branch.findUnique({
        where: { id: data.branchId },
        include: {
          serviceAreas: {
            select: {
              zipCode: true,
              city: true,
            },
          },
        },
      });

      if (branch) {
        // Check if residence area matches service areas
        const residenceLower = data.areaOfResidence.toLowerCase();
        const serviceAreaMatches = branch.serviceAreas.some((area) => {
          const zipLower = area.zipCode?.toLowerCase() || '';
          const cityLower = area.city?.toLowerCase() || '';
          return (
            residenceLower.includes(zipLower) ||
            zipLower.includes(residenceLower) ||
            residenceLower.includes(cityLower) ||
            cityLower.includes(residenceLower)
          );
        });

        if (serviceAreaMatches) {
          score += 20;
        } else {
          // Partial match (contains common words)
          const commonWords = ['port', 'antonio', 'portland', 'jamaica'];
          const hasCommonWord = commonWords.some((word) =>
            residenceLower.includes(word)
          );
          if (hasCommonWord) {
            score += 10;
          }
        }
      }
    } catch (error) {
      console.error('Error checking residence match:', error);
      // Don't fail, just skip this check
    }
  }

  // 5. Experience Level (max 15 points)
  if (data.experienceLevel) {
    const expLower = data.experienceLevel.toLowerCase();
    if (expLower.includes('experienced') || expLower.includes('professional')) {
      score += 15;
    } else if (expLower.includes('moderate') || expLower.includes('some')) {
      score += 10;
    } else if (expLower.includes('none')) {
      score += 5; // Still give some points for no experience
    }
  }

  // 6. Phone Number Validity (max 5 points)
  // Check if phone is valid Jamaican format (876-xxx-xxxx or +1876...)
  const phoneClean = data.phone.replace(/[^\d+]/g, '');
  if (phoneClean.startsWith('876') || phoneClean.startsWith('+1876')) {
    score += 5;
  } else if (phoneClean.length >= 10) {
    score += 2; // Valid format but not Jamaican
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Get score category label
 */
export function getScoreCategory(score: number): {
  label: string;
  color: string;
  recommendation: string;
} {
  if (score >= 70) {
    return {
      label: 'Strong Applicant',
      color: 'green',
      recommendation: 'Schedule interview immediately',
    };
  } else if (score >= 40) {
    return {
      label: 'Moderate Fit',
      color: 'yellow',
      recommendation: 'Review and consider interview',
    };
  } else {
    return {
      label: 'Weak Fit',
      color: 'red',
      recommendation: 'May need additional screening',
    };
  }
}


export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { seedAllBranches } from '@/utils/seedBranches';

/**
 * Seed Branches API
 * 
 * POST /api/admin/branches/seed
 * 
 * Seeds all VelocityMaid branches with complete configuration
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check
    
    const result = seedAllBranches();
    
    return NextResponse.json({
      success: true,
      message: 'All branches seeded successfully',
      branches: {
        newJersey: {
          id: result.newJersey.id,
          slug: result.newJersey.slug,
          name: result.newJersey.name,
        },
        vermont: {
          id: result.vermont.id,
          slug: result.vermont.slug,
          name: result.vermont.name,
        },
        boston: {
          id: result.boston.id,
          slug: result.boston.slug,
          name: result.boston.name,
        },
        newYorkCity: {
          id: result.newYorkCity.id,
          slug: result.newYorkCity.slug,
          name: result.newYorkCity.name,
        },
        portAntonio: {
          id: result.portAntonio.id,
          slug: result.portAntonio.slug,
          name: result.portAntonio.name,
        },
      },
    });
  } catch (error: any) {
    console.error('Seed branches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed branches' },
      { status: 500 }
    );
  }
}





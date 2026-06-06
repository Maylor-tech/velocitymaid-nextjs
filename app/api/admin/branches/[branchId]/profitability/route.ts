import { NextRequest, NextResponse } from 'next/server';
import { getBranchBySlug, getAllBranches } from '@/utils/branchData';

/**
 * Branch Profitability API
 * 
 * GET /api/admin/branches/[slug]/profitability?range=7|30|90&start=YYYY-MM-DD&end=YYYY-MM-DD
 * 
 * Returns profitability metrics for a specific branch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30';
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const branch = getBranchBySlug(slug);
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const endDate = end ? new Date(end) : new Date();
    let startDate = start ? new Date(start) : new Date();
    
    if (!start) {
      const days = parseInt(range);
      startDate.setDate(endDate.getDate() - days);
    }

    // TODO: Fetch actual metrics from Stripe/database
    // For now, return mock data based on branch
    const mockMetrics = {
      branchId: branch.id,
      branchSlug: branch.slug,
      branchName: branch.name,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      revenue: branch.slug === 'new-york-city' ? 18500.00 : branch.slug === 'boston' ? 15200.00 : 12500.00,
      labourCost: branch.slug === 'new-york-city' ? 6500.00 : branch.slug === 'boston' ? 5500.00 : 4500.00,
      incentives: branch.slug === 'new-york-city' ? 1200.00 : branch.slug === 'boston' ? 1000.00 : 800.00,
      bonuses: branch.slug === 'new-york-city' ? 900.00 : branch.slug === 'boston' ? 750.00 : 600.00,
      profit: 0, // Calculated below
      margin: 0, // Calculated below
      jobVolume: branch.slug === 'new-york-city' ? 125 : branch.slug === 'boston' ? 105 : 87,
      retentionRate: branch.slug === 'new-york-city' ? 72.5 : branch.slug === 'boston' ? 70.0 : 68.5,
      topCustomers: [
        { name: 'Customer A', jobs: 5, revenue: 450.00 },
        { name: 'Customer B', jobs: 4, revenue: 380.00 },
        { name: 'Customer C', jobs: 3, revenue: 320.00 },
      ],
      topCleaners: [
        { name: 'Cleaner A', jobs: 25, revenue: 3200.00 },
        { name: 'Cleaner B', jobs: 22, revenue: 2800.00 },
        { name: 'Cleaner C', jobs: 18, revenue: 2400.00 },
      ],
    };

    // Calculate profit and margin
    const totalCosts = mockMetrics.labourCost + mockMetrics.incentives + mockMetrics.bonuses;
    mockMetrics.profit = mockMetrics.revenue - totalCosts;
    mockMetrics.margin = mockMetrics.revenue > 0 
      ? (mockMetrics.profit / mockMetrics.revenue) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      metrics: mockMetrics,
    });
  } catch (error: any) {
    console.error('Branch profitability error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profitability data' },
      { status: 500 }
    );
  }
}


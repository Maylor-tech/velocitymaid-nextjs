import { NextRequest, NextResponse } from 'next/server';
import {
  getReviewsByCleanerId,
  getAllReviews,
  calculateReviewStats,
  ServiceRegion,
} from '@/utils/reviewData';

/**
 * List Reviews API
 * 
 * GET /api/reviews/list?cleanerId=xxx&region=new_jersey|vermont
 * 
 * Returns: Reviews and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cleanerId = searchParams.get('cleanerId');
    const regionParam = searchParams.get('region');

    const region: ServiceRegion | undefined =
      regionParam === 'new_jersey' || regionParam === 'vermont' ? regionParam : undefined;

    let reviews;
    let stats = null;

    if (cleanerId) {
      // Get reviews for specific cleaner
      reviews = getReviewsByCleanerId(cleanerId);
      stats = calculateReviewStats(cleanerId);
    } else {
      // Get all reviews (optionally filtered by region)
      reviews = getAllReviews(region);
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats,
      count: reviews.length,
    });
  } catch (error: any) {
    console.error('List reviews error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}




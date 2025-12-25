'use client';

import type { Review } from '@/utils/reviewData';
import RatingDisplay from './RatingDisplay';
import LocationBadge from '../../components/LocationBadge';
import { getComplaintByReviewId } from '@/utils/complaintData';

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
        <p className="text-gray-500 text-center py-8">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RatingDisplay rating={review.rating} size="sm" />
                  <LocationBadge location={review.serviceLocation} />
                  {(() => {
                    const complaint = getComplaintByReviewId(review.id);
                    if (complaint) {
                      if (complaint.status === 'resolved' || complaint.status === 'closed') {
                        return (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Complaint Resolved
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Complaint Open
                          </span>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
                <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
              </div>
              {review.requestReclean && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                  Re-clean Requested
                </span>
              )}
            </div>
            {review.comment && (
              <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


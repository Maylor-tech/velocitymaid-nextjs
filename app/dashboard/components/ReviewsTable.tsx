'use client';

import type { Review } from '@/utils/reviewData';
import LocationBadge from '@/app/cleaners/components/LocationBadge';

interface ReviewsTableProps {
  reviews: Review[];
  region: 'new_jersey' | 'vermont' | null;
}

export default function ReviewsTable({ reviews, region }: ReviewsTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    );
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews — Latest 20</h2>
        <p className="text-gray-500 text-center py-8">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews — Latest 20</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cleaner
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rating
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Comment
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Re-clean
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reviews.map((review) => (
            <tr
              key={review.id}
              className={`hover:bg-gray-50 ${
                review.rating <= 3 ? 'bg-red-50' : ''
              }`}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {review.jobId.substring(0, 12)}...
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {review.cleanerId}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {renderStars(review.rating)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                {review.comment || <span className="text-gray-400">No comment</span>}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <LocationBadge location={review.serviceLocation} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {formatDate(review.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {review.requestReclean ? (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                    Yes
                  </span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


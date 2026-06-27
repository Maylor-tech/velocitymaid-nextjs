'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LocationBadge from '@/app/cleaners/components/LocationBadge';

interface JobDetails {
  id: string;
  customerName: string;
  cleanerName: string;
  cleanerId: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: string;
  serviceLocation: 'new_jersey' | 'vermont';
  address: string;
}

export default function ReviewPage() {
  const params = useParams();
  const jobId = params?.jobId as string;

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [requestReclean, setRequestReclean] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/job/${jobId}`);
      const data = await response.json();

      if (data.success) {
        setJobDetails(data.job);
        setHasReview(data.hasReview);
        if (data.existingReview) {
          setRating(data.existingReview.rating);
          setComment(data.existingReview.comment || '');
          setRequestReclean(data.existingReview.requestReclean);
        }
      } else {
        setError(data.error || 'Failed to load job details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobDetails) return;
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobDetails.id,
          cleanerId: jobDetails.cleanerId,
          rating,
          comment: comment.trim() || undefined,
          requestReclean,
          serviceLocation: jobDetails.serviceLocation,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-vm-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !jobDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600 font-medium mb-4">Error</p>
          <p className="text-vm-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-vm-text mb-2">Thank You!</h1>
          <p className="text-vm-muted mb-6">
            Your review has been submitted. We appreciate your feedback!
          </p>
          <div className="bg-vm-success-bg border border-vm-success/30 rounded-lg p-4">
            <p className="text-sm text-vm-success">
              {requestReclean
                ? 'We have received your request for a follow-up cleaning. Our team will contact you shortly.'
                : 'Your feedback helps us improve our service.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!jobDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-vm-text mb-2">Rate Your Service</h1>
            <p className="text-vm-muted">Help us improve by sharing your experience</p>
          </div>

          {/* Job Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-vm-text mb-4">Service Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-vm-muted">Cleaner:</span>
                <span className="font-medium text-vm-text">{jobDetails.cleanerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-vm-muted">Service Date:</span>
                <span className="font-medium text-vm-text">{formatDate(jobDetails.serviceDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-vm-muted">Service Type:</span>
                <span className="font-medium text-vm-text">{jobDetails.serviceType}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-vm-muted">Location:</span>
                <LocationBadge location={jobDetails.serviceLocation} />
              </div>
            </div>
          </div>

          {hasReview && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                You have already submitted a review for this service.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-vm-text mb-3">
                How would you rate your cleaning service? *
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-5xl transition-transform hover:scale-110 ${
                      rating >= star ? 'text-yellow-400' : 'text-vm-muted'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-vm-muted mt-2">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Great!'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Fair'}
                  {rating === 1 && 'Poor'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-vm-text mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Tell us about your experience..."
              />
            </div>

            {/* Request Reclean */}
            <div className="flex items-start">
              <input
                id="requestReclean"
                type="checkbox"
                checked={requestReclean}
                onChange={(e) => setRequestReclean(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requestReclean" className="ml-3 text-sm text-vm-text">
                Request a follow-up cleaning
                <span className="block text-xs text-vm-muted mt-1">
                  Check this if you'd like us to send someone back to address any issues
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || rating === 0 || hasReview}
              className="w-full bg-vm-navy text-white py-3 rounded-lg font-semibold hover:bg-vm-navy transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : hasReview ? 'Already Submitted' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}





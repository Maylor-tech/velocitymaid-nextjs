/**
 * Review Data Model and Utilities
 * 
 * TODO: Replace with database queries when connecting to real DB
 */

export type ServiceRegion = 'new_jersey' | 'vermont';

export interface Review {
  id: string;
  jobId: string;
  cleanerId: string;
  serviceLocation: ServiceRegion;
  rating: number; // 1-5
  comment?: string;
  requestReclean: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  last5Reviews: Review[];
  recleanRequestRate: number; // Percentage
  ratingTrend: number[]; // Last 6 ratings
}

/**
 * Mock reviews storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_REVIEWS: Review[] = [];

/**
 * Create a new review
 * TODO: Replace with database INSERT
 */
export function createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Review {
  const newReview: Review = {
    id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...review,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_REVIEWS.push(newReview);
  return newReview;
}

/**
 * Get review by ID
 * TODO: Replace with database SELECT
 */
export function getReviewById(id: string): Review | null {
  return MOCK_REVIEWS.find(r => r.id === id) || null;
}

/**
 * Get reviews by cleaner ID
 * TODO: Replace with database SELECT WHERE cleanerId = ?
 */
export function getReviewsByCleanerId(cleanerId: string): Review[] {
  return MOCK_REVIEWS.filter(r => r.cleanerId === cleanerId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get reviews by job ID
 * TODO: Replace with database SELECT WHERE jobId = ?
 */
export function getReviewsByJobId(jobId: string): Review[] {
  return MOCK_REVIEWS.filter(r => r.jobId === jobId);
}

/**
 * Get all reviews
 * TODO: Replace with database SELECT
 */
export function getAllReviews(region?: ServiceRegion): Review[] {
  let reviews = [...MOCK_REVIEWS];
  
  if (region) {
    reviews = reviews.filter(r => r.serviceLocation === region);
  }
  
  return reviews.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Calculate review statistics for a cleaner
 * TODO: Replace with database aggregations
 */
export function calculateReviewStats(cleanerId: string): ReviewStats {
  const reviews = getReviewsByCleanerId(cleanerId);
  
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      last5Reviews: [],
      recleanRequestRate: 0,
      ratingTrend: [],
    };
  }
  
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  const recleanRequests = reviews.filter(r => r.requestReclean).length;
  const recleanRequestRate = (recleanRequests / reviews.length) * 100;
  
  const last5Reviews = reviews.slice(0, 5);
  const last6Ratings = reviews.slice(0, 6).map(r => r.rating);
  
  return {
    averageRating,
    totalReviews: reviews.length,
    last5Reviews,
    recleanRequestRate,
    ratingTrend: last6Ratings,
  };
}

/**
 * Get reviews requiring follow-up (rating <= 3)
 * TODO: Replace with database SELECT WHERE rating <= 3
 */
export function getReviewsRequiringFollowUp(region?: ServiceRegion): Review[] {
  let reviews = MOCK_REVIEWS.filter(r => r.rating <= 3);
  
  if (region) {
    reviews = reviews.filter(r => r.serviceLocation === region);
  }
  
  return reviews.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Database Schema (for future migration)
 * 
 * CREATE TABLE reviews (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   job_id VARCHAR(255) NOT NULL,
 *   cleaner_id VARCHAR(255) NOT NULL,
 *   service_location VARCHAR(20) NOT NULL CHECK (service_location IN ('new_jersey', 'vermont')),
 *   rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
 *   comment TEXT,
 *   request_reclean BOOLEAN DEFAULT false,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id),
 *   CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
 * );
 * 
 * CREATE INDEX idx_reviews_cleaner ON reviews(cleaner_id);
 * CREATE INDEX idx_reviews_job ON reviews(job_id);
 * CREATE INDEX idx_reviews_location ON reviews(service_location);
 * CREATE INDEX idx_reviews_rating ON reviews(rating);
 * CREATE INDEX idx_reviews_created ON reviews(created_at);
 */




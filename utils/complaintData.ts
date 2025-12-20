/**
 * Complaint Data Model and Utilities
 * 
 * Smart Complaint Resolution System
 * TODO: Replace with database queries when connecting to real DB
 */

export type ServiceRegion = 'new_jersey' | 'vermont';
export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
export type ResolutionType = 'reclean' | 'refund_partial' | 'refund_full' | 'credit' | 'no_issue';

export interface Complaint {
  id: string;
  jobId: string;
  reviewId: string | null;
  cleanerId: string | null;
  serviceLocation: ServiceRegion;
  customerName: string;
  customerPhone: string;
  rating: number; // 1-5
  comment: string | null;
  requestReclean: boolean;
  status: ComplaintStatus;
  resolutionType: ResolutionType | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ComplaintStats {
  openComplaints: number;
  openByRegion: {
    new_jersey: number;
    vermont: number;
  };
  avgRatingOnComplaints: number;
  recleanRequestRate: number; // Percentage
  avgResolutionTime: number; // Hours
}

/**
 * Mock complaints storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_COMPLAINTS: Complaint[] = [];

/**
 * Create a new complaint
 * TODO: Replace with database INSERT
 */
export function createComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'>): Complaint {
  const newComplaint: Complaint = {
    id: `complaint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...complaint,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_COMPLAINTS.push(newComplaint);
  return newComplaint;
}

/**
 * Get complaint by ID
 * TODO: Replace with database SELECT
 */
export function getComplaintById(id: string): Complaint | null {
  return MOCK_COMPLAINTS.find(c => c.id === id) || null;
}

/**
 * Get all complaints with optional filters
 * TODO: Replace with database SELECT WHERE
 */
export function getAllComplaints(
  filters?: {
    status?: ComplaintStatus;
    serviceLocation?: ServiceRegion;
  }
): Complaint[] {
  let complaints = [...MOCK_COMPLAINTS];
  
  if (filters?.status) {
    complaints = complaints.filter(c => c.status === filters.status);
  }
  
  if (filters?.serviceLocation) {
    complaints = complaints.filter(c => c.serviceLocation === filters.serviceLocation);
  }
  
  return complaints.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get complaints by cleaner ID
 * TODO: Replace with database SELECT WHERE cleanerId = ?
 */
export function getComplaintsByCleanerId(cleanerId: string): Complaint[] {
  return MOCK_COMPLAINTS
    .filter(c => c.cleanerId === cleanerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get complaints by job ID
 * TODO: Replace with database SELECT WHERE jobId = ?
 */
export function getComplaintsByJobId(jobId: string): Complaint[] {
  return MOCK_COMPLAINTS.filter(c => c.jobId === jobId);
}

/**
 * Get complaints by review ID
 * TODO: Replace with database SELECT WHERE reviewId = ?
 */
export function getComplaintByReviewId(reviewId: string): Complaint | null {
  return MOCK_COMPLAINTS.find(c => c.reviewId === reviewId) || null;
}

/**
 * Update complaint
 * TODO: Replace with database UPDATE
 */
export function updateComplaint(
  id: string,
  updates: {
    status?: ComplaintStatus;
    resolutionType?: ResolutionType | null;
    adminNotes?: string | null;
  }
): Complaint | null {
  const complaint = getComplaintById(id);
  if (!complaint) {
    return null;
  }
  
  const updatedComplaint: Complaint = {
    ...complaint,
    ...updates,
    updatedAt: new Date().toISOString(),
    resolvedAt: 
      (updates.status === 'resolved' || updates.status === 'closed') && !complaint.resolvedAt
        ? new Date().toISOString()
        : complaint.resolvedAt,
  };
  
  const index = MOCK_COMPLAINTS.findIndex(c => c.id === id);
  if (index !== -1) {
    MOCK_COMPLAINTS[index] = updatedComplaint;
  }
  
  return updatedComplaint;
}

/**
 * Calculate complaint statistics
 * TODO: Replace with database aggregations
 */
export function calculateComplaintStats(region?: ServiceRegion): ComplaintStats {
  let complaints = MOCK_COMPLAINTS;
  
  if (region) {
    complaints = complaints.filter(c => c.serviceLocation === region);
  }
  
  const openComplaints = complaints.filter(
    c => c.status === 'pending' || c.status === 'in_progress'
  );
  
  const openByRegion = {
    new_jersey: complaints.filter(
      c => (c.status === 'pending' || c.status === 'in_progress') && c.serviceLocation === 'new_jersey'
    ).length,
    vermont: complaints.filter(
      c => (c.status === 'pending' || c.status === 'in_progress') && c.serviceLocation === 'vermont'
    ).length,
  };
  
  const avgRating = complaints.length > 0
    ? complaints.reduce((sum, c) => sum + c.rating, 0) / complaints.length
    : 0;
  
  const recleanRequests = complaints.filter(c => c.requestReclean).length;
  const recleanRequestRate = complaints.length > 0
    ? (recleanRequests / complaints.length) * 100
    : 0;
  
  // Calculate average resolution time
  const resolvedComplaints = complaints.filter(c => c.resolvedAt);
  let avgResolutionTime = 0;
  
  if (resolvedComplaints.length > 0) {
    const totalHours = resolvedComplaints.reduce((sum, c) => {
      if (c.resolvedAt) {
        const created = new Date(c.createdAt);
        const resolved = new Date(c.resolvedAt);
        const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);
    avgResolutionTime = totalHours / resolvedComplaints.length;
  }
  
  return {
    openComplaints: openComplaints.length,
    openByRegion,
    avgRatingOnComplaints: avgRating,
    recleanRequestRate,
    avgResolutionTime,
  };
}

/**
 * Database Schema (for future migration)
 * 
 * CREATE TABLE complaints (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   job_id VARCHAR(255) NOT NULL,
 *   review_id VARCHAR(255),
 *   cleaner_id VARCHAR(255),
 *   service_location VARCHAR(20) NOT NULL 
 *     CHECK (service_location IN ('new_jersey', 'vermont')),
 *   customer_name VARCHAR(255) NOT NULL,
 *   customer_phone VARCHAR(20) NOT NULL,
 *   rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
 *   comment TEXT,
 *   request_reclean BOOLEAN DEFAULT false,
 *   status VARCHAR(20) NOT NULL 
 *     CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
 *   resolution_type VARCHAR(20) 
 *     CHECK (resolution_type IN ('reclean', 'refund_partial', 'refund_full', 'credit', 'no_issue')),
 *   admin_notes TEXT,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   resolved_at TIMESTAMP,
 *   CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id),
 *   CONSTRAINT fk_review FOREIGN KEY (review_id) REFERENCES reviews(id),
 *   CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
 * );
 * 
 * CREATE INDEX idx_complaints_status ON complaints(status);
 * CREATE INDEX idx_complaints_location ON complaints(service_location);
 * CREATE INDEX idx_complaints_cleaner ON complaints(cleaner_id);
 * CREATE INDEX idx_complaints_job ON complaints(job_id);
 * CREATE INDEX idx_complaints_review ON complaints(review_id);
 * CREATE INDEX idx_complaints_created ON complaints(created_at);
 */





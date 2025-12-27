/**
 * Phase 2B: Admin Audit Log Utility
 * 
 * Purpose: Add observability to admin actions without changing behavior
 * Why audit logs exist: Track who did what, when, and why for compliance and debugging
 * 
 * Scope: Phase 2B is append-only - we only add audit entries, never modify or delete
 * Why audit failures don't block ops: Audit logging is non-critical observability
 *   If audit logging fails, the main operation should still succeed
 */

import { prisma } from './prisma';
import { randomBytes } from 'crypto';

export interface AdminEventParams {
  eventType: string;
  adminEmail: string;
  jobId?: string;
  cleanerId?: string;
  branchId?: string;
  notes?: string;
}

/**
 * Phase 2B: Log admin event to audit trail
 * 
 * This function persists audit entries in an append-only manner.
 * Failures are silent - audit logging must never block operations.
 * 
 * @param params - Event parameters including admin email and relevant IDs
 */
export async function logAdminEvent(params: AdminEventParams): Promise<void> {
  try {
    // Phase 2B: Create audit log entry
    // Using existing AuditLog table structure
    await prisma.auditLog.create({
      data: {
        id: randomBytes(16).toString('hex'),
        actorId: null, // We store adminEmail in description/changes instead
        actorRole: 'ADMIN',
        action: params.eventType,
        entityType: params.jobId ? 'Job' : 'System',
        entityId: params.jobId || 'system',
        description: `Admin ${params.adminEmail} performed ${params.eventType}${params.notes ? `: ${params.notes}` : ''}`,
        changes: {
          adminEmail: params.adminEmail,
          jobId: params.jobId || null,
          cleanerId: params.cleanerId || null,
          branchId: params.branchId || null,
          notes: params.notes || null,
        },
      },
    });
  } catch (error) {
    // Phase 2B: Fail silently - audit logging must not block operations
    // Why: Audit logs are for observability, not critical path
    console.error('[AUDIT_LOG_ERROR] Failed to log admin event:', error);
    // Do not throw - this ensures assignment logic continues even if audit fails
  }
}


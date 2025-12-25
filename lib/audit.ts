/**
 * Audit Log Helper
 * 
 * Logs admin actions and system changes for compliance tracking
 */

import { prisma } from './prisma';

export interface AuditLogParams {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  changes?: any;
}

export async function logAuditEntry(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        changes: params.changes ?? {},
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error);
    // Don't throw - audit logging should never break the main flow
  }
}

















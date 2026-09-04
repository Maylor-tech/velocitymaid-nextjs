/**
 * Audit Log Helper
 * 
 * Logs admin actions and system changes for compliance tracking
 */

import { prisma } from './prisma';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';

export interface AuditLogParams {
  id?: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  changes?: Prisma.InputJsonValue;
}

export async function logAuditEntry(params: AuditLogParams): Promise<string | null> {
  const id = params.id ?? randomUUID();
  try {
    await prisma.auditLog.create({
      data: {
        id,
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        changes: params.changes ?? {},
      },
    });
    return id;
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error);
    // Don't throw - audit logging should never break the main flow
    return null;
  }
}

















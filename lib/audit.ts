/**
 * Audit Log Helper
 * 
 * Logs admin actions and system changes for compliance tracking
 */

import { prisma } from './prisma';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

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

function isActorForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003'
  );
}

function changesWithRejectedActor(
  changes: Prisma.InputJsonValue | undefined,
  actorId: string
): Prisma.InputJsonValue {
  if (changes && typeof changes === 'object' && !Array.isArray(changes)) {
    return { ...changes, actorIdRejected: actorId };
  }
  return { priorChanges: changes ?? null, actorIdRejected: actorId };
}

async function insertAuditRow(
  id: string,
  params: AuditLogParams,
  actorId: string | null,
  changes: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: {
      id,
      actorId,
      actorRole: params.actorRole ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      changes,
    },
  });
}

export async function logAuditEntry(params: AuditLogParams): Promise<string | null> {
  const id = params.id ?? randomUUID();
  const actorId = params.actorId ?? null;
  const changes = params.changes ?? {};
  try {
    await insertAuditRow(id, params, actorId, changes);
    return id;
  } catch (error) {
    // AuditLog.actorId FKs to User. A stale or sentinel id must not drop the event.
    if (actorId && isActorForeignKeyError(error)) {
      try {
        await insertAuditRow(
          id,
          params,
          null,
          changesWithRejectedActor(params.changes, actorId)
        );
        return id;
      } catch (retryError) {
        console.error('[AUDIT_LOG_ERROR]', retryError);
        return null;
      }
    }
    console.error('[AUDIT_LOG_ERROR]', error);
    // Don't throw - audit logging should never break the main flow
    return null;
  }
}

















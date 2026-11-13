import { prisma } from '@/lib/prisma';
import {
  REBOOKING_WORKER_KEY,
  isExplicitRebookingV2Enablement,
  readRebookingRuntimeIdentity,
  type RebookingRuntimeIdentity,
} from '@/lib/cron/rebookingRuntimeIdentity';

export type RebookingControlRow = {
  workerKey: string;
  enabled: boolean;
  approvedDeploymentId: string | null;
  approvedCommitSha: string | null;
  generation: number;
  updatedBy: string | null;
};

export type RebookingAuthorization =
  | { ok: true; generation: number }
  | { ok: false; reason: RebookingAuthorizationReason };

export type RebookingAuthorizationReason =
  | 'flag'
  | 'environment'
  | 'deployment_id'
  | 'commit_sha'
  | 'control_missing'
  | 'control_disabled'
  | 'control_invalid'
  | 'control_lookup_failed'
  | 'deployment_mismatch'
  | 'commit_mismatch'
  | 'generation_invalid'
  | 'generation_changed';

function validGeneration(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

const EARLY_DENIALS: RebookingAuthorizationReason[] = [
  'flag',
  'environment',
  'deployment_id',
  'commit_sha',
];

export function rebookingDenialReason(
  decision: { ok: boolean }
): RebookingAuthorizationReason | null {
  if (decision.ok) return null;
  const reason = (decision as { reason?: RebookingAuthorizationReason }).reason;
  return reason ?? 'control_invalid';
}

function earlyDenial(decision: RebookingAuthorization): RebookingAuthorization | null {
  const reason = rebookingDenialReason(decision);
  if (reason && EARLY_DENIALS.includes(reason)) return { ok: false, reason };
  return null;
}

export function evaluateRebookingExecutionControl(input: {
  flag: string | null | undefined;
  identity: RebookingRuntimeIdentity;
  control: RebookingControlRow | null;
  controlError?: boolean;
  expectedGeneration?: number;
}): RebookingAuthorization {
  if (!isExplicitRebookingV2Enablement(input.flag)) return { ok: false, reason: 'flag' };
  if (input.identity.environment !== 'production') return { ok: false, reason: 'environment' };
  if (!input.identity.deploymentIdPresent || !input.identity.deploymentIdValid) {
    return { ok: false, reason: 'deployment_id' };
  }
  if (!input.identity.commitShaPresent || !input.identity.commitShaValid) {
    return { ok: false, reason: 'commit_sha' };
  }
  if (input.controlError) return { ok: false, reason: 'control_lookup_failed' };
  const control = input.control;
  if (!control || control.workerKey !== REBOOKING_WORKER_KEY) {
    return { ok: false, reason: 'control_missing' };
  }
  if (!control.enabled) return { ok: false, reason: 'control_disabled' };
  if (!validGeneration(control.generation)) return { ok: false, reason: 'generation_invalid' };
  if (!control.updatedBy || control.updatedBy.trim().length === 0) {
    return { ok: false, reason: 'control_invalid' };
  }
  if (control.approvedDeploymentId !== input.identity.deploymentId) {
    return { ok: false, reason: 'deployment_mismatch' };
  }
  if (control.approvedCommitSha !== input.identity.commitSha) {
    return { ok: false, reason: 'commit_mismatch' };
  }
  if (
    input.expectedGeneration !== undefined
    && input.expectedGeneration !== control.generation
  ) {
    return { ok: false, reason: 'generation_changed' };
  }
  return { ok: true, generation: control.generation };
}

export async function loadRebookingExecutionControl(): Promise<RebookingControlRow | null> {
  const row = await prisma.rebookingExecutionControl.findUnique({
    where: { workerKey: REBOOKING_WORKER_KEY },
    select: {
      workerKey: true,
      enabled: true,
      approvedDeploymentId: true,
      approvedCommitSha: true,
      generation: true,
      updatedBy: true,
    },
  });
  return row;
}

export function preflightRebookingExecution(input: {
  flag?: string | null;
  env?: NodeJS.ProcessEnv;
} = {}): RebookingAuthorization | { ok: true } {
  const env = input.env ?? process.env;
  const identity = readRebookingRuntimeIdentity(env);
  const decision = evaluateRebookingExecutionControl({
    flag: input.flag === undefined ? env.REBOOKING_REMINDERS_ENABLED : input.flag,
    identity,
    control: {
      workerKey: REBOOKING_WORKER_KEY,
      enabled: true,
      approvedDeploymentId: identity.deploymentId,
      approvedCommitSha: identity.commitSha,
      generation: 1,
      updatedBy: 'preflight',
    },
  });
  const early = earlyDenial(decision);
  if (early) return early;
  return { ok: true };
}

export async function authorizeRebookingExecution(input: {
  flag?: string | null;
  env?: NodeJS.ProcessEnv;
  expectedGeneration?: number;
  load?: () => Promise<RebookingControlRow | null>;
} = {}): Promise<RebookingAuthorization> {
  const env = input.env ?? process.env;
  const identity = readRebookingRuntimeIdentity(env);
  const preliminary = evaluateRebookingExecutionControl({
    flag: input.flag === undefined ? env.REBOOKING_REMINDERS_ENABLED : input.flag,
    identity,
    control: {
      workerKey: REBOOKING_WORKER_KEY,
      enabled: true,
      approvedDeploymentId: identity.deploymentId,
      approvedCommitSha: identity.commitSha,
      generation: 1,
      updatedBy: 'preliminary',
    },
  });
  const early = earlyDenial(preliminary);
  if (early) return early;
  try {
    const control = await (input.load ?? loadRebookingExecutionControl)();
    return evaluateRebookingExecutionControl({
      flag: input.flag === undefined ? env.REBOOKING_REMINDERS_ENABLED : input.flag,
      identity,
      control,
      expectedGeneration: input.expectedGeneration,
    });
  } catch {
    return { ok: false, reason: 'control_lookup_failed' };
  }
}

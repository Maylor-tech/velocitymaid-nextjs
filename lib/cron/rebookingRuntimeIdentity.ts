export const REBOOKING_WORKER_KEY = 'rebooking-reminders';

const DEPLOYMENT_ID = /^dpl_[A-Za-z0-9]+$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/;

export type RebookingEnvironment = 'production' | 'preview' | 'development' | 'missing' | 'other';

export type RebookingRuntimeIdentity = {
  deploymentId: string;
  commitSha: string;
  environment: RebookingEnvironment;
  deploymentIdPresent: boolean;
  commitShaPresent: boolean;
  deploymentIdValid: boolean;
  commitShaValid: boolean;
};

function classifyEnvironment(value: string | null | undefined): RebookingEnvironment {
  if (typeof value !== 'string' || value.length === 0) return 'missing';
  if (value === 'production' || value === 'preview' || value === 'development') return value;
  return 'other';
}

/**
 * Platform process identity only. Caller headers, query values, and hostnames
 * are not read here and cannot satisfy this check.
 */
export function readRebookingRuntimeIdentity(
  env: NodeJS.ProcessEnv = process.env
): RebookingRuntimeIdentity {
  const deploymentId = typeof env.VERCEL_DEPLOYMENT_ID === 'string' ? env.VERCEL_DEPLOYMENT_ID : '';
  const commitSha = typeof env.VERCEL_GIT_COMMIT_SHA === 'string' ? env.VERCEL_GIT_COMMIT_SHA : '';
  return {
    deploymentId,
    commitSha,
    environment: classifyEnvironment(env.VERCEL_ENV),
    deploymentIdPresent: deploymentId.length > 0,
    commitShaPresent: commitSha.length > 0,
    deploymentIdValid: DEPLOYMENT_ID.test(deploymentId),
    commitShaValid: COMMIT_SHA.test(commitSha),
  };
}

export function isExplicitRebookingV2Enablement(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

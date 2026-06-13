import { prisma } from '@/lib/prisma';
import {
  CERTIFICATION_COMPLETE_SLUG,
  CERTIFICATION_QUIZ_SLUG,
  getRequiredModuleSlugs,
  getTrainingModule,
  scoreQuiz,
  TRAINING_MODULES,
} from './trainingModules';

export type CertificationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'CERTIFIED';

export interface ModuleProgressView {
  slug: string;
  title: string;
  description: string;
  order: number;
  kind: 'content' | 'quiz' | 'completion';
  completed: boolean;
  completedAt: string | null;
  quizScore: number | null;
  quizPath?: string;
}

export interface CertificationSummary {
  status: CertificationStatus;
  modulesCompleted: number;
  modulesTotal: number;
  quizScore: number | null;
  certifiedAt: string | null;
  modules: ModuleProgressView[];
}

export async function getCleanerProgressRecords(cleanerId: string) {
  return prisma.cleanerTrainingProgress.findMany({
    where: { cleanerId },
    orderBy: { completedAt: 'asc' },
  });
}

export async function markModuleComplete(
  cleanerId: string,
  moduleSlug: string,
  quizScore?: number
) {
  const moduleDef = getTrainingModule(moduleSlug);
  if (!moduleDef) {
    throw new Error('Unknown training module');
  }

  if (moduleSlug === CERTIFICATION_QUIZ_SLUG) {
    throw new Error('Complete the certification quiz to finish this module');
  }

  if (moduleSlug === CERTIFICATION_COMPLETE_SLUG) {
    throw new Error('Certification complete is awarded automatically');
  }

  await prisma.cleanerTrainingProgress.upsert({
    where: {
      cleanerId_moduleSlug: { cleanerId, moduleSlug },
    },
    create: {
      cleanerId,
      moduleSlug,
      quizScore: quizScore ?? null,
    },
    update: {
      completedAt: new Date(),
      ...(quizScore !== undefined ? { quizScore } : {}),
    },
  });

  await maybeAwardCertificationComplete(cleanerId);
}

export async function submitCertificationQuiz(
  cleanerId: string,
  answers: Record<string, number>
) {
  const result = scoreQuiz(answers);
  if (!result.passed) {
    return { ...result, certified: false };
  }

  await prisma.cleanerTrainingProgress.upsert({
    where: {
      cleanerId_moduleSlug: { cleanerId, moduleSlug: CERTIFICATION_QUIZ_SLUG },
    },
    create: {
      cleanerId,
      moduleSlug: CERTIFICATION_QUIZ_SLUG,
      quizScore: result.scorePercent,
    },
    update: {
      completedAt: new Date(),
      quizScore: result.scorePercent,
    },
  });

  await maybeAwardCertificationComplete(cleanerId);

  return { ...result, certified: true };
}

async function maybeAwardCertificationComplete(cleanerId: string) {
  const required = getRequiredModuleSlugs().filter(
    (s) => s !== CERTIFICATION_COMPLETE_SLUG
  );
  const completed = await prisma.cleanerTrainingProgress.findMany({
    where: { cleanerId, moduleSlug: { in: required } },
    select: { moduleSlug: true },
  });
  const completedSet = new Set(completed.map((c) => c.moduleSlug));
  const allDone = required.every((s) => completedSet.has(s));
  if (!allDone) return;

  await prisma.cleanerTrainingProgress.upsert({
    where: {
      cleanerId_moduleSlug: {
        cleanerId,
        moduleSlug: CERTIFICATION_COMPLETE_SLUG,
      },
    },
    create: { cleanerId, moduleSlug: CERTIFICATION_COMPLETE_SLUG },
    update: { completedAt: new Date() },
  });
}

export async function getCertificationSummary(
  cleanerId: string
): Promise<CertificationSummary> {
  const records = await getCleanerProgressRecords(cleanerId);
  const bySlug = new Map(records.map((r) => [r.moduleSlug, r]));

  const modules: ModuleProgressView[] = TRAINING_MODULES.map((mod) => {
    const rec = bySlug.get(mod.slug);
    return {
      slug: mod.slug,
      title: mod.title,
      description: mod.description,
      order: mod.order,
      kind: mod.kind,
      completed: Boolean(rec),
      completedAt: rec?.completedAt.toISOString() ?? null,
      quizScore: rec?.quizScore ?? null,
      quizPath: mod.quizPath,
    };
  });

  const required = getRequiredModuleSlugs().filter(
    (s) => s !== CERTIFICATION_COMPLETE_SLUG
  );
  const modulesCompleted = required.filter((s) => bySlug.has(s)).length;
  const completeRec = bySlug.get(CERTIFICATION_COMPLETE_SLUG);
  const quizRec = bySlug.get(CERTIFICATION_QUIZ_SLUG);

  let status: CertificationStatus = 'NOT_STARTED';
  if (completeRec) {
    status = 'CERTIFIED';
  } else if (modulesCompleted > 0) {
    status = 'IN_PROGRESS';
  }

  return {
    status,
    modulesCompleted,
    modulesTotal: required.length,
    quizScore: quizRec?.quizScore ?? null,
    certifiedAt: completeRec?.completedAt.toISOString() ?? null,
    modules,
  };
}

export function isCleanerCertified(summary: CertificationSummary): boolean {
  return summary.status === 'CERTIFIED';
}

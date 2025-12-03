/**
 * Training Progress Utility
 * 
 * Computes training progress metrics
 */

interface LessonProgress {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface ModuleProgress {
  lessons: LessonProgress[];
}

/**
 * Calculate progress for a single module
 */
export function calculateModuleProgress(module: ModuleProgress): {
  completed: number;
  total: number;
  percentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
} {
  const total = module.lessons.length;
  const completed = module.lessons.filter((lesson) => lesson.status === 'COMPLETED').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  if (completed === total && total > 0) {
    status = 'COMPLETED';
  } else if (completed > 0) {
    status = 'IN_PROGRESS';
  } else {
    status = 'NOT_STARTED';
  }

  return {
    completed,
    total,
    percentage,
    status,
  };
}

/**
 * Calculate overall training progress across all modules
 */
export function calculateOverallProgress(modules: ModuleProgress[]): {
  completed: number;
  total: number;
  percentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED';
} {
  let totalLessons = 0;
  let completedLessons = 0;

  modules.forEach((module) => {
    totalLessons += module.lessons.length;
    completedLessons += module.lessons.filter((lesson) => lesson.status === 'COMPLETED').length;
  });

  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED';
  if (completedLessons === totalLessons && totalLessons > 0) {
    status = 'PASSED';
  } else if (completedLessons > 0) {
    status = 'IN_PROGRESS';
  } else {
    status = 'NOT_STARTED';
  }

  return {
    completed: completedLessons,
    total: totalLessons,
    percentage,
    status,
  };
}


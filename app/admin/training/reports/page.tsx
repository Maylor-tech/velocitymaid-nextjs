/**
 * Admin Training Reports Page
 * 
 * /admin/training/reports
 * 
 * Shows training analytics and statistics
 */

import { prisma } from '@/lib/prisma';
import { BarChart3, Users, Award, Clock, TrendingUp, XCircle } from 'lucide-react';

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic';

export default async function TrainingReportsPage() {
  // Get all Jamaica branches
  const jamaicaBranches = await prisma.branch.findMany({
    where: {
      OR: [
        { country: 'Jamaica' },
        { country: 'JM' },
        { slug: 'port-antonio' },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const branchIds = jamaicaBranches.map((b) => b.id);

  // Get all cleaners from Jamaica branches
  const cleaners = await prisma.user.findMany({
    where: {
      role: 'CLEANER',
      primaryBranchId: { in: branchIds },
    },
    include: {
      trainingStatus: true,
      lessonProgresses: {
        include: {
          lesson: {
            include: {
              module: true,
            },
          },
        },
      },
      primaryBranch: {
        select: {
          name: true,
        },
      },
    },
  });

  // Get all training modules and lessons
  const allModules = await prisma.trainingModule.findMany({
    where: { isActive: true },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  const allLessons = allModules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;

  // Calculate statistics
  const totalCleaners = cleaners.length;
  const cleanersWithTraining = cleaners.filter((c) => c.trainingStatus).length;
  const passedCleaners = cleaners.filter(
    (c) => c.trainingStatus?.overallStatus === 'PASSED'
  ).length;
  const inProgressCleaners = cleaners.filter(
    (c) => c.trainingStatus?.overallStatus === 'IN_PROGRESS'
  ).length;
  const notStartedCleaners = cleaners.filter(
    (c) => !c.trainingStatus || c.trainingStatus.overallStatus === 'NOT_STARTED'
  ).length;

  // Module pass rates
  const moduleStats = allModules.map((module) => {
    const moduleLessons = module.lessons;
    const moduleLessonIds = moduleLessons.map((l) => l.id);

    const cleanersWhoCompletedModule = cleaners.filter((cleaner) => {
      const completedLessons = cleaner.lessonProgresses.filter(
        (p) => p.status === 'COMPLETED' && moduleLessonIds.includes(p.lessonId)
      );
      return completedLessons.length === moduleLessons.length;
    }).length;

    const cleanersWhoStartedModule = cleaners.filter((cleaner) => {
      const startedLessons = cleaner.lessonProgresses.filter(
        (p) => moduleLessonIds.includes(p.lessonId)
      );
      return startedLessons.length > 0;
    }).length;

    const passRate =
      cleanersWhoStartedModule > 0
        ? Math.round((cleanersWhoCompletedModule / cleanersWhoStartedModule) * 100)
        : 0;

    // Calculate average score for this module
    const moduleScores = cleaners
      .flatMap((c) =>
        c.lessonProgresses
          .filter((p) => moduleLessonIds.includes(p.lessonId) && p.score !== null)
          .map((p) => p.score!)
      )
      .filter((s) => s !== null);

    const avgScore =
      moduleScores.length > 0
        ? Math.round(moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length)
        : 0;

    // Count failures (score < 70)
    const failures = cleaners
      .flatMap((c) =>
        c.lessonProgresses.filter(
          (p) =>
            moduleLessonIds.includes(p.lessonId) &&
            p.score !== null &&
            p.score < 70
        )
      ).length;

    return {
      moduleId: module.id,
      moduleTitle: module.title,
      totalLessons: moduleLessons.length,
      cleanersStarted: cleanersWhoStartedModule,
      cleanersCompleted: cleanersWhoCompletedModule,
      passRate,
      avgScore,
      failures,
    };
  });

  // Calculate average time spent (estimated from completedAt - startedAt)
  // For now, we'll use a placeholder since we don't track start times precisely
  const avgTimeSpent = 'N/A'; // Would need to track lesson start times

  // Certification stats
  const certificates = await prisma.trainingCertificate.findMany({
    where: {
      cleaner: {
        primaryBranchId: { in: branchIds },
      },
    },
  });

  const activeCertificates = certificates.filter((c) => c.status === 'ACTIVE').length;
  const revokedCertificates = certificates.filter((c) => c.status === 'REVOKED').length;

  // Overall completion percentage
  const totalCompletedLessons = cleaners.reduce(
    (sum, c) =>
      sum + c.lessonProgresses.filter((p) => p.status === 'COMPLETED').length,
    0
  );
  const totalPossibleLessons = totalCleaners * totalLessons;
  const overallCompletionRate =
    totalPossibleLessons > 0
      ? Math.round((totalCompletedLessons / totalPossibleLessons) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Reports</h1>
          <p className="text-gray-600">Jamaica Branch Training Analytics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Cleaners</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCleaners}</p>
            <p className="text-sm text-gray-500 mt-1">
              {cleanersWithTraining} with training status
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Passed Training</h3>
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{passedCleaners}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totalCleaners > 0
                ? Math.round((passedCleaners / totalCleaners) * 100)
                : 0}% of total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{inProgressCleaners}</p>
            <p className="text-sm text-gray-500 mt-1">
              {notStartedCleaners} not started
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Certificates Issued</h3>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{activeCertificates}</p>
            <p className="text-sm text-gray-500 mt-1">
              {revokedCertificates} revoked
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Overall Completion Rate</h2>
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Lessons Completed</span>
              <span className="text-sm font-semibold text-gray-900">
                {overallCompletionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${overallCompletionRate}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {totalCompletedLessons} of {totalPossibleLessons} possible lessons completed
          </p>
        </div>

        {/* Module Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Module Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Module</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Lessons</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Started</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Completed</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Pass Rate</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Score</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Failures</th>
                </tr>
              </thead>
              <tbody>
                {moduleStats.map((stat) => (
                  <tr key={stat.moduleId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{stat.moduleTitle}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{stat.totalLessons}</td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {stat.cleanersStarted}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {stat.cleanersCompleted}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          stat.passRate >= 80
                            ? 'text-green-600'
                            : stat.passRate >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.passRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{stat.avgScore}%</td>
                    <td className="py-3 px-4 text-center">
                      {stat.failures > 0 ? (
                        <span className="text-red-600 font-semibold flex items-center justify-center gap-1">
                          <XCircle className="w-4 h-4" />
                          {stat.failures}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Passed</span>
                <span className="font-semibold text-green-600">{passedCleaners}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-yellow-600">{inProgressCleaners}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Not Started</span>
                <span className="font-semibold text-gray-600">{notStartedCleaners}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certification</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active</span>
                <span className="font-semibold text-green-600">{activeCertificates}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revoked</span>
                <span className="font-semibold text-red-600">{revokedCertificates}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Branches</h3>
            <div className="space-y-2">
              {jamaicaBranches.map((branch) => {
                const branchCleaners = cleaners.filter(
                  (c) => c.primaryBranchId === branch.id
                ).length;
                return (
                  <div key={branch.id} className="flex justify-between items-center">
                    <span className="text-gray-600">{branch.name}</span>
                    <span className="font-semibold text-gray-900">{branchCleaners}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


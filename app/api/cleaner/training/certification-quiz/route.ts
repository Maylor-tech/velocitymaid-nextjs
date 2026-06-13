import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import {
  CERTIFICATION_QUIZ_QUESTIONS,
  TRAINING_PASSING_SCORE,
} from '@/lib/cleaners/trainingModules';
import {
  getCertificationSummary,
  submitCertificationQuiz,
} from '@/lib/cleaners/trainingProgress';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/cleaner/training/certification-quiz — questions (no answers) */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, 'CLEANER');
    const questions = CERTIFICATION_QUIZ_QUESTIONS.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));
    return NextResponse.json({
      success: true,
      passingScore: TRAINING_PASSING_SCORE,
      questions,
    });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    return NextResponse.json(
      { success: false, error: 'Failed to load quiz' },
      { status: 500 }
    );
  }
}

/** POST /api/cleaner/training/certification-quiz — submit answers */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, 'CLEANER');
    const body = await req.json();
    const answers = body?.answers as Record<string, number> | undefined;
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { success: false, error: 'answers object required' },
        { status: 400 }
      );
    }

    const result = await submitCertificationQuiz(auth.userId, answers);
    const summary = await getCertificationSummary(auth.userId);

    return NextResponse.json({
      success: true,
      ...result,
      certification: summary,
    });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    return NextResponse.json(
      { success: false, error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}

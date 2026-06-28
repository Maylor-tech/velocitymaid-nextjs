import type { PipelineLeadStage, PrismaClient } from '@prisma/client';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function runLeadAutomations(
  prisma: PrismaClient,
  leadId: string,
  options: { isNew?: boolean; previousStage?: PipelineLeadStage; newStage?: PipelineLeadStage }
) {
  const tasks: Array<{
    type: 'FOLLOW_UP' | 'QUOTE_REMINDER' | 'ONBOARDING';
    title: string;
    dueAt: Date;
  }> = [];

  const now = new Date();

  if (options.isNew) {
    tasks.push({
      type: 'FOLLOW_UP',
      title: 'Initial follow-up — contact new lead',
      dueAt: addDays(now, 1),
    });
  }

  if (options.newStage === 'QUOTE_SENT' && options.previousStage !== 'QUOTE_SENT') {
    tasks.push({
      type: 'QUOTE_REMINDER',
      title: 'Quote follow-up — check in after quote sent',
      dueAt: addDays(now, 3),
    });
  }

  if (options.newStage === 'WON' && options.previousStage !== 'WON') {
    tasks.push({
      type: 'ONBOARDING',
      title: 'Client onboarding — schedule first service',
      dueAt: addDays(now, 1),
    });
  }

  if (tasks.length === 0) return;

  await prisma.pipelineLeadTask.createMany({
    data: tasks.map((t) => ({
      leadId,
      type: t.type,
      title: t.title,
      dueAt: t.dueAt,
    })),
  });

  const earliest = tasks.reduce(
    (min, t) => (t.dueAt < min ? t.dueAt : min),
    tasks[0].dueAt
  );

  await prisma.pipelineLead.update({
    where: { id: leadId },
    data: { nextActionDate: earliest },
  });
}

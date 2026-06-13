/**
 * VelocityMaid cleaner certification training modules (MVP).
 * Edit content here — pages consume this data only.
 */

export const TRAINING_PASSING_SCORE = 80;

export type TrainingModuleKind = 'content' | 'quiz' | 'completion';

export interface TrainingModuleDefinition {
  slug: string;
  title: string;
  description: string;
  order: number;
  kind: TrainingModuleKind;
  /** Content modules only */
  sections?: Array<{ heading: string; body: string }>;
  takeaways?: string[];
  /** Quiz module — link to dedicated quiz page */
  quizPath?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const CERTIFICATION_QUIZ_SLUG = 'certification-quiz';
export const CERTIFICATION_COMPLETE_SLUG = 'certification-complete';

export const TRAINING_MODULES: TrainingModuleDefinition[] = [
  {
    slug: 'welcome-to-velocitymaid',
    title: 'Welcome to VelocityMaid',
    description: 'Your role, expectations, and how the VelocityMaid platform works.',
    order: 1,
    kind: 'content',
    sections: [
      {
        heading: 'Welcome aboard',
        body: 'VelocityMaid connects professional cleaners with homeowners and hospitality partners across our service areas. As an approved cleaner, you represent the brand in every home you enter.',
      },
      {
        heading: 'What success looks like',
        body: 'Guests and homeowners should feel cared for — not just that a checklist was completed. You are a hospitality professional: punctual, prepared, and proactive.',
      },
      {
        heading: 'Using the cleaner portal',
        body: 'View assigned jobs at /cleaner/jobs, accept when ready, start on arrival, and mark complete when finished. Complete certification training before taking live assignments.',
      },
    ],
    takeaways: [
      'You represent VelocityMaid in every property.',
      'Use the cleaner portal for all job updates.',
      'Complete certification before live jobs.',
    ],
  },
  {
    slug: 'service-standards',
    title: 'VelocityMaid Service Standards',
    description: 'Non-negotiable quality standards for every clean.',
    order: 2,
    kind: 'content',
    sections: [
      {
        heading: 'Consistency',
        body: 'Every clean meets the same high standard regardless of property size. Follow branch checklists and never skip documented steps.',
      },
      {
        heading: 'Attention to detail',
        body: 'High-touch surfaces, bathrooms, kitchens, and floors must be guest-ready. Reset spaces to a neutral, welcoming baseline.',
      },
      {
        heading: 'Time integrity',
        body: 'Arrive on time, communicate delays early, and finish within the scheduled window unless the host approves an extension.',
      },
    ],
    takeaways: [
      'Follow checklists every time.',
      'High-touch areas must shine.',
      'Communicate delays before they become problems.',
    ],
  },
  {
    slug: 'professional-appearance',
    title: 'Professional Appearance',
    description: 'Present yourself as a trusted hospitality professional.',
    order: 3,
    kind: 'content',
    sections: [
      {
        heading: 'Dress code',
        body: 'Wear clean, professional attire suitable for entering client homes. Closed-toe shoes, neat grooming, and VelocityMaid-branded items when provided.',
      },
      {
        heading: 'Equipment',
        body: 'Bring approved supplies in organized totes. Do not use strong fragrances that may linger for guests with sensitivities.',
      },
    ],
    takeaways: [
      'Clean, professional attire at every job.',
      'Organized supplies and minimal fragrance.',
    ],
  },
  {
    slug: 'hospitality-checklist',
    title: '50-Point Hospitality Checklist',
    description: 'Core areas every certified cleaner verifies before leaving.',
    order: 4,
    kind: 'content',
    sections: [
      {
        heading: 'Overview',
        body: 'The 50-point checklist covers entry, living areas, kitchen, bathrooms, bedrooms, finishing touches, and departure. Your branch may provide a detailed version — this training covers the principles.',
      },
      {
        heading: 'Key categories',
        body: 'Entry & first impression · Living & dining · Kitchen (surfaces, appliances visible to guests) · Bathrooms (sanitized, stocked, streak-free) · Bedrooms (linens, surfaces, floors) · Final walk-through & photos.',
      },
    ],
    takeaways: [
      'Work room-by-room with a systematic approach.',
      'Kitchens and bathrooms receive extra scrutiny.',
      'Final walk-through before marking complete.',
    ],
  },
  {
    slug: 'property-documentation',
    title: 'Property Documentation',
    description: 'Before/after photos and condition reporting.',
    order: 5,
    kind: 'content',
    sections: [
      {
        heading: 'Before photos',
        body: 'Capture key areas on arrival when required by the job or branch policy. Document pre-existing issues so you are never blamed for prior damage.',
      },
      {
        heading: 'After photos',
        body: 'Show completed work in the same angles as before photos when possible. Clear, well-lit images protect you and demonstrate quality to hosts.',
      },
      {
        heading: 'Issue reporting',
        body: 'Log missing supplies, damage, access problems, or incomplete scope in the portal or via host communication channels immediately.',
      },
    ],
    takeaways: [
      'Document condition on arrival when required.',
      'After photos prove quality and completion.',
      'Report issues immediately — do not wait.',
    ],
  },
  {
    slug: 'host-communication',
    title: 'Host Communication',
    description: 'Professional, timely communication with property owners and hosts.',
    order: 6,
    kind: 'content',
    sections: [
      {
        heading: 'When to communicate',
        body: 'Notify the host before arrival if running late, when you discover damage or access issues, and when the job is complete (if the branch requires it).',
      },
      {
        heading: 'Tone and clarity',
        body: 'Be concise, respectful, and solution-oriented. Never argue with a host in writing — escalate to VelocityMaid support if needed.',
      },
    ],
    takeaways: [
      'Communicate delays and blockers early.',
      'Stay professional and solution-focused.',
      'Escalate disputes to VelocityMaid support.',
    ],
  },
  {
    slug: 'cleaner-safety',
    title: 'Cleaner Safety',
    description: 'Protect yourself and others on every job.',
    order: 7,
    kind: 'content',
    sections: [
      {
        heading: 'Personal safety',
        body: 'Do not enter unsafe properties. If you feel threatened, leave and contact support. Use proper lifting technique and ventilation when using cleaning products.',
      },
      {
        heading: 'When to stop',
        body: 'If a task requires equipment you do not have, involves heights you cannot safely reach, or exposes you to biohazards, stop and report. Never proceed with a task that feels unsafe.',
      },
    ],
    takeaways: [
      'Leave unsafe situations immediately.',
      'Report unsafe tasks — do not improvise.',
      'Use products with proper ventilation.',
    ],
  },
  {
    slug: 'customer-privacy',
    title: 'Customer Privacy',
    description: 'Respect guest and homeowner privacy at all times.',
    order: 8,
    kind: 'content',
    sections: [
      {
        heading: 'Confidentiality',
        body: 'Do not discuss client identities, addresses, or property details outside the platform. Never post photos of interiors on social media.',
      },
      {
        heading: 'Property access',
        body: 'Use only provided access methods. Do not share codes or keys. Lock up exactly as instructed when leaving.',
      },
    ],
    takeaways: [
      'Never share client details or interior photos publicly.',
      'Protect access codes and keys.',
      'Secure the property on departure.',
    ],
  },
  {
    slug: CERTIFICATION_QUIZ_SLUG,
    title: 'Certification Quiz',
    description: 'Pass with 80% or higher to earn your VelocityMaid certification.',
    order: 9,
    kind: 'quiz',
    quizPath: '/cleaner/training/certification-quiz',
  },
  {
    slug: CERTIFICATION_COMPLETE_SLUG,
    title: 'Certification Complete',
    description: 'Your certification status and next steps.',
    order: 10,
    kind: 'completion',
    sections: [
      {
        heading: 'Congratulations',
        body: 'You have completed VelocityMaid cleaner certification. You may now accept live job assignments through the cleaner portal.',
      },
      {
        heading: 'Stay current',
        body: 'Service standards and branch policies may update. Check back for refresher modules as they are released.',
      },
    ],
    takeaways: [
      'Certification unlocks live job assignments.',
      'Maintain standards on every job.',
    ],
  },
];

export const CERTIFICATION_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'damage',
    question: 'What should you do if you discover damage?',
    options: [
      'Ignore it if it looks minor',
      'Document it and notify the host / VelocityMaid immediately',
      'Try to repair it yourself',
      'Wait until the next scheduled clean',
    ],
    correctIndex: 1,
  },
  {
    id: 'photos',
    question: 'What is the purpose of before/after photos?',
    options: [
      'Social media marketing only',
      'Document condition and prove quality of completed work',
      'Required only for deep cleans',
      'Optional and rarely needed',
    ],
    correctIndex: 1,
  },
  {
    id: 'guest-ready',
    question: 'What should every property feel like when a guest arrives?',
    options: [
      'Lightly tidied but clearly lived-in',
      'Welcoming, clean, and guest-ready',
      'Sanitized like a hospital only',
      'Exactly as the owner left it',
    ],
    correctIndex: 1,
  },
  {
    id: 'unsafe',
    question: 'What should you do if a task feels unsafe?',
    options: [
      'Complete it quickly to stay on schedule',
      'Ask a neighbor for help',
      'Stop and report — do not proceed',
      'Skip it without telling anyone',
    ],
    correctIndex: 2,
  },
  {
    id: 'host-comms',
    question: 'When should you communicate with the host?',
    options: [
      'Only after the job is complete',
      'Never — only VelocityMaid admin communicates',
      'Before arrival issues, delays, damage, or completion when required',
      'Only if the host messages you first',
    ],
    correctIndex: 2,
  },
];

export function getTrainingModule(slug: string): TrainingModuleDefinition | undefined {
  return TRAINING_MODULES.find((m) => m.slug === slug);
}

export function getContentModules(): TrainingModuleDefinition[] {
  return TRAINING_MODULES.filter((m) => m.kind === 'content');
}

export function getRequiredModuleSlugs(): string[] {
  return TRAINING_MODULES.map((m) => m.slug);
}

export function scoreQuiz(answers: Record<string, number>): {
  scorePercent: number;
  passed: boolean;
  correctCount: number;
  total: number;
} {
  const total = CERTIFICATION_QUIZ_QUESTIONS.length;
  let correctCount = 0;
  for (const q of CERTIFICATION_QUIZ_QUESTIONS) {
    if (answers[q.id] === q.correctIndex) correctCount++;
  }
  const scorePercent = Math.round((correctCount / total) * 100);
  return {
    scorePercent,
    passed: scorePercent >= TRAINING_PASSING_SCORE,
    correctCount,
    total,
  };
}

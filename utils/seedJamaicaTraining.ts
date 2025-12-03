/**
 * Jamaica Training Modules Seed
 * 
 * Seeds training modules and lessons for the Port Antonio (Jamaica) branch.
 * This should be run after the database migration.
 */

import { prisma } from '@/lib/prisma';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
}

interface QuizData {
  questions: QuizQuestion[];
}

/**
 * Generate quiz data for a lesson
 */
function createQuiz(questions: Omit<QuizQuestion, 'correctAnswer'> & { correctAnswer: number }): QuizData {
  return {
    questions: questions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
  };
}

/**
 * Upsert a training lesson (create or update)
 */
async function upsertLesson(
  moduleId: string,
  order: number,
  data: {
    title: string;
    content: string;
    quizJson?: QuizData;
  }
) {
  const existing = await prisma.trainingLesson.findFirst({
    where: {
      moduleId,
      order,
    },
  });

  if (existing) {
    return await prisma.trainingLesson.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        content: data.content,
        quizJson: data.quizJson || null,
      },
    });
  } else {
    return await prisma.trainingLesson.create({
      data: {
        moduleId,
        order,
        title: data.title,
        content: data.content,
        quizJson: data.quizJson || null,
      },
    });
  }
}

/**
 * Seed Welcome to VelocityMaid Jamaica module
 */
async function seedWelcomeModule() {
  const module = await prisma.trainingModule.upsert({
    where: { slug: 'welcome-jamaica' },
    update: {},
    create: {
      slug: 'welcome-jamaica',
      title: 'Welcome to VelocityMaid Jamaica',
      description: 'Get started with VelocityMaid and learn about our mission and how we work with you.',
      order: 1,
      isActive: true,
    },
  });

  // Lesson 1: Welcome & Mission
  await upsertLesson(module.id, 1, {
    title: 'Welcome & Mission',
      content: `# Welcome to VelocityMaid Jamaica!

Welcome to the VelocityMaid family! We're excited to have you join our team in Port Antonio.

## Our Mission

At VelocityMaid, we believe in providing exceptional cleaning services while creating meaningful employment opportunities. We're committed to:

- **Professional Excellence**: Delivering consistent, high-quality cleaning services
- **Fair Compensation**: Ensuring you're paid fairly and on time
- **Growth Opportunities**: Supporting your professional development
- **Community Impact**: Building a positive presence in Port Antonio

## What Makes Us Different

- **Reliable Work**: Consistent job assignments
- **Fair Pay**: Competitive rates with transparent payment
- **Support**: We're here to help you succeed
- **Technology**: Easy-to-use tools for managing your work

## Your Journey Starts Here

Complete all training modules to begin receiving job assignments. We're here to support you every step of the way!`,
    quizJson: createQuiz({
        questions: [
          {
            question: 'What is VelocityMaid\'s main mission?',
            options: [
              'To provide the cheapest cleaning services',
              'To provide exceptional cleaning services while creating meaningful employment opportunities',
              'To only serve wealthy customers',
              'To expand to every country',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you do after completing training?',
            options: [
              'Wait for further instructions',
              'Start receiving job assignments',
              'Contact customers directly',
              'None of the above',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What makes VelocityMaid different?',
            options: [
              'We only work with experienced cleaners',
              'We provide reliable work, fair pay, support, and technology',
              'We only serve commercial properties',
              'We don\'t use technology',
            ],
            correctAnswer: 1,
          },
        ],
      }),
  });

  // Lesson 2: How VelocityMaid Will Work With You
  await upsertLesson(module.id, 2, {
    title: 'How VelocityMaid Will Work With You',
      content: `# How VelocityMaid Will Work With You

Understanding how we operate will help you succeed in your role.

## Communication

- **WhatsApp**: Primary communication channel for job assignments and updates
- **Training Portal**: Access your training materials and track progress
- **Support**: Always available to answer questions

## Job Assignment Process

1. **Job Notification**: You'll receive a WhatsApp message when assigned to a job
2. **Job Details**: All information (address, time, service type) will be provided
3. **Confirmation**: Confirm your availability
4. **Completion**: Update job status when finished

## Payment

- **Frequency**: Regular payment cycles
- **Method**: Bank transfer or other agreed method
- **Transparency**: Clear breakdown of earnings

## Support & Resources

- Training materials available anytime
- Quality feedback to help you improve
- Performance tracking to recognize your achievements

## Expectations

- **Punctuality**: Arrive on time for all jobs
- **Professionalism**: Maintain high standards
- **Communication**: Keep us informed of any issues
- **Quality**: Deliver consistent, excellent service`,
      order: 2,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What is the primary communication channel for job assignments?',
            options: [
              'Email',
              'Phone calls',
              'WhatsApp',
              'Text messages',
            ],
            correctAnswer: 2,
          },
          {
            question: 'What should you do when assigned to a job?',
            options: [
              'Ignore the message',
              'Confirm your availability and review job details',
              'Call the customer directly',
              'Wait for a phone call',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What is expected of you as a cleaner?',
            options: [
              'Only show up when convenient',
              'Punctuality, professionalism, communication, and quality',
              'Work without any support',
              'Set your own prices',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  return module;
}

/**
 * Seed Professional Standards & Culture module
 */
async function seedProfessionalStandardsModule() {
  const module = await prisma.trainingModule.upsert({
    where: { slug: 'professional-standards' },
    update: {},
    create: {
      slug: 'professional-standards',
      title: 'Professional Standards & Culture',
      description: 'Learn about our dress code, timekeeping, and communication standards.',
      order: 2,
      isActive: true,
    },
  });

  // Lesson 1: Dress Code & Timekeeping
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 1,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Dress Code & Timekeeping',
      content: `# Dress Code & Timekeeping

Professional appearance and punctuality are essential to our success.

## Dress Code

### Required Attire

- **Clean, professional clothing**: No torn or stained clothes
- **Comfortable, closed-toe shoes**: For safety and comfort
- **VelocityMaid-branded items** (when provided): Shirts, aprons, etc.
- **Hair**: Neatly groomed and tied back if long

### What to Avoid

- Revealing or inappropriate clothing
- Strong perfumes or colognes
- Excessive jewelry that could interfere with work
- Dirty or unkempt appearance

## Timekeeping

### Punctuality Standards

- **Arrive on time**: Be at the job location at the scheduled time
- **15-minute buffer**: Arrive 15 minutes early if possible
- **Communication**: If running late, notify immediately via WhatsApp

### Time Management

- **Plan ahead**: Check traffic and plan your route
- **Transport**: Ensure reliable transportation
- **Buffer time**: Allow extra time for unexpected delays

## Professional Appearance Impact

- Builds trust with customers
- Represents VelocityMaid brand positively
- Shows respect for the job and clients
- Creates a professional work environment`,
      order: 1,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What should you do if you\'re running late?',
            options: [
              'Don\'t say anything',
              'Notify immediately via WhatsApp',
              'Call the customer directly',
              'Just show up when you can',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What is the recommended arrival time?',
            options: [
              'Exactly on time',
              '15 minutes early if possible',
              '30 minutes late',
              'Whenever convenient',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you avoid wearing?',
            options: [
              'Clean, professional clothing',
              'Revealing or inappropriate clothing',
              'Comfortable shoes',
              'VelocityMaid-branded items',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 2: Communication & Phone Etiquette
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 2,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Communication & Phone Etiquette',
      content: `# Communication & Phone Etiquette

Effective communication is key to success.

## WhatsApp Communication

### Best Practices

- **Respond promptly**: Acknowledge messages within 2 hours
- **Be clear and concise**: Use proper grammar and spelling
- **Professional tone**: Always be respectful and courteous
- **Confirm details**: Repeat important information to ensure understanding

### Message Examples

**Good Response:**
"Thank you for the assignment. I confirm I'll be at 123 Main St on Monday at 9 AM for a Standard Clean. I'll arrive by 8:45 AM."

**Poor Response:**
"ok"

## Phone Etiquette (if calling)

- **Answer professionally**: "Hello, this is [Your Name] from VelocityMaid"
- **Speak clearly**: Use a calm, friendly tone
- **Listen actively**: Pay attention to what's being said
- **Take notes**: Write down important information

## When to Communicate

- **Job confirmations**: Always confirm when assigned
- **Running late**: Notify immediately
- **Issues or concerns**: Report problems right away
- **Job completion**: Update status when finished
- **Questions**: Don't hesitate to ask for clarification

## Communication Don'ts

- ❌ Using inappropriate language
- ❌ Ignoring messages
- ❌ Making assumptions
- ❌ Sharing customer information
- ❌ Complaining to customers`,
      order: 2,
      quizJson: createQuiz({
        questions: [
          {
            question: 'How quickly should you respond to WhatsApp messages?',
            options: [
              'Within 24 hours',
              'Within 2 hours',
              'Within a week',
              'Whenever you feel like it',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you do when assigned to a job?',
            options: [
              'Ignore the message',
              'Confirm details and arrival time',
              'Call the customer directly',
              'Wait for a reminder',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you avoid in communication?',
            options: [
              'Being clear and concise',
              'Using inappropriate language',
              'Confirming details',
              'Responding promptly',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  return module;
}

/**
 * Seed Cleaning Systems & Checklists module
 */
async function seedCleaningSystemsModule() {
  const module = await prisma.trainingModule.upsert({
    where: { slug: 'cleaning-systems' },
    update: {},
    create: {
      slug: 'cleaning-systems',
      title: 'Cleaning Systems & Checklists',
      description: 'Learn our standard cleaning procedures for different service types.',
      order: 3,
      isActive: true,
    },
  });

  // Lesson 1: Standard Clean – Room by Room
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 1,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Standard Clean – Room by Room',
      content: `# Standard Clean – Room by Room

A systematic approach ensures nothing is missed.

## Kitchen

- **Countertops**: Clean and sanitize all surfaces
- **Sink**: Clean, sanitize, and polish faucet
- **Appliances**: Wipe exterior of refrigerator, stove, microwave
- **Floors**: Sweep and mop
- **Trash**: Empty and replace liner

## Bathroom

- **Toilet**: Clean inside and out, sanitize
- **Shower/Tub**: Clean walls, floor, and fixtures
- **Sink**: Clean and sanitize, polish mirror
- **Floors**: Sweep and mop
- **Trash**: Empty and replace liner

## Living Areas

- **Dusting**: All surfaces, including baseboards
- **Vacuuming**: Carpets and rugs
- **Mopping**: Hard floors
- **Trash**: Empty all bins
- **Tidying**: Organize items, fluff pillows

## Bedrooms

- **Bed making**: Fresh sheets if provided
- **Dusting**: All surfaces
- **Vacuuming/Mopping**: Floors
- **Trash**: Empty bins
- **Tidying**: Organize items

## General

- **Windows**: Clean interior windows and sills
- **Doors**: Wipe handles and frames
- **Light switches**: Wipe clean
- **Baseboards**: Dust or wipe`,
      order: 1,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What should you clean in the kitchen?',
            options: [
              'Only the sink',
              'Countertops, sink, appliances, floors, and trash',
              'Only the floors',
              'Nothing specific',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What is included in bathroom cleaning?',
            options: [
              'Only the toilet',
              'Toilet, shower/tub, sink, floors, and trash',
              'Only the mirror',
              'Only the floors',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you do in living areas?',
            options: [
              'Only vacuum',
              'Dust, vacuum/mop, empty trash, and tidy',
              'Only dust',
              'Nothing',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 2: Deep Clean – Extra Tasks
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 2,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Deep Clean – Extra Tasks',
      content: `# Deep Clean – Extra Tasks

Deep cleans include all standard tasks plus additional thorough cleaning.

## Additional Kitchen Tasks

- **Inside appliances**: Clean inside oven, refrigerator
- **Cabinets**: Wipe exterior and interior
- **Vent hood**: Clean filter and exterior
- **Backsplash**: Deep clean grout and tiles
- **Baseboards**: Detailed cleaning

## Additional Bathroom Tasks

- **Grout**: Deep clean and scrub
- **Shower doors**: Remove soap scum
- **Vent fan**: Clean and dust
- **Medicine cabinet**: Wipe interior
- **Caulking**: Clean around tub and sink

## Additional Living Areas

- **Ceiling fans**: Dust blades
- **Light fixtures**: Clean covers
- **Window tracks**: Deep clean
- **Blinds**: Dust or wipe
- **Upholstery**: Vacuum thoroughly

## Additional Bedroom Tasks

- **Under bed**: Vacuum and clean
- **Closet**: Organize and dust
- **Window treatments**: Clean
- **Furniture**: Move and clean behind

## General Deep Clean Tasks

- **Walls**: Spot clean marks
- **Doors**: Clean frames and tops
- **Vents**: Clean and dust
- **Cobwebs**: Remove from corners
- **Baseboards**: Detailed cleaning`,
      order: 2,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What additional tasks are included in a deep clean?',
            options: [
              'Only standard tasks',
              'Standard tasks plus inside appliances, detailed grout cleaning, ceiling fans, and more',
              'Only vacuuming',
              'Nothing extra',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you clean in the bathroom during a deep clean?',
            options: [
              'Only the toilet',
              'All standard tasks plus grout, shower doors, vent fan, and caulking',
              'Only the mirror',
              'Nothing',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 3: Move In/Out – Empty House Standards
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 3,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Move In/Out – Empty House Standards',
      content: `# Move In/Out – Empty House Standards

Move-in/out cleans require the highest level of detail.

## Pre-Cleaning Inspection

- **Walk through**: Note any damage or issues
- **Photo documentation**: Take photos if needed
- **Special requests**: Confirm any specific requirements

## Comprehensive Cleaning

### All Rooms

- **Walls**: Clean marks, fingerprints, and smudges
- **Baseboards**: Thorough cleaning
- **Windows**: Inside and tracks
- **Doors**: Frames, handles, and tops
- **Light fixtures**: Clean covers and bulbs
- **Vents**: Clean and dust
- **Cobwebs**: Remove all

### Kitchen (Empty)

- **Cabinets**: Clean inside and out
- **Drawers**: Clean interior
- **Appliances**: Deep clean inside and out
- **Countertops**: Sanitize thoroughly
- **Sink**: Polish and sanitize
- **Floors**: Deep scrub

### Bathrooms (Empty)

- **All surfaces**: Deep sanitize
- **Grout**: Scrub thoroughly
- **Caulking**: Clean and inspect
- **Fixtures**: Polish all
- **Mirrors**: Streak-free
- **Floors**: Deep clean

### Final Inspection

- **Checklist review**: Ensure all tasks completed
- **Quality check**: Verify high standards
- **Final walkthrough**: Confirm readiness`,
      order: 3,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What should you do before starting a move-in/out clean?',
            options: [
              'Start cleaning immediately',
              'Walk through, note issues, and confirm requirements',
              'Only clean the kitchen',
              'Skip inspection',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What is required for move-in/out cleans?',
            options: [
              'Only basic cleaning',
              'Highest level of detail including walls, baseboards, inside cabinets, and deep sanitization',
              'Only vacuuming',
              'Nothing special',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  return module;
}

/**
 * Seed Products, Safety & Eco Practices module
 */
async function seedSafetyEcoModule() {
  const module = await prisma.trainingModule.upsert({
    where: { slug: 'safety-eco' },
    update: {},
    create: {
      slug: 'safety-eco',
      title: 'Products, Safety & Eco Practices',
      description: 'Learn about safe product use, personal protection, and eco-friendly practices.',
      order: 4,
      isActive: true,
    },
  });

  // Lesson 1: Safe Product Use in Jamaica
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 1,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Safe Product Use in Jamaica',
      content: `# Safe Product Use in Jamaica

Understanding products and their safe use is essential.

## Product Categories

### All-Purpose Cleaners
- **Use**: General surfaces, countertops
- **Safety**: Avoid mixing with bleach
- **Storage**: Keep in original containers

### Disinfectants
- **Use**: Bathrooms, kitchens, high-touch areas
- **Safety**: Follow contact time instructions
- **Ventilation**: Ensure good airflow

### Glass Cleaners
- **Use**: Mirrors, windows
- **Safety**: Avoid eye contact
- **Application**: Spray on cloth, not directly on glass

### Floor Cleaners
- **Use**: Appropriate for floor type
- **Safety**: Avoid slipping hazards
- **Dilution**: Follow instructions

## Safety Rules

- **Read labels**: Always check instructions
- **Never mix**: Don't combine different products
- **Ventilation**: Open windows when possible
- **Storage**: Keep away from food and children
- **Disposal**: Follow local regulations

## Jamaica-Specific Considerations

- **Availability**: Use products available locally
- **Climate**: Consider humidity in storage
- **Water quality**: Adjust dilution if needed`,
      order: 1,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What should you do before using a cleaning product?',
            options: [
              'Use it immediately',
              'Read the label and check instructions',
              'Mix it with other products',
              'Skip reading',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you never do with cleaning products?',
            options: [
              'Read labels',
              'Mix different products together',
              'Use in well-ventilated areas',
              'Store properly',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 2: Protecting Yourself & Clients
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 2,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Protecting Yourself & Clients',
      content: `# Protecting Yourself & Clients

Safety is our top priority.

## Personal Protection

### Protective Equipment

- **Gloves**: Wear when using chemicals
- **Masks**: Use in poorly ventilated areas
- **Closed-toe shoes**: Always required
- **Aprons**: Protect clothing

### Health & Safety

- **Hand washing**: Wash hands frequently
- **Breaks**: Take breaks in fresh air
- **Hydration**: Drink water regularly
- **Report issues**: Notify if feeling unwell

## Client Protection

### Respect Privacy

- **Personal items**: Don't move or inspect personal belongings
- **Documents**: Never read or handle private documents
- **Photos**: Don't take photos without permission
- **Information**: Keep client information confidential

### Property Care

- **Fragile items**: Handle with care
- **Ask first**: If unsure about an item, ask
- **Report damage**: Immediately report any accidents
- **Respect space**: Work around client's belongings

## Emergency Procedures

- **Accidents**: Report immediately
- **Injuries**: Seek medical attention if needed
- **Spills**: Clean up safely
- **Fire**: Know exit routes`,
      order: 2,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What protective equipment should you wear?',
            options: [
              'Nothing',
              'Gloves when using chemicals, closed-toe shoes, and other protective gear as needed',
              'Only gloves',
              'Only shoes',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you do with client's personal items?',
            options: [
              'Move them around',
              'Respect privacy, don't move or inspect personal belongings',
              'Take photos',
              'Read documents',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What should you do if an accident occurs?',
            options: [
              'Ignore it',
              'Report immediately',
              'Hide it',
              'Wait until later',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 3: Eco-Friendly Cleaning & Water Use
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 3,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Eco-Friendly Cleaning & Water Use',
      content: `# Eco-Friendly Cleaning & Water Use

Sustainable practices benefit everyone.

## Water Conservation

### Efficient Water Use

- **Buckets**: Use buckets instead of running water
- **Rinse efficiently**: Don't let water run unnecessarily
- **Mop water**: Reuse when appropriate
- **Final rinse**: Use clean water for final steps

### Jamaica Water Considerations

- **Conservation**: Important in all areas
- **Quality**: Use appropriate filtration if needed
- **Storage**: Handle stored water properly

## Eco-Friendly Products

### When Available

- **Biodegradable**: Choose when possible
- **Concentrated**: Use less product
- **Natural alternatives**: Consider vinegar, baking soda
- **Packaging**: Minimize waste

## Waste Reduction

- **Reusable cloths**: Use washable cleaning cloths
- **Minimize disposables**: Reduce single-use items
- **Proper disposal**: Follow recycling guidelines
- **Efficient use**: Don't waste products

## Benefits

- **Environment**: Reduces impact
- **Cost**: Saves money
- **Health**: Better for everyone
- **Community**: Sets positive example`,
      order: 3,
      quizJson: createQuiz({
        questions: [
          {
            question: 'How should you conserve water?',
            options: [
              'Let water run continuously',
              'Use buckets, rinse efficiently, and avoid running water unnecessarily',
              'Use as much water as possible',
              'Don't worry about water use',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What are benefits of eco-friendly practices?',
            options: [
              'No benefits',
              'Reduces environmental impact, saves money, and is better for health',
              'Only saves money',
              'Only helps the environment',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  return module;
}

/**
 * Seed Quality Control & Scorecard module
 */
async function seedQualityScorecardModule() {
  const module = await prisma.trainingModule.upsert({
    where: { slug: 'quality-scorecard' },
    update: {},
    create: {
      slug: 'quality-scorecard',
      title: 'Quality Control & Scorecard',
      description: 'Understand how quality is measured and how to achieve excellence.',
      order: 5,
      isActive: true,
    },
  });

  // Lesson 1: Scorecard & Ratings
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 1,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Scorecard & Ratings',
      content: `# Scorecard & Ratings

Understanding how your work is evaluated helps you excel.

## Scorecard Components

### Quality Metrics

- **Thoroughness**: Completeness of cleaning
- **Attention to detail**: Nothing missed
- **Consistency**: Same high standard every time
- **Time management**: Efficient completion

### Customer Ratings

- **5 stars**: Excellent - exceeds expectations
- **4 stars**: Very good - meets all expectations
- **3 stars**: Good - meets basic expectations
- **2 stars**: Needs improvement
- **1 star**: Unsatisfactory

## How to Achieve High Ratings

### Preparation

- **Review checklist**: Know what's expected
- **Bring supplies**: Ensure you have everything
- **Plan your time**: Allocate time for each area

### Execution

- **Follow systems**: Use our standard procedures
- **Double-check**: Review your work
- **Attention to detail**: Notice the small things

### Communication

- **Confirm completion**: Update job status
- **Report issues**: Communicate problems
- **Ask questions**: Clarify if unsure

## Tracking Your Performance

- **Regular reviews**: Check your scorecard
- **Identify areas for improvement**: Focus on weak points
- **Celebrate success**: Recognize achievements`,
      order: 1,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What is included in quality metrics?',
            options: [
              'Only speed',
              'Thoroughness, attention to detail, consistency, and time management',
              'Only customer ratings',
              'Nothing specific',
            ],
            correctAnswer: 1,
          },
          {
            question: 'How can you achieve high ratings?',
            options: [
              'Work as fast as possible',
              'Prepare well, follow systems, pay attention to detail, and communicate',
              'Only focus on speed',
              'Skip some tasks',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 2: Complaints & Re-cleans
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 2,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Complaints & Re-cleans',
      content: `# Complaints & Re-cleans

How to handle feedback and improve.

## Understanding Complaints

### Common Issues

- **Missed areas**: Something not cleaned
- **Quality concerns**: Not meeting standards
- **Time issues**: Taking too long or too short
- **Communication**: Lack of updates

### Why Complaints Happen

- **Rush jobs**: Not enough time allocated
- **Distractions**: Not focusing on work
- **Skipping steps**: Not following checklist
- **Miscommunication**: Unclear expectations

## Handling Complaints

### Professional Response

- **Acknowledge**: Accept feedback graciously
- **Apologize**: Take responsibility
- **Learn**: Understand what went wrong
- **Improve**: Make changes for next time

### Re-clean Process

- **Priority**: Re-cleans are high priority
- **Thoroughness**: Extra attention to detail
- **Communication**: Keep client informed
- **Follow-up**: Ensure satisfaction

## Prevention

### Best Practices

- **Follow checklist**: Don't skip steps
- **Take your time**: Quality over speed
- **Double-check**: Review before leaving
- **Ask questions**: Clarify expectations

## Learning from Feedback

- **Constructive**: Use feedback to improve
- **Patterns**: Identify recurring issues
- **Solutions**: Develop better approaches
- **Growth**: Continuous improvement`,
      order: 2,
      quizJson: createQuiz({
        questions: [
          {
            question: 'How should you respond to complaints?',
            options: [
              'Ignore them',
              'Acknowledge, apologize, learn, and improve',
              'Blame the client',
              'Make excuses',
            ],
            correctAnswer: 1,
          },
          {
            question: 'How can you prevent complaints?',
            options: [
              'Work as fast as possible',
              'Follow checklist, take time, double-check, and ask questions',
              'Skip some tasks',
              'Don't communicate',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 3: Bonuses & Incentives
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 3,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Bonuses & Incentives',
      content: `# Bonuses & Incentives

Rewards for excellent performance.

## Bonus Opportunities

### Performance Bonuses

- **High ratings**: Consistent 5-star reviews
- **Perfect attendance**: No missed jobs
- **Customer compliments**: Positive feedback
- **Quality excellence**: Exceeding standards

### Special Bonuses

- **Holiday periods**: Extra during busy times
- **Referrals**: Bringing in new customers
- **Training completion**: Finishing all modules
- **Milestones**: Reaching job count goals

## How Bonuses Work

### Eligibility

- **Active status**: Must be active cleaner
- **Minimum jobs**: Complete required number
- **Quality threshold**: Maintain high standards
- **Time period**: Based on monthly/quarterly cycles

### Calculation

- **Base amount**: Standard bonus rate
- **Multipliers**: Higher for exceptional performance
- **Accumulation**: Bonuses can add up
- **Payment**: Included in regular payout

## Maximizing Your Earnings

### Focus on Quality

- **Excellence**: Always do your best
- **Consistency**: Maintain high standards
- **Customer satisfaction**: Exceed expectations

### Stay Active

- **Availability**: Accept assignments
- **Reliability**: Show up on time
- **Communication**: Stay engaged

## Recognition

- **Public acknowledgment**: Recognition for achievements
- **Career growth**: Opportunities for advancement
- **Team building**: Part of VelocityMaid family`,
      order: 3,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What can earn you bonuses?',
            options: [
              'Only showing up',
              'High ratings, perfect attendance, customer compliments, and quality excellence',
              'Only completing many jobs',
              'Nothing specific',
            ],
            correctAnswer: 1,
          },
          {
            question: 'How can you maximize your earnings?',
            options: [
              'Work as fast as possible',
              'Focus on quality, stay active, and maintain consistency',
              'Skip training',
              'Only work when you feel like it',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  return module;
}

/**
 * Seed Routes, Time & Communication module
 */
async function seedRoutesCommunicationModule() {
  const module = await prisma.trainingModule.upsert({
    where: { slug: 'routes-communication' },
    update: {},
    create: {
      slug: 'routes-communication',
      title: 'Routes, Time & Communication',
      description: 'Learn how to manage routes, time, and handle communication effectively.',
      order: 6,
      isActive: true,
    },
  });

  // Lesson 1: Using WhatsApp for Jobs
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 1,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Using WhatsApp for Jobs',
      content: `# Using WhatsApp for Jobs

WhatsApp is your primary tool for job management.

## Receiving Job Assignments

### Notification Format

You'll receive messages with:
- **Customer name**: Who you're cleaning for
- **Service type**: Standard, Deep, Move-in/out
- **Date and time**: When to arrive
- **Address**: Exact location
- **Special instructions**: Any specific requirements

### Responding to Assignments

**Always confirm:**
- "Confirmed. I'll be at [address] on [date] at [time]."
- Include your estimated arrival time
- Ask questions if anything is unclear

## Job Updates

### Status Updates

- **On the way**: When you're heading to the job
- **Arrived**: When you reach the location
- **Started**: When you begin cleaning
- **Completed**: When finished

### Communication During Job

- **Issues**: Report problems immediately
- **Questions**: Ask if unsure about anything
- **Delays**: Notify if running behind
- **Completion**: Confirm when done

## Best Practices

- **Check regularly**: Don't miss messages
- **Respond promptly**: Within 2 hours
- **Be professional**: Use proper language
- **Save contacts**: Add VelocityMaid number
- **Backup plan**: Have alternative communication method`,
      order: 1,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What should you do when receiving a job assignment?',
            options: [
              'Ignore it',
              'Confirm with details including address, date, and time',
              'Call the customer directly',
              'Wait for a reminder',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What status updates should you send?',
            options: [
              'None',
              'On the way, arrived, started, and completed',
              'Only when finished',
              'Only when starting',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 2: Time Management & Transport
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 2,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'Time Management & Transport',
      content: `# Time Management & Transport

Effective time management ensures success.

## Planning Your Day

### Before the Job

- **Review assignment**: Know all details
- **Check route**: Plan your journey
- **Prepare supplies**: Gather everything needed
- **Allow buffer time**: Plan for delays

### Time Allocation

- **Travel time**: Factor in transport
- **Job duration**: Standard times per service type
  - Standard Clean: 2-3 hours
  - Deep Clean: 4-6 hours
  - Move-in/out: 6-8 hours
- **Buffer**: Extra time for unexpected issues

## Transportation

### Reliable Transport

- **Consistent method**: Have reliable transportation
- **Backup plan**: Alternative if primary fails
- **Route planning**: Know the area
- **Time estimates**: Realistic travel times

### Jamaica-Specific

- **Public transport**: Plan routes if using
- **Traffic patterns**: Know peak times
- **Distance**: Consider travel distance
- **Weather**: Account for conditions

## Punctuality

### Arrival Standards

- **On time**: Arrive at scheduled time
- **Early is better**: 15 minutes early ideal
- **Communication**: Notify if delayed
- **Preparation**: Ready to start immediately

## Efficiency Tips

- **Organize supplies**: Easy access
- **Work systematically**: Follow room order
- **Minimize breaks**: Stay focused
- **Quality first**: Don't rush`,
      order: 2,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What should you do before a job?',
            options: [
              'Show up whenever',
              'Review assignment, check route, prepare supplies, and allow buffer time',
              'Only check the address',
              'Nothing',
            ],
            correctAnswer: 1,
          },
          {
            question: 'What is the ideal arrival time?',
            options: [
              'Exactly on time',
              '15 minutes early',
              '30 minutes late',
              'Whenever convenient',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  // Lesson 3: When Something Goes Wrong
  await prisma.trainingLesson.upsert({
    where: {
      moduleId_order: {
        moduleId: module.id,
        order: 3,
      },
    },
    update: {},
    create: {
      moduleId: module.id,
      title: 'When Something Goes Wrong',
      content: `# When Something Goes Wrong

Handling problems professionally is essential.

## Common Issues

### Transportation Problems

- **Delays**: Traffic, transport issues
- **Solution**: Notify immediately, provide ETA
- **Prevention**: Leave early, have backup plan

### Access Problems

- **Locked out**: Can't get in
- **Solution**: Contact immediately, wait for instructions
- **Prevention**: Confirm access details beforehand

### Supply Issues

- **Missing supplies**: Don't have what you need
- **Solution**: Report immediately, use alternatives if safe
- **Prevention**: Check supplies before leaving

### Property Issues

- **Damage found**: Existing damage
- **Solution**: Document, report immediately
- **Prevention**: Inspect before starting

## Communication Protocol

### Immediate Notification

- **WhatsApp**: Primary method
- **Be specific**: What's wrong, what you need
- **Be proactive**: Suggest solutions if possible
- **Follow up**: Confirm resolution

### Example Messages

**Good:**
"I've arrived but the door is locked. I've tried calling but no answer. Should I wait or reschedule?"

**Poor:**
"Can't get in"

## Problem Resolution

### Stay Calm

- **Don't panic**: Problems happen
- **Think clearly**: Assess the situation
- **Communicate**: Keep everyone informed

### Professional Approach

- **Take responsibility**: For your part
- **Be solution-focused**: Help resolve
- **Learn**: Prevent future issues

## Escalation

### When to Escalate

- **Safety concerns**: Immediate escalation
- **Property damage**: Report immediately
- **Customer conflict**: Get support
- **Unresolved issues**: Don't struggle alone`,
      order: 3,
      quizJson: createQuiz({
        questions: [
          {
            question: 'What should you do if you can\'t access a property?',
            options: [
              'Leave and go home',
              'Contact immediately via WhatsApp, wait for instructions',
              'Break in',
              'Don't say anything',
            ],
            correctAnswer: 1,
          },
          {
            question: 'How should you communicate problems?',
            options: [
              'Don't say anything',
              'Notify immediately via WhatsApp, be specific, and suggest solutions',
              'Only tell the customer',
              'Wait until later',
            ],
            correctAnswer: 1,
          },
        ],
      }),
    },
  });

  return module;
}

/**
 * Main seed function
 */
export async function seedJamaicaTraining() {
  console.log('🌱 Seeding Jamaica training modules...');

  try {
    const welcome = await seedWelcomeModule();
    console.log(`✅ Seeded module: ${welcome.title}`);

    const professional = await seedProfessionalStandardsModule();
    console.log(`✅ Seeded module: ${professional.title}`);

    const cleaning = await seedCleaningSystemsModule();
    console.log(`✅ Seeded module: ${cleaning.title}`);

    const safety = await seedSafetyEcoModule();
    console.log(`✅ Seeded module: ${safety.title}`);

    const quality = await seedQualityScorecardModule();
    console.log(`✅ Seeded module: ${quality.title}`);

    const routes = await seedRoutesCommunicationModule();
    console.log(`✅ Seeded module: ${routes.title}`);

    console.log('🎉 All Jamaica training modules seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding training modules:', error);
    throw error;
  }
}


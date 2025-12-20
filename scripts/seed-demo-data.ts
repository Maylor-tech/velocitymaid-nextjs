/**
 * Demo Data Seeding Script
 * 
 * Seeds the database with realistic demo data for development and testing
 */

import { prisma } from '@/lib/prisma';
import {
  randomDateWithin,
  pick,
  generateNJAddress,
  generateName,
  generatePhone,
  generateEmail,
  jobStatuses,
  trainingStatuses,
  availabilityTemplates,
  performanceStats,
} from '@/lib/demo-data';

export async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');

  // Step 1: Clear tables in order (to avoid FK conflicts)
  console.log('🧹 Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.complianceIssue.deleteMany();
  // Note: Complaint model doesn't exist yet - skip for now
  // await prisma.complaint.deleteMany();
  await prisma.cleanerRating.deleteMany();
  await prisma.assignmentLog.deleteMany();
  await prisma.job.deleteMany();
  await prisma.cleanerAvailability.deleteMany();
  await prisma.trainingStatus.deleteMany();
  await prisma.userBranch.deleteMany();
  // Delete cleaners (Users with role CLEANER)
  await prisma.user.deleteMany({ where: { role: 'CLEANER' } });
  await prisma.customer.deleteMany();

  // Step 2: Get a branch (use first available branch or create a default one)
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    // Create a default branch if none exists
    branch = await prisma.branch.create({
      data: {
        id: `branch_${Date.now()}`,
        name: 'New Jersey',
        slug: 'new-jersey',
        country: 'US',
        state: 'NJ',
        city: 'Newark',
        regionLabel: 'New Jersey',
        timezone: 'America/New_York',
        primaryPhone: '201-555-0100',
        whatsappNumber: '201-555-0100',
        status: 'ACTIVE',
        currency: 'USD',
        updatedAt: new Date(),
      },
    });
  }

  // Step 3: Seed Customers (5)
  console.log('👥 Creating customers...');
  const customers = [];
  for (let i = 0; i < 5; i++) {
    const name = generateName();
    const email = generateEmail(name);
    const address = generateNJAddress();
    const zipMatch = address.match(/\b\d{5}\b/);
    const homeZipCode = zipMatch ? zipMatch[0] : null;

    const customer = await prisma.customer.create({
      data: {
        id: `customer_${Date.now()}_${i}`,
        firstName: name.firstName,
        lastName: name.lastName,
        email,
        phone: generatePhone(),
        defaultAddress: address,
        homeZipCode,
        branchId: branch.id,
        riskScore: Math.floor(Math.random() * 30), // 0-30 for demo
        riskFlags: [],
        isBlocked: false,
        updatedAt: new Date(),
      },
    });
    customers.push(customer);
  }

  // Step 4: Seed Cleaners (5)
  console.log('🧹 Creating cleaners...');
  const cleaners = [];
  const trainingStatusValues = ['PENDING', 'IN_REVIEW', 'PASSED', 'ACTIVE', 'NOT_STARTED'];
  const stats = performanceStats();

  for (let i = 0; i < 5; i++) {
    const name = generateName();
    const email = generateEmail(name);
    const trainingStatus = pick(trainingStatusValues);
    const isSuspended = i === 0; // First cleaner is suspended
    const warningCount = i === 1 ? 2 : 0; // Second cleaner has warnings

    // Create User (Cleaner)
    const cleaner = await prisma.user.create({
      data: {
        id: `cleaner_${Date.now()}_${i}`,
        email,
        name: `${name.firstName} ${name.lastName}`,
        role: 'CLEANER',
        primaryBranchId: branch.id,
        isActive: !isSuspended,
        warningCount,
        isSuspended,
        preferredCities: ['Newark', 'Jersey City'],
        updatedAt: new Date(),
      },
    });

    // Create TrainingStatus
    const ts = await prisma.trainingStatus.create({
      data: {
        id: `training_${cleaner.id}`,
        cleanerId: cleaner.id,
        overallStatus: trainingStatus,
        updatedAt: new Date(),
      },
    });

    // Random training certificate for seeders
    await prisma.trainingCertificate.create({
      data: {
        certificateId: `CERT-SEED-${i}`,
        cleanerId: cleaner.id,
        trainingStatusId: ts.id,
      },
    });

    // Create CleanerAvailability
    const availability = pick(availabilityTemplates);
    await prisma.cleanerAvailability.create({
      data: {
        id: `avail_${cleaner.id}`,
        cleanerId: cleaner.id,
        workingDays: availability.workingDays as any,
        timeRanges: availability.timeRanges as any,
        maxDailyJobs: availability.maxDailyJobs,
        isActive: !isSuspended,
        updatedAt: new Date(),
      },
    });

    // Create UserBranch relationship
    await prisma.userBranch.create({
      data: {
        id: `ub_${cleaner.id}_${branch.id}`,
        userId: cleaner.id,
        branchId: branch.id,
      },
    });

    cleaners.push(cleaner);
  }

  // Step 5: Seed Jobs (10)
  console.log('📋 Creating jobs...');
  const jobs = [];
  const jobStatusValues = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];

  for (let i = 0; i < 10; i++) {
    const customer = pick(customers);
    const status = pick(jobStatusValues);
    const assignedCleaner = status !== 'pending' && status !== 'cancelled' ? pick(cleaners) : null;
    const preferredDate = randomDateWithin(60);
    const isCompleted = status === 'completed';
    const completedAt = isCompleted ? new Date(preferredDate.getTime() + 2 * 60 * 60 * 1000) : null;

    const job = await prisma.job.create({
      data: {
        id: `job_${Date.now()}_${i}`,
        branchId: branch.id,
        customerId: customer.id,
        assignedCleanerId: assignedCleaner?.id || null,
        customerName: `${customer.firstName} ${customer.lastName}`,
        preferredDate,
        preferredTime: pick(['Morning', 'Afternoon', 'Evening']),
        serviceType: pick(['basic', 'deep', 'moveInOut']),
        serviceLocation: 'new_jersey',
        address: customer.defaultAddress || generateNJAddress(),
        status,
        totalPrice: Math.floor(Math.random() * 200) + 100,
        currency: 'USD',
        paymentMethod: 'card',
        assignedAt: assignedCleaner ? new Date(preferredDate.getTime() - 24 * 60 * 60 * 1000) : null,
        completedAt,
        jobQualityScore: isCompleted ? Math.floor(Math.random() * 20) + 80 : null,
      },
    });
    jobs.push(job);
  }

  // Step 6: Seed Ratings (4) - only for completed jobs
  console.log('⭐ Creating ratings...');
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const jobsToRate = completedJobs.slice(0, 4);

  for (const job of jobsToRate) {
    if (!job.assignedCleanerId) continue;

    await prisma.cleanerRating.create({
      data: {
        jobId: job.id,
        cleanerId: job.assignedCleanerId,
        customerId: job.customerId || null,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        comment: pick([
          'Great service!',
          'Very thorough cleaning.',
          'Professional and friendly.',
          'Would book again!',
          'Excellent work!',
        ]),
      },
    });
  }

  // Step 7: Seed Complaints (3) - Note: Complaint model doesn't exist yet
  // Placeholder: Will create when Complaint model is added to schema
  console.log('⚠️  Skipping complaints (model not in schema yet)');

  // Step 8: Seed Compliance Issues (2)
  console.log('🚨 Creating compliance issues...');
  const issueTypes = [
    'DOCUMENT_MISSING',
    'TOO_MANY_COMPLAINTS',
    'PAYMENT_ISSUE',
    'TRAINING_INCOMPLETE',
    'ATTENDANCE_ISSUE',
  ];

  // Issue 1: Attached to cleaner with warnings
  const cleanerWithWarnings = cleaners.find((c) => c.warningCount > 0);
  if (cleanerWithWarnings) {
    await prisma.complianceIssue.create({
      data: {
        cleanerId: cleanerWithWarnings.id,
        branchId: branch.id,
        type: pick(issueTypes),
        severity: 3, // MEDIUM
        status: 'OPEN',
        summary: 'Multiple warnings issued - review required',
        details: 'Cleaner has received multiple warnings for attendance issues.',
      },
    });
  }

  // Issue 2: Attached to suspended cleaner
  const suspendedCleaner = cleaners.find((c) => c.isSuspended);
  if (suspendedCleaner) {
    await prisma.complianceIssue.create({
      data: {
        cleanerId: suspendedCleaner.id,
        branchId: branch.id,
        type: 'SUSPENSION_REQUIRED',
        severity: 5, // CRITICAL
        status: 'OPEN',
        summary: 'Cleaner suspended due to policy violation',
        details: 'Cleaner has been suspended pending investigation.',
      },
    });
  }

  // Step 9: Seed Audit Logs (12)
  console.log('📝 Creating audit logs...');
  const auditActions = [
    'CREATED_CLEANER',
    'UPDATED_TRAINING_STATUS',
    'ASSIGNED_JOB',
    'COMPLETED_JOB',
    'CREATED_COMPLAINT',
    'SUSPENDED_CLEANER',
    'UPDATED_COMPLIANCE_STATUS',
  ];

  // Log cleaner creation
  for (const cleaner of cleaners.slice(0, 3)) {
    await prisma.auditLog.create({
      data: {
        actorId: null,
        actorRole: 'ADMIN',
        action: 'CREATED_CLEANER',
        entityType: 'Cleaner',
        entityId: cleaner.id,
        description: `Cleaner ${cleaner.name} was created`,
        changes: { name: cleaner.name, email: cleaner.email },
      },
    });
  }

  // Log training status updates
  for (const cleaner of cleaners.slice(0, 2)) {
    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId: cleaner.id },
    });
    if (trainingStatus) {
      await prisma.auditLog.create({
        data: {
          actorId: null,
          actorRole: 'ADMIN',
          action: 'UPDATED_TRAINING_STATUS',
          entityType: 'Cleaner',
          entityId: cleaner.id,
          description: `Training status updated to ${trainingStatus.overallStatus}`,
          changes: { overallStatus: trainingStatus.overallStatus },
        },
      });
    }
  }

  // Log job assignments
  const assignedJobs = jobs.filter((j) => j.assignedCleanerId);
  for (const job of assignedJobs.slice(0, 3)) {
    await prisma.auditLog.create({
      data: {
        actorId: null,
        actorRole: 'ADMIN',
        action: 'ASSIGNED_JOB',
        entityType: 'Job',
        entityId: job.id,
        description: `Job assigned to cleaner`,
        changes: { assignedCleanerId: job.assignedCleanerId },
      },
    });
  }

  // Log job completions
  const completedJobsForAudit = jobs.filter((j) => j.status === 'completed');
  for (const job of completedJobsForAudit.slice(0, 2)) {
    await prisma.auditLog.create({
      data: {
        actorId: null,
        actorRole: 'SYSTEM',
        action: 'COMPLETED_JOB',
        entityType: 'Job',
        entityId: job.id,
        description: `Job marked as completed`,
        changes: { status: 'completed', completedAt: job.completedAt?.toISOString() },
      },
    });
  }

  // Log suspension
  if (suspendedCleaner) {
    await prisma.auditLog.create({
      data: {
        actorId: null,
        actorRole: 'ADMIN',
        action: 'SUSPENDED_CLEANER',
        entityType: 'Cleaner',
        entityId: suspendedCleaner.id,
        description: `Cleaner ${suspendedCleaner.name} was suspended`,
        changes: { isSuspended: true },
      },
    });
  }

  // Log compliance issue creation
  const issues = await prisma.complianceIssue.findMany();
  for (const issue of issues) {
    await prisma.auditLog.create({
      data: {
        actorId: null,
        actorRole: 'ADMIN',
        action: 'CREATED_COMPLIANCE_ISSUE',
        entityType: 'ComplianceIssue',
        entityId: issue.id,
        description: `Compliance issue created: ${issue.summary}`,
        changes: { type: issue.type, severity: issue.severity },
      },
    });
  }

  const summary = {
    cleaners: cleaners.length,
    customers: customers.length,
    jobs: jobs.length,
    ratings: jobsToRate.length,
    complaints: 0, // Placeholder - Complaint model not in schema
    complianceIssues: issues.length,
    auditLogs: 12,
  };

  console.log('✅ Demo data seeding completed!');
  console.log('Summary:', summary);

  return summary;
}

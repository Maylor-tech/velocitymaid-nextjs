/**
 * Phase M: Assignment SLA Tracking
 * 
 * Tracks assignment time and enforces 60-minute SLA during business hours.
 * "Assign within 60 minutes during business hours"
 */

import { prisma } from "@/lib/prisma";
import { getServiceHours } from "./territory";

export interface AssignmentSLAStatus {
  jobId: string;
  createdAt: Date;
  assignedAt: Date | null;
  assignmentTimeMinutes: number | null;
  slaTargetMinutes: number;
  slaStatus: "pending" | "met" | "violated" | "outside_hours";
  isBusinessHours: boolean;
  violationReason?: string;
}

export interface AssignmentQueueItem {
  jobId: string;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: Date | null;
  preferredTime: string | null;
  address: string | null;
  createdAt: Date;
  assignedAt: Date | null;
  assignmentTimeMinutes: number | null;
  slaStatus: "pending" | "met" | "violated" | "outside_hours";
  urgency: "low" | "medium" | "high" | "critical";
}

/**
 * Calculate assignment time in minutes
 */
export function calculateAssignmentTime(
  createdAt: Date,
  assignedAt: Date | null
): number | null {
  if (!assignedAt) {
    return null;
  }
  return Math.round((assignedAt.getTime() - createdAt.getTime()) / (1000 * 60));
}

/**
 * Check if current time is within business hours for a branch
 */
export async function isBusinessHours(branchId: string): Promise<boolean> {
  const serviceHours = await getServiceHours(branchId);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinutes;

  const [startHours, startMinutes] = serviceHours.start.split(":").map(Number);
  const startTimeMinutes = startHours * 60 + startMinutes;

  const [endHours, endMinutes] = serviceHours.end.split(":").map(Number);
  const endTimeMinutes = endHours * 60 + endMinutes;

  return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
}

/**
 * Check if a specific time is within business hours
 */
export async function isTimeBusinessHours(
  branchId: string,
  time: Date
): Promise<boolean> {
  const serviceHours = await getServiceHours(branchId);
  const timeHour = time.getHours();
  const timeMinutes = time.getMinutes();
  const timeMinutesTotal = timeHour * 60 + timeMinutes;

  const [startHours, startMinutes] = serviceHours.start.split(":").map(Number);
  const startTimeMinutes = startHours * 60 + startMinutes;

  const [endHours, endMinutes] = serviceHours.end.split(":").map(Number);
  const endTimeMinutes = endHours * 60 + endMinutes;

  return timeMinutesTotal >= startTimeMinutes && timeMinutesTotal <= endTimeMinutes;
}

/**
 * Get SLA status for a job
 */
export async function getAssignmentSLAStatus(
  jobId: string
): Promise<AssignmentSLAStatus> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      createdAt: true,
      assignedAt: true,
      branchId: true,
      status: true,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const assignmentTimeMinutes = calculateAssignmentTime(job.createdAt, job.assignedAt);
  const slaTargetMinutes = 60; // 60 minutes SLA

  // Check if job was created during business hours
  const createdAtBusinessHours = await isTimeBusinessHours(job.branchId, job.createdAt);
  const nowBusinessHours = await isBusinessHours(job.branchId);

  let slaStatus: "pending" | "met" | "violated" | "outside_hours";
  let violationReason: string | undefined;

  if (!job.assignedAt) {
    // Not yet assigned
    if (!createdAtBusinessHours) {
      slaStatus = "outside_hours";
    } else if (!nowBusinessHours) {
      // Created during business hours but now outside - check if it's been > 60 minutes
      const timeSinceCreation = Math.round(
        (Date.now() - job.createdAt.getTime()) / (1000 * 60)
      );
      if (timeSinceCreation > slaTargetMinutes) {
        slaStatus = "violated";
        violationReason = `Assignment took ${timeSinceCreation} minutes (SLA: ${slaTargetMinutes} minutes)`;
      } else {
        slaStatus = "pending";
      }
    } else {
      // Currently in business hours - check if SLA violated
      const timeSinceCreation = Math.round(
        (Date.now() - job.createdAt.getTime()) / (1000 * 60)
      );
      if (timeSinceCreation > slaTargetMinutes) {
        slaStatus = "violated";
        violationReason = `Assignment took ${timeSinceCreation} minutes (SLA: ${slaTargetMinutes} minutes)`;
      } else {
        slaStatus = "pending";
      }
    }
  } else {
    // Already assigned
    if (!createdAtBusinessHours) {
      slaStatus = "outside_hours";
    } else if (assignmentTimeMinutes && assignmentTimeMinutes <= slaTargetMinutes) {
      slaStatus = "met";
    } else {
      slaStatus = "violated";
      violationReason = `Assignment took ${assignmentTimeMinutes} minutes (SLA: ${slaTargetMinutes} minutes)`;
    }
  }

  return {
    jobId: job.id,
    createdAt: job.createdAt,
    assignedAt: job.assignedAt,
    assignmentTimeMinutes,
    slaTargetMinutes,
    slaStatus,
    isBusinessHours: nowBusinessHours,
    violationReason,
  };
}

/**
 * Get assignment queue for a branch
 * Shows unassigned jobs ordered by urgency
 */
export async function getAssignmentQueue(
  branchId: string
): Promise<AssignmentQueueItem[]> {
  const jobs = await prisma.job.findMany({
    where: {
      branchId,
      assignedCleanerId: null,
      status: {
        in: ["RECEIVED", "CONFIRMED"],
      },
    },
    select: {
      id: true,
      customerName: true,
      serviceType: true,
      preferredDate: true,
      preferredTime: true,
      address: true,
      createdAt: true,
      assignedAt: true,
      status: true,
    },
    orderBy: {
      createdAt: "asc", // Oldest first
    },
  });

  const now = new Date();
  const slaTargetMinutes = 60;

  const queueItems: AssignmentQueueItem[] = await Promise.all(
    jobs.map(async (job) => {
      const assignmentTimeMinutes = calculateAssignmentTime(job.createdAt, job.assignedAt);
      const timeSinceCreation = Math.round(
        (now.getTime() - job.createdAt.getTime()) / (1000 * 60)
      );

      const createdAtBusinessHours = await isTimeBusinessHours(branchId, job.createdAt);
      const nowBusinessHours = await isBusinessHours(branchId);

      let slaStatus: "pending" | "met" | "violated" | "outside_hours";
      let urgency: "low" | "medium" | "high" | "critical";

      if (!createdAtBusinessHours) {
        slaStatus = "outside_hours";
        urgency = "low";
      } else if (nowBusinessHours) {
        if (timeSinceCreation > slaTargetMinutes) {
          slaStatus = "violated";
          urgency = "critical";
        } else if (timeSinceCreation > slaTargetMinutes * 0.75) {
          slaStatus = "pending";
          urgency = "high";
        } else if (timeSinceCreation > slaTargetMinutes * 0.5) {
          slaStatus = "pending";
          urgency = "medium";
        } else {
          slaStatus = "pending";
          urgency = "low";
        }
      } else {
        // Outside business hours now
        if (timeSinceCreation > slaTargetMinutes) {
          slaStatus = "violated";
          urgency = "high";
        } else {
          slaStatus = "pending";
          urgency = "low";
        }
      }

      return {
        jobId: job.id,
        customerName: job.customerName,
        serviceType: job.serviceType,
        preferredDate: job.preferredDate,
        preferredTime: job.preferredTime,
        address: job.address,
        createdAt: job.createdAt,
        assignedAt: job.assignedAt,
        assignmentTimeMinutes,
        slaStatus,
        urgency,
      };
    })
  );

  // Sort by urgency (critical first, then high, medium, low)
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  queueItems.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return queueItems;
}

/**
 * Get SLA violation alerts for a branch
 */
export async function getSLAViolations(
  branchId: string,
  hours: number = 24
): Promise<AssignmentSLAStatus[]> {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);

  const jobs = await prisma.job.findMany({
    where: {
      branchId,
      createdAt: {
        gte: cutoffTime,
      },
      OR: [
        {
          assignedAt: null, // Not yet assigned
        },
        {
          assignedAt: {
            not: null,
          },
        },
      ],
    },
    select: {
      id: true,
      createdAt: true,
      assignedAt: true,
    },
  });

  const violations: AssignmentSLAStatus[] = [];

  for (const job of jobs) {
    const slaStatus = await getAssignmentSLAStatus(job.id);
    if (slaStatus.slaStatus === "violated") {
      violations.push(slaStatus);
    }
  }

  return violations;
}




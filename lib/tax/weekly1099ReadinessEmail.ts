/**
 * Phase 3H.6: Weekly 1099 Readiness Email
 * 
 * Email template for weekly admin readiness reports
 * Sent during January to track Jan 31 readiness
 * No sensitive data in emails
 */

/**
 * Get status band from score
 */
export function getReadinessStatusBand(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: "Excellent",
      color: "#059669", // green-600
      description: "On track for Jan 31 deadline",
    };
  } else if (score >= 80) {
    return {
      label: "Good",
      color: "#10b981", // green-500
      description: "Minor improvements needed",
    };
  } else if (score >= 60) {
    return {
      label: "Fair",
      color: "#f59e0b", // yellow-500
      description: "Action required to meet deadline",
    };
  } else {
    return {
      label: "Critical",
      color: "#ef4444", // red-500
      description: "Urgent action required",
    };
  }
}

/**
 * Generate weekly 1099 readiness email subject
 */
export function getWeekly1099ReadinessEmailSubject(
  year: number,
  score: number,
  statusBand: string
): string {
  return `Jan 31 Readiness: ${score.toFixed(1)}/100 (${statusBand}) - Week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/**
 * Generate weekly 1099 readiness email HTML
 */
export function getWeekly1099ReadinessEmailHTML(data: {
  year: number;
  overallScore: number;
  statusBand: { label: string; color: string; description: string };
  eligibleCleanersCount: number;
  blockers: Array<{
    type: string;
    label: string;
    count: number;
  }>;
  dashboardUrl: string;
}): string {
  const { year, overallScore, statusBand, eligibleCleanersCount, blockers, dashboardUrl } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jan 31 Readiness Report - VelocityMaid</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📊 Jan 31 Readiness Report</h1>
    <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">Week of ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 48px; font-weight: bold; color: ${statusBand.color}; margin: 20px 0;">
        ${overallScore.toFixed(1)}
      </div>
      <div style="font-size: 18px; color: #6b7280; margin-bottom: 10px;">/ 100</div>
      <div style="display: inline-block; padding: 8px 16px; background: ${statusBand.color}20; color: ${statusBand.color}; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: 10px;">
        ${statusBand.label}
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">${statusBand.description}</p>
    </div>

    <div style="background: #f9fafb; border-left: 4px solid ${statusBand.color}; padding: 20px; margin: 25px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 600; margin-bottom: 8px;">
        Summary
      </p>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        <strong>${eligibleCleanersCount}</strong> cleaner${eligibleCleanersCount !== 1 ? "s" : ""} meet the ${year} 1099 threshold ($${year === 2025 ? "600.01" : "2,000.01"}+)
      </p>
    </div>

    ${blockers.length > 0 ? `
    <div style="margin: 30px 0;">
      <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 15px;">
        Top Blockers
      </h3>
      <div style="space-y: 8px;">
        ${blockers.slice(0, 5).map((blocker) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; margin-bottom: 8px;">
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: 500; color: #92400e; margin-bottom: 2px;">
                ${blocker.label}
              </div>
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #92400e;">
              ${blocker.count} cleaner${blocker.count !== 1 ? "s" : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Full Dashboard →
      </a>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 6px; margin: 25px 0;">
      <p style="margin: 0; font-size: 13px; color: #166534;">
        <strong>💡 Next Steps:</strong> Review blockers and take action to improve readiness before the Jan 31 deadline. Use the dashboard to filter and contact affected cleaners.
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      This is an automated weekly report sent during January to track readiness for the Jan 31 tax filing deadline.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
      VelocityMaid Admin Dashboard
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate weekly 1099 readiness email plain text
 */
export function getWeekly1099ReadinessEmailText(data: {
  year: number;
  overallScore: number;
  statusBand: { label: string; color: string; description: string };
  eligibleCleanersCount: number;
  blockers: Array<{
    type: string;
    label: string;
    count: number;
  }>;
  dashboardUrl: string;
}): string {
  const { year, overallScore, statusBand, eligibleCleanersCount, blockers, dashboardUrl } = data;

  return `
Jan 31 Readiness Report
Week of ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

Overall Score: ${overallScore.toFixed(1)}/100
Status: ${statusBand.label} - ${statusBand.description}

Summary:
- ${eligibleCleanersCount} cleaner${eligibleCleanersCount !== 1 ? "s" : ""} meet the ${year} 1099 threshold ($${year === 2025 ? "600.01" : "2,000.01"}+)

${blockers.length > 0 ? `
Top Blockers:
${blockers.slice(0, 5).map((blocker) => `- ${blocker.label}: ${blocker.count} cleaner${blocker.count !== 1 ? "s" : ""}`).join("\n")}
` : ""}

View Full Dashboard: ${dashboardUrl}

Next Steps: Review blockers and take action to improve readiness before the Jan 31 deadline. Use the dashboard to filter and contact affected cleaners.

---
This is an automated weekly report sent during January to track readiness for the Jan 31 tax filing deadline.
  `.trim();
}



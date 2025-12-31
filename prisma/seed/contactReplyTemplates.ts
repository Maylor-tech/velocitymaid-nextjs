/**
 * Seed Contact Reply Templates
 * 
 * Initial reply templates for common scenarios
 * Run via: npx prisma db seed (if configured)
 * Or manually via admin UI later
 */

import { prisma } from "@/lib/prisma";

export async function seedContactReplyTemplates() {
  // Check if templates already exist
  const existing = await prisma.contactReplyTemplate.findFirst();
  if (existing) {
    console.log("[SEED] Contact reply templates already exist, skipping seed");
    return;
  }

  await prisma.contactReplyTemplate.createMany({
    data: [
      {
        title: "Investor – Acknowledgment",
        role: "Investor",
        body: `Thank you for reaching out and for your interest in VelocityMaid.

We review investor inquiries thoughtfully to ensure alignment and appropriate context. If there is a fit for next steps, we will follow up directly.

Best regards,
VelocityMaid`,
      },
      {
        title: "Partner – Next Steps",
        role: "Partner / Operator",
        body: `Thank you for reaching out.

We'd be glad to learn more about your operation and discuss whether a pilot makes sense. If helpful, please share a bit more context about your contractor volume and current workflows.

Best regards,
VelocityMaid`,
      },
      {
        title: "General – Polite Decline",
        role: "All",
        body: `Thank you for your message.

At this time, we don't believe there's a fit for next steps, but we appreciate you reaching out and wish you the best.

Regards,
VelocityMaid`,
      },
    ],
  });

  console.log("[SEED] Contact reply templates seeded successfully");
}


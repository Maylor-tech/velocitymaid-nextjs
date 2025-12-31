/**
 * Seed Contact Reply Templates
 * 
 * Run with: npx tsx scripts/seed-templates.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check if templates already exist
  const existing = await prisma.contactReplyTemplate.findFirst();
  if (existing) {
    console.log("Templates already exist, skipping seed");
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

  console.log("✅ Contact reply templates seeded successfully!");
  console.log("   - Investor – Acknowledgment");
  console.log("   - Partner – Next Steps");
  console.log("   - General – Polite Decline");
}

main()
  .catch((error) => {
    console.error("Error seeding templates:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


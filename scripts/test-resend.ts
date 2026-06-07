/**
 * Resend connectivity test — run with:
 * npx dotenv-cli -e .env.local -- npx tsx scripts/test-resend.ts
 */
import { Resend } from "resend";
import {
  DEFAULT_RESEND_FROM,
  getResendFromEmail,
} from "../lib/email/resendClient";

const key = process.env.RESEND_API_KEY;
const to = process.env.RESEND_TEST_TO || "hello@velocitymaid.com";

async function main() {
  if (!key) {
    console.error("FAIL: RESEND_API_KEY is not set");
    process.exit(1);
  }

  console.log(`RESEND_API_KEY: set (${key.slice(0, 8)}…)`);
  console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || "(not set, using default)"}`);
  console.log(`Default from: ${DEFAULT_RESEND_FROM}`);
  console.log(`Resolved from: ${getResendFromEmail()}`);
  console.log(`Test recipient: ${to}`);

  const resend = new Resend(key);

  const domains = await resend.domains.list();
  if (domains.error) {
    console.log("Domain list error:", domains.error);
  } else {
    console.log("Verified domains:");
    for (const d of domains.data?.data ?? []) {
      console.log(`  - ${d.name}: ${d.status}`);
    }
  }

  const from = getResendFromEmail();
  const result = await resend.emails.send({
    from,
    to: [to],
    subject: `VelocityMaid Resend test — ${new Date().toISOString()}`,
    html: "<p>Resend connectivity test. If you received this, the API key and from-address are working.</p>",
    text: "VelocityMaid Resend connectivity test.",
  });

  if (result.error) {
    console.log(`SEND FAIL  from=${from}`);
    console.log(`           ${JSON.stringify(result.error)}`);
    process.exit(1);
  }

  console.log(`SEND OK    from=${from}`);
  console.log(`           id=${result.data?.id}`);
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});

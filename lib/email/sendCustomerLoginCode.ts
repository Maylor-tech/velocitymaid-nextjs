import { Resend } from "resend";
import { brand } from "@/lib/brand/tokens";
import { getResendFromEmail } from "@/lib/email/resendClient";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendCustomerLoginCodeEmail(params: {
  email: string;
  code: string;
  expiresMinutes?: number;
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const { email, code, expiresMinutes = 10 } = params;
  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: [email],
      subject: "Your VelocityMaid sign-in code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #334155;">
          <h2 style="color: ${brand.forest}; margin-bottom: 8px;">Your sign-in code</h2>
          <p style="margin: 0 0 24px;">Enter this code on the VelocityMaid customer portal to continue:</p>
          <div style="background: ${brand.ivory}; border: 2px solid ${brand.forest}; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${brand.forest};">${code}</span>
          </div>
          <p style="font-size: 14px; color: ${brand.slate}; margin: 0;">
            This code expires in ${expiresMinutes} minutes. If you didn't request it, you can ignore this email.
          </p>
        </div>
      `,
      text: `Your VelocityMaid sign-in code is: ${code}\n\nThis code expires in ${expiresMinutes} minutes.`,
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[CUSTOMER_LOGIN_CODE_EMAIL]", message);
    return { sent: false, error: message };
  }
}

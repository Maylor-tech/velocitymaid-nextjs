/**
 * Auto-Reply Email Templates
 * 
 * Role-specific acknowledgment emails sent to contact form submitters.
 * Tone: Calm, professional, no promises, no timelines, no sales pressure.
 */

type AutoReply = {
  subject: string;
  html: (name: string) => string;
};

export const autoReplyTemplates: Record<string, AutoReply> = {
  investor: {
    subject: "Thank you for reaching out to VelocityMaid",
    html: (name) => `
      <p>Hello ${name},</p>

      <p>Thank you for your interest in VelocityMaid.</p>

      <p>
        We review investor inquiries thoughtfully to ensure alignment and
        appropriate context. If there's a fit, we'll follow up directly.
      </p>

      <p>
        Regards,<br/>
        VelocityMaid
      </p>

      <hr/>
      <p style="font-size:12px;color:#666;">
        Infrastructure for trust at scale.
      </p>
    `,
  },

  partner: {
    subject: "Thanks for contacting VelocityMaid",
    html: (name) => `
      <p>Hello ${name},</p>

      <p>
        Thank you for reaching out. We appreciate the opportunity to learn more
        about your operation and where VelocityMaid may be helpful.
      </p>

      <p>
        Messages are reviewed by our team, and we'll follow up if there's a fit
        for next steps.
      </p>

      <p>
        Best regards,<br/>
        VelocityMaid
      </p>

      <hr/>
      <p style="font-size:12px;color:#666;">
        Built to protect people, processes, and progress.
      </p>
    `,
  },

  advisor: {
    subject: "Thank you for your message",
    html: (name) => `
      <p>Hello ${name},</p>

      <p>
        Thank you for reaching out and offering your perspective.
      </p>

      <p>
        We value thoughtful input and will respond if there's alignment with
        current priorities.
      </p>

      <p>
        Sincerely,<br/>
        VelocityMaid
      </p>
    `,
  },

  other: {
    subject: "Message received",
    html: (name) => `
      <p>Hello ${name},</p>

      <p>
        Thank you for your message. We've received it and will review it
        accordingly.
      </p>

      <p>
        Regards,<br/>
        VelocityMaid
      </p>
    `,
  },
};


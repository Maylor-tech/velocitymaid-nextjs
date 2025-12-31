/**
 * Phase 3H.9: Auto-Generated Call Scripts
 * 
 * Reusable call script templates for different blocker scenarios
 * Scripts are calm, compliant, and non-threatening
 * No sensitive data in scripts
 */

import { TaxProfileStatus } from "@prisma/client";

export type CallScriptType =
  | "W9_NOT_STARTED"
  | "W9_SUBMITTED_PENDING"
  | "W9_REJECTED"
  | "ADDRESS_INCOMPLETE"
  | "MULTIPLE_ISSUES"
  | "VOICEMAIL";

export interface CallScript {
  type: CallScriptType;
  title: string;
  script: string;
  followUps?: string[];
}

/**
 * Get call script for W-9 NOT STARTED
 */
function getW9NotStartedScript(cleanerName: string, adminName: string): CallScript {
  const firstName = cleanerName?.split(" ")[0] || "there";
  
  return {
    type: "W9_NOT_STARTED",
    title: "W-9 Not Started",
    script: `Hi ${firstName}, this is ${adminName} calling from VelocityMaid.

I'm reaching out because you've received payouts that require tax reporting, and we're missing your W-9 information.

This doesn't affect any past payments — it's simply required so we can file correctly by January 31.

You can complete it online in just a few minutes at /cleaner/tax-form.

If it helps, I can stay on the line while you get started or answer any questions.

Thank you — we really appreciate your work.`,
    followUps: [
      "If they hesitate: I understand — just to reassure you, we never share this information publicly, and it's only used for tax reporting as required by law.",
    ],
  };
}

/**
 * Get call script for W-9 SUBMITTED, PENDING VERIFICATION
 */
function getW9SubmittedPendingScript(cleanerName: string, adminName: string): CallScript {
  const firstName = cleanerName?.split(" ")[0] || "there";
  
  return {
    type: "W9_SUBMITTED_PENDING",
    title: "W-9 Pending Verification",
    script: `Hi ${firstName}, this is ${adminName} from VelocityMaid.

I'm calling to let you know we received your W-9 — thank you for submitting it.

It's currently under review, which usually takes a short time. If we need anything else, we'll reach out.

There's nothing you need to do right now unless we contact you again.

Thanks again for getting that done.`,
    followUps: [
      "Optional close: We're just making sure everything is set well ahead of January 31.",
    ],
  };
}

/**
 * Get call script for W-9 REJECTED
 */
function getW9RejectedScript(cleanerName: string, adminName: string): CallScript {
  const firstName = cleanerName?.split(" ")[0] || "there";
  
  return {
    type: "W9_REJECTED",
    title: "W-9 Rejected - Needs Correction",
    script: `Hi ${firstName}, this is ${adminName} from VelocityMaid.

I'm calling regarding your W-9 submission — we reviewed it, but a small detail needs correction before we can verify it.

The note is visible in your tax form, and you can fix and resubmit it at /cleaner/tax-form.

Once that's done, we can verify it right away.

If you'd like, I can walk you through the update now.`,
    followUps: [
      'If they ask "What was wrong?": It\'s a minor detail — the system will guide you exactly on what needs adjusting.',
    ],
  };
}

/**
 * Get call script for ADDRESS INCOMPLETE
 */
function getAddressIncompleteScript(cleanerName: string, adminName: string): CallScript {
  const firstName = cleanerName?.split(" ")[0] || "there";
  
  return {
    type: "ADDRESS_INCOMPLETE",
    title: "Address Incomplete",
    script: `Hi ${firstName}, this is ${adminName} from VelocityMaid.

Everything is almost set — we just need to complete your address information for tax records.

You can update it quickly at /cleaner/tax-form. It usually takes less than a minute.

Once that's done, you'll be fully set on our end.

Thanks for taking care of that.`,
  };
}

/**
 * Get call script for MULTIPLE ISSUES (W-9 + Address)
 */
function getMultipleIssuesScript(cleanerName: string, adminName: string): CallScript {
  const firstName = cleanerName?.split(" ")[0] || "there";
  
  return {
    type: "MULTIPLE_ISSUES",
    title: "Multiple Issues - W-9 & Address",
    script: `Hi ${firstName}, this is ${adminName} from VelocityMaid.

I'm calling because we're finalizing our year-end records, and there are two quick items we need to complete:

• Your W-9 submission
• A small address update

Both can be handled together at /cleaner/tax-form.

This doesn't affect past payouts — it just ensures everything is correct by January 31.

If you'd like, I can stay on the call while you complete it.`,
  };
}

/**
 * Get voicemail script
 */
function getVoicemailScript(cleanerName: string, adminName: string): CallScript {
  const firstName = cleanerName?.split(" ")[0] || "there";
  
  return {
    type: "VOICEMAIL",
    title: "Voicemail Script",
    script: `Hi ${firstName}, this is ${adminName} from VelocityMaid.

I'm calling regarding a quick tax form update needed for year-end reporting.

Please visit /cleaner/tax-form when you have a moment, or feel free to return my call if you have questions.

Thank you.`,
  };
}

/**
 * Auto-select call script based on cleaner blockers
 */
export function selectCallScript(data: {
  cleanerName: string | null;
  adminName: string;
  w9Status: TaxProfileStatus | null;
  addressComplete: boolean;
  issues: string[];
}): CallScript {
  const { cleanerName, adminName, w9Status, addressComplete, issues } = data;

  // Determine primary issue
  const hasW9NotStarted = !w9Status || w9Status === TaxProfileStatus.DRAFT;
  const hasW9Submitted = w9Status === TaxProfileStatus.SUBMITTED;
  const hasW9Rejected = w9Status === TaxProfileStatus.REJECTED;
  const hasAddressIssue = !addressComplete;

  // Multiple issues - use combined script
  if ((hasW9NotStarted || hasW9Submitted || hasW9Rejected) && hasAddressIssue) {
    return getMultipleIssuesScript(cleanerName || "there", adminName);
  }

  // Primary issue selection (priority order)
  if (hasW9Rejected) {
    return getW9RejectedScript(cleanerName || "there", adminName);
  }

  if (hasW9NotStarted) {
    return getW9NotStartedScript(cleanerName || "there", adminName);
  }

  if (hasW9Submitted) {
    return getW9SubmittedPendingScript(cleanerName || "there", adminName);
  }

  if (hasAddressIssue) {
    return getAddressIncompleteScript(cleanerName || "there", adminName);
  }

  // Fallback (shouldn't happen if called correctly)
  return getW9NotStartedScript(cleanerName || "there", adminName);
}

/**
 * Get voicemail script for a cleaner
 */
export function getVoicemailScriptForCleaner(
  cleanerName: string | null,
  adminName: string
): CallScript {
  return getVoicemailScript(cleanerName || "there", adminName);
}

/**
 * Get all available scripts (for reference)
 */
export function getAllScripts(cleanerName: string, adminName: string): CallScript[] {
  return [
    getW9NotStartedScript(cleanerName, adminName),
    getW9SubmittedPendingScript(cleanerName, adminName),
    getW9RejectedScript(cleanerName, adminName),
    getAddressIncompleteScript(cleanerName, adminName),
    getMultipleIssuesScript(cleanerName, adminName),
    getVoicemailScript(cleanerName, adminName),
  ];
}



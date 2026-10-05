import { RESIDENTIAL_CONDITION_FLAGS } from "./constants";
import { residentialConditionDisclaimer } from "./validate";
import type { ResidentialIntakePayload } from "./types";
import { escapeHtml, NAVY } from "@/lib/billing/emailBrand";

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function conditionLabels(payload: ResidentialIntakePayload): string {
  if (payload.conditionFlags.length === 0) return "None reported";
  return payload.conditionFlags
    .map((id) => RESIDENTIAL_CONDITION_FLAGS.find((f) => f.id === id)?.label || id)
    .join(", ");
}

export function formatResidentialIntakeText(
  payload: ResidentialIntakePayload
): string {
  const disclaimer = residentialConditionDisclaimer(payload.conditionFlags);
  const lines = [
    "NEW RESIDENTIAL INTAKE (/residential)",
    "=======================",
    `Name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Address: ${payload.serviceAddress}`,
    `City/town: ${payload.city}`,
    `Bedrooms: ${payload.bedrooms}`,
    `Bathrooms: ${payload.bathrooms}`,
    `Square footage: ${payload.squareFootage}`,
    `Service type: ${payload.serviceType}`,
    `Frequency: ${payload.frequency}`,
    `Preferred date: ${payload.preferredServiceDate}`,
    `Preferred contact: ${payload.preferredContactMethod}`,
    `Pets: ${payload.pets || "—"}`,
    `Occupants: ${payload.occupancyApprox || "—"}`,
    `Access/parking: ${payload.accessParking || "—"}`,
    `Products: ${payload.suppliesProvidedBy}`,
    `Trash: ${payload.trashRequirements || "—"}`,
    `Laundry: ${yesNo(payload.laundryRequested)}`,
    `Bed-making / linen reset: ${yesNo(payload.bedMakingRequested)}`,
    `Last professional cleaning: ${payload.lastProfessionalClean || "—"}`,
    `Special instructions: ${payload.specialInstructions || "—"}`,
    `Condition flags: ${conditionLabels(payload)}`,
    `Condition other: ${payload.conditionOther || "—"}`,
  ];
  if (disclaimer) {
    lines.push("", `Assessment note: ${disclaimer}`);
  }
  if (payload.attribution) {
    lines.push(
      "",
      "Attribution:",
      `landing: ${payload.attribution.landing || "—"}`,
      `utm_source: ${payload.attribution.utm_source || "—"}`,
      `utm_medium: ${payload.attribution.utm_medium || "—"}`,
      `utm_campaign: ${payload.attribution.utm_campaign || "—"}`,
      `utm_content: ${payload.attribution.utm_content || "—"}`
    );
  }
  return lines.join("\n");
}

export function formatResidentialIntakeHtml(
  payload: ResidentialIntakePayload
): string {
  const disclaimer = residentialConditionDisclaimer(payload.conditionFlags);
  const row = (label: string, value: string) =>
    `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "—")}</li>`;
  return `
<h2 style="color:${NAVY};">New Residential Intake — /residential</h2>
<ul>
  ${row("Name", payload.fullName)}
  ${row("Email", payload.email)}
  ${row("Phone", payload.phone)}
  ${row("Address", payload.serviceAddress)}
  ${row("City/town", payload.city)}
  ${row("Bedrooms", payload.bedrooms)}
  ${row("Bathrooms", payload.bathrooms)}
  ${row("Square footage", payload.squareFootage)}
  ${row("Service type", payload.serviceType)}
  ${row("Frequency", payload.frequency)}
  ${row("Preferred date", payload.preferredServiceDate)}
  ${row("Preferred contact", payload.preferredContactMethod)}
  ${row("Pets", payload.pets)}
  ${row("Occupants", payload.occupancyApprox)}
  ${row("Access/parking", payload.accessParking)}
  ${row("Products", payload.suppliesProvidedBy)}
  ${row("Trash", payload.trashRequirements)}
  ${row("Laundry", yesNo(payload.laundryRequested))}
  ${row("Bed-making / linen reset", yesNo(payload.bedMakingRequested))}
  ${row("Last professional cleaning", payload.lastProfessionalClean)}
  ${row("Special instructions", payload.specialInstructions)}
  ${row("Condition flags", conditionLabels(payload))}
  ${row("Condition other", payload.conditionOther)}
</ul>
${
  disclaimer
    ? `<p style="margin-top:16px;padding:12px;background:#f4f7fb;border-radius:8px;color:${NAVY};">${escapeHtml(disclaimer)}</p>`
    : ""
}
`.trim();
}

export function residentialLeadFreeText(
  payload: ResidentialIntakePayload
): string {
  const parts = [
    `Residential request: ${payload.serviceType} · ${payload.frequency}`,
    payload.specialInstructions.trim() || null,
    residentialConditionDisclaimer(payload.conditionFlags),
  ];
  return parts.filter(Boolean).join("\n");
}

import type { HostIntakePayload } from "./types";

function formatList(items: string[] | undefined): string {
  if (!items || items.length === 0) return "—";
  return items.join(", ");
}

function displayTimeValue(value: string, other: string): string {
  if (!value) return "—";
  if (value === "Other" && other.trim()) return `Other: ${other.trim()}`;
  return value;
}

function displayAccessType(payload: HostIntakePayload): string {
  if (!payload.accessType) return "—";
  if (payload.accessType === "Other (please describe)" && payload.accessTypeOther.trim()) {
    return `Other: ${payload.accessTypeOther.trim()}`;
  }
  return payload.accessType;
}

export function formatHostIntakeText(payload: HostIntakePayload): string {
  return `
NEW VERMONT HOST INTAKE
=======================

PROPERTY DETAILS
Property address: ${payload.propertyAddress || "—"}
City / Town: ${payload.city || "—"}
Bedrooms: ${payload.bedrooms || "—"}
Bathrooms: ${payload.bathrooms || "—"}
Approximate square footage: ${payload.squareFootage || "—"}
Bed configuration: ${payload.bedConfiguration || "—"}
Property amenities: ${formatList(payload.propertyAmenities)}
Restricted areas: ${payload.restrictedAreas || "—"}
Booking platform(s): ${formatList(payload.bookingPlatforms)}

ACCESS & OPERATIONS
Access type: ${displayAccessType(payload)}
Will send access details before first service: ${payload.willSendAccessDetails ? "Yes" : "No"}
Guest check-out time: ${displayTimeValue(payload.guestCheckoutTime, payload.guestCheckoutTimeOther)}
Guest check-in time: ${displayTimeValue(payload.guestCheckinTime, payload.guestCheckinTimeOther)}
Supply storage location: ${payload.supplyStorageLocation || "—"}
Trash bin location and pickup day: ${payload.trashBinLocation || "—"}

CLEANING NEEDS
Service types: ${formatList(payload.serviceTypes)}
Turnover frequency: ${payload.turnoverFrequency || "—"}
Currently has a cleaner: ${payload.hasCleaner || "—"}

SERVICE PREFERENCES
Who provides linens and towels: ${payload.linenProvider || "—"}
Same-day turnovers needed: ${payload.sameDayTurnovers || "—"}
Booking advance notice: ${payload.bookingAdvanceNotice || "—"}
Property most active: ${formatList(payload.propertyActiveSeasons)}
Preferred payment method: ${payload.preferredPaymentMethod || "—"}
Special instructions: ${payload.specialInstructions || "—"}

CONTACT INFO
Full name: ${payload.fullName || "—"}
Email: ${payload.email || "—"}
Phone: ${payload.phone || "—"}
Preferred contact: ${payload.preferredContact || "—"}
Best time to reach: ${payload.bestTimeToReach || "—"}
  `.trim();
}

export function formatHostIntakeHtml(payload: HostIntakePayload): string {
  const row = (label: string, value: string) =>
    `<li><strong>${label}:</strong> ${value || "—"}</li>`;

  return `
<h2>New Host Intake — ${payload.propertyAddress || "Vermont property"}</h2>

<h3>Property details</h3>
<ul>
  ${row("Property address", payload.propertyAddress)}
  ${row("City / Town", payload.city)}
  ${row("Bedrooms", payload.bedrooms)}
  ${row("Bathrooms", payload.bathrooms)}
  ${row("Approximate square footage", payload.squareFootage)}
  ${row("Bed configuration", payload.bedConfiguration)}
  ${row("Property amenities", formatList(payload.propertyAmenities))}
  ${row("Restricted areas", payload.restrictedAreas)}
  ${row("Booking platform(s)", formatList(payload.bookingPlatforms))}
</ul>

<h3>Access &amp; operations</h3>
<ul>
  ${row("Access type", displayAccessType(payload))}
  ${row("Will send access details before first service", payload.willSendAccessDetails ? "Yes" : "No")}
  ${row("Guest check-out time", displayTimeValue(payload.guestCheckoutTime, payload.guestCheckoutTimeOther))}
  ${row("Guest check-in time", displayTimeValue(payload.guestCheckinTime, payload.guestCheckinTimeOther))}
  ${row("Supply storage location", payload.supplyStorageLocation)}
  ${row("Trash bin location and pickup day", payload.trashBinLocation)}
</ul>

<h3>Cleaning needs</h3>
<ul>
  ${row("Service types", formatList(payload.serviceTypes))}
  ${row("Turnover frequency", payload.turnoverFrequency)}
  ${row("Currently has a cleaner", payload.hasCleaner)}
</ul>

<h3>Service preferences</h3>
<ul>
  ${row("Who provides linens and towels", payload.linenProvider)}
  ${row("Same-day turnovers needed", payload.sameDayTurnovers)}
  ${row("Booking advance notice", payload.bookingAdvanceNotice)}
  ${row("Property most active", formatList(payload.propertyActiveSeasons))}
  ${row("Preferred payment method", payload.preferredPaymentMethod)}
  ${row("Special instructions", payload.specialInstructions)}
</ul>

<h3>Contact info</h3>
<ul>
  ${row("Full name", payload.fullName)}
  ${row("Email", payload.email)}
  ${row("Phone", payload.phone)}
  ${row("Preferred contact", payload.preferredContact)}
  ${row("Best time to reach", payload.bestTimeToReach)}
</ul>
  `.trim();
}

export function parseHostIntakeBody(body: Record<string, unknown>): HostIntakePayload {
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map(String) : [];

  return {
    propertyAddress: String(body.propertyAddress ?? "").trim(),
    city: String(body.city ?? "").trim(),
    bedrooms: String(body.bedrooms ?? "").trim(),
    bathrooms: String(body.bathrooms ?? "").trim(),
    squareFootage: String(body.squareFootage ?? "").trim(),
    bedConfiguration: String(body.bedConfiguration ?? "").trim(),
    propertyAmenities: asStringArray(body.propertyAmenities),
    restrictedAreas: String(body.restrictedAreas ?? "").trim(),
    bookingPlatforms: asStringArray(body.bookingPlatforms),
    accessType: String(body.accessType ?? "").trim(),
    accessTypeOther: String(body.accessTypeOther ?? "").trim(),
    willSendAccessDetails: Boolean(body.willSendAccessDetails),
    guestCheckoutTime: String(body.guestCheckoutTime ?? "").trim(),
    guestCheckoutTimeOther: String(body.guestCheckoutTimeOther ?? "").trim(),
    guestCheckinTime: String(body.guestCheckinTime ?? "").trim(),
    guestCheckinTimeOther: String(body.guestCheckinTimeOther ?? "").trim(),
    supplyStorageLocation: String(body.supplyStorageLocation ?? "").trim(),
    trashBinLocation: String(body.trashBinLocation ?? "").trim(),
    serviceTypes: asStringArray(body.serviceTypes),
    turnoverFrequency: String(body.turnoverFrequency ?? "").trim(),
    hasCleaner: String(body.hasCleaner ?? "").trim(),
    linenProvider: String(body.linenProvider ?? "").trim(),
    sameDayTurnovers: String(body.sameDayTurnovers ?? "").trim(),
    bookingAdvanceNotice: String(body.bookingAdvanceNotice ?? "").trim(),
    propertyActiveSeasons: asStringArray(body.propertyActiveSeasons),
    preferredPaymentMethod: String(body.preferredPaymentMethod ?? "").trim(),
    specialInstructions: String(body.specialInstructions ?? "").trim(),
    fullName: String(body.fullName ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase(),
    phone: String(body.phone ?? "").trim(),
    preferredContact: String(body.preferredContact ?? "").trim(),
    bestTimeToReach: String(body.bestTimeToReach ?? "").trim(),
  };
}

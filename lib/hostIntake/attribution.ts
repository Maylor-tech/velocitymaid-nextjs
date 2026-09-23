/**
 * First-touch attribution for /hosts → setup request → full host intake.
 * Stored in PipelineLead.notes (no Prisma columns for v1).
 */

export const HOST_ATTRIBUTION_STORAGE_KEY = "vm_host_attribution_v1";

export const VM_ATTRIBUTION_START = "[VM_ATTRIBUTION v1]";
export const VM_ATTRIBUTION_END = "[/VM_ATTRIBUTION]";
export const VM_SETUP_REQUEST_START = "[VM_SETUP_REQUEST v1]";
export const VM_SETUP_REQUEST_END = "[/VM_SETUP_REQUEST]";

export type HostAttribution = {
  landing: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  first_touch_at: string;
};

export type HostSetupRequestMeta = {
  town: string;
  interest: string;
  submitted_at: string;
};

const EMPTY_ATTRIBUTION: HostAttribution = {
  landing: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  first_touch_at: "",
};

function cleanParam(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 200);
}

/** Parse attribution from URL search params (first touch wins when merging). */
export function parseAttributionFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  defaults?: Partial<HostAttribution>
): HostAttribution {
  const get = (key: string): string => {
    if (params instanceof URLSearchParams) {
      return cleanParam(params.get(key) ?? "");
    }
    const raw = params[key];
    if (Array.isArray(raw)) return cleanParam(raw[0] ?? "");
    return cleanParam(raw);
  };

  return {
    landing: get("landing") || defaults?.landing || "",
    utm_source: get("utm_source") || defaults?.utm_source || "",
    utm_medium: get("utm_medium") || defaults?.utm_medium || "",
    utm_campaign: get("utm_campaign") || defaults?.utm_campaign || "",
    utm_content: get("utm_content") || defaults?.utm_content || "",
    first_touch_at:
      defaults?.first_touch_at ||
      (get("utm_source") || get("utm_medium") || get("utm_campaign") || get("landing")
        ? new Date().toISOString()
        : ""),
  };
}

/** Keep first-touch values; fill empty slots from `incoming`. */
export function mergeAttributionFirstTouch(
  existing: HostAttribution | null | undefined,
  incoming: HostAttribution | null | undefined
): HostAttribution {
  const a = existing ?? EMPTY_ATTRIBUTION;
  const b = incoming ?? EMPTY_ATTRIBUTION;
  return {
    landing: a.landing || b.landing,
    utm_source: a.utm_source || b.utm_source,
    utm_medium: a.utm_medium || b.utm_medium,
    utm_campaign: a.utm_campaign || b.utm_campaign,
    utm_content: a.utm_content || b.utm_content,
    first_touch_at: a.first_touch_at || b.first_touch_at || new Date().toISOString(),
  };
}

export function hasAttribution(attr: HostAttribution | null | undefined): boolean {
  if (!attr) return false;
  return Boolean(
    attr.landing ||
      attr.utm_source ||
      attr.utm_medium ||
      attr.utm_campaign ||
      attr.utm_content
  );
}

export function formatAttributionBlock(attr: HostAttribution): string {
  return [
    VM_ATTRIBUTION_START,
    `landing=${attr.landing || ""}`,
    `utm_source=${attr.utm_source || ""}`,
    `utm_medium=${attr.utm_medium || ""}`,
    `utm_campaign=${attr.utm_campaign || ""}`,
    `utm_content=${attr.utm_content || ""}`,
    `first_touch_at=${attr.first_touch_at || ""}`,
    VM_ATTRIBUTION_END,
  ].join("\n");
}

export function formatSetupRequestBlock(meta: HostSetupRequestMeta): string {
  return [
    VM_SETUP_REQUEST_START,
    `town=${meta.town || ""}`,
    `interest=${meta.interest || ""}`,
    `submitted_at=${meta.submitted_at || ""}`,
    VM_SETUP_REQUEST_END,
  ].join("\n");
}

function parseKeyedBlock(
  notes: string | null | undefined,
  start: string,
  end: string
): Record<string, string> | null {
  if (!notes) return null;
  const startIdx = notes.indexOf(start);
  const endIdx = notes.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  const body = notes.slice(startIdx + start.length, endIdx).trim();
  const out: Record<string, string> = {};
  for (const line of body.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    out[key] = value;
  }
  return out;
}

export function parseAttributionFromNotes(
  notes: string | null | undefined
): HostAttribution | null {
  const map = parseKeyedBlock(notes, VM_ATTRIBUTION_START, VM_ATTRIBUTION_END);
  if (!map) return null;
  return {
    landing: map.landing || "",
    utm_source: map.utm_source || "",
    utm_medium: map.utm_medium || "",
    utm_campaign: map.utm_campaign || "",
    utm_content: map.utm_content || "",
    first_touch_at: map.first_touch_at || "",
  };
}

export function stripStructuredBlocks(notes: string | null | undefined): string {
  if (!notes) return "";
  let result = notes;
  const strip = (start: string, end: string) => {
    const s = result.indexOf(start);
    const e = result.indexOf(end);
    if (s !== -1 && e !== -1 && e > s) {
      result = `${result.slice(0, s)}${result.slice(e + end.length)}`.trim();
    }
  };
  strip(VM_ATTRIBUTION_START, VM_ATTRIBUTION_END);
  strip(VM_SETUP_REQUEST_START, VM_SETUP_REQUEST_END);
  return result.trim();
}

/**
 * Merge free-text notes with structured attribution / setup-request blocks.
 * First-touch attribution is preserved when already present.
 */
export function mergeLeadNotes(options: {
  existingNotes?: string | null;
  freeText?: string | null;
  attribution?: HostAttribution | null;
  setupRequest?: HostSetupRequestMeta | null;
}): string {
  const existingAttr = parseAttributionFromNotes(options.existingNotes);
  const mergedAttr = mergeAttributionFirstTouch(existingAttr, options.attribution);
  const free =
    options.freeText?.trim() ||
    stripStructuredBlocks(options.existingNotes) ||
    "";

  const parts: string[] = [];
  if (hasAttribution(mergedAttr)) {
    parts.push(formatAttributionBlock(mergedAttr));
  }
  if (options.setupRequest) {
    parts.push(formatSetupRequestBlock(options.setupRequest));
  } else {
    const existingSetup = parseKeyedBlock(
      options.existingNotes,
      VM_SETUP_REQUEST_START,
      VM_SETUP_REQUEST_END
    );
    if (existingSetup) {
      parts.push(
        formatSetupRequestBlock({
          town: existingSetup.town || "",
          interest: existingSetup.interest || "",
          submitted_at: existingSetup.submitted_at || "",
        })
      );
    }
  }
  if (free) parts.push(free);
  return parts.join("\n\n").trim() || "";
}

/** Campaign dimensions only — never include name/email/phone/address. */
export function attributionAnalyticsParams(
  attr: HostAttribution | null | undefined
): Record<string, string> {
  if (!attr || !hasAttribution(attr)) {
    return { market: "vermont" };
  }
  const params: Record<string, string> = { market: "vermont" };
  if (attr.landing) params.landing = attr.landing;
  if (attr.utm_source) params.utm_source = attr.utm_source;
  if (attr.utm_medium) params.utm_medium = attr.utm_medium;
  if (attr.utm_campaign) params.utm_campaign = attr.utm_campaign;
  if (attr.utm_content) params.utm_content = attr.utm_content;
  return params;
}

export function parseAttributionFromUnknown(
  value: unknown
): HostAttribution | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const attr: HostAttribution = {
    landing: cleanParam(o.landing),
    utm_source: cleanParam(o.utm_source),
    utm_medium: cleanParam(o.utm_medium),
    utm_campaign: cleanParam(o.utm_campaign),
    utm_content: cleanParam(o.utm_content),
    first_touch_at: cleanParam(o.first_touch_at) || new Date().toISOString(),
  };
  return hasAttribution(attr) ? attr : null;
}

export function buildHostIntakeDeepLink(options: {
  email?: string;
  fullName?: string;
  phone?: string;
  city?: string;
  attribution?: HostAttribution | null;
}): string {
  const params = new URLSearchParams();
  params.set("from", "hosts");
  if (options.email) params.set("email", options.email);
  if (options.fullName) params.set("name", options.fullName);
  if (options.phone) params.set("phone", options.phone);
  if (options.city) params.set("city", options.city);
  const attr = options.attribution;
  if (attr) {
    if (attr.landing) params.set("landing", attr.landing);
    if (attr.utm_source) params.set("utm_source", attr.utm_source);
    if (attr.utm_medium) params.set("utm_medium", attr.utm_medium);
    if (attr.utm_campaign) params.set("utm_campaign", attr.utm_campaign);
    if (attr.utm_content) params.set("utm_content", attr.utm_content);
  }
  return `/vermont/host-intake?${params.toString()}`;
}

export function readStoredAttribution(): HostAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HOST_ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    return parseAttributionFromUnknown(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredAttribution(attr: HostAttribution): void {
  if (typeof window === "undefined") return;
  if (!hasAttribution(attr)) return;
  try {
    const existing = readStoredAttribution();
    const merged = mergeAttributionFirstTouch(existing, attr);
    sessionStorage.setItem(HOST_ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // sessionStorage may be unavailable
  }
}

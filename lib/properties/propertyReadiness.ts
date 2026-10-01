/**
 * Host-facing property readiness.
 *
 * Mirrors the cleaner "incomplete brief" signal (see `isJobPacketIncomplete` in
 * components/cleaner/JobPacketCard.tsx): a cleaner needs an access method and
 * standing instructions to work a property well. We surface the same gap to the
 * host *before* they add a cleaning, so the field team never inherits a thin
 * brief.
 *
 * Host-controllable fields only: `accessNotes` (door codes) are set ops-side and
 * are not visible/editable in the host portal, so host readiness keys off
 * `accessType` — the thing a host can actually fill in.
 *
 * Pure functions — safe on client and server.
 */

export interface HostReadinessInput {
  accessType?: string | null;
  standingInstructions?: string | null;
  linenInstructions?: string | null;
  supplyStorageLocation?: string | null;
  trashInstructions?: string | null;
}

export interface ReadinessItem {
  key: 'access' | 'standingInstructions' | 'linens' | 'trash';
  label: string;
  /** What the host should add — shown as guidance. */
  hint: string;
  done: boolean;
  /** Required items gate the "brief complete" state; recommended ones don't. */
  required: boolean;
}

export interface PropertyReadiness {
  /** True when every required item is filled in. */
  ready: boolean;
  items: ReadinessItem[];
  missingRequired: ReadinessItem[];
  missingRecommended: ReadinessItem[];
  requiredTotal: number;
  requiredDone: number;
}

function filled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Evaluate how complete a property's standing brief is from the host's side.
 * Required: access method + standing instructions (matches the cleaner brief).
 * Recommended: linens/supplies + trash handling.
 */
export function evaluateHostPropertyReadiness(
  input: HostReadinessInput
): PropertyReadiness {
  const items: ReadinessItem[] = [
    {
      key: 'access',
      label: 'Access method',
      hint: 'How the cleaner gets in (lockbox, smart lock, keypad, on-site).',
      done: filled(input.accessType),
      required: true,
    },
    {
      key: 'standingInstructions',
      label: 'Standing instructions',
      hint: 'How you want the property cleaned and reset every visit.',
      done: filled(input.standingInstructions),
      required: true,
    },
    {
      key: 'linens',
      label: 'Linens & supplies',
      hint: 'Where linens and cleaning supplies are kept and how to handle them.',
      done: filled(input.linenInstructions) || filled(input.supplyStorageLocation),
      required: false,
    },
    {
      key: 'trash',
      label: 'Trash handling',
      hint: 'Where trash and recycling go, plus pickup days.',
      done: filled(input.trashInstructions),
      required: false,
    },
  ];

  const required = items.filter((item) => item.required);
  const requiredDone = required.filter((item) => item.done).length;

  return {
    ready: requiredDone === required.length,
    items,
    missingRequired: items.filter((item) => item.required && !item.done),
    missingRecommended: items.filter((item) => !item.required && !item.done),
    requiredTotal: required.length,
    requiredDone,
  };
}

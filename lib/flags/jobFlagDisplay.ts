import { formatDeskSentAt } from '@/lib/admin/jobsMonthlyWorkspace';
import {
  CUSTOMER_FLAG_NOTICE,
  FLAG_KIND_LABEL,
  hostChannelLabel,
  type HostNotifyChannelValue,
  type JobFlagKindValue,
} from '@/lib/flags/jobFlagRules';

export type DeskJobFlag = {
  id: string;
  jobId: string;
  propertyName: string;
  kind: JobFlagKindValue;
  note: string;
  photoUrl: string | null;
  createdAt: string;
  hostNotifiedAt: string | null;
  hostNotifiedChannel: HostNotifyChannelValue | null;
  resolvedAt: string | null;
};

export function orderOpenFlags<T extends { createdAt: string; resolvedAt: string | null; id: string }>(
  flags: T[]
): T[] {
  return flags
    .filter((flag) => !flag.resolvedAt)
    .sort((a, b) => {
      if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
      return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
    });
}

/** Null hostNotifiedAt stays "Host not told yet". A time is shown only when it parses. */
export function describeHostNotice(flag: {
  hostNotifiedAt: string | null;
  hostNotifiedChannel: string | null;
}): string {
  const clock = formatDeskSentAt(flag.hostNotifiedAt);
  if (!clock) return 'Host not told yet';
  const channel = hostChannelLabel(flag.hostNotifiedChannel);
  return channel ? `Host told ${clock} by ${channel}` : `Host told ${clock}`;
}

/** The cleaner's note. A blank legacy flag keeps the approved fallback line. */
export function flagMainLine(note: string | null | undefined): string {
  const trimmed = note?.trim();
  return trimmed ? trimmed : CUSTOMER_FLAG_NOTICE;
}

export function flagKindLabel(kind: string): string {
  if (kind in FLAG_KIND_LABEL) return FLAG_KIND_LABEL[kind as JobFlagKindValue];
  return kind;
}

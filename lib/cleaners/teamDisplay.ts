/**
 * Guest-facing and admin display helpers for assigned service teams.
 */

export interface TeamMemberDisplay {
  id: string;
  name: string | null;
  publicDisplayName?: string | null;
  jobTitle?: string | null;
  certificationLabel?: string | null;
  isCertified?: boolean;
}

export function memberDisplayName(m: TeamMemberDisplay): string {
  return (m.publicDisplayName || m.name || 'Team member').trim();
}

export function formatTeamNames(members: TeamMemberDisplay[]): string {
  const names = members.map(memberDisplayName).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/** Premium guest-facing line for job details and emails. */
export function guestServiceTeamLine(members: TeamMemberDisplay[]): string {
  const names = formatTeamNames(members);
  if (!names) {
    return 'Your service will be completed by the VelocityMaid Certified Service Team.';
  }
  return `Service Team: ${names}`;
}

export function guestCompletionMessage(members: TeamMemberDisplay[]): string {
  const names = formatTeamNames(members);
  if (!names) {
    return 'Your service was completed by the VelocityMaid Certified Service Team.';
  }
  return `Your service was completed by the VelocityMaid Certified Service Team — ${names}.`;
}

export function isCertifiedMember(m: TeamMemberDisplay): boolean {
  if (m.isCertified) return true;
  const label = (m.certificationLabel || '').toLowerCase();
  return label.includes('certified') || label.includes('internal');
}

export function teamSubtitle(members: TeamMemberDisplay[]): string | null {
  const internal = members.some((m) =>
    (m.certificationLabel || '').toLowerCase().includes('internal')
  );
  if (internal && members.length >= 2) {
    return 'VelocityMaid Founder-Led Service Team';
  }
  if (members.length > 1) {
    return 'VelocityMaid Certified Service Team';
  }
  return null;
}

export function mergePrimaryWithTeam(
  primary: TeamMemberDisplay | null,
  team: TeamMemberDisplay[]
): TeamMemberDisplay[] {
  const merged: TeamMemberDisplay[] = [];
  const seen = new Set<string>();

  if (primary?.id) {
    merged.push(primary);
    seen.add(primary.id);
  }

  for (const m of team) {
    if (!seen.has(m.id)) {
      merged.push(m);
      seen.add(m.id);
    }
  }

  return merged;
}

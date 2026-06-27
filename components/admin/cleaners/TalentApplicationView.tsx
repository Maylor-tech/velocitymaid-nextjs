import type { TalentApplicationPayload } from '@/lib/cleaners/talentApplicationTypes';
import { SKILL_RATING_LABELS, SKILL_RATING_KEYS } from '@/lib/cleaners/talentApplicationTypes';

export function TalentApplicationView({ data }: { data: TalentApplicationPayload }) {
  return (
    <div className="space-y-6">
      <DetailBlock title="Personal">
        <Row label="Name" value={`${data.personal.firstName} ${data.personal.lastName}`} />
        {data.personal.preferredName && (
          <Row label="Preferred name" value={data.personal.preferredName} />
        )}
        <Row label="Address" value={`${data.personal.streetAddress}, ${data.personal.city}, ${data.personal.state} ${data.personal.zipCode}`} />
      </DetailBlock>

      <DetailBlock title="Eligibility">
        <Row label="Authorized to work (US)" value={yn(data.eligibility.authorizedToWork)} />
        <Row label="Reliable transportation" value={yn(data.eligibility.reliableTransportation)} />
        <Row label="Owns vehicle" value={yn(data.eligibility.ownsVehicle)} />
        <Row label="Auto insurance" value={yn(data.eligibility.hasAutoInsurance)} />
        <Row label="Driver's license" value={yn(data.eligibility.hasDriversLicense)} />
      </DetailBlock>

      <DetailBlock title="Availability">
        <Row label="Days" value={data.availability.daysAvailable.join(', ') || '—'} />
        <Row label="Preferred time" value={data.availability.preferredTime || '—'} />
        <Row label="Max hours/week" value={data.availability.maxHoursPerWeek} />
        <Row label="Weekend turnovers" value={yn(data.availability.weekendTurnovers)} />
      </DetailBlock>

      <DetailBlock title="Service areas">
        <Row label="Areas" value={data.serviceAreas.areas.join(', ')} />
        {data.serviceAreas.otherArea && (
          <Row label="Other" value={data.serviceAreas.otherArea} />
        )}
        <Row label="Max travel" value={data.serviceAreas.maxTravelDistance} />
      </DetailBlock>

      <DetailBlock title="Experience">
        <Row label="Professional cleaner" value={yn(data.experience.workedProfessionally)} />
        <Row label="Years" value={data.experience.yearsExperience} />
        <Row label="Types" value={data.experience.experienceTypes.join(', ') || '—'} />
      </DetailBlock>

      <DetailBlock title="Skills (1–5)">
        {SKILL_RATING_KEYS.map((key) => (
          <Row key={key} label={SKILL_RATING_LABELS[key]} value={String(data.skills[key])} />
        ))}
      </DetailBlock>

      <DetailBlock title="Equipment">
        <Row label="Has access to" value={data.equipment.join(', ') || '—'} />
      </DetailBlock>

      <DetailBlock title="Hospitality mindset">
        {Object.entries(data.hospitality).map(([key, value]) => (
          <div key={key} className="border-b border-vm-border py-3 last:border-0">
            <p className="text-sm font-medium capitalize text-vm-navy">{humanize(key)}</p>
            <p className="mt-1 whitespace-pre-wrap font-body text-sm text-vm-text">{value}</p>
          </div>
        ))}
      </DetailBlock>

      <DetailBlock title="References">
        {data.references.map((ref, i) =>
          ref.name ? (
            <div key={i} className="border-b border-vm-border py-2 last:border-0">
              <p className="font-body text-sm text-vm-text">
                <strong>{ref.name}</strong> — {ref.relationship}
              </p>
              <p className="font-body text-sm text-vm-muted">{ref.phone}</p>
            </div>
          ) : null
        )}
      </DetailBlock>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-vm-border bg-vm-white p-6">
      <h3 className="mb-4 font-heading text-lg font-semibold text-vm-navy">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="min-w-[160px] font-body text-sm text-vm-muted">{label}</span>
      <span className="font-body text-sm text-vm-text">{value}</span>
    </div>
  );
}

function yn(v: boolean) {
  return v ? 'Yes' : 'No';
}

function humanize(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

export function parseTalentApplicationData(raw: unknown): TalentApplicationPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as TalentApplicationPayload;
  if (d.portalVersion !== 'talent-v1') return null;
  return d;
}

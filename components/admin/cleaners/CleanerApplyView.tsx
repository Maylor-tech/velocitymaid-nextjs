import {
  isCleanerApplyPayload,
  type CleanerApplyPayload,
} from '@/lib/cleaners/cleanerApplyTypes';

export function parseCleanerApplyData(raw: unknown): CleanerApplyPayload | null {
  return isCleanerApplyPayload(raw) ? raw : null;
}

export function CleanerApplyView({ data }: { data: CleanerApplyPayload }) {
  return (
    <div className="space-y-6">
      <DetailBlock title="Personal">
        <Row label="Name" value={data.personal.fullName} />
        <Row label="Email" value={data.personal.email} />
        <Row label="Phone" value={data.personal.phone} />
        <Row label="City" value={data.personal.city} />
        <Row label="State" value={data.personal.state} />
        <Row label="Neighborhood" value={data.personal.neighborhood} />
      </DetailBlock>

      <DetailBlock title="Eligibility">
        <Row label="18 or older" value={data.eligibility.age18OrOlder} />
        <Row label="Authorized to work (US)" value={data.eligibility.authorizedToWork} />
        <Row label="Driver's license" value={data.eligibility.hasDriversLicense} />
        <Row label="Reliable transportation" value={data.eligibility.reliableTransportation} />
        {data.eligibility.comfortableDriving30to60Miles && (
          <Row
            label="Comfortable driving 30–60 mi"
            value={data.eligibility.comfortableDriving30to60Miles}
          />
        )}
        <Row label="Background check consent" value={yn(data.eligibility.backgroundCheckConsent)} />
      </DetailBlock>

      <DetailBlock title="Availability">
        <Row label="Days" value={data.availability.daysAvailable.join(', ') || '—'} />
        <Row label="Hours/week" value={data.availability.hoursPerWeek} />
        <Row label="Same-day bookings" value={data.availability.sameDayBookings} />
        {data.availability.skiSeasonAvailable && (
          <Row label="Ski season" value={data.availability.skiSeasonAvailable} />
        )}
        <Row label="Other employment" value={data.availability.otherEmployment} />
      </DetailBlock>

      <DetailBlock title="Experience">
        <Row label="Cleaning experience" value={data.experience.hasCleaningExperience} />
        <Row label="Years" value={data.experience.yearsExperience} />
        <Row label="Property types" value={data.experience.propertyTypes.join(', ') || '—'} />
        <Row label="Vacation rental turnovers" value={data.experience.vacationRentalTurnovers} />
        <Row label="On-site laundry" value={data.experience.comfortableWithLaundry} />
        {data.experience.hotTubComfort && (
          <Row label="Hot tub comfort" value={data.experience.hotTubComfort} />
        )}
        <Row label="Cleaning supplies" value={data.experience.cleaningSupplies} />
      </DetailBlock>

      <DetailBlock title="Professional fit">
        <Row label="Independent cleaner" value={data.professionalFit.independentCleaner} />
        <Row label="Why VelocityMaid" value={data.professionalFit.whyVelocityMaid} />
        <Row label="How heard" value={data.professionalFit.howHeardAboutUs} />
        {data.professionalFit.anythingElse && (
          <Row label="Anything else" value={data.professionalFit.anythingElse} />
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
      <span className="font-body text-sm text-vm-text whitespace-pre-wrap">{value}</span>
    </div>
  );
}

function yn(v: boolean) {
  return v ? 'Yes' : 'No';
}

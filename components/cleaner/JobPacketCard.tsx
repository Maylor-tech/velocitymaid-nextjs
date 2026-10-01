import type { ReactNode } from 'react';
import { formatServiceDate } from '@/lib/dates/serviceDate';

export type JobPacketProperty = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bedConfiguration: string | null;
  amenities: string[];
  restrictedAreas: string | null;
  supplyStorageLocation: string | null;
  trashInstructions: string | null;
  linenInstructions: string | null;
  standingInstructions: string | null;
  accessType: string | null;
  accessNotes: string | null;
  standardCheckoutTime: string | null;
  standardCheckinTime: string | null;
};

export type JobPacketProps = {
  preferredDate: string | null;
  preferredTime: string | null;
  guestCheckInDate: string | null;
  guestCheckOutDate: string | null;
  property: JobPacketProperty | null;
  jobSpecificNotes: string | null;
  compensationLabel: string;
  estimatedDurationMins: number | null;
};

/** True when property link is missing or critical field brief is incomplete. */
export function isJobPacketIncomplete(property: JobPacketProperty | null): boolean {
  if (!property) return true;
  const hasAccess = Boolean(property.accessType?.trim() || property.accessNotes?.trim());
  const hasStanding = Boolean(property.standingInstructions?.trim());
  return !hasAccess || !hasStanding;
}

function dateLabel(iso: string | null): string {
  if (!iso) return 'Not set';
  return (
    formatServiceDate(iso, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) || 'Not set'
  );
}

function PacketSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-vm-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Assigned-cleaner field packet: schedule, property, access, supplies, instructions.
 * Always rendered when assigned — shows incomplete-brief callouts when data is missing.
 */
export function JobPacketCard({
  preferredDate,
  preferredTime,
  guestCheckInDate,
  guestCheckOutDate,
  property,
  jobSpecificNotes,
  compensationLabel,
  estimatedDurationMins,
}: JobPacketProps) {
  const incomplete = isJobPacketIncomplete(property);
  const hasAccess = Boolean(
    property?.accessType?.trim() || property?.accessNotes?.trim()
  );
  const hasLinens = Boolean(
    property?.linenInstructions ||
      property?.supplyStorageLocation ||
      property?.trashInstructions
  );

  return (
    <div className="mb-6 rounded-lg border-l-4 border-vm-navy bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-vm-navy">Job packet</h2>
        <div className="text-right text-sm text-vm-muted">
          <p>
            <span className="font-medium text-vm-text">Your pay:</span>{' '}
            {compensationLabel}
          </p>
          {estimatedDurationMins != null && (
            <p className="mt-0.5">Est. {estimatedDurationMins} min</p>
          )}
        </div>
      </div>

      {incomplete && (
        <div className="mb-5 rounded-lg border border-vm-navy/15 bg-vm-navy/5 px-4 py-3 font-body text-sm text-vm-navy">
          Property brief incomplete — contact VelocityMaid ops before starting if
          access or standing instructions are unclear.
        </div>
      )}

      <div className="space-y-6">
        <PacketSection title="Schedule">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-vm-muted">Cleaning / service date</dt>
              <dd className="font-medium text-vm-text">
                {dateLabel(preferredDate)}
                {preferredTime ? ` · ${preferredTime}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-vm-muted">Guest check-in</dt>
              <dd className="font-medium text-vm-text">
                {dateLabel(guestCheckInDate)}
              </dd>
            </div>
            <div>
              <dt className="text-vm-muted">Guest checkout</dt>
              <dd className="font-medium text-vm-text">
                {dateLabel(guestCheckOutDate)}
              </dd>
            </div>
          </dl>
        </PacketSection>

        <PacketSection title="Property overview">
          {!property ? (
            <p className="text-sm text-vm-muted">
              No property profile linked to this job. Confirm address and access
              with ops.
            </p>
          ) : (
            <>
              <p className="font-medium text-vm-text">{property.name}</p>
              <p className="mt-1 text-sm text-vm-muted">
                {property.address}
                {property.city ? `, ${property.city}` : ''}
                {property.state ? `, ${property.state}` : ''}
              </p>
              {(property.bedrooms != null ||
                property.bathrooms != null ||
                property.bedConfiguration) && (
                <p className="mt-2 text-sm text-vm-muted">
                  {property.bedrooms != null ? `${property.bedrooms} bed` : null}
                  {property.bedrooms != null && property.bathrooms != null
                    ? ' · '
                    : null}
                  {property.bathrooms != null
                    ? `${property.bathrooms} bath`
                    : null}
                  {property.bedConfiguration
                    ? ` · ${property.bedConfiguration}`
                    : null}
                </p>
              )}
              {property.amenities?.length > 0 && (
                <p className="mt-2 text-sm text-vm-muted">
                  Amenities: {property.amenities.join(', ')}
                </p>
              )}
              {property.restrictedAreas && (
                <p className="mt-2 text-sm text-amber-800">
                  Restricted: {property.restrictedAreas}
                </p>
              )}
            </>
          )}
        </PacketSection>

        <PacketSection title="Access">
          {!property || !hasAccess ? (
            <p className="text-sm text-vm-muted">
              Access details not on file — confirm with VelocityMaid ops before
              arrival.
            </p>
          ) : (
            <>
              {property.accessType && (
                <p className="text-vm-text">{property.accessType}</p>
              )}
              {property.accessNotes && (
                <p className="mt-1 whitespace-pre-wrap text-vm-text">
                  {property.accessNotes}
                </p>
              )}
              {(property.standardCheckoutTime ||
                property.standardCheckinTime) && (
                <p className="mt-2 text-sm text-vm-muted">
                  {property.standardCheckoutTime
                    ? `Usual guest checkout: ${property.standardCheckoutTime}`
                    : null}
                  {property.standardCheckoutTime &&
                  property.standardCheckinTime
                    ? ' · '
                    : null}
                  {property.standardCheckinTime
                    ? `Usual guest check-in: ${property.standardCheckinTime}`
                    : null}
                </p>
              )}
            </>
          )}
        </PacketSection>

        <PacketSection title="Linens & supplies">
          {!property || !hasLinens ? (
            <p className="text-sm text-vm-muted">
              No linen, supply, or trash notes on file for this property.
            </p>
          ) : (
            <>
              {property.linenInstructions && (
                <p className="text-vm-text">
                  Linens: {property.linenInstructions}
                </p>
              )}
              {property.supplyStorageLocation && (
                <p className="mt-1 text-vm-text">
                  Supplies: {property.supplyStorageLocation}
                </p>
              )}
              {property.trashInstructions && (
                <p className="mt-1 text-vm-text">
                  Trash: {property.trashInstructions}
                </p>
              )}
            </>
          )}
        </PacketSection>

        <PacketSection title="Standing instructions">
          {property?.standingInstructions?.trim() ? (
            <p className="whitespace-pre-wrap text-vm-text">
              {property.standingInstructions}
            </p>
          ) : (
            <p className="text-sm text-vm-muted">
              No standing cleaning instructions on file.
            </p>
          )}
        </PacketSection>

        <PacketSection title="This clean only">
          {jobSpecificNotes?.trim() ? (
            <p className="whitespace-pre-wrap text-vm-text">{jobSpecificNotes}</p>
          ) : (
            <p className="text-sm text-vm-muted">No job-specific notes.</p>
          )}
        </PacketSection>
      </div>
    </div>
  );
}

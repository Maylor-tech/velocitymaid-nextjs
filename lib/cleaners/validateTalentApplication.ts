import type { TalentApplicationPayload } from './talentApplicationTypes';

export function validateTalentApplication(
  data: TalentApplicationPayload
): string | null {
  const { personal, eligibility, availability, serviceAreas, experience, hospitality, references, consents } =
    data;

  if (!personal.firstName.trim()) return 'First name is required.';
  if (!personal.lastName.trim()) return 'Last name is required.';
  if (!personal.phone.trim()) return 'Phone number is required.';
  if (!personal.email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (!personal.streetAddress.trim()) return 'Street address is required.';
  if (!personal.city.trim()) return 'City is required.';
  if (!personal.state.trim()) return 'State is required.';
  if (!personal.zipCode.trim()) return 'ZIP code is required.';

  if (!eligibility.authorizedToWork) {
    return 'You must confirm you are legally authorized to work in the United States.';
  }
  if (!eligibility.reliableTransportation) {
    return 'Reliable transportation is required for this role.';
  }

  if (availability.daysAvailable.length === 0) {
    return 'Please select at least one day you are available.';
  }
  if (!availability.preferredTime) {
    return 'Please select a preferred time of day.';
  }
  if (!availability.maxHoursPerWeek.trim()) {
    return 'Maximum hours per week is required.';
  }

  if (serviceAreas.areas.length === 0) {
    return 'Please select at least one service area.';
  }
  if (serviceAreas.areas.includes('Other') && !serviceAreas.otherArea.trim()) {
    return 'Please describe your other service area.';
  }
  if (!serviceAreas.maxTravelDistance.trim()) {
    return 'Maximum travel distance is required.';
  }

  if (!experience.yearsExperience.trim()) {
    return 'Years of cleaning experience is required.';
  }

  const hospitalityFields = [
    hospitality.meaningOfClean,
    hospitality.exceededExpectations,
    hospitality.foundWeddingRing,
    hospitality.noticedDamage,
    hospitality.finishedEarly,
    hospitality.meaningOfExcellence,
  ];
  if (hospitalityFields.some((v) => !v.trim())) {
    return 'Please complete all hospitality mindset questions.';
  }

  const filledReferences = references.filter(
    (r) => r.name.trim() && r.phone.trim() && r.relationship.trim()
  );
  if (filledReferences.length < 1) {
    return 'Please provide at least one complete reference.';
  }

  if (!consents.backgroundCheck) {
    return 'Background check consent is required.';
  }
  if (!consents.certificationTraining) {
    return 'Please confirm you understand the certification training requirement.';
  }
  if (!consents.informationAccurate) {
    return 'Please confirm your information is accurate.';
  }

  return null;
}

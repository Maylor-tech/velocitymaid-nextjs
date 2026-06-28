import type { CleanerApplyPayload } from './cleanerApplyTypes';

export const INELIGIBLE_APPLICATION_MESSAGE =
  'Thank you for your interest. Unfortunately we are unable to proceed with your application at this time.';

export function isCleanerApplyIneligible(data: CleanerApplyPayload): boolean {
  return (
    data.eligibility.age18OrOlder === 'No' ||
    data.eligibility.authorizedToWork === 'No'
  );
}

export function validateCleanerApply(
  data: CleanerApplyPayload,
  options: { isVermontBranch: boolean }
): string | null {
  const { personal, eligibility, availability, experience, professionalFit, agreements } =
    data;

  if (!personal.fullName.trim()) return 'Full name is required.';
  if (!personal.email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (!personal.phone.trim()) return 'Phone number is required.';
  if (!personal.city.trim()) return 'City / town is required.';
  if (!personal.state) return 'State is required.';
  if (!personal.branchId) return 'Preferred branch is required.';
  if (!personal.neighborhood.trim()) {
    return 'Neighborhood or nearest town is required.';
  }

  if (!eligibility.age18OrOlder) return 'Please confirm whether you are 18 or older.';
  if (!eligibility.authorizedToWork) {
    return 'Please confirm your work authorization status.';
  }
  if (isCleanerApplyIneligible(data)) return INELIGIBLE_APPLICATION_MESSAGE;
  if (!eligibility.hasDriversLicense) {
    return "Please confirm whether you have a valid driver's license.";
  }
  if (!eligibility.reliableTransportation) {
    return 'Please confirm whether you have reliable personal transportation.';
  }
  if (options.isVermontBranch && !eligibility.comfortableDriving30to60Miles) {
    return 'Please confirm your comfort driving 30–60 miles for a job.';
  }
  if (!eligibility.backgroundCheckConsent) {
    return 'Background check consent is required.';
  }

  if (availability.daysAvailable.length === 0) {
    return 'Please select at least one day you are available.';
  }
  if (!availability.hoursPerWeek) return 'Hours available per week is required.';
  if (!availability.sameDayBookings) {
    return 'Please indicate your same-day booking availability.';
  }
  if (options.isVermontBranch && !availability.skiSeasonAvailable) {
    return 'Please indicate your ski season availability.';
  }
  if (!availability.otherEmployment) {
    return 'Please indicate whether you currently have other employment.';
  }

  if (!experience.hasCleaningExperience) {
    return 'Please indicate whether you have previous cleaning experience.';
  }
  if (!experience.yearsExperience) return 'Years of cleaning experience is required.';
  if (experience.propertyTypes.length === 0) {
    return 'Please select at least one property type.';
  }
  if (!experience.vacationRentalTurnovers) {
    return 'Please indicate whether you have done vacation rental turnovers.';
  }
  if (!experience.comfortableWithLaundry) {
    return 'Please indicate your comfort with on-site laundry.';
  }
  if (!experience.cleaningSupplies) {
    return 'Please indicate whether you have your own cleaning supplies.';
  }

  if (!professionalFit.independentCleaner) {
    return 'Please indicate whether you are currently working as an independent cleaner.';
  }
  if (!professionalFit.whyVelocityMaid.trim()) {
    return 'Please tell us why you want to work with VelocityMaid.';
  }
  if (professionalFit.whyVelocityMaid.trim().length > 300) {
    return 'Why VelocityMaid must be 300 characters or fewer.';
  }
  if (!professionalFit.howHeardAboutUs) return 'Please tell us how you heard about us.';
  if (professionalFit.anythingElse.trim().length > 300) {
    return 'Additional notes must be 300 characters or fewer.';
  }

  if (!agreements.independentContractor) {
    return 'Please confirm you understand this is an independent contractor position.';
  }
  if (!agreements.professionalConduct) {
    return 'Please confirm you understand VelocityMaid professional conduct requirements.';
  }
  if (!agreements.hospitalityStandard) {
    return 'Please confirm you agree to VelocityMaid hospitality standards.';
  }

  return null;
}

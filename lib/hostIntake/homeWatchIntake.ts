export const HOME_WATCH_SERVICE_PARAM = "home-watch";

export const HOME_WATCH_INSPECTION_SERVICE = "Property inspection & photo report";

export const HOME_WATCH_NOTES_PREFILL = "Home Watch request";

export const HOME_WATCH_INTAKE_BANNER =
  "Home Watch request: answer what applies; linen and turnover questions can be answered 'Host provides' / 'No — always overnight gap'.";

export function isHomeWatchIntake(service: string | null): boolean {
  return service === HOME_WATCH_SERVICE_PARAM;
}

export function homeWatchIntakeHref(intakePath: string): string {
  return `${intakePath}?service=${HOME_WATCH_SERVICE_PARAM}`;
}

type HomeWatchFields = {
  serviceTypes: string[];
  specialInstructions: string;
};

/**
 * Defaults for `?service=home-watch` only. Returns the same object when the
 * parameter is absent so a normal intake stays empty.
 * Notes already typed by the visitor are left as they are. The inspection
 * service is added once; the form applies this a single time so a later
 * untick stays unticked.
 */
export function mergeHomeWatchDefaults<T extends HomeWatchFields>(
  form: T,
  service: string | null
): T {
  if (!isHomeWatchIntake(service)) return form;

  const serviceTypes = form.serviceTypes.includes(HOME_WATCH_INSPECTION_SERVICE)
    ? form.serviceTypes
    : [...form.serviceTypes, HOME_WATCH_INSPECTION_SERVICE];
  const specialInstructions = form.specialInstructions.trim()
    ? form.specialInstructions
    : HOME_WATCH_NOTES_PREFILL;

  if (
    serviceTypes === form.serviceTypes &&
    specialInstructions === form.specialInstructions
  ) {
    return form;
  }

  return { ...form, serviceTypes, specialInstructions };
}

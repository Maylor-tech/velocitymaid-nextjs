/**
 * Miami pilot territory helpers.
 *
 * No implementation is present in this tree. Signatures match the
 * assignment SLA and territory route callers.
 */

export type ServiceHours = {
  start: string;
  end: string;
};

export type TerritoryValidation = {
  valid: boolean;
  error?: string;
  zipCode?: string;
  serviceHours?: ServiceHours;
};

export async function getServiceHours(_branchId: string): Promise<ServiceHours> {
  throw new Error("not implemented");
}

export async function getAllowedZipCodes(_branchId: string): Promise<string[]> {
  throw new Error("not implemented");
}

export async function validateTerritory(
  _branchId: string,
  _zipCode: string,
  _preferredTime?: string
): Promise<TerritoryValidation> {
  throw new Error("not implemented");
}

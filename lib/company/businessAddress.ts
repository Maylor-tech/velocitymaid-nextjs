/** VelocityMaid legal / Vermont operations business address — single source of truth. */
export const BUSINESS_ADDRESS = {
  street: "9 North Depot Street",
  city: "Ludlow",
  state: "VT",
  stateFull: "Vermont",
  zip: "05149",
  country: "USA",
  full: "9 North Depot Street, Ludlow, VT 05149, USA",
} as const;

/** Legal contact blocks: "Ludlow, VT 05149, USA" */
export const BUSINESS_ADDRESS_LOCALITY = `${BUSINESS_ADDRESS.city}, ${BUSINESS_ADDRESS.state} ${BUSINESS_ADDRESS.zip}, ${BUSINESS_ADDRESS.country}`;

/** Vermont landing footers: first segment before city/state line wrap. */
export const VERMONT_OPERATIONS_SUPPORT_LINE1 = `VelocityMaid — Vermont Operations Support · ${BUSINESS_ADDRESS.street},`;

/** Vermont landing footers: second segment (city, state, zip). */
export const VERMONT_OPERATIONS_SUPPORT_LINE2 = BUSINESS_ADDRESS_LOCALITY;

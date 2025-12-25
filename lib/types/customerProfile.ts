export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notifyEmail: boolean;
  notifySMS: boolean;
}















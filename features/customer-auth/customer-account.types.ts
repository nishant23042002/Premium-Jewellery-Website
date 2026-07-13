export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerAccount {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  addresses: Address[];
  isActive: boolean;
  createdAt: string;
}

/** Decoded JWT payload carried in the customer session cookie — deliberately a distinct shape from admin's `SessionPayload` so the two tokens can never be confused/swapped. */
export interface CustomerSessionPayload {
  sub: string; // CustomerAccount id
  tenantId: string;
  email: string;
  kind: "customer";
}

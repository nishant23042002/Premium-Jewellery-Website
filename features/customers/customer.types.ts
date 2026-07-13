/** A person derived from reservation/enquiry contact details — there are no customer accounts in v1 (PRD), this is a CRM-lite directory for staff, keyed by phone number. */
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  notes?: string;
  totalReservations: number;
  totalEnquiries: number;
  lastContactAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerReservationSummary {
  id: string;
  status: string;
  preferredDate: string;
  createdAt: string;
}

export interface CustomerEnquirySummary {
  id: string;
  status: string;
  message?: string;
  createdAt: string;
}

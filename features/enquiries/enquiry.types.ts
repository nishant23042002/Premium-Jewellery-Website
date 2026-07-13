export type EnquirySource = "whatsapp" | "form" | "call_request";
export type EnquiryStatus = "new" | "contacted" | "closed";

export interface Enquiry {
  id: string;
  tenantId: string;
  productId?: string | null;
  name: string;
  phone: string;
  message?: string;
  source: EnquirySource;
  status: EnquiryStatus;
  createdAt: string;
}

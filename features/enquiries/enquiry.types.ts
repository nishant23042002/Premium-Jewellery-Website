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
  /** Best-effort, looked up live from the current product record — undefined if there's no linked product or it was since deleted. */
  productName?: string;
  productImageUrl?: string;
}

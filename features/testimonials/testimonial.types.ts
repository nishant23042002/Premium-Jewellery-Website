export interface Testimonial {
  id: string;
  tenantId: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

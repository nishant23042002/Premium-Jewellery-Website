/** A single uploaded Cloudinary asset tracked in the Media Library (Phase 7 "Media"). */
export interface MediaAsset {
  id: string;
  tenantId: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
  fileName?: string;
  uploadedByAdminId: string;
  tags: string[];
  createdAt: string;
}

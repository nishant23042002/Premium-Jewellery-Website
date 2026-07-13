import { clientEnv } from "@/config/env";

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: "auto" | number;
  crop?: "fill" | "fit" | "scale" | "thumb";
  gravity?: "auto" | "center" | "face";
}

/**
 * Builds a transformed Cloudinary delivery URL from a stored publicId.
 * Client-safe — string building only, no SDK/secrets involved.
 */
export function getCloudinaryImageUrl(
  publicId: string,
  {
    width,
    height,
    quality = "auto",
    crop = "fill",
    gravity = "auto",
  }: CloudinaryTransformOptions = {},
): string {
  const cloudName = clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured");
  }

  const transforms = [
    `f_auto`,
    `q_${quality}`,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    width || height ? `c_${crop}` : null,
    width || height ? `g_${gravity}` : null,
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
}

/** Standard responsive breakpoints used across product/catalogue imagery. */
export const IMAGE_BREAKPOINTS = {
  thumbnail: 200,
  card: 480,
  detail: 960,
  hero: 1600,
} as const;

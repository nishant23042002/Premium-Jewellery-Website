import "server-only";
import { getCloudinaryClient } from "@/lib/cloudinary/client";

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Uploads a single image buffer to Cloudinary. Type/size are validated here
 * server-side rather than trusted from the client (PRD §17).
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  options: { folder: string; mimeType: string },
): Promise<UploadedImage> {
  if (!ALLOWED_MIME_TYPES.has(options.mimeType)) {
    throw new Error(`Unsupported image type: ${options.mimeType}`);
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Image exceeds the 10MB upload limit");
  }

  const cloudinary = getCloudinaryClient();

  return new Promise<UploadedImage>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  const cloudinary = getCloudinaryClient();
  await cloudinary.uploader.destroy(publicId);
}

export interface UploadedVideo {
  url: string;
  publicId: string;
}

const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

/**
 * Uploads a single video buffer to Cloudinary as a `resource_type: "video"`
 * asset — separate from `uploadImageBuffer` because Cloudinary tracks/deletes
 * video and image assets under different resource types.
 */
export async function uploadVideoBuffer(
  buffer: Buffer,
  options: { folder: string; mimeType: string },
): Promise<UploadedVideo> {
  if (!ALLOWED_VIDEO_MIME_TYPES.has(options.mimeType)) {
    throw new Error(`Unsupported video type: ${options.mimeType}`);
  }
  if (buffer.byteLength > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error("Video exceeds the 50MB upload limit");
  }

  const cloudinary = getCloudinaryClient();

  return new Promise<UploadedVideo>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "video",
        // The SDK's own default is 60s, which a 50MB video routinely blows
        // past on real-world upload bandwidth (a 50MB file needs ~6.7Mbps
        // sustained just to squeak under 60s) — this was silently failing
        // uploads that were still transferring fine, just slowly.
        timeout: 180_000,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

export async function deleteVideo(publicId: string): Promise<void> {
  const cloudinary = getCloudinaryClient();
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
}

/**
 * Recovers the Cloudinary public_id from a stored secure_url. Several
 * content models (categories, collections, offers, blog posts, gallery
 * images, events) only persist the delivery URL, not a separate publicId
 * field like Product does — this lets cleanup code (recycle bin permanent
 * delete) find the asset to remove without a schema change.
 */
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

/** Metadata for an asset that already exists in Cloudinary (not one this app uploaded itself). */
export async function getImageMetadata(
  publicId: string,
): Promise<UploadedImage> {
  const cloudinary = getCloudinaryClient();
  const result = await cloudinary.api.resource(publicId);
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

/** Relocates an existing asset into a folder (e.g. consolidating externally-uploaded photos into the app's managed folder) without re-uploading the bytes. */
export async function moveImageToFolder(
  publicId: string,
  folder: string,
): Promise<UploadedImage> {
  const cloudinary = getCloudinaryClient();
  const filename = publicId.split("/").pop();
  const newPublicId = `${folder}/${filename}`;

  if (publicId === newPublicId) {
    return getImageMetadata(publicId);
  }

  const result = await cloudinary.uploader.rename(publicId, newPublicId, {
    overwrite: false,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

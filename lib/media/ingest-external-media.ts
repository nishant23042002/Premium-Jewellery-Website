import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import {
  uploadImageBuffer,
  uploadVideoBuffer,
  getImageMetadata,
  publicIdFromUrl,
  type UploadedImage,
  type UploadedVideo,
} from "@/lib/cloudinary/upload";
import { clientEnv } from "@/config/env";

/**
 * The one genuinely new capability the import engine needs: fetch bytes
 * from an admin-supplied external URL and hand them to the existing
 * `uploadImageBuffer`/`uploadVideoBuffer` wrappers (which stay the sole
 * authority on mime/size validation — this module never bypasses them).
 * Everything below exists because fetching an arbitrary admin-supplied URL
 * server-side is a real outbound-request surface (SSRF), not because the
 * upload step itself needed changing.
 */

const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;
// Mirrors uploadImageBuffer/uploadVideoBuffer's own caps — checked here too
// so an oversized file is rejected mid-download instead of after fully
// buffering it in memory for nothing.
const MAX_IMAGE_DOWNLOAD_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_DOWNLOAD_BYTES = 50 * 1024 * 1024;

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpv4InCidr(ip: number, base: string, prefixLength: number): boolean {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const mask = prefixLength === 0 ? 0 : (~0 << (32 - prefixLength)) >>> 0;
  return (ip & mask) === (baseInt & mask);
}

// Loopback, private (RFC1918), link-local, CGNAT, documentation/test-net,
// and multicast/reserved ranges — anything an admin-supplied URL shouldn't
// be able to reach from our server.
const PRIVATE_IPV4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

/** Fails closed — an address we can't classify is treated as private rather than assumed safe. */
function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const asInt = ipv4ToInt(ip);
    if (asInt === null) return true;
    return PRIVATE_IPV4_RANGES.some(([base, prefix]) => isIpv4InCidr(asInt, base, prefix));
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
      return true;
    }
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateOrReservedIp(mapped[1]);
    return false;
  }
  return true;
}

/**
 * Resolves DNS and checks every returned address, not just the hostname
 * string — a hostname that looks public can still resolve to an internal
 * IP (DNS rebinding), which a string-only check would miss entirely.
 */
async function assertPublicHost(hostname: string): Promise<void> {
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error(`Could not resolve "${hostname}"`);
  }
  if (addresses.length === 0) {
    throw new Error(`Could not resolve "${hostname}"`);
  }
  if (addresses.some(({ address }) => isPrivateOrReservedIp(address))) {
    throw new Error("This URL points to a private or internal address and can't be fetched");
  }
}

interface FetchedBody {
  buffer: Buffer;
  contentType: string | null;
}

/**
 * Fetches with redirects followed manually (not by `fetch` itself) so every
 * hop gets the same public-host check before being requested — the
 * standard SSRF-via-redirect bypass otherwise skips that check on the
 * final destination.
 */
async function fetchWithGuards(url: string, maxBytes: number): Promise<FetchedBody> {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const parsedUrl = new URL(currentUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Only http:// and https:// URLs are supported");
    }
    await assertPublicHost(parsedUrl.hostname);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "AmbikaJewellersImportBot/1.0" },
      });
    } catch (error) {
      throw error instanceof Error && error.name === "AbortError"
        ? new Error("Request timed out")
        : error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirected with no Location header");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const sizeLimitMessage = `File is larger than the ${Math.round(maxBytes / (1024 * 1024))}MB limit`;

    // Pre-check via the header — rejects most oversized files before
    // downloading anything. Not authoritative on its own (a server can omit
    // or lie about Content-Length), so the byte length is checked again
    // after download as the real backstop.
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) {
      throw new Error(sizeLimitMessage);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(sizeLimitMessage);
    }

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type"),
    };
  }

  throw new Error("Too many redirects");
}

function guessImageMimeType(contentType: string | null, url: string): string {
  const fromHeader = contentType?.split(";")[0]?.trim().toLowerCase();
  if (fromHeader) return fromHeader;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

function guessVideoMimeType(contentType: string | null, url: string): string {
  const fromHeader = contentType?.split(";")[0]?.trim().toLowerCase();
  if (fromHeader) return fromHeader;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return "application/octet-stream";
}

/** True if the URL is already hosted on this app's own Cloudinary account — re-uploading it would just waste bandwidth and create a duplicate asset. */
function isOwnCloudinaryUrl(url: string): boolean {
  const cloudName = clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "res.cloudinary.com" &&
      parsed.pathname.startsWith(`/${cloudName}/`)
    );
  } catch {
    return false;
  }
}

export type IngestResult<T> =
  | { success: true; data: T; skippedReupload?: boolean }
  | { success: false; error: string };

/**
 * Fetches an external image URL and uploads it to Cloudinary, or — if the
 * URL is already one of ours — resolves its existing asset directly
 * without re-downloading/re-uploading anything.
 */
export async function ingestExternalImage(
  url: string,
  folder: string,
): Promise<IngestResult<UploadedImage>> {
  try {
    if (isOwnCloudinaryUrl(url)) {
      const publicId = publicIdFromUrl(url);
      if (publicId) {
        const existing = await getImageMetadata(publicId);
        return { success: true, data: existing, skippedReupload: true };
      }
    }

    const { buffer, contentType } = await fetchWithGuards(url, MAX_IMAGE_DOWNLOAD_BYTES);
    const mimeType = guessImageMimeType(contentType, url);
    const uploaded = await uploadImageBuffer(buffer, { folder, mimeType });
    return { success: true, data: uploaded };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ingest image",
    };
  }
}

/** Same as `ingestExternalImage`, for video URLs. */
export async function ingestExternalVideo(
  url: string,
  folder: string,
): Promise<IngestResult<UploadedVideo>> {
  try {
    if (isOwnCloudinaryUrl(url)) {
      const publicId = publicIdFromUrl(url);
      // No metadata round trip here (unlike the image path) — `resource.api`
      // needs the right `resource_type` and UploadedVideo doesn't carry
      // width/height anyway, so there's nothing extra worth fetching.
      if (publicId) {
        return { success: true, data: { url, publicId }, skippedReupload: true };
      }
    }

    const { buffer, contentType } = await fetchWithGuards(url, MAX_VIDEO_DOWNLOAD_BYTES);
    const mimeType = guessVideoMimeType(contentType, url);
    const uploaded = await uploadVideoBuffer(buffer, { folder, mimeType });
    return { success: true, data: uploaded };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ingest video",
    };
  }
}

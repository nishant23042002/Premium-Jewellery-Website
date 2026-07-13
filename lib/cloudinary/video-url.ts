/**
 * Inserts Cloudinary's `f_auto` transformation into a video delivery URL so
 * it's transcoded to whatever format/codec the requesting browser can
 * actually decode. Many phone/desktop-recorded "mp4" files are internally
 * HEVC/H.265, which Chrome and most browsers can't play — without this the
 * <video> element loads successfully but renders a blank frame with no
 * visible error. Applied at render time (not upload time) so it also fixes
 * videos uploaded before this existed, without re-uploading.
 *
 * Deliberately not in lib/cloudinary/upload.ts — that module is
 * `"server-only"`, but this needs to run in client components that render
 * <video> tags.
 */
export function webSafeVideoUrl(url: string): string {
  return url.replace("/upload/", "/upload/f_auto/");
}

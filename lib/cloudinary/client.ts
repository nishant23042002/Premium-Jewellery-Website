import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/config/env";

let configured = false;

/** Configures the Cloudinary SDK once per server process, on first use. */
export function getCloudinaryClient() {
  if (!configured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      getServerEnv();

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });

    configured = true;
  }

  return cloudinary;
}

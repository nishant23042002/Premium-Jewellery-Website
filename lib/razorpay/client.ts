import "server-only";
import Razorpay from "razorpay";
import { getServerEnv } from "@/config/env";

let cachedClient: Razorpay | undefined;

/** Lazily-constructed singleton — same reasoning as the Mongoose connection cache, avoids re-reading env/creating a new client on every import in dev. */
export function getRazorpayClient(): Razorpay {
  if (!cachedClient) {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = getServerEnv();
    cachedClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return cachedClient;
}

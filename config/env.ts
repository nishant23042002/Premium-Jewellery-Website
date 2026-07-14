import { z } from "zod";

/**
 * For optional secrets: treats an empty string the same as an absent key.
 * `.optional()` alone only tolerates the key being missing entirely — a
 * `.env.local` line like `FOO=` (present, empty) still fails `.min(1)`even
 * though the field is meant to be "leave blank to disable". Every optional
 * secret below is documented that way, so the schema needs to actually
 * honor it.
 */
function optionalSecret() {
  return z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  );
}

/**
 * Server-side environment schema. Import this only from server-only code
 * (Server Components, Server Actions, route handlers, lib/db, lib/auth).
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .startsWith(
      "mongodb",
      "MONGODB_URI must be a valid MongoDB connection string",
    ),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  // Optional — the webhook route degrades to a 503 (see app/api/razorpay/
  // webhook/route.ts) when unset, rather than every deployment needing the
  // webhook configured in the Razorpay dashboard before it can boot. Set
  // this to the same secret configured for the webhook URL in the Razorpay
  // dashboard once it's added there.
  RAZORPAY_WEBHOOK_SECRET: optionalSecret(),

  // Optional — the live rate auto-fetch feature degrades to manual-entry-only
  // (the original behavior) when either is unset, rather than failing env
  // validation for every deployment that hasn't opted into it yet.
  METALS_DEV_API_KEY: optionalSecret(),
  CRON_SECRET: optionalSecret(),

  // Optional — sendEmail() degrades to a logged no-op (the original stub
  // behavior) when unset, rather than every deployment needing an email
  // provider configured before it can boot.
  RESEND_API_KEY: optionalSecret(),

  // Optional — "Continue with Google" is hidden (see
  // components/storefront/google-signin-button.tsx, which checks the
  // client-side NEXT_PUBLIC_GOOGLE_CLIENT_ID counterpart below) and
  // app/api/auth/google/route.ts 503s when either is unset, rather than
  // every deployment needing a Google Cloud OAuth client before it can boot.
  GOOGLE_CLIENT_ID: optionalSecret(),
  GOOGLE_CLIENT_SECRET: optionalSecret(),
});

/**
 * Client-safe environment schema. These are inlined at build time by
 * Next.js, so only ever put genuinely public values here.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_NAME: z.string().default("Shree Ambika Jewellers"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_RAZORPAY_KEY_ID is required"),
  // Same value as the server-only GOOGLE_CLIENT_ID above — a Google OAuth
  // client ID isn't a secret (only GOOGLE_CLIENT_SECRET is), it's exposed
  // here purely so GoogleSignInButton can decide whether to render without
  // threading a server-computed boolean through the component tree.
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;
type ClientEnv = z.infer<typeof clientEnvSchema>;

function loadServerEnv(): ServerEnv {
  // Skip strict validation during build-time static analysis / lint / test
  // runs where secrets legitimately aren't present (e.g. CI typecheck).
  if (typeof window !== "undefined") {
    throw new Error("Server env must not be imported from client code.");
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid or missing environment variables:\n${formatted}\n\nCheck your .env.local against .env.example.`,
    );
  }

  return parsed.data;
}

function loadClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid public environment variables:\n${formatted}`);
  }

  return parsed.data;
}

let cachedServerEnv: ServerEnv | undefined;

/** Lazily-validated, memoized server env. Call from server-only modules. */
export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = loadServerEnv();
  }
  return cachedServerEnv;
}

export const clientEnv = loadClientEnv();

import path from "path";
import type { NextConfig } from "next";

// Next.js/Tailwind emit inline <script>/<style> for hydration data and
// critical CSS, so a nonce-based strict CSP would need a custom middleware
// pipeline; 'unsafe-inline' on script/style is the pragmatic baseline here
// while still locking down framing, mixed content, and cross-origin loads.
// 'unsafe-eval' is dev-only: webpack's HMR bundle in `next dev` wraps
// modules in eval() to rebuild fast, and without it the client JS bundle
// fails to execute at all (no hydration, no interactivity, images stuck
// mid-load) — production builds don't eval, so this never relaxes prod.
const CSP = [
  "default-src 'self'",
  // Razorpay's hosted checkout.js loads its own sub-scripts from
  // *.razorpay.com at runtime — without this the widget silently fails to
  // load (no console error, just `window.Razorpay` never appearing).
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com https://*.razorpay.com",
  "font-src 'self' data:",
  // The Razorpay SDK calls its own API/analytics endpoints from the page.
  "connect-src 'self' https://*.razorpay.com",
  // Contact page embeds a Google Maps iframe; Razorpay's payment modal is
  // itself an iframe hosted on checkout.razorpay.com/api.razorpay.com.
  "frame-src https://www.google.com https://*.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), camera=(), microphone=()",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // A sibling lockfile in the parent directory (an unrelated project)
  // otherwise makes Next.js misdetect the monorepo root.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Next's default Server Action body cap is 1MB — raised to match the
    // largest upload the app validates itself (MAX_VIDEO_UPLOAD_BYTES in
    // lib/cloudinary/upload.ts, 50MB for styling-story cover videos) so the
    // app's own validation is what rejects oversized uploads, not the
    // framework silently truncating the multipart body first (which
    // surfaces to the user as a cryptic "Unexpected end of form").
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Separate 10MB-default cap specifically for requests that pass through
    // middleware.ts (ours matches every /admin/* route, which is where the
    // video upload POST lands) — independent of serverActions.bodySizeLimit
    // above. Left unset, it silently truncates the body ("Request body
    // exceeded 10MB ... Only the first 10MB will be available") before the
    // Server Action layer even runs, producing the same "Unexpected end of
    // form" symptom.
    middlewareClientMaxBodySize: "50mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

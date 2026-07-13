# API Reference

Shree Ambika Jewellers is a Next.js App Router application, and almost all
data access goes through **Server Actions**, not REST endpoints — the
storefront forms, admin CRUD screens, search, etc. all call typed functions
in `features/*/*.actions.ts` directly. Server Actions aren't documented here
because they're not a public network-facing surface; TypeScript at the call
site is the contract.

The two routes below exist under `app/api/*` specifically for **non-Next
clients** — anything that can't invoke a Server Action (a future WhatsApp
webhook relay, a third-party integration, a script). If you're working
inside this codebase, prefer calling the underlying Server Action directly
instead of fetching these routes.

All responses use the shared envelope from `lib/api/response.ts`:

```jsonc
// success
{ "success": true, "data": <T> }

// error
{ "success": false, "error": "message" }
```

---

## `POST /api/enquiries`

Creates a customer enquiry (same record type as the storefront's contact
form / WhatsApp CTA fallback).

- **Auth**: none — public.
- **Rate limit**: 5 requests/minute per IP (`checkRateLimit`, in-memory,
  single-instance — see `lib/api/rate-limit.ts`).
- **Request body** (JSON): matches `EnquiryFormValues`
  (`features/enquiries/enquiry.schema.ts`):
  ```jsonc
  {
    "name": "string, required",
    "phone": "string, required",
    "message": "string, optional",
    "productId": "string (ObjectId), optional",
    "source": "\"enquiry\" | \"whatsapp\" | \"call\", optional"
  }
  ```
- **Responses**:
  - `201` — `{ success: true, data: Enquiry }`
  - `400` — invalid JSON body
  - `422` — validation failed (`{ success: false, error }`)
  - `429` — rate limited

## `GET /api/rates/current`

Returns the latest published gold/silver rates.

- **Auth**: none — public.
- **Rate limit**: 30 requests/minute per IP.
- **Caching**: backed by a server-side cache tagged `rates:<tenantId>`,
  invalidated whenever an admin updates the daily rate — not a static
  response, but not hitting the DB on every single request either.
- **Response** `200`:
  ```jsonc
  {
    "success": true,
    "data": {
      "gold": { "ratePerGram": 6800, "effectiveDate": "2026-07-12T00:00:00.000Z" } ,
      "silver": { "ratePerGram": 85, "effectiveDate": "2026-07-12T00:00:00.000Z" }
    }
  }
  ```
  Either `gold`/`silver` is `null` if no rate has ever been set.
- `429` — rate limited.

---

## Adding a new route

If a new integration genuinely needs a REST entry point (rather than a
Server Action), follow the existing pattern:

1. Route handler under `app/api/<name>/route.ts`.
2. Call `checkRateLimit` from `lib/api/rate-limit.ts` first, keyed by
   `x-forwarded-for`/`x-real-ip`.
3. Validate the request body with the feature's existing Zod schema — don't
   write a second parallel validation path.
4. Respond via `apiSuccess`/`apiError` from `lib/api/response.ts` so the
   envelope stays consistent.
5. Add it to this file.

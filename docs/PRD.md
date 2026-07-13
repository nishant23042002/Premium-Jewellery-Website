# Shree Ambika Jewellers — Digital Showroom Platform
## Phase 0: Product & Architecture Requirements Document

---

## Context

Shree Ambika Jewellers (Roha, Maharashtra) is an established offline jewellery retailer — 4.9★ across 1,402 Google reviews — with no digital presence today. The goal is not to replace the showroom but to extend its trusted, offline reputation into a luxury-grade digital experience that:

1. Showcases the full catalogue with the polish of a global luxury brand.
2. Converts online browsing into offline showroom visits (calls, WhatsApp, walk-ins) — this is a **lead-generation and brand asset**, not a transaction engine, at launch.
3. Can be operated day-to-day by non-technical showroom staff (updating gold/silver rates, adding new arrivals, uploading photos) without developer involvement.
4. Is architected so that a future ecommerce layer (cart, checkout, payments, inventory) — and eventually a multi-tenant SaaS product sold to *other* jewellers — can be added without a rewrite.

Decisions locked in for this phase (confirmed with the client/stakeholder):
- **Pricing**: Live calculated price per product = `weight × today's metal rate + making charges + GST`, with the day's gold/silver rate entered once by admin and applied platform-wide.
- **Languages**: Trilingual — English, Hindi, Marathi — from day one.
- **Ecommerce**: Long-term/aspirational only. We design for optionality, we do not build cart/checkout/payments now.

---

## 1. Business Goals

**Primary**
- Establish a credible, premium web presence matching the brand's 4.9★ offline reputation.
- Drive qualified foot traffic and phone/WhatsApp enquiries to the physical Roha showroom.
- Reduce staff time spent answering "what designs do you have / what's today's rate" questions by putting that information online.

**Secondary**
- Build a reusable content foundation (product data, categories, media) that doesn't need re-modeling when ecommerce is added.
- Create a defensible local SEO presence ("jewellers in Roha", "sonar in Roha Ashtami", gold rate today Roha, etc.).
- Prove a template that can be white-labeled and resold to other regional jewellers (future SaaS).

**Non-goals (v1)**
- No online payments, cart, or checkout.
- No user accounts / customer login.
- No real-time inventory-quantity tracking (a product is "in showroom" or "made to order", not stock-counted).

---

## 2. Target Audience

- **Local repeat customers** (existing offline clientele, largely Roha/Raigad district) — want to check today's gold rate and browse new arrivals before visiting.
- **Occasion buyers** (weddings, festivals — Akshaya Tritiya, Diwali, Gudi Padwa) — searching broadly, comparing 2–3 local jewellers, highly influenced by trust signals (reviews, certifications, BIS hallmark).
- **NRI / out-of-town family** of local residents — browsing remotely to select designs before a relative visits the store on their behalf, or before their own visit home.
- **Younger, digitally-native buyers (25–40)** — expect an Instagram/Tanishq-like browsing experience, price transparency, and mobile-first design.
- **Referral traffic** from Google Maps/Search (the existing listing already has strong reviews — the site must convert that discovery, not compete with it).

---

## 3. Competitor Analysis

| Tier | Examples | Takeaway to emulate | Takeaway to avoid |
|---|---|---|---|
| National luxury chains | Tanishq, Kalyan Jewellers, Malabar Gold | Cinematic hero imagery, strong category storytelling, live gold-rate widget, certification/trust badges, store-locator UX | Heavy ecommerce complexity, bloated page weight — not needed at this stage |
| Regional/local jewellers with websites | Typical small-jeweller WordPress sites | — | Cluttered layouts, no live pricing, stock photography instead of real catalogue, poor mobile experience, slow load times, no clear CTA to visit |
| Local jewellers with *no* website (majority) | — | The bar is low; a genuinely fast, elegant, trilingual site with live pricing is an immediate differentiator in this market | — |
| D2C jewellery brands (CaratLane, Bluestone) | Excellent product photography, 360° views, transparent making-charge breakdown | Adopt the price-transparency UX pattern | Full ecommerce checkout — explicitly out of scope for v1 |

**Positioning**: "The trust of your neighbourhood jeweller, presented like a global luxury brand."

---

## 4. Feature Prioritization

**MVP (Launch, v1)**
- Trilingual homepage with brand story, hero imagery, trust signals (rating, years in business, certifications)
- Full catalogue: categories (Gold, Diamond, Silver, Antique/Temple jewellery, Bridal collections, etc.) → products → product detail page
- Live daily gold/silver rate ticker + per-product calculated price (weight × rate + making + GST)
- Product detail: multi-image gallery, weight, purity (18K/22K/24K), making charges breakdown, "Enquire on WhatsApp" / "Call Store" / "Visit Showroom" CTAs
- Store info: address, hours, map embed, phone, directions (reusing the Google Business data already established)
- Admin panel: staff can add/edit/remove products, upload photos, update the daily metal rate, manage categories — in all 3 languages
- Basic on-page SEO + local SEO (schema.org JewelryStore, LocalBusiness markup)
- Mobile-first, fast-loading (sub-2.5s LCP)
- Contact/enquiry form → email/WhatsApp notification to staff

**Fast-follow (v1.1–1.3, 0–6 months post-launch)**
- Customer testimonials / Google Reviews sync
- Wishlist / "shortlist for showroom visit" (no login required — local storage / shareable link)
- Appointment booking (private viewing slots)
- Collections/lookbook pages (seasonal, bridal, festival)
- Blog/content hub for SEO (care guides, purity guides, occasion guides) — also strengthens trilingual SEO footprint
- WhatsApp Business API integration for catalogue sharing

**Mid-term roadmap (6–18 months)**
- Customer accounts (save wishlist permanently, order history readiness)
- Real inventory model (SKU-level stock, "available in showroom" flags)
- Advanced product configurator (choose ring size, metal purity variant)
- Multi-store support if a second branch opens

**Long-term (18+ months) — Ecommerce & SaaS**
- Full cart/checkout/payments (Razorpay/UPI native to India)
- Order management, shipping/logistics integration, insured delivery
- Multi-tenant SaaS: same platform, white-labeled, sold to other regional jewellers as a subscription product

---

## 5. Site Architecture

```
/                          Home
/about                     Brand story, heritage, certifications
/collections                Category index (Gold, Diamond, Silver, Bridal, Antique...)
/collections/[category]     Category listing (filter/sort)
/product/[slug]              Product detail page
/gold-rate-today              Live rate page (also feeds the site-wide ticker) — high SEO value
/visit-us                    Store info, map, hours, directions
/contact                     Enquiry form, phone, WhatsApp
/blog (v1.1)                  Content hub
/[locale]/...                 All routes mirrored under en / hi / mr

--- Admin (auth-gated) ---
/admin/login
/admin/dashboard
/admin/products               CRUD + trilingual fields + images
/admin/categories
/admin/rates                  Daily gold/silver rate entry
/admin/enquiries              Incoming leads from contact/WhatsApp forms
/admin/settings               Store info, hours, banners
```

---

## 6. User Journey (Primary — Occasion Buyer)

1. Discovers via Google Search/Maps ("jewellers near Roha") or a shared WhatsApp link.
2. Lands on homepage — immediately sees trust signals (4.9★, years established) and today's gold rate.
3. Browses Collections → filters to "Bridal Gold" → scans product grid with live calculated prices.
4. Opens a product → views gallery, purity/weight/making-charge breakdown.
5. Taps "Enquire on WhatsApp" (pre-filled message with product name) or "Shortlist for visit".
6. Shares shortlist with family, or drives to the showroom with specific product references in hand.
7. Staff, on arrival, sees the enquiry in `/admin/enquiries` and has the product pulled ready.

## User Journey (Admin — Daily Operations)

1. Staff opens `/admin` each morning, updates the day's gold/silver rate (2 fields, <30 seconds) — this cascades to every product price site-wide automatically.
2. When new stock arrives, staff photographs it and adds a product via a simple form (name, category, weight, purity, making charge %, photos) in whichever language they're comfortable typing, with the other two languages fillable later or assisted by simple translation prompts.
3. Staff checks `/admin/enquiries` for WhatsApp/form leads and follows up.

---

## 7. Customer Personas

**"Anita" — The Occasion Buyer (34, Roha)**
Planning her daughter's engagement. Comparing 2–3 known local jewellers. Wants to see designs and *approximate* pricing before visiting to avoid wasting a trip. Not tech-savvy beyond WhatsApp/Instagram — needs a dead-simple, fast mobile experience in Hindi or Marathi.

**"Rohit" — The Remote Decision-Maker (29, based in Pune/Mumbai)**
Grew up in Roha, family still visits this store. Browses in English on a laptop, shortlists a few pieces, sends the link to his mother who will visit in person and finalize.

**"Suresh" — The Repeat/Loyal Customer (52, Roha)**
Has bought from the store for 20 years. Mainly wants to check today's gold rate and see if anything new has arrived — doesn't need convincing on trust, just convenience.

---

## 8. Admin Personas

**"Meena" — Showroom Staff (Primary Admin)**
Non-technical, comfortable with WhatsApp/Instagram-level apps, not with dashboards or code. Needs: big buttons, obvious labels, minimal steps, mistake-forgiving (edit/undo), and works fine on a shared showroom desktop or tablet.

**"Owner" — Store Owner (Secondary Admin)**
Reviews enquiries, occasionally updates featured collections/banners, checks that the site "looks right." Not involved in daily data entry.

---

## 9. Future Roadmap (Summary)

| Phase | Timeframe | Scope |
|---|---|---|
| v1 — Digital Showroom | Launch | Catalogue, live pricing, trilingual, admin CMS, lead capture |
| v1.x — Engagement | 0–6 mo | Wishlist, appointments, blog/SEO content, WhatsApp API |
| v2 — Commerce-ready | 6–18 mo | Accounts, real inventory, product variants |
| v3 — Full Ecommerce | 18+ mo | Cart, checkout, Razorpay/UPI payments, order management |
| v4 — SaaS | 24+ mo | Multi-tenant platform, white-label, subscription billing, sold to other jewellers |

Architectural choices throughout this document are made so v1 requires **no structural rewrite** to reach v2/v3/v4 — only additive schema and modules.

---

## 10. Technical Architecture

**Stack**
- **Framework**: Next.js (App Router, TypeScript) — Server Components for catalogue pages, Server Actions for admin mutations
- **Hosting**: Vercel (Fluid Compute) — matches the environment already provisioned; gives us ISR/ on-demand revalidation, edge network for the image-heavy catalogue, zero-config previews per PR
- **Styling/UI**: Tailwind CSS + shadcn/ui as the component base, customized into a bespoke luxury design system (not left looking like a shadcn template)
- **Animation**: Framer Motion (page transitions, scroll reveals, gallery interactions) — restrained, see Animation Philosophy
- **Database**: PostgreSQL via Neon (Vercel Marketplace) + Prisma ORM — a relational model is the right fit for categories/products/pricing rules and scales cleanly into multi-tenant SaaS later (vs. forcing a headless-CMS-per-tenant model)
- **Media storage**: Vercel Blob for product imagery at launch (simplest path, native to the platform); revisit Cloudinary if/when 360° product photography or advanced transforms are needed
- **i18n**: `next-intl` with `/en`, `/hi`, `/mr` locale routing; all content fields (product name, description, category name) stored as localized JSON columns in Postgres, not separate content trees
- **Admin auth**: Auth.js (NextAuth) with email/passwordless (magic link) for the single-store MVP — deliberately chosen over a heavier provider now, with a clear upgrade path to Clerk/Auth0 for multi-tenant role/org management at the SaaS phase
- **Forms/validation**: React Hook Form + Zod, shared schemas between client and Server Actions
- **Deployment**: Vercel Git integration, preview deployments per PR, production on merge to `main`

---

## 11. Folder Structure

```
/app
  /[locale]
    /(storefront)
      /page.tsx                    Home
      /about/page.tsx
      /collections/page.tsx
      /collections/[category]/page.tsx
      /product/[slug]/page.tsx
      /gold-rate-today/page.tsx
      /visit-us/page.tsx
      /contact/page.tsx
    /(admin)
      /admin/login/page.tsx
      /admin/dashboard/page.tsx
      /admin/products/...
      /admin/categories/...
      /admin/rates/page.tsx
      /admin/enquiries/page.tsx
      /admin/settings/page.tsx
    /layout.tsx
  /api                              Webhooks only (WhatsApp, form notifications) — prefer Server Actions elsewhere
/components
  /ui                                shadcn primitives (buttons, inputs, dialogs)
  /storefront                        ProductCard, PriceBreakdown, GoldRateTicker, Gallery...
  /admin                             ProductForm, RateEntryForm, EnquiryTable...
/lib
  /db                                Prisma client, query modules per domain
  /pricing                           Metal-rate → product-price calculation logic (single source of truth)
  /i18n                              next-intl config, message catalogs
  /auth                              Auth.js config
  /validation                        Zod schemas (shared client/server)
/prisma
  schema.prisma
  /migrations
/messages
  en.json / hi.json / mr.json        Static UI strings (not product content)
/public
  /brand                             Logo, favicon, static brand assets
```

---

## 12. Database Design (core entities)

```
Tenant (future-ready, single row in v1)
  id, name, subdomain, plan, createdAt

Store
  id, tenantId, name, address, phone, whatsappNumber,
  latitude, longitude, hoursJson, mapEmbedUrl

Category
  id, tenantId, slug, nameJson{en,hi,mr}, imageUrl, sortOrder, parentId (nullable, for subcategories)

Product
  id, tenantId, categoryId, slug, skuCode,
  nameJson{en,hi,mr}, descriptionJson{en,hi,mr},
  metalType (gold|silver|diamond|other), purity (e.g. "22K"),
  grossWeightGrams, netWeightGrams,
  makingChargeType (percentage|perGram|flat), makingChargeValue,
  gstPercentage, isFeatured, isPublished, tags[]

ProductImage
  id, productId, url, altTextJson{en,hi,mr}, sortOrder

MetalRate
  id, tenantId, metalType, purity, ratePerGram, effectiveDate
  # latest row per (metalType, purity) drives all live price calculations

Enquiry
  id, tenantId, productId (nullable), name, phone, message,
  source (whatsapp|form|call-request), status (new|contacted|closed), createdAt

AdminUser
  id, tenantId, email, name, role (owner|staff), passwordless auth via Auth.js

SiteSetting
  id, tenantId, key, valueJson   # banners, featured collection IDs, homepage copy blocks
```

**Design notes**
- Price is **never stored** — it's computed at render time from `MetalRate` × `Product` weight/making/GST via `/lib/pricing`. This is the single most important invariant: it guarantees every page always reflects today's rate with zero cache-invalidation bugs.
- `tenantId` is present on every table from day one (even though v1 runs a single tenant) — this is the one deliberate "build for the future" decision, since retrofitting multi-tenancy onto a single-tenant schema later is the expensive rewrite we're explicitly avoiding.
- Localized text uses JSON columns (`{en, hi, mr}`) rather than a separate translations table — simpler for a 3-language, non-collaborative-editing use case; revisit only if a future SaaS tenant needs more languages or translation workflows.

---

## 13. Component Hierarchy (storefront, representative)

```
<StorefrontLayout>
  <AnnouncementBar>            GoldRateTicker
  <Header>                     Logo, LocaleSwitcher, NavMenu, CallButton
  <PageContent>
    <Hero> / <CategoryGrid> / <ProductGrid>
      <ProductCard>            Image, name, PriceBreakdown (compact), category tag
    <ProductDetail>
      <Gallery>                 Zoom, thumbnails
      <PriceBreakdown>          Weight, purity, making charge, GST, total — expandable detail
      <CTAGroup>                 WhatsAppEnquiryButton, CallButton, ShortlistButton
      <RelatedProducts>
  <Footer>                      Store info, hours, map, social, trust badges
```

Admin mirrors this with `<AdminLayout>` → `<Sidebar>` → form-centric pages built from shared `<ui>` primitives, optimized for speed of data entry over visual flourish.

---

## 14. Design Language

**Brand feel**: Warm luxury — closer to Tanishq/Cartier restraint than a "busy" traditional jewellery site. Deep jewel tones, generous whitespace, photography-led (the product *is* the decoration).

- **Primary palette**: Deep maroon/oxblood or emerald as accent (echoes the storefront's red/pink festive drapery in the reference photo), warm gold as the metallic accent (used sparingly — as a highlight, not a background), off-white/ivory base, near-black for text.
- **Imagery**: Real product photography only, consistent lighting/background (soft studio white or dark charcoal for contrast), no stock jewellery images.
- **Iconography**: Thin-line, minimal, custom where possible (avoid generic ecommerce icon packs).

---

## 15. Animation Philosophy

Motion should feel like **quality, not decoration** — the digital equivalent of a velvet-lined tray sliding open, not a flashy ecommerce banner carousel.

- Purposeful only: page transitions, image gallery interactions, scroll-triggered reveals of product grids, price-breakdown expand/collapse.
- No animation blocks perceived load — content is visible/usable before any animation completes.
- Respect `prefers-reduced-motion` throughout.
- Timing: 200–400ms, ease-out for entrances, ease-in for exits — nothing bouncy or playful; this is a luxury register, not a consumer-app register.

---

## 16. SEO Strategy

- Server-rendered (Next.js SSR/ISR) catalogue pages — fully crawlable, no client-only rendering of product content.
- `schema.org` structured data: `JewelryStore`, `LocalBusiness`, `Product` (with `Offer` reflecting the live calculated price), `AggregateRating` (synced from the existing Google rating).
- Localized SEO: hreflang tags across en/hi/mr, locale-specific URL paths (not query params), localized meta titles/descriptions.
- High-intent local landing pages: `/gold-rate-today` (genuinely high-search-volume query locally), `/visit-us` optimized for "jewellers near me" / "sonar Roha".
- Core Web Vitals as an SEO input, not an afterthought — see Performance Strategy.
- Sitemap auto-generated from the product/category database, submitted via Search Console.

---

## 17. Security Strategy

- Admin routes gated by Auth.js session, server-side role checks on every mutation (not just UI hiding).
- All admin mutations via Server Actions with Zod input validation — no trusted client input.
- Rate-limiting on public forms (contact/enquiry) to prevent spam/abuse — Vercel Firewall / simple IP-based throttling.
- Image uploads validated server-side (type, size, dimension) before storage — never trust client-declared MIME type.
- No sensitive data collected from customers in v1 (no payments, no accounts) — minimizes the security surface area by design.
- Environment secrets (DB URL, auth secrets) managed via Vercel env vars, never committed.
- Audit log on `MetalRate` and `Product` price-affecting changes (who changed what, when) — important given price is customer-facing and computed.

---

## 18. Performance Strategy

- Target: LCP < 2.5s on 4G mobile, CLS near 0, TTFB optimized via Vercel edge caching + ISR for catalogue pages.
- Images: Next/Image with responsive sizing, AVIF/WebP, lazy-loaded below the fold, blur placeholders.
- Static generation + on-demand ISR revalidation for product/category pages (revalidate on admin publish, not on a timer) — catalogue is read-heavy, write-light, ideal for this pattern.
- The one truly dynamic piece — today's gold rate — is fetched via a lightweight, separately-cached endpoint (short revalidate window) so it doesn't force full-page dynamic rendering.
- Font loading: self-hosted, `font-display: swap`, subset for Devanagari (Hindi/Marathi) + Latin to avoid bloating with unused glyphs.

---

## 19. Accessibility Strategy

- WCAG 2.1 AA baseline: color contrast (especially gold-on-white accents — test explicitly), keyboard navigability across gallery/filters/forms, visible focus states.
- Semantic HTML and ARIA labels on custom components (gallery, locale switcher, price breakdown accordion).
- All product images require meaningful localized alt text (enforced as a required admin field, not optional).
- Respect `prefers-reduced-motion` (see Animation Philosophy).
- Devanagari script rendering tested explicitly for line-height/legibility, not just Latin.

---

## 20. Scalability Strategy

- Stateless Next.js app on Vercel — scales horizontally by default.
- Postgres (Neon) scales vertically/read-replicas well beyond single-store catalogue needs; connection pooling (Prisma + Neon's pooled connection) from day one to avoid the classic serverless-to-Postgres connection exhaustion issue.
- `tenantId` scoping on every query from day one means scaling from 1 store → many stores (SaaS) is a data-partitioning exercise, not a schema migration.
- Media on Vercel Blob (or Cloudinary later) scales independently of the app.

---

## 21. Admin Experience

Design principle: **the admin panel is a product in its own right**, aimed at non-technical daily users, not developers.

- Single most important screen: "Update Today's Rate" — 2 numeric fields (gold rate/gram, silver rate/gram), one save button, visible confirmation, front and center on the dashboard.
- Product form: guided, single-column, large touch targets (usable on a showroom tablet), image upload via drag-drop or camera capture, live preview of calculated price as weight/making-charge fields are filled in.
- Trilingual fields presented as tabs (EN/HI/MR) on the same form, not three separate flows; allow saving with only one language filled and publishing later once translated.
- Enquiries inbox: simple table, one-tap "Call" / "WhatsApp" actions, status marking (new/contacted/closed).
- No jargon: no "SKU", "slug", "metadata" exposed in the UI — plain language throughout, in the admin's chosen locale too.

---

## 22. Content Strategy

- Product content owned entirely by store staff via admin — no developer dependency for day-to-day updates.
- Editorial content (About, brand story, blog) drafted collaboratively at launch, then updated by the owner via simple rich-text fields in Settings/Blog admin.
- Photography guidelines documented for staff (lighting, background, angles) since photo quality is the single biggest lever on perceived luxury quality online.
- Blog/content hub (v1.1) targets long-tail local + informational SEO ("hallmark guide", "how to care for gold jewellery", "Akshaya Tritiya buying guide") in all three languages.

---

## 23. Brand Experience

- Every touchpoint reinforces "trusted local expert, presented at global standard": rating/review count visible near the top of the homepage, years-in-business/heritage messaging, real storefront photography (the shopfront image itself is a strong asset — festive, warm, recognizable).
- Consistent CTA language across the site: "Enquire", "Visit Showroom", "Check Today's Rate" — never "Buy" or "Add to Cart" (explicitly out of register for a non-ecommerce v1).
- Trust badges: BIS Hallmark certification, years established, Google rating badge (kept live/synced, not a stale screenshot).

---

## 24. Micro-interaction Strategy

- Hover/tap states on product cards: subtle scale + shadow lift, not color inversion.
- Price breakdown accordion: smooth expand revealing weight/purity/making/GST line items — reinforces transparency, a key trust driver.
- WhatsApp/Call CTA buttons: satisfying tap feedback (scale-down on press) since these are the core conversion actions.
- Form submissions: inline success state, not a jarring redirect.
- Locale switcher: instant, no full page reload where avoidable.

---

## 25. Motion Guidelines

(Consolidated with §15 — repeated here as the concrete ruleset for implementation)
- Standard easing: `ease-out` for entrances (200–300ms), `ease-in` for exits (150–200ms).
- Scroll reveals: fade + 8–16px translate-Y, staggered by ~40ms per grid item, capped so long grids don't feel sluggish.
- No parallax, no auto-playing carousels (both hurt performance and accessibility with little payoff for this brand register).

---

## 26. Spacing System

- 4px base unit, Tailwind's default scale adopted as-is (4/8/12/16/24/32/48/64/96) to avoid inventing a parallel system.
- Section vertical rhythm: generous (64–96px between major sections on desktop, 32–48px mobile) — whitespace is a luxury signal.
- Product grid gutters: consistent 16–24px, denser than editorial sections since browsing density matters for catalogue pages.

---

## 27. Typography System

- **Latin display/headings**: a refined serif or high-contrast serif (e.g., in the family of Playfair Display / Canela-like) for luxury tone on headings only.
- **Latin body/UI**: a clean, highly legible sans-serif (e.g., Inter or similar) for body copy, forms, admin UI — readability over ornamentation.
- **Devanagari (Hindi/Marathi)**: a matching-weight, well-hinted Devanagari sans (e.g., Noto Sans Devanagari or Baloo family) paired carefully against the Latin choices for visual parity — this needs explicit design QA, Devanagari webfont pairing is frequently an afterthought and it shows.
- Type scale: modest number of steps (e.g., 12/14/16/18/24/32/48/64), consistent across locales even though Devanagari glyphs run visually larger at the same font-size — compensate with locale-specific line-height rather than font-size.

---

## 28. Color System

- **Base**: Ivory/off-white (#FAF7F2-ish) background, near-black (#1A1512-ish) text — warm neutrals, not stark white/black.
- **Primary accent**: Deep maroon/oxblood (echoes the storefront's festive drapery) for CTAs, highlights.
- **Metallic accent**: Muted gold, used sparingly — borders, dividers, icon accents — never as large background fills (reads cheap/gaudy at scale, the opposite of luxury).
- **Semantic**: Success/new-enquiry green, alert amber for admin (rate not yet updated today, etc.) — kept muted, on-brand, not default-bright.
- Contrast-checked explicitly against WCAG AA for all text/background combinations, especially gold-on-ivory.

---

## 29. Image Strategy

- Real product photography exclusively; no stock imagery anywhere on the storefront.
- Standardized shoot setup documented for staff: consistent background (soft white for catalogue, optional dark/moody for hero/editorial), consistent lighting, multiple angles per product (front, angle, worn/scale reference where feasible).
- Responsive image delivery via Next/Image (AVIF/WebP, multiple breakpoints), lazy-loaded below the fold.
- Hero/storefront photography (like the existing shopfront image) used prominently on About/Home for authenticity and local recognition.
- Upgrade path: 360°/zoom photography via Cloudinary or a dedicated product-photography vendor once volume justifies the investment (v1.1+).

---

## 30. Responsive Strategy / Mobile-First Guidelines

- Designed mobile-first: the overwhelming majority of local discovery traffic (Google Maps → site) will be mobile.
- Breakpoints: mobile (base) → tablet (768px) → desktop (1024px+) → large desktop (1440px+), Tailwind defaults.
- Sticky, always-reachable primary CTA on mobile product pages ("WhatsApp Enquiry" / "Call Store") — this is the conversion moment and must never require scrolling to find.
- Admin panel also tested on tablet (showroom counter use case), not just desktop.
- Touch targets ≥44px throughout, no hover-dependent functionality (no information hidden exclusively behind `:hover`).

---

## 31. Backend Architecture

- Next.js Server Components for all read paths (catalogue, product detail) — direct DB reads via Prisma, no separate REST/GraphQL layer needed for v1.
- Server Actions for all admin writes (product CRUD, rate updates, enquiry status changes) — colocated with the UI that calls them, validated with Zod.
- A small set of true API routes reserved for: webhook receivers (future WhatsApp Business API, future payment webhooks), and any endpoint that must be called from outside the Next.js app itself.
- Pricing calculation isolated in `/lib/pricing` as pure functions — the same logic used server-side for rendering and (later) reused unchanged for cart/checkout in the ecommerce phase.

---

## 32. API Structure (for the future-facing API routes only)

```
POST   /api/enquiries              Public — create enquiry (rate-limited)
POST   /api/webhooks/whatsapp      Future — inbound WhatsApp Business events
GET    /api/rates/current          Public, cached — powers the rate ticker if client-side fetch is needed
```

Everything else deliberately stays inside Server Components/Actions rather than a public API — minimizes attack surface and avoids building REST endpoints that aren't needed until true third-party/mobile-app consumers exist.

---

## 33. State Management

- Server state is the source of truth (DB via Server Components) — minimal client state needed by design.
- Client-side state limited to: locale preference, shortlist/wishlist (local storage, no login in v1), UI state (gallery index, accordion open/closed, form state via React Hook Form).
- No global client state library (Redux/Zustand) needed at this scope — would be premature; revisit only if the ecommerce phase introduces genuinely complex client-side cart state.

---

## 34. Authentication

- **v1**: Auth.js (NextAuth) passwordless/magic-link for `AdminUser` only. No customer-facing auth.
- **v2 (commerce-ready)**: Add customer accounts — likely still Auth.js, extended with credential/social login.
- **v4 (SaaS)**: Migrate/extend to an org-aware provider (Clerk or Auth0, both available via Vercel Marketplace/partner integrations) for multi-tenant role management (store-owner vs staff vs platform-admin).

---

## 35. Authorization

- v1 roles: `owner` (full access incl. settings) and `staff` (products, rates, enquiries — not settings/users).
- Every Server Action re-checks role server-side; UI-level hiding is a convenience, never the enforcement point.
- `tenantId` scoping enforced at the query layer (a shared Prisma query wrapper) from day one, so the eventual multi-tenant SaaS phase can't leak data across tenants by omission.

---

## 36. Media Storage

- Vercel Blob for v1 — zero extra vendor, integrated billing/deployment, sufficient for photo-based (non-video, non-360°) catalogue imagery.
- Revisit Cloudinary (or similar) when advanced needs arise: 360° spins, AI background removal, video, on-the-fly watermarking — flagged as a v1.1+ decision, not a launch blocker.

---

## 37. Deployment Plan

- Vercel project linked to the Git repository; every PR gets a preview deployment for stakeholder review before merge.
- `main` branch auto-deploys to production.
- Environments: Development (local), Preview (per-PR), Production.
- Database migrations (Prisma) run as an explicit, reviewed step in the deploy pipeline — never auto-applied silently against production data.
- Domain: client to acquire/confirm a domain (e.g., `shreeambikajewellers.com` or similar); DNS pointed at Vercel.

---

## 38. Testing Plan

- **Unit**: pricing calculation logic (`/lib/pricing`) — this is the highest-stakes logic in the app (customer-facing prices) and gets the most rigorous test coverage, including edge cases (zero making charge, percentage vs flat, rate not yet set for the day).
- **Integration**: Server Actions (product CRUD, rate update, enquiry creation) against a test database.
- **E2E** (Playwright): critical customer journeys (browse → product detail → WhatsApp CTA fires correctly with right prefilled message) and critical admin journeys (update rate → price reflects on storefront; add product → appears in catalogue).
- **Visual/manual QA**: explicit Devanagari rendering check (Hindi/Marathi) on real devices, not just browser emulation.
- **Accessibility**: automated (axe) in CI + manual keyboard-only pass before launch.

---

## 39. Coding Standards

- TypeScript strict mode throughout, no `any` without justification.
- ESLint + Prettier enforced in CI, not just locally.
- Shared Zod schemas between form validation and Server Action input validation — one source of truth per data shape.
- Components kept small and colocated with their route where not genuinely shared; shared primitives live in `/components/ui`.
- No premature abstraction — this document intentionally scopes v1 tightly; do not build multi-tenant UI, cart logic, or payment scaffolding now just because the roadmap mentions it later.

---

## 40. Git Workflow

- Trunk-based with short-lived feature branches, PR review before merge to `main`.
- Conventional commit messages (`feat:`, `fix:`, `chore:`) to keep history and future changelog generation clean.
- Preview deployments (Vercel) serve as the review environment — no separate staging server needed at this scale.

---

## 41. Documentation Strategy

- `README.md`: setup, environment variables, local dev instructions.
- `/docs` (lightweight): pricing-calculation rules (business logic reference), admin user guide (screenshots, in plain language, possibly the single most important doc given the non-technical admin persona), content/photography guidelines for staff.
- Inline code comments reserved for non-obvious business rules only (e.g., why price is computed rather than stored) — not restating what the code already says.

---

## 42. Error Handling

- User-facing: friendly, localized error states (form submission failure, image upload failure) — never raw stack traces or English-only errors on a trilingual site.
- Admin-facing: specific, actionable messages ("Rate must be greater than 0", not "Validation failed").
- Server Actions return typed result objects (`{success, error}`) rather than throwing across the client/server boundary where avoidable, for predictable UI handling.
- Graceful degradation: if the day's metal rate hasn't been set yet, product pages show "Price on request" rather than breaking or showing ₹0.

---

## 43. Logging

- Vercel's built-in function/runtime logs for request-level visibility at this scale — no need for a dedicated logging vendor in v1.
- Structured audit log (DB table) specifically for price-affecting admin actions (`MetalRate` changes, `Product` making-charge edits) — business-critical traceability distinct from general app logs.
- No customer PII logged beyond what's explicitly submitted via the enquiry form, and only where necessary for follow-up.

---

## 44. Monitoring

- Vercel Analytics + Speed Insights for Core Web Vitals tracking in production (ties directly back to the Performance/SEO strategy).
- Uptime/error monitoring via Vercel's built-in observability at this scale; revisit a dedicated APM (e.g., Sentry) if error volume/complexity grows post-launch.
- A simple weekly-glance admin metric worth adding early: enquiry volume and source breakdown, so the owner can see the site is generating leads.

---

## 45. Future SaaS Architecture

The single-tenant v1 is deliberately built on multi-tenant-shaped foundations so the SaaS phase is additive:

- **Data layer**: `tenantId` already present on every table (§12) — SaaS phase adds a tenant-provisioning flow and a tenant-scoped query middleware layer, not a schema redesign.
- **Auth**: migrate from single-store Auth.js to an org-aware provider (Clerk/Auth0) supporting `tenant → users → roles`.
- **Theming**: the design system (§14, §26–29) is already token-based (colors/type/spacing as design tokens) — white-labeling becomes swapping token values per tenant rather than rebuilding UI.
- **Billing**: add a `Subscription`/`Plan` entity and Stripe (or Razorpay for India-first billing) integration, gated behind a platform-admin role that doesn't exist in v1.
- **Deployment model**: likely a single Next.js app serving all tenants by subdomain/custom-domain routing (Vercel supports this natively), rather than one deployment per tenant — keeps operational overhead low as tenant count grows.
- **Go-to-market**: v1's build, for this specific client, effectively becomes the flagship reference implementation/case study for selling the SaaS product to other regional jewellers.

---

## Open Items for Client Confirmation (not blocking this document, but needed before build starts)

- Final domain name.
- Final category taxonomy (exact collections the store wants featured, e.g., Bridal, Antique/Temple, Daily Wear, Diamond, Silver).
- Who will supply/shoot initial product photography, and by when.
- WhatsApp Business number to use for enquiry CTAs.
- Whether BIS Hallmark / certification details should be displayed per-product or store-wide.

---

## Next Step

This document is Phase 0 deliverable only — **no code has been written**. Upon your approval, Phase 1 will begin: scaffolding the Next.js project, Prisma schema, and design system foundations described above.

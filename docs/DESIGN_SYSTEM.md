# Shree Ambika Jewellers — Design System Reference
## Phase 2 Deliverable

This is the implementation map for the Phase 2 design system: every item on the brief, the token/component that satisfies it, and where to find it. Nothing here builds a page — this is the reusable foundation pages will be assembled from in Phase 3.

**Inspiration synthesis**: Apple/Tiffany/Cartier restraint (generous whitespace, photography-led, metallic accent used sparingly, never as a fill) + Awwwards/Studio Freight/Lusion motion craft (Lenis smooth scroll, expo-out easing, scroll reveals, no gratuitous parallax or auto-playing carousels). See [PRD.md §14](PRD.md) for the full design-language rationale.

---

## Layout Primitives

| Item | Token / Utility | Component | File |
|---|---|---|---|
| Grid System | `--grid-columns`, `--grid-gutter`, `.grid-luxury` (12-col raw grid) | `<Grid>` (opinionated N-up card grid) | [app/globals.css](../app/globals.css), [components/common/grid.tsx](../components/common/grid.tsx) |
| Container Widths | `--container-content` (1200px) / `--container-wide` (1440px) / `--container-narrow` (720px) | `<Container width="content" \| "wide" \| "narrow">` | [components/common/container.tsx](../components/common/container.tsx) |
| Padding Rules | `--container-padding-mobile/tablet/desktop` (16/24/32px), applied via `.container-luxury` | `<Container>` | same |
| Margin System | `--space-section-sm/md/lg` (48/64/96px), applied via `.section` / `.section--lg` | — (utility classes, apply directly to section wrappers) | [app/globals.css](../app/globals.css) |
| Spacing Scale (sub-section) | Tailwind's default 4px-based scale, used directly (`gap-4`, `p-6`, etc.) — no separate token needed below section level | — | n/a |
| Border Radius | `--radius-sm` → `--radius-4xl`, derived from `--radius: 0.625rem` | shadcn primitives (Card, Button, Dialog...) all consume these | [app/globals.css](../app/globals.css) |

## Color System

| Item | Where |
|---|---|
| Color Tokens (light + dark) | `:root` / `.dark` blocks — ivory/near-black base, oxblood `--primary`, muted gold `--gold` — OKLCH throughout | [app/globals.css](../app/globals.css) |
| Gold Gradients | `.gradient-gold` (fills), `.text-gradient-gold` (text), `--shadow-gold` | [app/globals.css](../app/globals.css) |
| JS-side color mirror (Recharts/R3F, which can't read CSS vars) | `THEME_COLORS`, `CHART_PALETTE` | [config/theme.config.ts](../config/theme.config.ts) |
| Dark Mode / Light Mode | `next-themes`, class-based (`.dark`), system-aware, no FOUC (`disableTransitionOnChange`) | [providers/theme-provider.tsx](../providers/theme-provider.tsx), [components/common/theme-toggle.tsx](../components/common/theme-toggle.tsx) |

## Typography

| Item | Where |
|---|---|
| Typography Scale | `--text-display-sm/md/lg/xl` (display sizes) + Tailwind's default text scale for body | [app/globals.css](../app/globals.css) |
| Fonts | Cormorant Garamond (headings, Latin) + Geist (body/UI) + Noto Sans Devanagari (Hindi/Marathi headings, paired weight-for-weight) | [app/layout.tsx](../app/layout.tsx) |
| Devanagari fallback rule | `:lang(hi) h1...`/`:lang(mr) h1...` swap to the Devanagari font stack | [app/globals.css](../app/globals.css) |

## Surfaces & Depth

| Item | Where |
|---|---|
| Shadow System | `--shadow-xs` → `--shadow-xl`, warm-tinted (never pure black), plus `--shadow-gold` | [app/globals.css](../app/globals.css) |
| Glassmorphism | `.glass` (blur + saturate + translucent bg/border, theme-aware via `--glass-bg`/`--glass-border`) | [app/globals.css](../app/globals.css), used in `MegaMenu` |
| Shimmer Effects | `.shimmer` (animated highlight sweep, respects `prefers-reduced-motion`) | [app/globals.css](../app/globals.css), used by every skeleton |
| Hover States | Card lift (`whileHover={{ y: -4 }}`), link underline/color shifts, button brightness — never color inversion | `ProductCard`, `CollectionCard`, nav links |
| Focus States | `.focus-luxury` (gold-ring focus), shadcn's built-in `focus-visible` rings on all primitives | [app/globals.css](../app/globals.css) |

## Component Library

| Category | Components |
|---|---|
| Buttons | `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`, **`gold`**, **`outline-gold`** variants | [components/ui/button.tsx](../components/ui/button.tsx) |
| Badges | `default`, `secondary`, `destructive`, `outline`, **`gold`**, **`success`** | [components/ui/badge.tsx](../components/ui/badge.tsx) |
| Cards | shadcn `Card` primitive + domain cards: `ProductCard` (image, live price, shortlist heart), `CollectionCard` (editorial full-bleed tile) | [components/storefront/](../components/storefront/) |
| Forms / Inputs / Dropdowns | `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `DropdownMenu`, `Form` (React Hook Form + Zod wired) | [components/ui/](../components/ui/) |
| Dialogs / Drawer | `Dialog`, `AlertDialog`, `Sheet`, `Drawer` | [components/ui/](../components/ui/) |
| Navbar / Mega Menu | Sticky header, hover-triggered mega menu (Redux-driven), call CTA | [components/layout/navbar.tsx](../components/layout/navbar.tsx), [mega-menu.tsx](../components/layout/mega-menu.tsx) |
| Footer | Store info, nav, rating, address | [components/layout/footer.tsx](../components/layout/footer.tsx) |
| Mobile Navigation | Full sheet nav, triggered from Zustand `isMobileNavOpen` | [components/layout/mobile-nav.tsx](../components/layout/mobile-nav.tsx) |
| Bottom Navigation | Fixed mobile tab bar, active-route aware, safe-area aware | [components/layout/bottom-nav.tsx](../components/layout/bottom-nav.tsx) |
| Price Breakdown | Transparent weight/making/GST accordion (the PRD's core trust mechanic) | [components/storefront/price-breakdown.tsx](../components/storefront/price-breakdown.tsx) |
| Carousel | Embla wrapper — arrows, dots, no autoplay | [components/common/carousel.tsx](../components/common/carousel.tsx) |
| Data Table | TanStack Table — sorting, filtering, pagination (admin screens) | [components/common/data-table.tsx](../components/common/data-table.tsx) |
| Chart | Recharts, gold-themed | [components/common/trend-chart.tsx](../components/common/trend-chart.tsx) |
| 3D Viewer | React Three Fiber + Drei canvas wrapper (placeholder mesh until real product models exist) | [components/three/product-viewer-canvas.tsx](../components/three/product-viewer-canvas.tsx) |
| Skeletons | Product card, category card, table, text — all `.shimmer`-enabled | [components/skeletons/](../components/skeletons/) |
| Loading Animation | Gold-ring `Loader` | [components/common/loader.tsx](../components/common/loader.tsx) |

## Motion

| Item | Where |
|---|---|
| Motion Curves | `EASING.out/in/inOut` (cubic-bezier), `DURATION.fast/base/slow/slower` | [lib/motion/easings.ts](../lib/motion/easings.ts) |
| Animations | `<Reveal>` (scroll-triggered, staggered), `<FadeIn>` (on-mount) | [components/motion/](../components/motion/) |
| Cursor Effects | `<CustomCursor>` — gold dot that magnifies on hover, fine-pointer only, never replaces the native cursor | [components/motion/custom-cursor.tsx](../components/motion/custom-cursor.tsx) |
| Micro Interactions | Card hover-lift, shortlist heart toggle, button press (built into shadcn Button), accordion expand | throughout `components/storefront/`, `components/ui/button.tsx` |
| Luxury Scroll Behavior | Lenis, expo-out easing, `lerp: 0.1` | [providers/smooth-scroll-provider.tsx](../providers/smooth-scroll-provider.tsx) |

All motion respects `prefers-reduced-motion` (PRD §19/§25) — `Reveal`/`FadeIn` skip the transform via `useReducedMotion()`, `.shimmer` disables its animation outright.

---

## What's deliberately not here

- No literal `<GridSystem>` demo page or Storybook — "do not build pages" per your instruction. Every primitive above is proven working inside the components that already consume it (`Navbar`/`Footer`/`MegaMenu` all use `<Container>`; skeleton grids use `<Grid>`).
- No component variants for states that don't exist yet in the data model (e.g. no "out of stock" badge — the PRD's v1 has no inventory tracking).

## Next step

Phase 4 (actual pages) will consume this system rather than inventing new tokens — any new visual need should extend `app/globals.css` tokens or the components above, not introduce one-off styles.

---

# Phase 3 Deliverable — Experience & Motion System

Every primitive below animates only `opacity`/`transform` (translate, scale, rotate) or `clip-path` — properties the compositor can handle without triggering layout or paint on the main thread — so the system stays 60fps-safe by construction, not by luck. Every interactive one respects `prefers-reduced-motion` (verified live: this sandbox's browser runs with OS-level reduced motion on, and every primitive correctly fell back to its static end-state with zero console errors).

| Item | Component / Hook | File |
|---|---|---|
| Page transitions / Route transitions | Removed for performance — `app/template.tsx` forced a full page-tree remount on every navigation just to key a ~400ms enter-fade, adding a flat delay to every page load with no functional benefit. Pages now render immediately via the normal `app/layout.tsx`. | — |
| Section reveal animations | `<Reveal direction="up\|left\|right\|scale\|fade">` | [components/motion/reveal.tsx](../components/motion/reveal.tsx) |
| Hero animations | `<HeroReveal>`/`<HeroRevealItem>` (staggered stack), `<HeroHeading>` (word-by-word masked reveal) | [components/motion/hero-reveal.tsx](../components/motion/hero-reveal.tsx) |
| Magnetic buttons | `<Magnetic>` — spring-driven pointer-follow, desktop/mouse only | [components/motion/magnetic-button.tsx](../components/motion/magnetic-button.tsx) |
| Mouse lighting | `<MouseGlow>` — cursor-tracked radial glow via `useMotionTemplate` | [components/motion/mouse-glow.tsx](../components/motion/mouse-glow.tsx) |
| Parallax | `<Parallax offset>` | [components/motion/parallax.tsx](../components/motion/parallax.tsx) |
| Scroll storytelling | `<ScrollStory>` + `<ScrollStory.Step range={[start,end]}>` | [components/motion/scroll-story.tsx](../components/motion/scroll-story.tsx) |
| Luxury easing | `EASING.out/in/inOut`, `DURATION.*` | [lib/motion/easings.ts](../lib/motion/easings.ts) |
| Stagger animations | `<Stagger>`/`<StaggerItem>`, `staggerContainer()` | [components/motion/stagger.tsx](../components/motion/stagger.tsx), [lib/motion/variants.ts](../lib/motion/variants.ts) |
| Floating particles | `<FloatingParticles>` — client-generated (hydration-safe), capped count | [components/motion/floating-particles.tsx](../components/motion/floating-particles.tsx) |
| 3D object interactions | `<ProductViewerCanvas>` (R3F/Drei, from Phase 1) | [components/three/product-viewer-canvas.tsx](../components/three/product-viewer-canvas.tsx) |
| Hover transformations | `<TiltCard>` — pointer-tracked 3D tilt via CSS `perspective`/`rotateX/Y` | [components/motion/tilt-card.tsx](../components/motion/tilt-card.tsx) |
| Glass reflections | `.glass-reflect` (diagonal sweep on hover) | [app/globals.css](../app/globals.css) |
| Gold shimmer | `.shimmer-gold` | [app/globals.css](../app/globals.css) |
| Animated gradients | `.gradient-gold-animated` | [app/globals.css](../app/globals.css) |
| Smooth scrolling | Lenis, from Phase 2 | [providers/smooth-scroll-provider.tsx](../providers/smooth-scroll-provider.tsx) |
| Loading experience | `<PagePreloader>` — branded cold-start overlay (not `<Loader>`, which is the in-page async spinner) | [components/motion/page-preloader.tsx](../components/motion/page-preloader.tsx) |
| Image reveal animations | `<ImageReveal>` — `clip-path` wipe on scroll into view | [components/motion/image-reveal.tsx](../components/motion/image-reveal.tsx) |
| Product hover effects | `ProductCard` — crossfades to a second photo angle on hover, wrapped shortlist button is `<Magnetic>` | [components/storefront/product-card.tsx](../components/storefront/product-card.tsx) |
| Collection transitions | `CollectionCard` — `<ImageReveal>` entrance + `<MouseGlow>` hover | [components/storefront/collection-card.tsx](../components/storefront/collection-card.tsx) |
| Mobile gestures | `useSwipe()` (touch-direction hook) + `<Swipeable>` (Motion drag, elastic snap-back) | [hooks/use-swipe.ts](../hooks/use-swipe.ts), [components/common/swipeable.tsx](../components/common/swipeable.tsx) |

**Shared foundations** feeding all of the above: `useMousePosition()` (Motion-value pointer tracking, zero re-renders), `useScrollProgress()` (scoped `useScroll` wrapper, optional spring smoothing) — [hooks/use-mouse-position.ts](../hooks/use-mouse-position.ts), [hooks/use-scroll-progress.ts](../hooks/use-scroll-progress.ts).

**Verified in-browser**: `ProductCard` + `CollectionCard` (with `Magnetic`, `TiltCard`, `MouseGlow`, `ImageReveal`, `HeroHeading`, `FloatingParticles` all composed together) were temporarily mounted with mock data, screenshotted, and checked for console errors — zero errors, correct static rendering, correct reduced-motion fallback — then the test page was reverted. `typecheck`/`lint`/`build` all pass clean.

## Next step

Phase 4 (actual pages) assembles these motion primitives around real content — still nothing to build until you approve.

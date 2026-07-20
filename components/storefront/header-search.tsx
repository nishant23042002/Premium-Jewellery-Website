"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Loader2, Search, TrendingUp, X } from "lucide-react";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getProductsByIds,
  listProducts,
  type ProductWithPrice,
} from "@/features/products/product.actions";
import {
  getPopularSearches,
  logSearchQuery,
  type PopularSearch,
} from "@/features/search-analytics/search-query.actions";
import { useRecentlyViewedStore } from "@/store/zustand/use-recently-viewed-store";
import { useRecentSearchesStore } from "@/store/zustand/use-recent-searches-store";
import { useDebounce } from "@/hooks/use-debounce";
import { formatINR } from "@/lib/utils/format";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import type { Locale } from "@/types/common";

const RESULT_LIMIT = 6;
const SUGGESTION_LIMIT = 4;
const MIN_TRACKED_QUERY_LENGTH = 2;
// Deliberately much slower than the 250ms results debounce below — that one
// exists to keep the dropdown feeling live as you type. This one decides
// what counts as a "real" search worth remembering. At 250ms, nearly every
// keystroke of an average typing pace settles and gets tracked, which is why
// "recent searches" and the admin's search-analytics tables used to fill up
// with every partial fragment ("w", "wa", "wat", "watc", ...). Waiting for a
// longer pause means only searches the visitor actually paused/finished on
// get recorded.
const TRACK_DEBOUNCE_MS = 650;

function ProductRow({
  product,
  price,
  onNavigate,
  locale,
}: {
  product: ProductWithPrice["product"];
  price: ProductWithPrice["price"];
  onNavigate: () => void;
  locale: Locale;
}) {
  return (
    <Link
      href={ROUTES.product(product.slug)}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.images[0] && (
          <ImageWithFallback
            src={product.images[0].url}
            alt={product.images[0].altText?.en ?? product.name.en}
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name.en}</p>
        <p className="text-xs text-muted-foreground">
          {price.isRatePending
            ? t("priceOnRequest", locale)
            : formatINR(price.total)}
        </p>
      </div>
    </Link>
  );
}

/** Shown when a query has zero matches — offers popular-search terms (excluding the failed query itself) as a next step instead of a dead end. */
function NoResultsSuggestions({
  query,
  popularSearches,
  onSelect,
  locale,
}: {
  query: string;
  popularSearches: PopularSearch[];
  onSelect: (query: string) => void;
  locale: Locale;
}) {
  const suggestions = popularSearches.filter(
    (p) => p.query.toLowerCase() !== query.toLowerCase(),
  );

  return (
    <div className="py-6 text-center">
      <p className="text-sm text-muted-foreground">
        {t("noResultsFor", locale)} &ldquo;{query}&rdquo;.
      </p>
      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("tryOneOfTheseInstead", locale)}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.query}
                type="button"
                onClick={() => onSelect(suggestion.query)}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs capitalize transition-colors hover:border-gold/40 hover:bg-gold/5"
              >
                <TrendingUp className="size-3 text-gold-dark" />
                {suggestion.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface HeaderSearchProps {
  /**
   * "icon" (default) — the desktop icon button that toggles a floating
   * dropdown, anchored top-right. "bar" — an always-visible full-width
   * input (the mobile row shown directly under the header), with the same
   * results panel opening below it on focus/typing instead of being
   * triggered by a separate icon click.
   */
  variant?: "icon" | "bar";
  className?: string;
  locale?: Locale;
}

/**
 * Inline live-search dropdown — types directly into a header popover/bar and
 * results filter in place, e-commerce-style. This is the only search surface
 * on the site (there's no standalone /search results page), so the preview
 * list is the whole experience rather than a teaser for a "view all" page.
 */
export function HeaderSearch({
  variant = "icon",
  className,
  locale = "en",
}: HeaderSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductWithPrice[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<ProductWithPrice[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [trending, setTrending] = useState<ProductWithPrice[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 250);
  const trackDebouncedQuery = useDebounce(query, TRACK_DEBOUNCE_MS);
  // Last query this component actually logged, so a longer pause on the
  // same finished word (or an Enter press right before the debounce fires)
  // never double-records it. Reset whenever the field is cleared, so
  // re-searching the same term later in a fresh typing burst still counts.
  const lastTrackedRef = useRef("");
  // Most recent {query, total} the live results fetch resolved — read by
  // the tracking effect so a genuinely zero-result search can still be
  // tallied as such without re-fetching just to log it.
  const lastFetchRef = useRef<{ query: string; total: number } | null>(null);
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.productIds);
  const recentSearches = useRecentSearchesStore((s) => s.queries);
  const trackRecentSearch = useRecentSearchesStore((s) => s.track);
  const removeRecentSearch = useRecentSearchesStore((s) => s.remove);
  const clearRecentSearches = useRecentSearchesStore((s) => s.clear);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Suggestions shown before the user types anything — fetched once per
  // open rather than on mount, so a header that's never clicked never hits
  // the DB for them.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const viewedIds = recentlyViewedIds.slice(0, SUGGESTION_LIMIT);
    Promise.all([
      viewedIds.length > 0 ? getProductsByIds(viewedIds) : Promise.resolve([]),
      getPopularSearches(5),
      listProducts({ featuredOnly: true, pageSize: SUGGESTION_LIMIT }),
    ]).then(([viewed, popular, trendingResult]) => {
      if (cancelled) return;
      // getProductsByIds doesn't preserve input order — reorder so the most
      // recently viewed product shows first.
      const viewedById = new Map(viewed.map((v) => [v.product.id, v]));
      setRecentlyViewed(
        viewedIds
          .map((id) => viewedById.get(id))
          .filter((v): v is ProductWithPrice => v !== undefined),
      );
      setPopularSearches(popular);
      setTrending(trendingResult.items);
    });
    return () => {
      cancelled = true;
    };
  }, [open, recentlyViewedIds]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Records a query as a "real" search — into the local recent-searches
  // store and the server-side popular/zero-result search analytics. Called
  // from the slow-settle debounce below and immediately on Enter, never
  // from the fast results debounce (that one just drives the live dropdown).
  const commitSearch = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed.length < MIN_TRACKED_QUERY_LENGTH) return;
      if (lastTrackedRef.current.toLowerCase() === trimmed.toLowerCase()) {
        return;
      }
      lastTrackedRef.current = trimmed;
      trackRecentSearch(trimmed);
      const matched = lastFetchRef.current;
      logSearchQuery(
        trimmed,
        matched?.query.toLowerCase() === trimmed.toLowerCase()
          ? matched.total
          : undefined,
      );
    },
    [trackRecentSearch],
  );

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setIsLoading(false);
      lastTrackedRef.current = "";
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    listProducts({ query: trimmed, pageSize: RESULT_LIMIT })
      .then((result) => {
        if (cancelled) return;
        setResults(result.items);
        setTotal(result.total);
        lastFetchRef.current = { query: trimmed, total: result.total };
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Only fires once the visitor has paused on a query for TRACK_DEBOUNCE_MS —
  // the actual "commit" point for recent-searches/analytics tracking.
  useEffect(() => {
    commitSearch(trackDebouncedQuery);
  }, [trackDebouncedQuery, commitSearch]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  const trimmedQuery = query.trim();

  const inputField = (
    <div className="relative">
      {variant === "bar" && (
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={variant === "bar" ? () => setOpen(true) : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitSearch(query);
        }}
        placeholder={t("searchByNameTagSku", locale)}
        className={cn(
          "pr-8",
          variant === "bar" && "rounded-full border-transparent bg-muted pl-9",
        )}
      />
      {query && (
        <button
          type="button"
          aria-label={t("clearSearch", locale)}
          onClick={() => setQuery("")}
          className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        variant === "bar" && "relative w-full",
        className,
      )}
    >
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-full border border-transparent hover:border-border sm:inline-flex"
          aria-label="Search"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Search className="size-4" />
        </Button>
      ) : (
        inputField
      )}

      {open && variant === "icon" && (
        // Anchored to the sticky <header> (the nearest positioned ancestor,
        // since this wrapper is no longer `relative`) instead of this tiny
        // icon's own box — inset-x-0 + justify-end + px-4 keeps it clamped
        // to the viewport at every width, so it can never overflow off-screen
        // the way anchoring to the icon itself did on narrower desktop/tablet
        // widths where the icon sits left-of-center in the header.
        <div className="absolute inset-x-0 top-full z-50 mt-2 flex justify-end px-4">
          <div className="w-[min(44rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
            <div className="border-b border-border p-4">{inputField}</div>

            <div className="max-h-[32rem] overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : !trimmedQuery ? (
                recentSearches.length > 0 ||
                recentlyViewed.length > 0 ||
                popularSearches.length > 0 ||
                trending.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-[minmax(0,11rem)_1fr]">
                    <div className="space-y-5">
                      {recentSearches.length > 0 && (
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-1.5">
                            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                              <Clock className="size-3" />
                              {t("recentSearches", locale)}
                            </p>
                            <button
                              type="button"
                              onClick={clearRecentSearches}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              {t("clear", locale)}
                            </button>
                          </div>
                          <ul className="space-y-1">
                            {recentSearches.map((recent) => (
                              <li key={recent} className="group flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setQuery(recent)}
                                  className="flex-1 truncate rounded-md px-1.5 py-1 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                  {recent}
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Remove "${recent}" from recent searches`}
                                  onClick={() => removeRecentSearch(recent)}
                                  className="opacity-0 shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground group-hover:opacity-100"
                                >
                                  <X className="size-3" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {recentlyViewed.length > 0 && (
                        <div>
                          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            <Clock className="size-3" />
                            {t("continueBrowsing", locale)}
                          </p>
                          <ul className="space-y-1">
                            {recentlyViewed.map(({ product, price }) => (
                              <li key={product.id}>
                                <ProductRow
                                  product={product}
                                  price={price}
                                  onNavigate={close}
                                  locale={locale}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {popularSearches.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {t("popularSearches", locale)}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {popularSearches.map((popular) => (
                              <button
                                key={popular.query}
                                type="button"
                                onClick={() => setQuery(popular.query)}
                                className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs capitalize transition-colors hover:border-gold/40 hover:bg-gold/5"
                              >
                                <TrendingUp className="size-3 text-gold-dark" />
                                {popular.query}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {trending.length > 0 && (
                      <div className="border-t border-border pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
                        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {t("trendingProducts", locale)}
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {trending.map(({ product, price }) => (
                            <Link
                              key={product.id}
                              href={ROUTES.product(product.slug)}
                              onClick={close}
                              className="group rounded-lg p-1.5 transition-colors hover:bg-muted"
                            >
                              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                                {product.images[0] && (
                                  <ImageWithFallback
                                    src={product.images[0].url}
                                    alt={
                                      product.images[0].altText?.en ??
                                      product.name.en
                                    }
                                    fill
                                    sizes="140px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                )}
                              </div>
                              <p className="mt-1.5 truncate text-xs font-medium">
                                {product.name.en}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {price.isRatePending
                                  ? t("priceOnRequest", locale)
                                  : formatINR(price.total)}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("searchTryCategoryHint", locale)}
                  </p>
                )
              ) : results.length === 0 ? (
                <NoResultsSuggestions
                  query={trimmedQuery}
                  popularSearches={popularSearches}
                  onSelect={setQuery}
                  locale={locale}
                />
              ) : (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {results.map(({ product, price }) => (
                    <li key={product.id}>
                      <ProductRow
                        product={product}
                        price={price}
                        onNavigate={close}
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {trimmedQuery && total > results.length && (
              <p className="border-t border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
                Showing {results.length} of {total} —{" "}
                {t("showingXOfYRefine", locale)}
              </p>
            )}
          </div>
        </div>
      )}

      {open && variant === "bar" && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover p-3 shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : !trimmedQuery ? (
              <div className="space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-1.5 px-1">
                      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        <Clock className="size-3" />
                        {t("recentSearches", locale)}
                      </p>
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {t("clear", locale)}
                      </button>
                    </div>
                    <ul className="space-y-1">
                      {recentSearches.map((recent) => (
                        <li key={recent} className="group flex items-center">
                          <button
                            type="button"
                            onClick={() => setQuery(recent)}
                            className="flex-1 truncate rounded-md px-1.5 py-1 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {recent}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove "${recent}" from recent searches`}
                            onClick={() => removeRecentSearch(recent)}
                            className="opacity-0 shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground group-hover:opacity-100"
                          >
                            <X className="size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recentlyViewed.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <Clock className="size-3" />
                      {t("continueBrowsing", locale)}
                    </p>
                    <ul className="space-y-1">
                      {recentlyViewed.map(({ product, price }) => (
                        <li key={product.id}>
                          <ProductRow
                            product={product}
                            price={price}
                            onNavigate={close}
                            locale={locale}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {popularSearches.length > 0 && (
                  <div>
                    <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t("popularSearches", locale)}
                    </p>
                    <div className="flex flex-wrap gap-2 px-1">
                      {popularSearches.map((popular) => (
                        <button
                          key={popular.query}
                          type="button"
                          onClick={() => setQuery(popular.query)}
                          className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs capitalize transition-colors hover:border-gold/40 hover:bg-gold/5"
                        >
                          <TrendingUp className="size-3 text-gold-dark" />
                          {popular.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {trending.length > 0 && (
                  <div>
                    <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t("trendingProducts", locale)}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {trending.map(({ product, price }) => (
                        <Link
                          key={product.id}
                          href={ROUTES.product(product.slug)}
                          onClick={close}
                          className="group rounded-lg p-1.5 transition-colors hover:bg-muted"
                        >
                          <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                            {product.images[0] && (
                              <ImageWithFallback
                                src={product.images[0].url}
                                alt={
                                  product.images[0].altText?.en ??
                                  product.name.en
                                }
                                fill
                                sizes="140px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            )}
                          </div>
                          <p className="mt-1.5 truncate text-xs font-medium">
                            {product.name.en}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {price.isRatePending
                              ? t("priceOnRequest", locale)
                              : formatINR(price.total)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {recentSearches.length === 0 &&
                  recentlyViewed.length === 0 &&
                  popularSearches.length === 0 &&
                  trending.length === 0 && (
                    <p className="px-1 py-4 text-sm text-muted-foreground">
                      {t("searchTryCategoryHint", locale)}
                    </p>
                  )}
              </div>
            ) : results.length === 0 ? (
              <NoResultsSuggestions
                query={trimmedQuery}
                popularSearches={popularSearches}
                onSelect={setQuery}
                locale={locale}
              />
            ) : (
              <ul className="space-y-1">
                {results.map(({ product, price }) => (
                  <li key={product.id}>
                    <ProductRow
                      product={product}
                      price={price}
                      onNavigate={close}
                      locale={locale}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {trimmedQuery && total > results.length && (
            <p className="mt-2 py-2 text-center text-xs text-muted-foreground">
              Showing {results.length} of {total} —{" "}
              {t("showingXOfYRefine", locale)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

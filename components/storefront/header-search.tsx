"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Loader2, Search, TrendingUp, X } from "lucide-react";
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
import { useDebounce } from "@/hooks/use-debounce";
import { formatINR } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

const RESULT_LIMIT = 6;
const SUGGESTION_LIMIT = 4;

function ProductRow({
  product,
  price,
  onNavigate,
}: {
  product: ProductWithPrice["product"];
  price: ProductWithPrice["price"];
  onNavigate: () => void;
}) {
  return (
    <Link
      href={ROUTES.product(product.slug)}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.images[0] && (
          <Image
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
          {price.isRatePending ? "Price on request" : formatINR(price.total)}
        </p>
      </div>
    </Link>
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
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.productIds);

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

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    // Fire-and-forget — a settled 250ms debounce is a reasonable proxy for
    // "the user meant this term" now that there's no dedicated search-page
    // submit to hang this on.
    logSearchQuery(trimmed);
    listProducts({ query: trimmed, pageSize: RESULT_LIMIT })
      .then((result) => {
        if (cancelled) return;
        setResults(result.items);
        setTotal(result.total);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

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
        placeholder={
          variant === "bar"
            ? "Search for jewellery..."
            : "Search by name, tag, or SKU..."
        }
        className={cn(
          "pr-8",
          variant === "bar" && "rounded-full border-transparent bg-muted pl-9",
        )}
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
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
      className={cn("relative", variant === "bar" && "w-full", className)}
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
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(44rem,90vw)] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
          <div className="border-b border-border p-4">{inputField}</div>

          <div className="max-h-[32rem] overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : !trimmedQuery ? (
              recentlyViewed.length > 0 ||
              popularSearches.length > 0 ||
              trending.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-[minmax(0,11rem)_1fr]">
                  <div className="space-y-5">
                    {recentlyViewed.length > 0 && (
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          <Clock className="size-3" />
                          Continue Browsing
                        </p>
                        <ul className="space-y-1">
                          {recentlyViewed.map(({ product, price }) => (
                            <li key={product.id}>
                              <ProductRow
                                product={product}
                                price={price}
                                onNavigate={close}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {popularSearches.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Popular Searches
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
                        Trending Products
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
                                <Image
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
                                ? "Price on request"
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
                  Try searching for a category like &ldquo;bridal&rdquo; or a
                  metal type like &ldquo;gold&rdquo;.
                </p>
              )
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No results for &ldquo;{trimmedQuery}&rdquo;.
              </p>
            ) : (
              <ul className="grid gap-1 sm:grid-cols-2">
                {results.map(({ product, price }) => (
                  <li key={product.id}>
                    <ProductRow
                      product={product}
                      price={price}
                      onNavigate={close}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {trimmedQuery && total > results.length && (
            <p className="border-t border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
              Showing {results.length} of {total} — refine your search to narrow
              it down.
            </p>
          )}
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
                {recentlyViewed.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <Clock className="size-3" />
                      Continue Browsing
                    </p>
                    <ul className="space-y-1">
                      {recentlyViewed.map(({ product, price }) => (
                        <li key={product.id}>
                          <ProductRow
                            product={product}
                            price={price}
                            onNavigate={close}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {popularSearches.length > 0 && (
                  <div>
                    <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Popular Searches
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
                      Trending Products
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
                              <Image
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
                              ? "Price on request"
                              : formatINR(price.total)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {recentlyViewed.length === 0 &&
                  popularSearches.length === 0 &&
                  trending.length === 0 && (
                    <p className="px-1 py-4 text-sm text-muted-foreground">
                      Try searching for a category like &ldquo;bridal&rdquo; or
                      a metal type like &ldquo;gold&rdquo;.
                    </p>
                  )}
              </div>
            ) : results.length === 0 ? (
              <p className="px-1 py-4 text-sm text-muted-foreground">
                No results for &ldquo;{trimmedQuery}&rdquo;.
              </p>
            ) : (
              <ul className="space-y-1">
                {results.map(({ product, price }) => (
                  <li key={product.id}>
                    <ProductRow
                      product={product}
                      price={price}
                      onNavigate={close}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {trimmedQuery && total > results.length && (
            <p className="mt-2 py-2 text-center text-xs text-muted-foreground">
              Showing {results.length} of {total} — refine your search to narrow
              it down.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

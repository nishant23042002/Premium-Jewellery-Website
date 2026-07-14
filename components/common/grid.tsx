import { cn } from "@/lib/utils";

interface GridProps extends React.ComponentProps<"div"> {
  /** Columns per breakpoint — defaults to a 2 / 3 / 4-up catalogue rhythm. */
  cols?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: "sm" | "md" | "lg";
}

const GAP_CLASSES = {
  sm: "gap-3",
  md: "gap-4 sm:gap-6",
  lg: "gap-4 lg:gap-8",
} as const;

// Full literal class strings per breakpoint — Tailwind's compiler only
// picks up classes that appear verbatim in source, so these can't be
// assembled at runtime via template strings (`sm:grid-cols-${n}` would be
// invisible to it and silently produce no CSS).
const BASE_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};
const SM_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};
const MD_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};
const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};
const XL_COLS: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
};

/**
 * Responsive CSS grid for catalogue/collection layouts (Phase 2 "Grid
 * System"). For a raw 12-column layout grid instead, use the
 * `.grid-luxury` utility class (app/globals.css) with `col-span-*`
 * children — this component is the opinionated "N-up card grid" case,
 * which is what ProductGrid/CollectionGrid actually need.
 */
export function Grid({
  cols = { base: 2, sm: 3, lg: 4 },
  gap = "md",
  className,
  ...props
}: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        cols.base && BASE_COLS[cols.base],
        cols.sm && SM_COLS[cols.sm],
        cols.md && MD_COLS[cols.md],
        cols.lg && LG_COLS[cols.lg],
        cols.xl && XL_COLS[cols.xl],
        GAP_CLASSES[gap],
        className,
      )}
      {...props}
    />
  );
}

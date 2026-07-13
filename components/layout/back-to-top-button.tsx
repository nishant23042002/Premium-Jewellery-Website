"use client";

import { ArrowUp } from "lucide-react";

/** Small, isolated client boundary so the rest of the footer can stay a Server Component. */
export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="focus-luxury group flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/40 hover:text-gold"
    >
      Back to top
      <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}

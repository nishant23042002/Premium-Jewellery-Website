"use client";

import NextTopLoader from "nextjs-toploader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { ReduxProvider } from "@/store/redux/provider";
import { SmoothScrollProvider } from "@/providers/smooth-scroll-provider";
import { CustomCursor } from "@/components/motion/custom-cursor";
import { LenisResizeOnRouteChange } from "@/components/motion/lenis-resize-on-route-change";

/** Single composition root for every client-side provider (PRD §10/§33). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <ReduxProvider>
        <SmoothScrollProvider>
          <LenisResizeOnRouteChange />
          {/* Fires the instant a link is clicked/route change starts — the
              one piece of nav feedback that can't wait for a route's own
              loading.tsx, since that only appears once the destination
              segment starts rendering. Gives every click/tap an immediate
              response regardless of how long the navigation itself takes. */}
          <NextTopLoader
            color="var(--gold)"
            height={2}
            showSpinner={false}
            shadow="0 0 10px var(--gold), 0 0 5px var(--gold)"
          />
          <TooltipProvider delay={200}>
            {children}
            <CustomCursor />
            <Toaster richColors closeButton position="bottom-right" />
          </TooltipProvider>
        </SmoothScrollProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}

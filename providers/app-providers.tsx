"use client";

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

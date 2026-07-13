"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store/redux/store";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  // One store instance per mount (per browser tab), created lazily — never
  // shared across requests on the server (App Router SSR pitfall).
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}

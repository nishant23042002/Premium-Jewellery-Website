"use client";

import { useEffect, useState } from "react";

/** Guards client-only rendering (theme toggle, portals) against hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

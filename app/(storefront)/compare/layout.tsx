import type { Metadata } from "next";

// The page itself is a client component (localStorage-backed comparison
// state), so metadata can't be exported from page.tsx directly — this
// layout is the server-component wrapper that carries it instead. Personal,
// session-specific content with no unique value to a search result, so it's
// excluded from indexing rather than left to compete with real product pages.
export const metadata: Metadata = {
  title: "Compare Products",
  robots: { index: false, follow: true },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

// See compare/layout.tsx's comment — same reasoning, same fix (the page is
// a client component, so metadata has to live in this server-component
// wrapper), for the same kind of per-customer, non-indexable content.
export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: true },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/cart/cart.actions";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";

interface AddToCartButtonProps {
  productId: string;
}

/**
 * The "Order Now" CTA — only ever rendered for Made-to-Order products.
 * Ready-stock products are view-only (Reserve/Enquiry/WhatsApp still apply).
 * Not a form/dialog — one click adds a single unit and routes straight to
 * the cart, where quantity can be adjusted.
 */
export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      const result = await addToCart(productId, 1);
      if (!result.success) {
        toast.error("Couldn't add to cart", result.error);
        return;
      }
      router.push(ROUTES.cart);
    } catch {
      // requireCustomer() throws when not logged in — send them to sign in
      // and back to this exact product page rather than showing a raw error.
      router.push(`${ROUTES.accountLogin}?redirect=${pathname}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      variant="gold"
      className="w-full"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShoppingBag className="size-4" />
      )}
      Order Now
    </Button>
  );
}

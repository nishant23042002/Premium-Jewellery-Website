"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "@/features/cart/cart.actions";
import { isMadeToOrder } from "@/features/products/product.types";
import { useWishlistStore } from "@/store/zustand/use-wishlist-store";
import { formatINR } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { CartLine } from "@/features/cart/cart.types";

export function CartLineItem({ line }: { line: CartLine }) {
  const router = useRouter();
  const { product, quantity, lineTotal } = line;
  const coverImage = product.images[0];
  const isWishlisted = useWishlistStore((s) => s.has(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  async function handleQuantityChange(next: number) {
    const result = await updateCartItemQuantity(product.id, next);
    if (!result.success) {
      toast.error("Couldn't update quantity", result.error);
      return;
    }
    router.refresh();
  }

  async function handleRemove() {
    const result = await removeFromCart(product.id);
    if (!result.success) {
      toast.error("Couldn't remove item", result.error);
      return;
    }
    router.refresh();
  }

  async function handleMoveToWishlist() {
    toggleWishlist(product.id);
    const result = await removeFromCart(product.id);
    if (!result.success) {
      toast.error("Couldn't move item", result.error);
      return;
    }
    toast.success(
      "Moved to wishlist",
      "You can find it in your wishlist for later.",
    );
    router.refresh();
  }

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-b-0">
      <Link
        href={ROUTES.product(product.slug)}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        {coverImage && (
          <Image
            src={coverImage.url}
            alt={product.name.en}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={ROUTES.product(product.slug)}
            className="font-heading text-sm hover:text-gold-dark"
          >
            {product.name.en}
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            {!isWishlisted && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleMoveToWishlist}
                aria-label="Move to wishlist"
              >
                <Heart className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRemove}
              aria-label="Remove item"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {isMadeToOrder(product) ? (
          <AvailabilityBadge availability={product.availability} />
        ) : (
          <p className="text-xs text-muted-foreground">
            {product.purity} {product.metalType}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-border">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => handleQuantityChange(quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-4 text-center text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => handleQuantityChange(quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="size-3" />
            </Button>
          </div>
          <p className="text-sm font-semibold">{formatINR(lineTotal)}</p>
        </div>
      </div>
    </div>
  );
}

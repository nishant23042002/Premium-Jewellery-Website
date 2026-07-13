"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireCustomer } from "@/lib/auth/customer-session";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { WishlistModel } from "@/features/wishlist/wishlist.model";
import type { ActionResult } from "@/types/common";

/** Product ids the current customer has wishlisted. Returns an empty list if not logged in, rather than throwing — every caller treats "no wishlist" as a valid empty state. */
export async function getWishlistProductIds(): Promise<string[]> {
  const session = await (async () => {
    try {
      return await requireCustomer();
    } catch {
      return null;
    }
  })();
  if (!session) return [];

  await connectToDatabase();
  const wishlist = await WishlistModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
  })
    .select("items")
    .lean();
  if (!wishlist) return [];
  return wishlist.items.map((item) => String(item.productId));
}

/** Adds or removes a product from the customer's wishlist, returning the new state so the client can sync optimistic UI without a second round trip. */
export async function toggleWishlistItem(
  productId: string,
): Promise<ActionResult<{ wishlisted: boolean }>> {
  const session = await requireCustomer();
  await connectToDatabase();

  const existing = await WishlistModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
    "items.productId": productId,
  });

  if (existing) {
    await WishlistModel.updateOne(
      { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
      { $pull: { items: { productId } } },
    );
    return { success: true, data: { wishlisted: false } };
  }

  await WishlistModel.findOneAndUpdate(
    { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
    {
      $setOnInsert: { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
      $push: { items: { productId, addedAt: new Date() } },
    },
    { upsert: true },
  );
  return { success: true, data: { wishlisted: true } };
}

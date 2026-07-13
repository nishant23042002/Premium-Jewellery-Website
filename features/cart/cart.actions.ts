"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireCustomer } from "@/lib/auth/customer-session";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { CartModel } from "@/features/cart/cart.model";
import { getProductsByIds } from "@/features/products/product.actions";
import { isMadeToOrder } from "@/features/products/product.types";
import type { ActionResult } from "@/types/common";
import type { CartSummary } from "@/features/cart/cart.types";

/** Free shipping across the board for now — no shipping-rate config exists yet; a flat, honest ₹0 rather than a fabricated fee. */
const FLAT_SHIPPING = 0;

async function getOrCreateCartDoc(customerId: string) {
  await connectToDatabase();
  const cart = await CartModel.findOneAndUpdate(
    { tenantId: DEFAULT_TENANT_ID, customerId },
    { $setOnInsert: { tenantId: DEFAULT_TENANT_ID, customerId, items: [] } },
    { returnDocument: "after", upsert: true },
  );
  return cart;
}

/** Joins the customer's cart with live product data + computed prices — what the cart/checkout UI renders. Returns an empty summary if not logged in, rather than throwing, so guest browsing never crashes. */
export async function getCartSummary(): Promise<CartSummary> {
  const session = await (async () => {
    try {
      return await requireCustomer();
    } catch {
      return null;
    }
  })();
  if (!session) {
    return {
      lines: [],
      unavailableProductIds: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      discount: 0,
      grandTotal: 0,
    };
  }

  const cart = await getOrCreateCartDoc(session.sub);
  const productIds = cart.items.map((item) => String(item.productId));
  const priced = await getProductsByIds(productIds);
  const priceByProductId = new Map(priced.map((p) => [p.product.id, p]));

  const lines = [];
  const unavailableProductIds: string[] = [];
  let subtotalExGst = 0;
  let tax = 0;

  for (const item of cart.items) {
    const productId = String(item.productId);
    const match = priceByProductId.get(productId);
    if (!match) {
      unavailableProductIds.push(productId);
      continue;
    }
    const lineTotal = match.price.total * item.quantity;
    lines.push({
      product: match.product,
      price: match.price,
      quantity: item.quantity,
      lineTotal,
    });
    subtotalExGst +=
      (match.price.metalValue + match.price.makingCharge) * item.quantity;
    tax += match.price.gstAmount * item.quantity;
  }

  const discount = 0; // no coupon system yet (Phase 2)
  const grandTotal = subtotalExGst + tax + FLAT_SHIPPING - discount;

  return {
    lines,
    unavailableProductIds,
    subtotal: round2(subtotalExGst),
    shipping: FLAT_SHIPPING,
    tax: round2(tax),
    discount,
    grandTotal: round2(grandTotal),
  };
}

export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<ActionResult> {
  const session = await requireCustomer();
  await connectToDatabase();

  const [priced] = await getProductsByIds([productId]);
  if (!priced || !isMadeToOrder(priced.product)) {
    return {
      success: false,
      error: "This product isn't available for online purchase",
    };
  }

  const existing = await CartModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
    "items.productId": productId,
  });

  if (existing) {
    await CartModel.updateOne(
      {
        tenantId: DEFAULT_TENANT_ID,
        customerId: session.sub,
        "items.productId": productId,
      },
      { $inc: { "items.$.quantity": quantity } },
    );
  } else {
    await CartModel.findOneAndUpdate(
      { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
      {
        $setOnInsert: { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
        $push: { items: { productId, quantity, addedAt: new Date() } },
      },
      { upsert: true },
    );
  }

  return { success: true, data: undefined };
}

export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await requireCustomer();
  if (quantity < 1) {
    return removeFromCart(productId);
  }

  await connectToDatabase();
  await CartModel.updateOne(
    {
      tenantId: DEFAULT_TENANT_ID,
      customerId: session.sub,
      "items.productId": productId,
    },
    { $set: { "items.$.quantity": quantity } },
  );

  return { success: true, data: undefined };
}

export async function removeFromCart(productId: string): Promise<ActionResult> {
  const session = await requireCustomer();
  await connectToDatabase();

  await CartModel.updateOne(
    { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
    { $pull: { items: { productId } } },
  );

  return { success: true, data: undefined };
}

export async function clearCart(): Promise<ActionResult> {
  const session = await requireCustomer();
  await connectToDatabase();

  await CartModel.updateOne(
    { tenantId: DEFAULT_TENANT_ID, customerId: session.sub },
    { $set: { items: [] } },
  );

  return { success: true, data: undefined };
}

/** Item count for the header/badge — cheap enough to call on every layout render without joining product data. */
export async function getCartItemCount(): Promise<number> {
  const session = await (async () => {
    try {
      return await requireCustomer();
    } catch {
      return null;
    }
  })();
  if (!session) return 0;

  await connectToDatabase();
  const cart = await CartModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    customerId: session.sub,
  })
    .select("items")
    .lean();
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

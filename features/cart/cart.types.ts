import type {
  PriceBreakdown,
  Product,
} from "@/features/products/product.types";

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
  updatedAt: string;
}

/** A cart line item joined with its live product + computed price — what the cart/checkout UI actually renders. */
export interface CartLine {
  product: Product;
  price: PriceBreakdown;
  quantity: number;
  lineTotal: number;
}

export interface CartSummary {
  lines: CartLine[];
  /** Lines whose product was removed/unpublished since being added — surfaced so the UI can prompt removal instead of silently dropping them. */
  unavailableProductIds: string[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  grandTotal: number;
}

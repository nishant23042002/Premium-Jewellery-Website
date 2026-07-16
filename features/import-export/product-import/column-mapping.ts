/**
 * Header auto-detection dictionary — every array entry is a normalized
 * (lowercased, non-alphanumerics stripped) header alias that resolves to
 * the given internal field. Covers the app's own CSV export column names
 * (see product-csv.actions.ts's CSV_COLUMNS) plus common Shopify/vendor-feed
 * naming variants, so a template-matching upload needs zero manual mapping.
 */
export const KNOWN_HEADERS: Record<string, string[]> = {
  slug: ["slug", "handle", "urlkey"],
  skuCode: ["sku", "skucode", "sku_code", "productsku", "variantsku"],
  barcode: ["barcode", "upc", "ean", "gtin"],
  name_en: ["name", "productname", "title", "name_en", "producttitle"],
  name_hi: ["name_hi", "namehi", "titlehi"],
  name_mr: ["name_mr", "namemr", "titlemr"],
  description_en: [
    "description",
    "desc",
    "description_en",
    "productdescription",
    "bodyhtml",
    "body",
  ],
  categorySlug: [
    "category",
    "categoryslug",
    "producttype",
    "categoryname",
    "collection",
  ],
  collectionSlugs: ["collections", "collectionslugs", "tagscollections"],
  metalType: ["metal", "metaltype"],
  purity: ["purity", "karat", "fineness"],
  grossWeightGrams: [
    "grossweight",
    "grossweightgrams",
    "grossweightg",
    "weight",
  ],
  netWeightGrams: ["netweight", "netweightgrams", "netweightg"],
  makingChargeType: ["makingchargetype", "wastagetype"],
  makingChargeValue: ["makingcharge", "makingchargevalue", "wastage"],
  gstPercentage: ["gst", "gstpercentage", "tax", "taxpercentage"],
  stoneValue: ["stonevalue", "stonecost", "diamondvalue"],
  certificationCost: ["certificationcost", "hallmarkcost"],
  customCharges: ["customcharges", "othercharges"],
  quantity: ["quantity", "qty", "stock", "inventory", "inventoryqty"],
  availability: ["availability", "status", "stockstatus"],
  isFeatured: ["featured", "isfeatured"],
  isPublished: ["published", "ispublished"],
  tags: ["tags", "tag"],
  images: [
    "image",
    "imageurl",
    "images",
    "imageurls",
    "gallery",
    "galleryimages",
    "heroimage",
    "mainimage",
    "thumbnail",
  ],
  videos: ["video", "videourl", "videos", "videourls", "herovideo"],
  metaTitle: ["metatitle", "seotitle"],
  metaDescription: ["metadescription", "seodescription"],
  canonicalUrl: ["canonicalurl", "canonical"],
  ogTitle: ["ogtitle"],
  ogDescription: ["ogdescription"],
  ogImageUrl: ["ogimage", "ogimageurl"],
};

/** Fields the import can't proceed without, even after auto-detection — everything else degrades gracefully to a default/blank. */
export const REQUIRED_INTERNAL_FIELDS = [
  "skuCode",
  "name_en",
  "categorySlug",
  "metalType",
  "purity",
  "grossWeightGrams",
  "netWeightGrams",
  "makingChargeValue",
] as const;

/** "update" mode only needs the SKU to find the product it's patching — every other field, if present in the file, overwrites; if absent, the existing value is left alone. */
export const UPDATE_MODE_REQUIRED_FIELDS = ["skuCode"] as const;

/** Human-readable labels for the Field Mapping Wizard — every key in KNOWN_HEADERS should have one. */
export const IMPORT_FIELD_LABELS: Record<string, string> = {
  slug: "Slug",
  skuCode: "SKU",
  barcode: "Barcode",
  name_en: "Product Name (English)",
  name_hi: "Product Name (Hindi)",
  name_mr: "Product Name (Marathi)",
  description_en: "Description",
  categorySlug: "Category",
  collectionSlugs: "Collections",
  metalType: "Metal Type",
  purity: "Purity",
  grossWeightGrams: "Gross Weight (g)",
  netWeightGrams: "Net Weight (g)",
  makingChargeType: "Making Charge Type",
  makingChargeValue: "Making Charge Value",
  gstPercentage: "GST %",
  stoneValue: "Stone Value",
  certificationCost: "Certification Cost",
  customCharges: "Custom Charges",
  quantity: "Quantity",
  availability: "Availability",
  isFeatured: "Featured?",
  isPublished: "Published?",
  tags: "Tags",
  images: "Images",
  videos: "Videos",
  metaTitle: "Meta Title",
  metaDescription: "Meta Description",
  canonicalUrl: "Canonical URL",
  ogTitle: "Social Share Title",
  ogDescription: "Social Share Description",
  ogImageUrl: "Social Share Image",
};

/** Lowercases and strips everything but letters/digits, so "Gross Weight (g)", "gross_weight_grams", and "GrossWeight" all normalize the same way. */
export function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export interface ColumnMappingResult {
  /** internal field name -> source CSV column header (verbatim, as it appears in the file). */
  mapping: Record<string, string>;
  missingRequiredFields: string[];
}

/**
 * Auto-detects which CSV column corresponds to which internal field by
 * normalized-header lookup against `KNOWN_HEADERS`. First matching column
 * wins if a header alias somehow matches more than one already-mapped
 * field. Case/spacing/punctuation-insensitive by construction.
 */
export function detectColumnMapping(
  headers: string[],
  requiredFields: readonly string[] = REQUIRED_INTERNAL_FIELDS,
): ColumnMappingResult {
  const normalizedHeaders = headers.map((h) => ({
    original: h,
    normalized: normalizeHeaderKey(h),
  }));

  const mapping: Record<string, string> = {};

  for (const [field, aliases] of Object.entries(KNOWN_HEADERS)) {
    const normalizedAliases = new Set(aliases.map(normalizeHeaderKey));
    const found = normalizedHeaders.find((h) =>
      normalizedAliases.has(h.normalized),
    );
    if (found) {
      mapping[field] = found.original;
    }
  }

  const missingRequiredFields = requiredFields.filter(
    (field) => !mapping[field],
  );

  return { mapping, missingRequiredFields };
}

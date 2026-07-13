/**
 * One-off script to seed sample catalogue/content from real photos the
 * store owner already uploaded to Cloudinary. Moves each image into the
 * managed `Ambika-Jewellers` folder (rename, not re-upload), registers it
 * in the Media Library, then creates the Categories/Products/Collection/
 * Gallery/MetalRate records that reference them.
 *
 * Idempotent — safe to re-run; already-moved images and already-created
 * records are detected and skipped.
 *
 * Usage: npm run seed:content
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import type { Types } from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "../lib/db/mongoose";
import { DEFAULT_TENANT_ID } from "../lib/db/schema-helpers";
import { AdminUserModel } from "../features/auth/admin-user.model";
import { MediaAssetModel } from "../features/media/media.model";
import { CategoryModel } from "../features/categories/category.model";
import { ProductModel } from "../features/products/product.model";
import { CollectionModel } from "../features/collections/collection.model";
import { GalleryImageModel } from "../features/gallery/gallery-image.model";
import { MetalRateModel } from "../features/metal-rates/metal-rate.model";

const CLOUDINARY_FOLDER = "Ambika-Jewellers";

const SOURCE_URLS = [
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788867/Luxury_jewellery_showroom_interior_2K_202607112213_xpijeb.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788864/Luxury_jewelry_showroom_interior_2K_202607112217_ghgyc4.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788864/Luxury_Indian_jewelry_showroom_i__202607112218_eo09br.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788863/Gold_pendant_necklace_on_stand_202607112218_1_-_Copy_pdi9mf.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788862/Luxury_Indian_bridal_jewellery_d__202607112218_-_Copy_pqnwqm.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788862/Indian_jewellery_display_showroom_2K_202607112218_uenwaa.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788861/Indian_gold_diamond_earrings_stand_202607112218_-_Copy_vc0bye.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788861/Indian_jewellery_display_showroom_2K_202607112218_1_-_Copy_zpuekn.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788860/Pair_gold_bangles_floral_engravings_202607112218_-_Copy_ouvlps.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788860/Gold_pendant_necklace_on_stand_202607112218_-_Copy_drpndd.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788858/Indian_gold_bridal_necklace_accents_202607112218_2_tzbyzb.jpg",
  "https://res.cloudinary.com/thelayerco/image/upload/v1783788858/Gold_engagement_ring_on_pedestal_202607112218_-_Copy_uz9ctl.jpg",
] as const;

// `lib/cloudinary/upload.ts` is guarded with `import "server-only"`, which
// throws outside a Next.js Server Component boundary — this script talks to
// the Cloudinary SDK directly instead, same credentials, same behavior.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function moveImageToFolder(
  publicId: string,
  folder: string,
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  const filename = publicId.split("/").pop();
  const newPublicId = `${folder}/${filename}`;
  const result = await cloudinary.uploader.rename(publicId, newPublicId, {
    overwrite: false,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

function extractPublicId(url: string): string {
  const match = url.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z]+$/);
  if (!match) throw new Error(`Couldn't parse public_id from URL: ${url}`);
  return match[1];
}

interface MovedAsset {
  key: string;
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/** Moves every source image into the managed folder and registers it as a MediaAsset, keyed by its original filename (without folder). */
async function moveAndRegisterImages(
  uploadedByAdminId: string,
): Promise<Map<string, MovedAsset>> {
  const byKey = new Map<string, MovedAsset>();

  for (const sourceUrl of SOURCE_URLS) {
    const sourcePublicId = extractPublicId(sourceUrl);
    const key = sourcePublicId.split("/").pop()!;
    const destinationPublicId = `${CLOUDINARY_FOLDER}/${key}`;

    // If a previous run already moved this asset, the source no longer
    // exists at its original location — reuse the registered record
    // instead of attempting another rename.
    const existingAsset = await MediaAssetModel.findOne({
      tenantId: DEFAULT_TENANT_ID,
      publicId: destinationPublicId,
    }).lean();

    if (existingAsset) {
      byKey.set(key, {
        key,
        url: existingAsset.url,
        publicId: existingAsset.publicId,
        width: existingAsset.width,
        height: existingAsset.height,
      });
      console.log(`  already moved & registered: ${key}`);
      continue;
    }

    const moved = await moveImageToFolder(sourcePublicId, CLOUDINARY_FOLDER);
    await MediaAssetModel.create({
      tenantId: DEFAULT_TENANT_ID,
      url: moved.url,
      publicId: moved.publicId,
      width: moved.width,
      height: moved.height,
      fileName: key,
      uploadedByAdminId,
      tags: ["seed"],
    });
    byKey.set(key, { key, ...moved });
    console.log(`  moved & registered: ${key}`);
  }

  return byKey;
}

async function ensureCategory(
  slug: string,
  nameEn: string,
  sortOrder: number,
  imageUrl?: string,
) {
  const existing = await CategoryModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug,
  });
  if (existing) {
    // Backfill imageUrl on a category created before this field was seeded
    // — never overwrites one an admin has since set via the media picker.
    if (imageUrl && !existing.imageUrl) {
      existing.imageUrl = imageUrl;
      await existing.save();
    }
    return existing;
  }
  return CategoryModel.create({
    tenantId: DEFAULT_TENANT_ID,
    slug,
    name: { en: nameEn, hi: nameEn, mr: nameEn },
    sortOrder,
    imageUrl,
    isPublished: true,
  });
}

interface ProductSeed {
  slug: string;
  skuCode: string;
  nameEn: string;
  imageKey: string;
  categorySlug: string;
  metalType: "gold" | "silver" | "diamond" | "other";
  purity: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  makingChargeValue: number;
  isFeatured: boolean;
}

async function ensureProduct(
  seed: ProductSeed,
  categoryId: Types.ObjectId,
  image: MovedAsset,
) {
  const existing = await ProductModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: seed.slug,
  });
  if (existing) return existing;

  return ProductModel.create({
    tenantId: DEFAULT_TENANT_ID,
    categoryId,
    slug: seed.slug,
    skuCode: seed.skuCode,
    name: { en: seed.nameEn, hi: seed.nameEn, mr: seed.nameEn },
    description: {
      en: `Handcrafted ${seed.nameEn.toLowerCase()} from our Roha showroom, finished in ${seed.purity} ${seed.metalType}.`,
    },
    metalType: seed.metalType,
    purity: seed.purity,
    grossWeightGrams: seed.grossWeightGrams,
    netWeightGrams: seed.netWeightGrams,
    makingChargeType: "percentage",
    makingChargeValue: seed.makingChargeValue,
    gstPercentage: 3,
    images: [{ url: image.url, publicId: image.publicId, sortOrder: 0 }],
    availability: "in_showroom",
    isFeatured: seed.isFeatured,
    isPublished: true,
    tags: [seed.categorySlug],
  });
}

async function main() {
  console.log("Connecting to database...");
  await connectToDatabase();

  const owner = await AdminUserModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    role: "owner",
  });
  if (!owner) {
    console.error(
      "No owner admin account found — run `npm run seed:admin` first.",
    );
    process.exit(1);
  }

  console.log(
    `Moving images into the "${CLOUDINARY_FOLDER}" Cloudinary folder...`,
  );
  const assets = await moveAndRegisterImages(owner._id.toString());

  console.log("Creating categories...");
  // Reuses each category's most representative product photo as its
  // thumbnail — no spare "generic ring/necklace" stock photos exist among
  // the 12 supplied images, so this is the lowest-duplication option.
  const necklaces = await ensureCategory(
    "necklaces",
    "Necklaces",
    1,
    assets.get("Indian_gold_bridal_necklace_accents_202607112218_2_tzbyzb")
      ?.url,
  );
  const earrings = await ensureCategory(
    "earrings",
    "Earrings",
    2,
    assets.get("Indian_gold_diamond_earrings_stand_202607112218_-_Copy_vc0bye")
      ?.url,
  );
  const bangles = await ensureCategory(
    "bangles",
    "Bangles",
    3,
    assets.get("Pair_gold_bangles_floral_engravings_202607112218_-_Copy_ouvlps")
      ?.url,
  );
  const rings = await ensureCategory(
    "rings",
    "Rings",
    4,
    assets.get("Gold_engagement_ring_on_pedestal_202607112218_-_Copy_uz9ctl")
      ?.url,
  );
  console.log("  necklaces, earrings, bangles, rings");

  console.log("Creating products...");
  const productSeeds: (ProductSeed & { categoryId: Types.ObjectId })[] = [
    {
      slug: "gold-pendant-necklace",
      skuCode: "AJ-NK-001",
      nameEn: "Gold Pendant Necklace",
      imageKey: "Gold_pendant_necklace_on_stand_202607112218_1_-_Copy_pdi9mf",
      categorySlug: "necklaces",
      categoryId: necklaces._id,
      metalType: "gold",
      purity: "22K",
      grossWeightGrams: 18.5,
      netWeightGrams: 17.8,
      makingChargeValue: 14,
      isFeatured: true,
    },
    {
      slug: "gold-pendant-necklace-ii",
      skuCode: "AJ-NK-002",
      nameEn: "Gold Pendant Necklace II",
      imageKey: "Gold_pendant_necklace_on_stand_202607112218_-_Copy_drpndd",
      categorySlug: "necklaces",
      categoryId: necklaces._id,
      metalType: "gold",
      purity: "22K",
      grossWeightGrams: 21.2,
      netWeightGrams: 20.4,
      makingChargeValue: 14,
      isFeatured: false,
    },
    {
      slug: "bridal-gold-necklace",
      skuCode: "AJ-NK-003",
      nameEn: "Bridal Gold Necklace",
      imageKey: "Indian_gold_bridal_necklace_accents_202607112218_2_tzbyzb",
      categorySlug: "necklaces",
      categoryId: necklaces._id,
      metalType: "gold",
      purity: "22K",
      grossWeightGrams: 42.6,
      netWeightGrams: 40.9,
      makingChargeValue: 16,
      isFeatured: true,
    },
    {
      slug: "gold-diamond-earrings",
      skuCode: "AJ-ER-001",
      nameEn: "Gold Diamond Earrings",
      imageKey: "Indian_gold_diamond_earrings_stand_202607112218_-_Copy_vc0bye",
      categorySlug: "earrings",
      categoryId: earrings._id,
      // Pricing only has a live rate for gold/silver (no separate diamond
      // rate) — `metalType: "diamond"` would silently price off the much
      // lower silver rate, so gold-set diamond pieces stay `metalType:
      // "gold"` and the diamond detail lives in the name/description only.
      metalType: "gold",
      purity: "18K",
      grossWeightGrams: 9.4,
      netWeightGrams: 8.9,
      makingChargeValue: 18,
      isFeatured: true,
    },
    {
      slug: "gold-floral-bangles",
      skuCode: "AJ-BN-001",
      nameEn: "Gold Floral Bangles",
      imageKey:
        "Pair_gold_bangles_floral_engravings_202607112218_-_Copy_ouvlps",
      categorySlug: "bangles",
      categoryId: bangles._id,
      metalType: "gold",
      purity: "22K",
      grossWeightGrams: 26.8,
      netWeightGrams: 25.9,
      makingChargeValue: 13,
      isFeatured: false,
    },
    {
      slug: "gold-engagement-ring",
      skuCode: "AJ-RG-001",
      nameEn: "Gold Engagement Ring",
      imageKey: "Gold_engagement_ring_on_pedestal_202607112218_-_Copy_uz9ctl",
      categorySlug: "rings",
      categoryId: rings._id,
      metalType: "gold",
      purity: "18K",
      grossWeightGrams: 5.2,
      netWeightGrams: 4.8,
      makingChargeValue: 16,
      isFeatured: false,
    },
  ];

  const productBySlug = new Map<
    string,
    Awaited<ReturnType<typeof ensureProduct>>
  >();
  for (const seed of productSeeds) {
    const image = assets.get(seed.imageKey);
    if (!image) {
      console.error(`  missing moved image for key: ${seed.imageKey}`);
      continue;
    }
    const doc = await ensureProduct(seed, seed.categoryId, image);
    productBySlug.set(seed.slug, doc);
    console.log(`  ${seed.slug}`);
  }

  console.log("Creating 'Bridal Edit' collection...");
  const bridalCoverImage = assets.get(
    "Luxury_Indian_bridal_jewellery_d__202607112218_-_Copy_pqnwqm",
  );
  const bridalNecklace = productBySlug.get("bridal-gold-necklace");
  const existingCollection = await CollectionModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    slug: "bridal-edit",
  });
  if (!existingCollection && bridalCoverImage) {
    await CollectionModel.create({
      tenantId: DEFAULT_TENANT_ID,
      slug: "bridal-edit",
      name: { en: "Bridal Edit", hi: "Bridal Edit", mr: "Bridal Edit" },
      description: {
        en: "A handpicked edit of bridal gold, ready for the big day.",
      },
      imageUrl: bridalCoverImage.url,
      productIds: bridalNecklace ? [bridalNecklace._id] : [],
      isFeatured: true,
      isPublished: true,
      sortOrder: 0,
    });
    console.log("  bridal-edit");
  } else {
    console.log("  already exists, skipping");
  }

  console.log("Creating gallery images...");
  const galleryKeys = [
    "Luxury_jewellery_showroom_interior_2K_202607112213_xpijeb",
    "Luxury_jewelry_showroom_interior_2K_202607112217_ghgyc4",
    "Indian_jewellery_display_showroom_2K_202607112218_1_-_Copy_zpuekn",
  ];
  let gallerySortOrder = 0;
  for (const key of galleryKeys) {
    const image = assets.get(key);
    if (!image) continue;
    const existing = await GalleryImageModel.findOne({
      tenantId: DEFAULT_TENANT_ID,
      imageUrl: image.url,
    });
    if (existing) {
      gallerySortOrder++;
      continue;
    }
    await GalleryImageModel.create({
      tenantId: DEFAULT_TENANT_ID,
      imageUrl: image.url,
      caption: { en: "Inside the showroom" },
      sortOrder: gallerySortOrder++,
      isPublished: true,
    });
  }
  console.log(`  registered ${galleryKeys.length} gallery images`);

  console.log("Seeding today's metal rates...");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const existingRateToday = await MetalRateModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    metalType: "gold",
    effectiveDate: { $gte: startOfToday },
  });
  if (!existingRateToday) {
    const effectiveDate = new Date();
    await MetalRateModel.create([
      {
        tenantId: DEFAULT_TENANT_ID,
        metalType: "gold",
        purity: "22K",
        ratePerGram: 6800,
        effectiveDate,
        setByAdminId: owner._id,
      },
      {
        tenantId: DEFAULT_TENANT_ID,
        metalType: "silver",
        purity: "999",
        ratePerGram: 85,
        effectiveDate,
        setByAdminId: owner._id,
      },
    ]);
    console.log("  gold ₹6800/g, silver ₹85/g");
  } else {
    console.log("  rate already set today, skipping");
  }

  console.log("\nDone. Hero image URLs for the hardcoded About/Home slots:");
  console.log(
    `  about-story:  ${assets.get("Luxury_Indian_jewelry_showroom_i__202607112218_eo09br")?.url}`,
  );
  console.log(
    `  story-teaser: ${assets.get("Indian_jewellery_display_showroom_2K_202607112218_uenwaa")?.url}`,
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

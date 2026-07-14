import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Phone } from "lucide-react";
import { BreadcrumbJsonLd, ProductJsonLd } from "next-seo";
import { Container } from "@/components/common/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { PriceBreakdown } from "@/components/storefront/price-breakdown";
import { ProductEnquiryDialog } from "@/components/storefront/product-enquiry-dialog";
import { AvailabilityBadge } from "@/components/storefront/availability-badge";
import { LowStockBadge } from "@/components/storefront/low-stock-badge";
import { ProductionEstimate } from "@/components/storefront/production-estimate";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import {
  isMadeToOrder,
  LOW_STOCK_THRESHOLD,
} from "@/features/products/product.types";
import { SpecTable } from "@/components/storefront/spec-table";
import { ProductTimeline } from "@/components/storefront/product-timeline";
import { ReserveButton } from "@/components/storefront/reserve-button";
import { RecentlyViewedTracker } from "@/components/storefront/recently-viewed-tracker";
import { RecentlyViewedRail } from "@/components/storefront/recently-viewed-rail";
import { RelatedProducts } from "@/components/storefront/related-products";
import {
  getProductBySlug,
  listRelatedProducts,
} from "@/features/products/product.actions";
import { getCurrentCustomer } from "@/features/customer-auth/customer-auth.actions";
import { safeQuery } from "@/lib/db/safe-query";
import { formatWeight } from "@/lib/utils/format";
import { canonicalFor } from "@/lib/seo/config";
import { siteConfig } from "@/config/site.config";
import {
  buildWhatsAppLink,
  productEnquiryWhatsAppMessage,
} from "@/lib/notifications/whatsapp-templates";
import { getStorefrontLocale } from "@/lib/i18n/locale";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { t } from "@/lib/i18n/dictionary";
import { ROUTES, SITE } from "@/constants";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await safeQuery(() => getProductBySlug(slug), null);
  if (!result) return { title: "Product" };

  const { product } = result;
  const description = `${product.name.en} — ${product.purity} ${product.metalType}, ${formatWeight(product.netWeightGrams)}.`;
  const image = product.images[0]?.url;

  return {
    title: product.name.en,
    description,
    ...canonicalFor(ROUTES.product(product.slug)),
    openGraph: {
      title: product.name.en,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const result = await safeQuery(() => getProductBySlug(slug), null);

  if (!result) notFound();

  const { product, price } = result;

  const [related, customer, locale] = await Promise.all([
    safeQuery(() => listRelatedProducts(product.categoryId, product.id), []),
    safeQuery(() => getCurrentCustomer(), null),
    getStorefrontLocale(),
  ]);

  const displayName = pickLocalized(product.name, locale);
  const displayDescription = pickLocalized(product.description, locale);

  const whatsappLink = buildWhatsAppLink(
    SITE.whatsappNumber,
    productEnquiryWhatsAppMessage({
      productName: displayName,
      skuCode: product.skuCode,
      metalType: product.metalType,
      purity: product.purity,
      netWeightGrams: product.netWeightGrams,
      productUrl: `${siteConfig.url}${ROUTES.product(product.slug)}`,
      productImageUrl: product.images[0]?.url,
      customerName: customer?.name,
      customerEmail: customer?.email,
    }),
  );

  return (
    <>
      <ProductJsonLd
        name={product.name.en}
        description={`${product.purity} ${product.metalType}, ${formatWeight(product.netWeightGrams)}.`}
        image={product.images.map((img) => img.url)}
        sku={product.skuCode}
        brand={SITE.name}
        offers={
          price.isRatePending
            ? undefined
            : {
                "@type": "Offer",
                url: `${siteConfig.url}${ROUTES.product(product.slug)}`,
                priceCurrency: "INR",
                price: price.total,
                availability:
                  product.availability === "in_showroom"
                    ? "https://schema.org/InStock"
                    : "https://schema.org/PreOrder",
              }
        }
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: siteConfig.url },
          { name: "Products", item: `${siteConfig.url}${ROUTES.products}` },
          { name: product.name.en },
        ]}
      />
      <RecentlyViewedTracker productId={product.id} />

      <Container className="pt-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href={ROUTES.home} className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link href={ROUTES.products} className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{product.name.en}</span>
        </nav>
      </Container>

      <section className="pb-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal
              direction="left"
              className="lg:sticky lg:top-24 lg:self-start"
            >
              <ProductGallery
                images={product.images}
                videos={product.videos}
                productName={product.name.en}
              />
            </Reveal>

            <Reveal direction="right" className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {product.isFeatured && <Badge variant="gold">Featured</Badge>}
                  <Badge variant="outline" className="capitalize">
                    {product.metalType}
                  </Badge>
                  <AvailabilityBadge availability={product.availability} />
                  {!isMadeToOrder(product) &&
                    product.quantity > 0 &&
                    product.quantity <= LOW_STOCK_THRESHOLD && (
                      <LowStockBadge quantity={product.quantity} />
                    )}
                </div>

                <h1 className="mt-3 font-heading text-2xl sm:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  SKU: {product.skuCode}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/10 p-5">
                <PriceBreakdown price={price} />
              </div>

              {displayDescription && (
                <p className="text-sm text-muted-foreground">
                  {displayDescription}
                </p>
              )}

              {isMadeToOrder(product) && (
                <ProductionEstimate
                  productionTimeDays={product.productionTimeDays}
                  deliveryEstimateDays={product.deliveryEstimateDays}
                  dispatchNote={product.dispatchNote}
                />
              )}

              <div className="space-y-3">
                {isMadeToOrder(product) && (
                  <AddToCartButton productId={product.id} />
                )}
                <ReserveButton productSlug={product.slug} />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline-gold"
                    className="flex-1"
                    nativeButton={false}
                    render={
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("whatsappEnquiry", locale)}
                      </a>
                    }
                  />
                  <ProductEnquiryDialog
                    productId={product.id}
                    productName={displayName}
                    productImageUrl={product.images[0]?.url}
                    productSkuCode={product.skuCode}
                  />
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={
                      <a
                        href={`tel:${SITE.phone}`}
                        aria-label={`Call ${SITE.phoneDisplay}`}
                      >
                        <Phone className="size-4" />
                      </a>
                    }
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h2 className="mb-3 text-sm font-medium">Specifications</h2>
                <SpecTable product={product} className="w-full" />
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-16 border-t border-border pt-10">
            <h2 className="mb-8 text-center font-heading text-xl">
              The Journey of This Piece
            </h2>
            <ProductTimeline />
          </Reveal>
        </Container>
      </section>

      <RelatedProducts items={related} locale={locale} />
      <RecentlyViewedRail excludeProductId={product.id} locale={locale} />
    </>
  );
}

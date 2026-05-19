import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Leaf,
  Gift,
  Truck,
  Clock3,
  PackageCheck,
  HeartHandshake,
  Utensils,
  Star,
  ShoppingCart,
  ClipboardCheck,
  Box,
  Send,
  Home,
} from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { ProductCard } from "@/components/product";
import { getCatalogProductBySlug, getCatalogProducts } from "@/lib/product/catalog";
import { getProductBySlug, products as staticProducts } from "@/data/products";
import { getProductReviews } from "@/lib/product/product-reviews";
import {
  getProductPositioning,
  getProductStory,
} from "@/lib/product/product-positioning";
import {
  getProductMerchandising,
  type ProductMerchandisingIconKey,
} from "@/lib/product/product-merchandising";
import {
  getBestsellerProducts,
  getRecommendedProducts,
  getRelatedProducts,
} from "@/lib/product/product-recommendations";
import AddToCartButton from "@/components/AddToCartButton";
import ProductViewTracker from "@/components/analytics/ProductViewTracker";
import MobileProductPurchaseBar from "@/components/product/mobile-product-purchase-bar";
import ProductSideGallery from "@/components/product/product-side-gallery";
import ProductMainImage from "@/components/product/product-main-image";
import ProductViewHistory from "@/components/product/product-view-history";
import RecentlyViewedProducts from "@/components/product/recently-viewed-products";
import ProductReviewsTrust from "@/components/product/product-reviews-trust";
import ProductDeliveryFlow from "@/components/product/product-delivery-flow";
import ProductShareButton from "@/components/product/product-share-button";
import type { Product } from "@/types/product";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

function DeliveryFlow() {
  const steps = [
    {
      icon: ShoppingCart,
      title: "注文",
      text: "ご注文完了後、内容を確認します。",
    },
    {
      icon: ClipboardCheck,
      title: "確認",
      text: "在庫・商品情報を確認します。",
    },
    {
      icon: Box,
      title: "梱包",
      text: "食品に適した状態で丁寧に梱包します。",
    },
    {
      icon: Send,
      title: "発送",
      text: "3〜5営業日以内に発送します。",
    },
    {
      icon: Home,
      title: "到着",
      text: "ご自宅まで商品をお届けします。",
    },
  ];

  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-neutral-500" />
        <p className="text-xs tracking-[0.24em] text-neutral-500">ORDER FLOW</p>
      </div>

      <p className="mt-3 text-sm leading-7 text-neutral-700">
        ご注文後の流れを、購入前に確認できます。
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className="relative rounded-2xl border border-[#e6d7c1] bg-white/86 p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0cdb0] bg-[#fff7e8]">
                  <Icon className="h-4 w-4 text-neutral-600" />
                </div>
                <span className="font-serif text-lg leading-none text-[#d6c09d]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <p className="mt-3 text-sm font-semibold text-neutral-950">
                {step.title}
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-600">
                {step.text}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-6 text-neutral-500">
        ※ 発送時期は在庫状況・配送地域・天候などにより前後する場合があります。
      </p>
    </div>
  );
}

const merchandisingIconMap = {
  utensils: Utensils,
  gift: Gift,
  leaf: Leaf,
  sparkles: Sparkles,
  shield: ShieldCheck,
  package: PackageCheck,
  truck: Truck,
} satisfies Record<ProductMerchandisingIconKey, typeof Utensils>;

function ProductSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Product[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-[#eadfce] bg-[#fffaf2] py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              SONYACHNA SELECTION
            </p>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950 md:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              {subtitle}
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden rounded-full border border-[#d9c8ae] bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-900 hover:text-neutral-950 sm:inline-flex"
          >
            すべて見る
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
          {items.map((item) => (
            <ProductCard key={`${title}-${item.id}`} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product =
    (await getCatalogProductBySlug(slug)) ?? getProductBySlug(slug);

  if (!product) {
    return {
      title: "商品が見つかりません | Sonyachna",
    };
  }

  const positioning = getProductPositioning(product);

  return {
    title: product.name,
    description: positioning.subheadline,

    openGraph: {
      title: product.name,
      description: positioning.subheadline,
      type: "website",
      url: `/product/${product.slug}`,
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: positioning.subheadline,
      images: [product.image],
    },

    alternates: {
      canonical: `/product/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product =
    (await getCatalogProductBySlug(slug)) ?? getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const neonCatalogProducts = await getCatalogProducts();
  const catalogProducts =
    neonCatalogProducts.length > 0 ? neonCatalogProducts : staticProducts;
  const relatedProducts = getRelatedProducts(product, catalogProducts);
  const bestsellerProducts = getBestsellerProducts(product, catalogProducts);
  const recommendedProducts = getRecommendedProducts(product, catalogProducts);
  const productStory = getProductStory(product);
  const positioning = getProductPositioning(product);
  const productReviews = getProductReviews(product);
  const merchandising = getProductMerchandising(product);
  const merchandisingCards = merchandising.galleryCards;
  const fitItems = merchandising.buyingFitItems;

  const stockStatus = {
    "in-stock": { label: "在庫あり", color: "text-emerald-700", icon: Check },
    limited: {
      label: "残りわずか",
      color: "text-amber-700",
      icon: AlertCircle,
    },
    "out-of-stock": {
      label: "在庫切れ",
      color: "text-red-700",
      icon: AlertCircle,
    },
  };

  const status = stockStatus[product.stockStatus];
  const StatusIcon = status.icon;

  return (
    <>
      <Header />
      <ProductViewTracker
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
        }}
      />
      <ProductViewHistory productId={product.id} />

      <main className="min-h-screen bg-[#fffaf2] text-neutral-950">
        <div className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" />
            商品一覧に戻る
          </Link>
        </div>

        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
              <div className="space-y-5">
                <ProductMainImage
                  productName={product.name}
                  productImage={product.image}
                  productTag={product.tag}
                  productOrigin={product.origin}
                />

                <ProductSideGallery
                  productName={product.name}
                  productImage={product.image}
                  images={product.images}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  {merchandisingCards.map((card) => {
                    const Icon = merchandisingIconMap[card.icon];

                    return (
                      <div
                        key={card.label}
                        className="group relative overflow-hidden rounded-3xl border border-[#e6d7c1] bg-white/84 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#d6b278] hover:shadow-[0_18px_42px_rgba(58,42,22,0.08)]"
                      >
                        <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#e9c77b]/14 blur-2xl transition duration-500 group-hover:scale-125" />
                        <div className="relative">
                          <div className="flex items-center justify-between gap-2">
                            <Icon className="h-4 w-4 text-[#9b6d24]" />
                            <span className="rounded-full bg-[#fff7e8] px-2 py-0.5 text-[10px] tracking-[0.18em] text-neutral-500">
                              {card.label}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-neutral-950">
                            {card.title}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-neutral-600">
                            {card.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <ProductReviewsTrust reviews={productReviews} />
              </div>

              <div className="flex flex-col">
                <div className="rounded-[34px] border border-[#e6d7c1] bg-white/86 p-6 shadow-[0_24px_70px_rgba(58,42,22,0.10)] md:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#d8c5aa] bg-[#fff7e8] px-3 py-1 text-xs tracking-[0.18em] text-neutral-600">
                      {positioning.eyebrow}
                    </span>
                    {product.category && (
                      <span className="rounded-full border border-[#e6d7c1] bg-white px-3 py-1 text-xs text-neutral-500">
                        {product.category}
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-neutral-950 md:text-5xl">
                    {product.name}
                  </h1>

                  <p className="mt-5 font-serif text-2xl leading-snug text-neutral-900 md:text-3xl">
                    {positioning.headline}
                  </p>

                  <p className="mt-5 text-base leading-8 text-neutral-700">
                    {positioning.subheadline}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <p className="text-3xl font-semibold tracking-tight text-neutral-950">
                      ¥{product.price.toLocaleString()}
                    </p>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-500">
                      税込
                    </span>
                    <div
                      className={`flex items-center gap-1.5 ${status.color}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fffaf2] px-3 py-1.5 text-xs text-neutral-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#9b6d24]" />
                      正規輸入
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fffaf2] px-3 py-1.5 text-xs text-neutral-700">
                      <PackageCheck className="h-3.5 w-3.5 text-[#9b6d24]" />
                      品質確認済み
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fffaf2] px-3 py-1.5 text-xs text-neutral-700">
                      <Truck className="h-3.5 w-3.5 text-[#9b6d24]" />
                      3〜5営業日以内に発送
                    </span>
                  </div>

                  <div className="mt-6 grid w-full max-w-md grid-cols-[minmax(0,1fr)_58px] items-start gap-1">
                    <div className="min-w-0">
                      <AddToCartButton
                        attachedShareTail
                        product={{
                          id: product.id,
                          slug: product.slug,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          stockStatus: product.stockStatus,
                          category: product.category,
                        }}
                      />
                    </div>

                    <ProductShareButton
                      productName={product.name}
                      productSlug={product.slug}
                    />
                  </div>

                  <ProductDeliveryFlow />

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <PackageCheck className="h-4 w-4 text-neutral-500" />
                      <p className="mt-2 text-xs font-medium text-neutral-900">
                        品質確認済み
                      </p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <Clock3 className="h-4 w-4 text-neutral-500" />
                      <p className="mt-2 text-xs font-medium text-neutral-900">
                        3〜5営業日以内に発送
                      </p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3">
                      <HeartHandshake className="h-4 w-4 text-neutral-500" />
                      <p className="mt-2 text-xs font-medium text-neutral-900">
                        不明点は購入前に確認可能
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-xs leading-6 text-neutral-500">
                    食品のため、原材料・アレルギー・保存方法をご確認のうえご購入ください。
                  </p>

                  <div className="mt-7 overflow-hidden rounded-3xl border border-[#eadfce] bg-[linear-gradient(135deg,#fffaf2_0%,#fffdf8_58%,#f4ead9_100%)] p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#b9852b]" />
                      <p className="text-xs tracking-[0.24em] text-neutral-500">
                        BUYING FIT
                      </p>
                    </div>

                    <p className="mt-3 font-serif text-xl leading-8 text-neutral-950">
                      この商品が合う人
                    </p>

                    <div className="mt-4 grid gap-2">
                      {fitItems.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-2 rounded-2xl border border-white/70 bg-white/72 px-3 py-2.5 text-sm leading-6 text-neutral-700 shadow-sm"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9b6d24]" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#e4d2b5] bg-white/78 p-4">
                      <p className="text-xs tracking-[0.2em] text-neutral-500">
                        TASTE NOTE
                      </p>
                      <p className="mt-2 text-sm leading-7 text-neutral-800">
                        {merchandising.tasteNote}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[34px] border border-[#e6d7c1] bg-[linear-gradient(135deg,#fff4df_0%,#fffdf8_55%,#f3eadb_100%)] p-6 shadow-[0_20px_60px_rgba(58,42,22,0.08)] md:p-8">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-neutral-500" />
                    <p className="text-xs tracking-[0.24em] text-neutral-500">
                      PRODUCT STORY
                    </p>
                  </div>

                  <h2 className="mt-4 font-serif text-2xl tracking-tight text-neutral-950 md:text-3xl">
                    {productStory.title}
                  </h2>

                  <p className="mt-4 text-sm leading-8 text-neutral-700">
                    {productStory.text}
                  </p>

                  <div className="mt-5 rounded-3xl border border-white/70 bg-white/70 p-5">
                    <p className="font-serif text-xl leading-8 text-neutral-950">
                      {positioning.closingLine}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-neutral-600">
                      {positioning.sensoryNote}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {positioning.idealFor.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#decdb3] bg-white/82 px-3 py-1.5 text-xs text-neutral-700 shadow-sm"
                      >
                        <Utensils className="h-3 w-3 text-neutral-400" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="product-details"
          className="scroll-mt-24 border-y border-[#eadfce] bg-white py-14"
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
            <div>
              <p className="text-xs tracking-[0.24em] text-neutral-500">
                DETAILS
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight text-neutral-950">
                商品詳細
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                購入前に確認すべき情報だけを整理しています。
              </p>
            </div>

            <dl className="grid gap-3">
              {[
                ["原産地", product.origin],
                ["原材料", product.ingredients],
                ["アレルギー", product.allergens],
                ["賞味期限", product.shelfLife],
                ["保存方法", product.storage],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-2 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5 sm:grid-cols-[120px_1fr]"
                >
                  <dt className="text-sm text-neutral-500">{label}</dt>
                  <dd className="text-sm leading-7 text-neutral-900">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-[#fffaf2] py-14">
          <div className="mx-auto grid max-w-6xl gap-5 px-6 md:grid-cols-3 lg:px-8">
            <div className="rounded-[30px] border border-[#e6d7c1] bg-white p-6 shadow-sm">
              <Truck className="h-5 w-5 text-neutral-500" />
              <h3 className="mt-4 font-serif text-xl text-neutral-950">
                配送について
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                ご注文確定後、3〜5営業日以内に発送いたします。商品の品質を保つため、適切な梱包でお届けします。
              </p>
            </div>

            <div className="rounded-[30px] border border-[#e6d7c1] bg-white p-6 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-neutral-500" />
              <h3 className="mt-4 font-serif text-xl text-neutral-950">
                安心して選べます
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                原材料、保存方法、アレルギー情報を確認したうえでご購入いただけます。不明点がある場合はお問い合わせください。
              </p>
            </div>

            <div className="rounded-[30px] border border-[#e6d7c1] bg-white p-6 shadow-sm">
              <Star className="h-5 w-5 text-neutral-500" />
              <h3 className="mt-4 font-serif text-xl text-neutral-950">
                Sonyachnaの基準
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                珍しさだけではなく、日本の食卓で使いやすいこと、背景が伝わることを基準に選んでいます。
              </p>
            </div>
          </div>
        </section>

        <RecentlyViewedProducts currentProductId={product.id} />

        <ProductSection
          title="関連商品"
          subtitle="同じカテゴリーから、合わせて見ておきたい商品です。"
          items={relatedProducts}
        />
        <ProductSection
          title="人気商品"
          subtitle="Sonyachnaの中でも選ばれやすい商品です。"
          items={bestsellerProducts}
        />
        <ProductSection
          title="おすすめ商品"
          subtitle="新商品・数量限定の商品を中心に紹介しています。"
          items={recommendedProducts}
        />
      </main>

      <MobileProductPurchaseBar
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image,
          stockStatus: product.stockStatus,
          category: product.category,
        }}
      />

      <Footer />
    </>
  );
}

import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Leaf,
  Gift,
  Truck,
} from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { ProductCard } from '@/components/product'
import { products, getProductBySlug } from '@/data/products'
import AddToCartButton from '@/components/AddToCartButton'
import ProductViewTracker from '@/components/analytics/ProductViewTracker'
import MobileProductPurchaseBar from '@/components/product/mobile-product-purchase-bar'
import type { Product } from '@/types/product'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

function getRelatedProducts(currentProduct: Product): Product[] {
  return products
    .filter(
      (candidate) =>
        candidate.id !== currentProduct.id &&
        candidate.category &&
        currentProduct.category &&
        candidate.category === currentProduct.category
    )
    .slice(0, 4)
}

function getBestsellerProducts(currentProduct: Product): Product[] {
  return products
    .filter(
      (candidate) =>
        candidate.id !== currentProduct.id && candidate.tag === '人気商品'
    )
    .slice(0, 4)
}

function getRecommendedProducts(currentProduct: Product): Product[] {
  return products
    .filter(
      (candidate) =>
        candidate.id !== currentProduct.id &&
        (candidate.tag === '新商品' || candidate.stockStatus === 'limited')
    )
    .slice(0, 4)
}

function getProductStory(product: Product) {
  const category = product.category ?? ''

  if (category.includes('蜂蜜')) {
    return {
      title: 'ウクライナの花畑から届く、自然の甘さ',
      text:
        'ウクライナは肥沃な黒土と広大な花畑に恵まれた農業国です。蜂蜜の味は、単なる甘さではなく、土地、花、季節、そして養蜂家の手仕事によって形づくられます。毎日のパン、ヨーグルト、紅茶に少し加えるだけで、食卓にやさしい香りが広がります。',
      recommendations: ['朝のヨーグルトに', '紅茶やハーブティーに', 'パンやチーズと一緒に'],
    }
  }

  if (category.includes('お菓子')) {
    return {
      title: '日常に小さな余韻を残す、ウクライナのお菓子',
      text:
        'ウクライナのお菓子文化は、ヨーロッパの影響を受けながら、家庭のティータイムや贈り物の中で育ってきました。派手な高級感ではなく、落ち着いた甘さと満足感。コーヒーや紅茶と合わせることで、日常の休憩時間を少し豊かにしてくれます。',
      recommendations: ['コーヒーと一緒に', '午後の休憩に', '小さなギフトに'],
    }
  }

  if (category.includes('食用油')) {
    return {
      title: 'ひまわり畑の恵みを、毎日の料理へ',
      text:
        'ウクライナの風景を象徴するひまわり。その種から生まれる油は、料理の主役ではないかもしれませんが、素材の香りや食感を支える重要な存在です。サラダ、パスタ、野菜料理など、日々の食卓に自然になじみます。',
      recommendations: ['サラダに', 'パスタに', '野菜料理に'],
    }
  }

  if (category.includes('ドライフルーツ')) {
    return {
      title: '果物の自然な甘みを、ゆっくり閉じ込める',
      text:
        '果物を乾燥させることは、保存の知恵であり、素材の甘みを凝縮する文化でもあります。余計なものを加えすぎず、果物そのものの味を楽しむ。朝食、お茶の時間、軽い間食に取り入れやすい食品です。',
      recommendations: ['朝食に', 'お茶の時間に', '軽い間食に'],
    }
  }

  if (category.includes('お茶')) {
    return {
      title: '静かな時間に寄り添う、ウクライナの自然の香り',
      text:
        'ハーブティーは、味だけでなく時間の使い方を変える食品です。香りを楽しみ、湯気を眺め、少し呼吸を整える。ウクライナの自然を感じる一杯として、仕事後や就寝前の時間に合います。',
      recommendations: ['仕事後の休憩に', '夜のリラックスタイムに', '甘いお菓子と一緒に'],
    }
  }

  return {
    title: '背景のある食品を、日々の食卓へ',
    text:
      'Sonyachnaでは、ただ珍しいだけの商品ではなく、土地、文化、食卓とのつながりを感じられる食品を選んでいます。毎日の中で自然に使えて、少し記憶に残るもの。それが私たちの選ぶ基準です。',
    recommendations: ['日常の食卓に', '贈り物に', '新しい味との出会いに'],
  }
}

function ProductSection({
  title,
  items,
}: {
  title: string
  items: Product[]
}) {
  if (items.length === 0) return null

  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sonyachnaが厳選したおすすめ商品です。
            </p>
          </div>

          <Link
            href="/shop"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            すべて見る
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
          {items.map((item) => (
            <ProductCard key={`${title}-${item.id}`} product={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) {
    return {
      title: '商品が見つかりません | Sonyachna',
    }
  }

  return {
    title: `${product.name} | Sonyachna`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = getRelatedProducts(product)
  const bestsellerProducts = getBestsellerProducts(product)
  const recommendedProducts = getRecommendedProducts(product)
  const productStory = getProductStory(product)

  const stockStatus = {
    'in-stock': { label: '在庫あり', color: 'text-green-700', icon: Check },
    limited: { label: '残りわずか', color: 'text-amber-600', icon: AlertCircle },
    'out-of-stock': { label: '在庫切れ', color: 'text-red-600', icon: AlertCircle },
  }

  const status = stockStatus[product.stockStatus]

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

      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            商品一覧に戻る
          </Link>
        </div>

        <section className="pb-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-5">
                <div className="relative aspect-square overflow-hidden rounded-[28px] bg-muted shadow-sm">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  {product.tag && (
                    <span className="absolute left-4 top-4 rounded-full bg-foreground/90 px-4 py-1.5 text-sm text-primary-foreground">
                      {product.tag}
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    <p className="mt-2 text-xs font-medium text-foreground">
                      ウクライナ由来
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      土地と食文化の背景を持つ食品
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="mt-2 text-xs font-medium text-foreground">
                      正規輸入
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      品質を確認して丁寧にお届け
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <p className="mt-2 text-xs font-medium text-foreground">
                      ギフトにも
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      日常にも贈り物にも使いやすい一品
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                {product.category && (
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">
                    {product.category}
                  </p>
                )}

                <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
                  {product.name}
                </h1>

                <p className="mt-4 text-2xl font-medium">
                  ¥{product.price.toLocaleString()}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (税込)
                  </span>
                </p>

                <div className={`mt-4 flex items-center gap-2 ${status.color}`}>
                  <status.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{status.label}</span>
                </div>

                <p className="mt-6 leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                <div className="mt-6 rounded-3xl border border-border bg-card p-5">
                  <p className="text-xs tracking-[0.22em] text-muted-foreground">
                    WHY SONYACHNA
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="flex gap-3 text-sm leading-6">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-green-700" />
                      <span>ウクライナの食文化を感じられる、背景のある食品です。</span>
                    </div>
                    <div className="flex gap-3 text-sm leading-6">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-green-700" />
                      <span>日本の食卓でも使いやすい味わいと用途を基準に選んでいます。</span>
                    </div>
                    <div className="flex gap-3 text-sm leading-6">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-green-700" />
                      <span>大量消費ではなく、少し記憶に残る一品として楽しめます。</span>
                    </div>
                  </div>
                </div>

                <AddToCartButton
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

                <div className="mt-8 rounded-3xl border border-border bg-[linear-gradient(135deg,#fff7e8_0%,#fffdf8_55%,#f6f1e8_100%)] p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs tracking-[0.22em] text-muted-foreground">
                      STORY
                    </p>
                  </div>

                  <h2 className="mt-3 font-serif text-2xl tracking-tight">
                    {productStory.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {productStory.text}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {productStory.recommendations.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 space-y-6 border-t border-border pt-8">
                  <h2 className="font-medium">商品詳細</h2>
                  <dl className="space-y-4">
                    <div className="flex gap-4">
                      <dt className="w-28 shrink-0 text-sm text-muted-foreground">原産地</dt>
                      <dd className="text-sm">{product.origin}</dd>
                    </div>
                    <div className="flex gap-4">
                      <dt className="w-28 shrink-0 text-sm text-muted-foreground">原材料</dt>
                      <dd className="text-sm">{product.ingredients}</dd>
                    </div>
                    <div className="flex gap-4">
                      <dt className="w-28 shrink-0 text-sm text-muted-foreground">アレルギー</dt>
                      <dd className="text-sm">{product.allergens}</dd>
                    </div>
                    <div className="flex gap-4">
                      <dt className="w-28 shrink-0 text-sm text-muted-foreground">賞味期限</dt>
                      <dd className="text-sm">{product.shelfLife}</dd>
                    </div>
                    <div className="flex gap-4">
                      <dt className="w-28 shrink-0 text-sm text-muted-foreground">保存方法</dt>
                      <dd className="text-sm">{product.storage}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border bg-muted p-6">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">配送について</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      ご注文確定後、3〜5営業日以内に発送いたします。
                      商品の品質を保つため、適切な梱包でお届けします。
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border bg-muted p-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">安心して選べます</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      食品のため、保存方法や原材料を確認したうえでご購入いただけます。
                      不明点がある場合はお問い合わせください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ProductSection title="関連商品" items={relatedProducts} />
        <ProductSection title="人気商品" items={bestsellerProducts} />
        <ProductSection title="おすすめ商品" items={recommendedProducts} />
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
  )
}
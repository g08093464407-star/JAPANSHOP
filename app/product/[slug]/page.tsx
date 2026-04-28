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
  Clock3,
  PackageCheck,
  HeartHandshake,
  Utensils,
  Star,
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

type ProductPositioning = {
  eyebrow: string
  headline: string
  subheadline: string
  buyingReason: string
  sensoryNote: string
  idealFor: string[]
  closingLine: string
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

function getProductPositioning(product: Product): ProductPositioning {
  const category = product.category ?? ''

  if (category.includes('蜂蜜')) {
    return {
      eyebrow: 'UKRAINIAN HONEY',
      headline: '朝の食卓に、ウクライナの花畑をひとさじ。',
      subheadline:
        'パン、ヨーグルト、紅茶に合わせやすい、自然な甘さの蜂蜜です。毎日の習慣に入れやすく、贈り物にも使いやすい一品です。',
      buyingReason:
        '甘さだけでなく、土地・花・季節の余韻を楽しめる蜂蜜を選びたい方へ。',
      sensoryNote:
        'まろやかな甘さと、花の香りがゆっくり残ります。',
      idealFor: ['朝食', '紅茶', 'ヨーグルト', '小さなギフト'],
      closingLine:
        'この蜂蜜そのものが、ウクライナの花畑の記憶です。',
    }
  }

  if (category.includes('お菓子')) {
    return {
      eyebrow: 'UKRAINIAN SWEETS',
      headline: 'ティータイムに、静かな満足感を。',
      subheadline:
        '派手な甘さではなく、コーヒーや紅茶に寄り添う落ち着いた味わい。日常の休憩時間を少し豊かにします。',
      buyingReason:
        '日本ではまだ珍しい、ウクライナのお菓子文化を気軽に試したい方へ。',
      sensoryNote:
        '濃さと甘さのバランスがあり、余韻が残ります。',
      idealFor: ['コーヒー', '午後の休憩', '来客用', 'ギフト'],
      closingLine:
        'この一品が、いつもの休憩時間に小さな物語を加えます。',
    }
  }

  if (category.includes('食用油')) {
    return {
      eyebrow: 'SUNFLOWER OIL',
      headline: '料理の香りを支える、ひまわり畑の恵み。',
      subheadline:
        'サラダ、パスタ、野菜料理に使いやすいウクライナ産ひまわり油。素材の味を邪魔せず、日々の料理になじみます。',
      buyingReason:
        '毎日の料理に、背景のある食材を自然に取り入れたい方へ。',
      sensoryNote:
        '軽やかで、料理全体を自然にまとめます。',
      idealFor: ['サラダ', 'パスタ', '野菜料理', '家庭料理'],
      closingLine:
        'この油は主役ではなく、料理を静かに支える存在です。',
    }
  }

  if (category.includes('ドライフルーツ')) {
    return {
      eyebrow: 'DRIED FRUITS',
      headline: '果物の甘みを、ゆっくり閉じ込めた間食。',
      subheadline:
        '朝食、お茶の時間、仕事中の軽い間食に使いやすいドライフルーツ。自然な甘みを少しずつ楽しめます。',
      buyingReason:
        '重すぎない甘さで、日常に取り入れやすい食品を探している方へ。',
      sensoryNote:
        '果物本来の甘みと、乾燥による凝縮感があります。',
      idealFor: ['朝食', 'お茶の時間', '間食', 'ヨーグルト'],
      closingLine:
        'この一袋は、果物を長く楽しむための昔ながらの知恵です。',
    }
  }

  if (category.includes('お茶')) {
    return {
      eyebrow: 'HERBAL TEA',
      headline: '一日の終わりに、ウクライナの自然を一杯。',
      subheadline:
        '香りを楽しみ、湯気を眺め、呼吸を整える。仕事後や夜の時間に合う、静かなハーブティーです。',
      buyingReason:
        '忙しい日の終わりに、甘くない贅沢を持ちたい方へ。',
      sensoryNote:
        'やさしい香りが広がり、後味は軽やかです。',
      idealFor: ['仕事後', '夜の時間', '読書', '甘いお菓子と一緒に'],
      closingLine:
        'この一杯は、時間の使い方を少し変えてくれます。',
    }
  }

  return {
    eyebrow: 'UKRAINIAN FOOD',
    headline: '背景のある食品を、日々の食卓へ。',
    subheadline:
      '珍しさだけではなく、土地、文化、食卓とのつながりを感じられる食品を選びました。',
    buyingReason:
      '新しい味との出会いを、日常の中で自然に楽しみたい方へ。',
    sensoryNote:
      '毎日の食卓に自然になじみます。',
    idealFor: ['日常の食卓', '贈り物', '新しい味との出会い'],
    closingLine:
      'この一品が、ウクライナの食文化への入口になります。',
  }
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
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: Product[]
}) {
  if (items.length === 0) return null

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

  const positioning = getProductPositioning(product)

  return {
    title: `${product.name} | Sonyachna`,
    description: positioning.subheadline,
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
  const positioning = getProductPositioning(product)
  const galleryImages =
    product.images && product.images.length > 0 ? product.images : [product.image]

  const stockStatus = {
    'in-stock': { label: '在庫あり', color: 'text-emerald-700', icon: Check },
    limited: { label: '残りわずか', color: 'text-amber-700', icon: AlertCircle },
    'out-of-stock': { label: '在庫切れ', color: 'text-red-700', icon: AlertCircle },
  }

  const status = stockStatus[product.stockStatus]
  const StatusIcon = status.icon

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
                <div className="relative overflow-hidden rounded-[34px] border border-[#e6d7c1] bg-[#f4ead9] p-3 shadow-[0_28px_80px_rgba(58,42,22,0.14)]">
                  <div className="relative aspect-square overflow-hidden rounded-[26px] bg-neutral-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {product.tag && (
                          <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-neutral-950 shadow-sm">
                            {product.tag}
                          </span>
                        )}
                        <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                          {product.origin}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {galleryImages.slice(0, 4).map((image) => (
                      <div
                        key={image}
                        className="relative aspect-square overflow-hidden rounded-2xl border border-[#e6d7c1] bg-white shadow-sm"
                      >
                        <Image
                          src={image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-[#e6d7c1] bg-white/80 p-4 shadow-sm">
                    <Leaf className="h-4 w-4 text-neutral-500" />
                    <p className="mt-2 text-xs font-semibold text-neutral-950">
                      ウクライナ由来
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">
                      土地と食文化の背景を持つ食品
                    </p>
                  </div>

                  <div className="rounded-3xl border border-[#e6d7c1] bg-white/80 p-4 shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-neutral-500" />
                    <p className="mt-2 text-xs font-semibold text-neutral-950">
                      正規輸入
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">
                      手続きを経て日本へお届け
                    </p>
                  </div>

                  <div className="rounded-3xl border border-[#e6d7c1] bg-white/80 p-4 shadow-sm">
                    <Gift className="h-4 w-4 text-neutral-500" />
                    <p className="mt-2 text-xs font-semibold text-neutral-950">
                      ギフトにも
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">
                      日常にも贈り物にも使いやすい一品
                    </p>
                  </div>
                </div>
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

                  <p className="mt-5 text-base leading-8 text-neutral-650">
                    {positioning.subheadline}
                  </p>

                  <div className="mt-6 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5">
                    <p className="text-xs tracking-[0.24em] text-neutral-500">
                      なぜこれを選ぶのか
                    </p>
                    <p className="mt-3 text-sm leading-7 text-neutral-800">
                      {positioning.buyingReason}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <p className="text-3xl font-semibold tracking-tight text-neutral-950">
                      ¥{product.price.toLocaleString()}
                    </p>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-500">
                      税込
                    </span>
                    <div className={`flex items-center gap-1.5 ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{status.label}</span>
                    </div>
                  </div>

                  <div className="mt-6">
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
                  </div>

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

        <section className="border-y border-[#eadfce] bg-white py-14">
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
                ['原産地', product.origin],
                ['原材料', product.ingredients],
                ['アレルギー', product.allergens],
                ['賞味期限', product.shelfLife],
                ['保存方法', product.storage],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-2 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5 sm:grid-cols-[120px_1fr]"
                >
                  <dt className="text-sm text-neutral-500">{label}</dt>
                  <dd className="text-sm leading-7 text-neutral-900">{value}</dd>
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
  )
}
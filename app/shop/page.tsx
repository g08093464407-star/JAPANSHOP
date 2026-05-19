import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { ProductCard } from '@/components/product'
import { getCatalogProducts } from '@/lib/product/catalog'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sonyachna.com'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '商品一覧 | Sonyachna',
  description:
    'ウクライナの厳選食品をご覧ください。蜂蜜、ひまわり油、ハーブティーなど、品質にこだわった商品を取り揃えています。',

  openGraph: {
    title: '商品一覧 | Sonyachna',
    description:
      'ウクライナの厳選食品をご覧ください。蜂蜜、ひまわり油、ハーブティーなど、品質にこだわった商品を取り揃えています。',
    images: [
      {
        url: `${SITE_URL}/og/shop.png`,
        width: 1200,
        height: 630,
        alt: '商品一覧 | Sonyachna',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: '商品一覧 | Sonyachna',
    description:
      'ウクライナの厳選食品をご覧ください。蜂蜜、ひまわり油、ハーブティーなど、品質にこだわった商品を取り揃えています。',
    images: [`${SITE_URL}/og/shop.png`],
  },

  alternates: {
    canonical: '/shop',
  },
}

export default async function ShopPage() {
  const products = await getCatalogProducts()

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section className="py-16 text-center md:py-24">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              ショップ
            </p>
            <h1 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl lg:text-5xl">
              商品一覧
            </h1>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-muted-foreground">
              ウクライナの豊かな自然から届いた、厳選された食品をご覧ください。
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-[#eadfce] bg-white px-6 py-14 text-center shadow-sm">
                <p className="text-xs tracking-[0.24em] text-neutral-500">
                  CATALOG
                </p>
                <h2 className="mt-3 font-serif text-2xl tracking-tight text-neutral-950">
                  現在、公開中の商品はありません
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-600">
                  商品が公開されると、このページに表示されます。
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

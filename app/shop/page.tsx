import { Metadata } from 'next'
import { Header, Footer } from '@/components/layout'
import { ProductCard } from '@/components/product'
import { products } from '@/data/products'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sonyachna.com'

export const metadata: Metadata = {
  title: '商品一覧 | Sonyachna',
  description:
    'ウクライナの厳選食品をご覧ください。蜂蜜、ひまわり油、ハーブティーなど、品質にこだわった商品を取り揃えています。',

  openGraph: {
    images: [`${SITE_URL}/og.png`],
  },

  twitter: {
    images: [`${SITE_URL}/og.png`],
  },
}

export default function ShopPage() {
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
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
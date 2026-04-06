import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/product'
import { getFeaturedProducts } from '@/data/products'

export function FeaturedProducts() {
  const products = getFeaturedProducts(6)

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              商品
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">
              厳選された商品
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground md:flex"
          >
            すべての商品を見る
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <Link
          href="/shop"
          className="mt-10 flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:text-muted-foreground md:hidden"
        >
          すべての商品を見る
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

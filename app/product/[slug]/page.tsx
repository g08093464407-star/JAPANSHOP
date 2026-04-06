import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { Header, Footer } from '@/components/layout'
import { products, getProductBySlug } from '@/data/products'
import AddToCartButton from '@/components/AddToCartButton'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
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

  const stockStatus = {
    'in-stock': { label: '在庫あり', color: 'text-green-700', icon: Check },
    limited: { label: '残りわずか', color: 'text-amber-600', icon: AlertCircle },
    'out-of-stock': { label: '在庫切れ', color: 'text-red-600', icon: AlertCircle },
  }

  const status = stockStatus[product.stockStatus]

  return (
    <>
      <Header />
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
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
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

                <AddToCartButton
                  product={{
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    stockStatus: product.stockStatus,
                  }}
                />

                <div className="mt-12 space-y-6 border-t border-border pt-8">
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

                <div className="mt-8 rounded-lg bg-muted p-6">
                  <h3 className="font-medium">配送について</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    ご注文確定後、3〜5営業日以内に発送いたします。
                    商品の品質を保つため、適切な梱包でお届けします。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

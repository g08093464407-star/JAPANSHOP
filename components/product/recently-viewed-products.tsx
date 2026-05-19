'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import type { Product } from '@/types/product'
import { ProductCard } from '@/components/product'

type RecentlyViewedProductsProps = {
  currentProductId?: string
}

type PublicCatalogProduct = Product & {
  legacyId?: string | null
}

type PublicCatalogResponse = {
  products?: PublicCatalogProduct[]
  error?: string
}

const STORAGE_KEY = 'sonyachna_recently_viewed_products'

export default function RecentlyViewedProducts({
  currentProductId,
}: RecentlyViewedProductsProps) {
  const [viewedIds, setViewedIds] = useState<string[]>([])
  const [catalogProducts, setCatalogProducts] = useState<PublicCatalogProduct[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as string[]) : []
      setViewedIds(parsed)
    } catch {
      setViewedIds([])
    }
  }, [currentProductId])

  useEffect(() => {
    let isMounted = true

    async function loadCatalogProducts() {
      try {
        const response = await fetch('/api/catalog/products', { cache: 'no-store' })

        if (!response.ok) {
          if (isMounted) setCatalogProducts([])
          return
        }

        const data = (await response.json()) as PublicCatalogResponse

        if (isMounted) {
          setCatalogProducts(data.products ?? [])
        }
      } catch {
        if (isMounted) setCatalogProducts([])
      }
    }

    void loadCatalogProducts()

    return () => {
      isMounted = false
    }
  }, [])

  const recentlyViewedProducts = useMemo(() => {
    return viewedIds
      .filter((id) => id !== currentProductId)
      .map((id) =>
        catalogProducts.find(
          (product) => product.id === id || product.legacyId === id
        )
      )
      .filter((product): product is PublicCatalogProduct => Boolean(product))
      .slice(0, 4)
  }, [viewedIds, currentProductId, catalogProducts])

  if (recentlyViewedProducts.length === 0) return null

  return (
    <section className="border-t border-[#eadfce] bg-[#fffaf2] py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              RECENTLY VIEWED
            </p>
            <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950 md:text-3xl">
              最近見た商品
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              気になった商品を、もう一度確認できます。
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
          {recentlyViewedProducts.map((product) => (
            <ProductCard key={`recent-${product.id}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
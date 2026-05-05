'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

type Product = {
  id: string
  name: string
  slug: string
  image?: string
}

type Props = {
  products: Product[]
}

export default function PostPurchaseRecommendations({ products }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 7000)
    return () => clearTimeout(timer)
  }, [])

  if (!products || products.length === 0) return null

  return (
    <div
      className={`mt-6 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <p className="text-[11px] tracking-[0.28em] text-neutral-400">
        次に試してほしい
      </p>

      <div className="mt-3 flex gap-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group flex w-[90px] flex-col items-center text-center"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-[11px] text-neutral-600 group-hover:text-neutral-900">
              {product.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
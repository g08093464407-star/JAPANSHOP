import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Product } from '@/types/product'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const stockLabel = {
    'in-stock': null,
    limited: '残りわずか',
    'out-of-stock': '在庫切れ',
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'group block rounded-[28px] border border-[#e6d7c1] bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(58,42,22,0.13)]',
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[#f4ead9]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {product.tag ? (
            <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-neutral-950 shadow-sm">
              {product.tag}
            </span>
          ) : (
            <span />
          )}

          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/88 text-neutral-800 opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        {stockLabel[product.stockStatus] && (
          <span className="absolute bottom-3 left-3 rounded-full bg-neutral-950/84 px-3 py-1 text-xs text-white backdrop-blur">
            {stockLabel[product.stockStatus]}
          </span>
        )}
      </div>

      <div className="px-1 pb-2 pt-4">
        {product.category && (
          <p className="text-[11px] tracking-[0.18em] text-neutral-500">
            {product.category}
          </p>
        )}

        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-neutral-950 transition-colors group-hover:text-neutral-650">
          {product.name}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-950">
            ¥{product.price.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500">詳しく見る</p>
        </div>
      </div>
    </Link>
  )
}
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types/product'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const stockLabel = {
    'in-stock': null,
    'limited': '残りわずか',
    'out-of-stock': '在庫切れ',
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn('group block', className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        {product.tag && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/90 px-3 py-1 text-xs text-primary-foreground">
            {product.tag}
          </span>
        )}
        {stockLabel[product.stockStatus] && (
          <span className="absolute bottom-3 left-3 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
            {stockLabel[product.stockStatus]}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium tracking-wide text-foreground transition-colors group-hover:text-muted-foreground">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          ¥{product.price.toLocaleString()}
        </p>
      </div>
    </Link>
  )
}

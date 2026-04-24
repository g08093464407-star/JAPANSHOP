'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { trackAddToCart } from '@/lib/analytics'
import { cn } from '@/lib/utils'

type MobileProductPurchaseBarProps = {
  product: {
    id: string
    slug: string
    name: string
    price: number
    image: string
    stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
    category?: string
  }
}

export default function MobileProductPurchaseBar({
  product,
}: MobileProductPurchaseBarProps) {
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const isDisabled = product.stockStatus === 'out-of-stock'

  function handleAddToCart() {
    if (isDisabled) return

    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      stockStatus: product.stockStatus,
    })

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      category: product.category,
    })

    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1400)
  }

  useEffect(() => {
    return () => setJustAdded(false)
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-[0_-18px_40px_rgba(15,23,42,0.10)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-xs text-neutral-500">
            {product.name}
          </div>
          <div className="mt-0.5 text-base font-semibold text-neutral-900">
            ¥{product.price.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-neutral-500">
              税込
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isDisabled}
          onClick={handleAddToCart}
          className={cn(
            'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-medium transition-all duration-300',
            isDisabled
              ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
              : 'bg-neutral-900 text-white shadow-[0_12px_28px_rgba(15,23,42,0.20)] active:scale-[0.97]'
          )}
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              追加済み
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              {isDisabled ? '在庫切れ' : '追加'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
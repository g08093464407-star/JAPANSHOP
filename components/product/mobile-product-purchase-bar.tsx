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
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-[#e6d7c1] bg-[#fffaf2]/96 px-4 py-3 shadow-[0_-20px_48px_rgba(58,42,22,0.16)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-xs text-neutral-500">
            {product.name}
          </div>
          <div className="mt-0.5 text-base font-semibold text-neutral-950">
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
            'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-all duration-300',
            isDisabled
              ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
              : 'bg-neutral-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.24)] active:scale-[0.97]'
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
              {isDisabled ? '在庫切れ' : 'カートに入れる'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
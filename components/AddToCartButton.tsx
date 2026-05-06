'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { trackAddToCart } from '@/lib/analytics'

interface Props {
  product: {
    id: string
    slug: string
    name: string
    price: number
    image: string
    stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
    category?: string
  }
  attachedShareTail?: boolean
}

export default function AddToCartButton({ product, attachedShareTail = false }: Props) {
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const [pressed, setPressed] = useState(false)

  const isDisabled = product.stockStatus === 'out-of-stock'

  const handleClick = () => {
    if (isDisabled) return

    setPressed(true)

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

    window.setTimeout(() => setPressed(false), 180)
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  useEffect(() => {
    return () => {
      setJustAdded(false)
      setPressed(false)
    }
  }, [])

  return (
    <div
      className={
        attachedShareTail
          ? 'flex w-full flex-col gap-3'
          : 'mt-8 flex w-full max-w-md flex-col gap-3'
      }
    >
      <Button
        type="button"
        size="lg"
        disabled={isDisabled}
        onClick={handleClick}
        className={`
          group relative h-14 w-full overflow-hidden
          ${attachedShareTail ? 'rounded-l-2xl rounded-r-[10px]' : 'rounded-2xl'} px-8
          text-base font-semibold
          transition-all duration-300 ease-out
          hover:-translate-y-0.5 hover:scale-[1.015]
          hover:shadow-[0_18px_45px_rgba(0,0,0,0.20)]
          hover:brightness-105
          active:translate-y-[1px] active:scale-[0.975]
          ${pressed ? 'scale-[0.975] shadow-[0_8px_18px_rgba(0,0,0,0.16)]' : ''}
        `}
      >
        <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

        <span className="relative flex items-center justify-center gap-2">
          {justAdded ? (
            <>
              <Check className="h-4 w-4 animate-pulse" />
              <span>追加しました</span>
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105" />
              <span>{isDisabled ? '在庫切れ' : 'カートに入れる'}</span>
            </>
          )}
        </span>
      </Button>

      <div
        className={`text-sm font-medium transition-all duration-300 ${
          justAdded
            ? 'translate-y-0 opacity-100 text-neutral-900'
            : '-translate-y-1 opacity-0 text-transparent'
        }`}
        aria-live="polite"
      >
        商品をカートに追加しました。
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'

interface Props {
  product: {
    id: string
    slug: string
    name: string
    price: number
    image: string
    stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
  }
}

export default function AddToCartButton({ product }: Props) {
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
    <div className="mt-8 flex flex-col gap-3">
      <Button
        type="button"
        size="lg"
        disabled={isDisabled}
        onClick={handleClick}
        className={`
          group relative overflow-hidden
          w-full md:w-auto
          rounded-xl px-8
          transition-all duration-300 ease-out
          hover:-translate-y-1 hover:scale-[1.035]
          hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)]
          hover:brightness-110
          active:translate-y-[1px] active:scale-[0.965]
          ${pressed ? 'scale-[0.965] shadow-[0_8px_18px_rgba(0,0,0,0.16)]' : ''}
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
              <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" />
              <span>{isDisabled ? '在庫切れ' : 'カートに追加'}</span>
            </>
          )}
        </span>
      </Button>

      <div
        className={`text-sm font-medium transition-all duration-300 ${
          justAdded
            ? 'translate-y-0 opacity-100 text-foreground'
            : '-translate-y-1 opacity-0 text-transparent'
        }`}
        aria-live="polite"
      >
        商品をカートに追加しました。
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'

const navigation = [
  { name: 'ショップ', href: '/shop' },
  { name: '私たちについて', href: '/about' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartAnimated, setCartAnimated] = useState(false)
  const { cartCount, lastAddedAt } = useCart()

  const previousLastAddedAt = useRef<number | null>(null)
  const animationTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (previousLastAddedAt.current === null) {
      previousLastAddedAt.current = lastAddedAt
      return
    }

    if (!lastAddedAt || previousLastAddedAt.current === lastAddedAt) {
      return
    }

    previousLastAddedAt.current = lastAddedAt
    setCartAnimated(true)

    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current)
    }

    animationTimerRef.current = window.setTimeout(() => {
      setCartAnimated(false)
    }, 820)

    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current)
      }
    }
  }, [lastAddedAt])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-wide">Sonyachna</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-10">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}

          <Link
            href="/cart"
            className={cn(
              'relative inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-500 ease-out hover:border-foreground/40 hover:text-foreground hover:shadow-md',
              cartAnimated &&
                'border-foreground/30 text-foreground shadow-[0_14px_34px_rgba(15,23,42,0.10)] -translate-y-[1px]'
            )}
            aria-label="カートを見る"
          >
            <span
              className={cn(
                'absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_72%)] opacity-0 transition-opacity duration-500',
                cartAnimated && 'opacity-100'
              )}
            />

            <ShoppingBag
              className={cn(
                'relative h-5 w-5 transition-all duration-500 ease-out',
                cartAnimated && 'scale-[1.12] -translate-y-[1px]'
              )}
            />

            <span className="relative">カート</span>

            <span
              className={cn(
                'relative inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold transition-all duration-500 ease-out',
                cartCount > 0
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground',
                cartAnimated &&
                  'scale-110 shadow-[0_0_0_4px_rgba(15,23,42,0.06)]'
              )}
            >
              {cartCount}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <Link
            href="/cart"
            className={cn(
              'relative inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-500 ease-out hover:border-foreground/40 hover:text-foreground',
              cartAnimated &&
                'border-foreground/30 text-foreground shadow-[0_14px_34px_rgba(15,23,42,0.10)] -translate-y-[1px]'
            )}
            aria-label="カートを見る"
          >
            <span
              className={cn(
                'absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_72%)] opacity-0 transition-opacity duration-500',
                cartAnimated && 'opacity-100'
              )}
            />

            <ShoppingBag
              className={cn(
                'relative h-5 w-5 transition-all duration-500 ease-out',
                cartAnimated && 'scale-[1.12] -translate-y-[1px]'
              )}
            />

            <span
              className={cn(
                'relative inline-flex min-w-5 items-center justify-center rounded-full px-1 py-0.5 text-[10px] font-semibold transition-all duration-500 ease-out',
                cartCount > 0
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground',
                cartAnimated &&
                  'scale-110 shadow-[0_0_0_4px_rgba(15,23,42,0.06)]'
              )}
            >
              {cartCount}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      <div className={cn('md:hidden', mobileMenuOpen ? 'block' : 'hidden')}>
        <div className="space-y-1 border-t border-border px-6 pb-6 pt-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-3 text-base tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <Link
            href="/cart"
            className="block py-3 text-base tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            カート ({cartCount})
          </Link>
        </div>
      </div>
    </header>
  )
}
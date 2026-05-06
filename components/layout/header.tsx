'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, ShoppingBag, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import SunLogo from '@/components/ui/SunLogo'

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

  useEffect(() => {
    if (!mobileMenuOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMobileMenuOpen(false)}
        >
          <SunLogo />
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
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'relative inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-500 ease-out hover:border-foreground/40 hover:text-foreground',
              cartAnimated &&
                'border-foreground/30 text-foreground shadow-[0_14px_34px_rgba(15,23,42,0.10)] -translate-y-[1px]'
            )}
            aria-label="カートを見る"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>{cartCount}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:border-foreground/40"
            aria-label={mobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="fixed inset-0 top-[81px] z-40 bg-neutral-950/28 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            id="mobile-navigation"
            className="absolute left-0 right-0 top-full z-50 border-b border-[#eadfce] bg-[#fffaf2] px-6 pb-6 pt-3 shadow-[0_26px_70px_rgba(58,42,22,0.16)]"
          >
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-[#eadfce] bg-white/92 p-4 shadow-sm">
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="group flex items-center justify-between rounded-2xl border border-transparent px-4 py-4 text-base font-medium text-neutral-900 transition hover:border-[#eadfce] hover:bg-[#fffaf2]"
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-neutral-900" />
                  </Link>
                ))}
              </div>

              <div className="mt-4 border-t border-[#eadfce] pt-4">
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  <ShoppingBag className="h-4 w-4" />
                  カートを見る
                  <span className="rounded-full bg-white/16 px-2 py-0.5 text-xs">
                    {cartCount}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
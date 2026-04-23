'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { cn } from '@/lib/utils'

export default function MiniCartDrawer() {
  const { items, cartCount, cartTotal, lastAddedAt, removeItem, updateQuantity } = useCart()

  const [open, setOpen] = useState(false)
  const [launcherVisible, setLauncherVisible] = useState(false)
  const [launcherAnimated, setLauncherAnimated] = useState(false)

  const previous = useRef<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const animationTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (cartCount > 0) {
      setLauncherVisible(true)
    } else {
      setLauncherVisible(false)
      setOpen(false)
    }
  }, [cartCount])

  useEffect(() => {
    if (previous.current === null) {
      previous.current = lastAddedAt
      return
    }

    if (!lastAddedAt || previous.current === lastAddedAt) return

    previous.current = lastAddedAt
    setLauncherVisible(true)
    setLauncherAnimated(true)

    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current)
    }

    animationTimerRef.current = window.setTimeout(() => {
      setLauncherAnimated(false)
    }, 1200)

    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current)
      }
    }
  }, [lastAddedAt])

  useEffect(() => {
    if (!open) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 60)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(timer)
    }
  }, [open])

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 right-6 z-[88] transition-all duration-500 ease-out',
          launcherVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="ミニカートを開く"
          className={cn(
            'group flex items-center gap-3 rounded-full border border-neutral-200 bg-white/95 px-4 py-3 text-neutral-900 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-[1px] hover:shadow-[0_22px_50px_rgba(15,23,42,0.16)]',
            launcherAnimated && 'scale-[1.04] shadow-[0_24px_55px_rgba(15,23,42,0.16)]'
          )}
        >
          <span
            className={cn(
              'relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#faf7f2_0%,#f6f1e8_100%)] transition-all duration-500',
              launcherAnimated && 'shadow-[0_0_0_6px_rgba(15,23,42,0.05)]'
            )}
          >
            <ShoppingBag
              className={cn(
                'h-5 w-5 transition-all duration-500 ease-out',
                launcherAnimated && 'scale-110 -translate-y-[1px]'
              )}
            />
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
              {cartCount}
            </span>
          </span>

          <div className="hidden text-left sm:block">
            <div className="text-xs tracking-[0.18em] text-neutral-500">
              MINI CART
            </div>
            <div className="mt-0.5 text-sm font-medium text-neutral-900">
              ¥{cartTotal.toLocaleString()}
            </div>
          </div>
        </button>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          aria-label="ミニカートを閉じる"
          onClick={() => setOpen(false)}
          className="h-full w-full cursor-default"
        />
      </div>

      <aside
        className={cn(
          'fixed right-0 top-0 z-[95] flex h-dvh w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-transform duration-500 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="ミニカート"
      >
        <div className="border-b border-neutral-200 bg-[linear-gradient(135deg,#fff7e8_0%,#fffdf8_55%,#f6f1e8_100%)] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.22em] text-neutral-500">
                MINI CART
              </p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-900">
                カート内容
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                現在 {cartCount} 点の商品が入っています。
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-600">
              カートに商品がありません。
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <article
                  key={`${item.id}-${index}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="pr-2">
                        <p className="line-clamp-2 text-sm font-medium text-neutral-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          ¥{item.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex h-10 items-center overflow-hidden rounded-xl border border-neutral-300">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="inline-flex h-full w-10 items-center justify-center text-base text-neutral-800 transition hover:bg-neutral-50"
                            aria-label={`${item.name} quantity decrease`}
                          >
                            −
                          </button>

                          <span className="inline-flex h-full min-w-10 items-center justify-center border-x border-neutral-300 px-3 text-sm font-medium text-neutral-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-full w-10 items-center justify-center text-base text-neutral-800 transition hover:bg-neutral-50"
                            aria-label={`${item.name} quantity increase`}
                          >
                            ＋
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-semibold text-neutral-900">
                            ¥{(item.price * item.quantity).toLocaleString()}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="mt-1 text-xs font-medium text-red-500 transition hover:opacity-80"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200 bg-white px-5 py-5">
          <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>商品点数</span>
              <span>{cartCount} 点</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
              <span>小計</span>
              <span>¥{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              ご購入手続きへ
            </Link>

            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              カートを見る
            </Link>
          </div>

          <p className="mt-4 text-xs leading-6 text-neutral-500">
            ご注文内容をご確認のうえ、決済へお進みください。
          </p>
        </div>
      </aside>
    </>
  )
}
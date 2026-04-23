'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'

export default function MiniCartDrawer() {
  const { items, cartCount, cartTotal, lastAddedAt, removeItem, updateQuantity } = useCart()

  const [open, setOpen] = useState(false)
  const previous = useRef<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (previous.current === null) {
      previous.current = lastAddedAt
      return
    }

    if (!lastAddedAt || previous.current === lastAddedAt) return

    previous.current = lastAddedAt
    setOpen(true)
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

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="ミニカートを閉じる"
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
      />

      <aside
        className="fixed right-0 top-0 z-[95] flex h-dvh w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-transform duration-500 ease-out"
        aria-label="ミニカート"
      >
        <div className="border-b border-neutral-200 bg-[linear-gradient(135deg,#fff7e8_0%,#fffdf8_55%,#f6f1e8_100%)] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.22em] text-neutral-500">
                MINI CART
              </p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-900">
                カートに追加しました
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
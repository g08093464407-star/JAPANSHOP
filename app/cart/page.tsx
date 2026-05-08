"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { useCart } from "@/hooks/use-cart"
import { products } from "@/data/products"
import { getShippingEstimateRange } from "@/lib/shipping/japan-post"

function ProductMarquee() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    let animationFrame = 0
    let scrollPosition = 0
    const speed = 0.3

    function animate() {
      if (!isPaused && element) {
        scrollPosition += speed

        if (scrollPosition >= element.scrollWidth / 2) {
          scrollPosition = 0
        }

        element.scrollLeft = scrollPosition
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [isPaused])

  const loopProducts = [...products, ...products]

  return (
    <section className="mt-14 overflow-hidden rounded-[32px] border border-neutral-200 bg-white py-8 shadow-sm">
      <div className="mb-7 px-6 text-center sm:px-8">
        <p className="text-xs tracking-[0.24em] text-neutral-500">
          DISCOVER PRODUCTS
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
          おすすめの商品
        </h2>
      </div>

      <div
        ref={containerRef}
        className="flex cursor-grab overflow-x-hidden active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex gap-4 px-4">
          {loopProducts.map((product, index) => (
            <Link
              key={`${product.id}-${index}`}
              href={`/product/${product.slug}`}
              className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 sm:h-48 sm:w-48"
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 160px, 192px"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-lg bg-white/90 px-2 py-1.5 text-center text-[10px] font-bold text-neutral-900 backdrop-blur-sm">
                  VIEW PRODUCT
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function CartPage() {
  const { items, cartCount, cartTotal, removeItem, updateQuantity } = useCart()
  const shippingEstimate = getShippingEstimateRange(items)

  if (cartCount === 0) {
    return (
      <main className="bg-[#f5f1e8] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-neutral-200 bg-white p-10 text-center shadow-sm sm:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <h1 className="mt-8 text-3xl font-semibold tracking-tight text-neutral-900">
              カートは空です
            </h1>
            <p className="mt-4 text-base text-neutral-600">
              まだ商品が追加されていません。ウクライナの厳選された商品を探してみませんか？
            </p>
            <div className="mt-10">
              <Link
                href="/shop"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-neutral-900 px-8 text-sm font-medium text-white transition hover:opacity-90"
              >
                ショッピングを続ける
              </Link>
            </div>
          </div>

          <ProductMarquee />
        </div>
      </main>
    )
  }

  return (
    <main className="bg-[#f5f1e8] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            ショッピングカート
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            {cartCount} 点の商品が入っています。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:gap-6 sm:p-5"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 sm:h-32 sm:w-32">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, 128px"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 transition hover:text-red-500"
                        aria-label="商品を削除"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      ¥{item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-neutral-300">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="flex h-full w-10 items-center justify-center text-lg transition hover:bg-neutral-50"
                      >
                        −
                      </button>
                      <span className="flex h-full min-w-[40px] items-center justify-center border-x border-neutral-300 px-2 text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-full w-10 items-center justify-center text-lg transition hover:bg-neutral-50"
                      >
                        ＋
                      </button>
                    </div>

                    <p className="text-lg font-semibold text-neutral-900">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
              注文概要
            </h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-neutral-600">
                <span>商品合計</span>
                <span>¥{cartTotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span>送料目安</span>
                <span>
                  ¥{shippingEstimate.min.toLocaleString()}〜¥{shippingEstimate.max.toLocaleString()}
                </span>
              </div>

              <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-xs leading-6 text-neutral-600">
                日本郵便ゆうパック{shippingEstimate.size}サイズ・愛知県発送を基準に、配送先入力後に正確な送料を確定します。
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
                <span>商品合計</span>
                <span>¥{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/checkout"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90"
              >
                ご購入手続きへ
              </Link>

              <Link
                href="/shop"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-neutral-300 px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                買い物を続ける
              </Link>

              <Link
                href="/stories"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                ストーリーから追加する
              </Link>
            </div>

            <p className="mt-4 text-xs leading-6 text-neutral-500">
              送料はチェックアウトで配送先を入力した後、商品合計とは別に一度の決済でお支払いいただきます。
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
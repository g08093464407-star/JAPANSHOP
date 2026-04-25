"use client"

import Image from "next/image"
import Link from "next/link"

import { useCart } from "@/hooks/use-cart"

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, cartTotal } = useCart()

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,#fff7e8_0%,#fffdf8_55%,#f6f1e8_100%)] px-6 py-12 text-center sm:px-10">
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              EMPTY CART
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              カートはまだ空です
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              商品を選ぶ前に、まずはウクライナの食文化に触れてみてください。物語から選ぶことで、ただの買い物ではなく、背景のある食品との出会いになります。
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/stories"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:opacity-90"
              >
                ストーリーから選ぶ
              </Link>

              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                商品一覧を見る
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-400">
              STEP 01
            </p>
            <h2 className="mt-2 text-base font-semibold text-neutral-900">
              物語を見る
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              蜂蜜、チョコレート、ひまわり油など、カテゴリーごとの背景を短いStoryBookで紹介します。
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-400">
              STEP 02
            </p>
            <h2 className="mt-2 text-base font-semibold text-neutral-900">
              商品を選ぶ
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              StoryBookの最後に、そのカテゴリーの商品が表示されます。気になる商品をそのままカートへ追加できます。
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-400">
              STEP 03
            </p>
            <h2 className="mt-2 text-base font-semibold text-neutral-900">
              安全に決済する
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              商品を選んだあとは、カート内容を確認してStripeの安全な決済ページへ進めます。
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-sm text-neutral-500">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          / Cart
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          カート
        </h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          {items.map((item, index) => (
            <article
              key={`${item.id}-${index}`}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative h-28 w-full overflow-hidden rounded-xl bg-neutral-100 sm:h-28 sm:w-28 sm:shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                    priority={index === 0}
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">
                      {item.name}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      単価: ¥{item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-neutral-300">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="inline-flex h-full w-11 items-center justify-center text-lg text-neutral-800 transition hover:bg-neutral-50"
                        aria-label={`${item.name} quantity decrease`}
                      >
                        −
                      </button>

                      <span className="inline-flex h-full min-w-12 items-center justify-center border-x border-neutral-300 px-4 text-sm font-medium text-neutral-900">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="inline-flex h-full w-11 items-center justify-center text-lg text-neutral-800 transition hover:bg-neutral-50"
                        aria-label={`${item.name} quantity increase`}
                      >
                        ＋
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <p className="text-base font-semibold text-neutral-900">
                        ¥{(item.price * item.quantity).toLocaleString()}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-sm font-medium text-red-500 transition hover:opacity-80"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}

          <div className="pt-2">
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 px-4 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              カートを空にする
            </button>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-xl font-semibold text-neutral-900">
            ご注文概要
          </h2>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>商品合計</span>
              <span>¥{cartTotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span>送料</span>
              <span>別途計算</span>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
              <span>小計</span>
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
            ご注文内容をご確認のうえ、安全な決済ページへお進みください。
          </p>
        </aside>
      </div>
    </main>
  )
}
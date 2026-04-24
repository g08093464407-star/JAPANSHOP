"use client"

import Image from "next/image"
import Link from "next/link"

import { useCart } from "@/hooks/use-cart"
import { products } from "@/data/products"
import { ProductCard } from "@/components/product"

function getEmptyCartSections() {
  return {
    bestseller: products.filter((product) => product.tag === "人気商品").slice(0, 4),
    newItems: products.filter((product) => product.tag === "新商品").slice(0, 4),
    limited: products.filter((product) => product.stockStatus === "limited").slice(0, 4),
  }
}

function ProductDiscoverySection({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: typeof products
}) {
  if (items.length === 0) return null

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {description}
          </p>
        </div>

        <Link
          href="/shop"
          className="hidden text-sm font-medium text-neutral-500 transition hover:text-neutral-900 sm:inline"
        >
          すべて見る
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

function EmptyCartStoryBlocks() {
  const stories = [
    {
      title: "ウクライナの蜂蜜",
      label: "HONEY",
      image: "/images/products/honey.jpg",
      text:
        "ウクライナの広大なひまわり畑で採れた蜂蜜は、やわらかな甘さと花の香りが特徴です。自然のリズムの中で育まれた味わいを、パンやヨーグルト、紅茶と一緒にお楽しみください。",
    },
    {
      title: "伝統的なチョコレート",
      label: "CHOCOLATE",
      image: "/images/products/chocolate.jpg",
      text:
        "ウクライナのチョコレート文化は、ヨーロッパの伝統を受け継ぎながら独自に発展してきました。濃厚なカカオの風味と、素朴で飽きのこない甘さが魅力です。",
    },
    {
      title: "大地が育てる農産物",
      label: "FARMING",
      image: "/images/products/sunflower-oil.jpg",
      text:
        "ウクライナは豊かな土壌を持つ農業国です。ひまわり油、穀物、果物、ハーブなど、多くの食品が自然環境と農家の手仕事によって支えられています。",
    },
    {
      title: "果物と日々の食卓",
      label: "FRUITS",
      image: "/images/products/dried-fruits.jpg",
      text:
        "りんご、梨、プラムなどの果物は、乾燥させることで自然な甘みが凝縮されます。間食としても、朝食やお茶の時間にも合わせやすい素朴な食品です。",
    },
  ]

  return (
    <section className="mt-20">
      <div className="mb-8 text-center">
        <p className="text-xs tracking-[0.24em] text-neutral-500">
          STORIES FROM UKRAINE
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
          商品の背景にある、ウクライナの食文化
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
          食品は単なる商品ではありません。土地、気候、農家の手仕事、そして日々の食卓とつながっています。
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {stories.map((story) => (
          <article
            key={story.title}
            className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]"
          >
            <div className="relative h-52 overflow-hidden bg-neutral-100">
              <Image
                src={story.image}
                alt={story.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-neutral-800 backdrop-blur">
                {story.label}
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {story.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-neutral-600">
                {story.text}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, cartTotal } = useCart()

  if (items.length === 0) {
    const { bestseller, newItems, limited } = getEmptyCartSections()

    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,#fff7e8_0%,#fffdf8_55%,#f6f1e8_100%)] px-6 py-10 text-center sm:px-10">
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              EMPTY CART
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              カートはまだ空です
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              でも、良い商品との出会いはここから始まります。人気商品、新商品、残りわずかな商品を見ながら、気になるものを探してみてください。
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:opacity-90"
              >
                商品一覧を見る
              </Link>

              <a
                href="#ukraine-stories"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                食文化を読む
              </a>
            </div>
          </div>
        </section>

        <div className="mt-14 space-y-14">
          <ProductDiscoverySection
            title="人気商品"
            description="まず見ておきたい、Sonyachnaで注目されている商品です。"
            items={bestseller}
          />

          <ProductDiscoverySection
            title="新商品"
            description="新しく追加された、ウクライナの食文化を感じられる商品です。"
            items={newItems}
          />

          <ProductDiscoverySection
            title="残りわずか"
            description="在庫が少なくなっている商品です。気になる場合は早めの確認がおすすめです。"
            items={limited}
          />
        </div>

        <div id="ukraine-stories">
          <EmptyCartStoryBlocks />
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:opacity-90"
          >
            商品一覧へ戻る
          </Link>
        </div>
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
          </div>

          <p className="mt-4 text-xs leading-6 text-neutral-500">
            現在はMVP段階のため、実際の決済はまだ行われません。次のステップでStripe連携に進めます。
          </p>
        </aside>
      </div>
    </main>
  )
}
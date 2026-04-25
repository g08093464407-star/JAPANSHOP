"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { useCart } from "@/hooks/use-cart"
import { products } from "@/data/products"
import { ProductCard } from "@/components/product"
import StoryModal from "@/components/ui/story-modal"
import type { Product } from "@/types/product"

type StorySlide = {
  title: string
  text: string
  image: string
}

type Story = {
  title: string
  label: string
  preview: string
  text: string
  slides: StorySlide[]
  category?: string
}

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
  compact = false,
}: {
  title: string
  description: string
  items: Product[]
  compact?: boolean
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

      <div
        className={
          compact
            ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            : "grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6"
        }
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

function EmptyCartStoryBlocks({
  onStoryModalOpenChange,
}: {
  onStoryModalOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [index, setIndex] = useState(0)

  function closeStoryModal() {
    setOpen(false)
    onStoryModalOpenChange?.(false)
  }

  const stories: Story[] = [
    {
      title: "ウクライナの蜂蜜",
      label: "HONEY",
      preview: "/images/products/honey.jpg",
      category: "蜂蜜",
      text:
        "黒土地帯に広がる花畑と、世代を超えて受け継がれてきた養蜂の知恵。ウクライナの蜂蜜には、土地の力と人の手仕事が静かに詰まっています。",
      slides: [
        {
          title: "黒土と花畑が育てる、ウクライナの蜂蜜",
          text:
            "ウクライナは肥沃な黒土で知られる農業国です。夏になると、ひまわり畑や野の花が広がり、ミツバチはその季節の香りを集めます。\n\n蜂蜜の味は、単なる甘さだけでは決まりません。どんな土地で、どんな花が咲き、どんな気候の中で蜜が集められたのか。そのすべてが、香りと余韻に表れます。",
          image: "/images/products/honey.jpg",
        },
        {
          title: "ウクライナは、ヨーロッパ有数の蜂蜜の国",
          text:
            "あまり知られていませんが、ウクライナはヨーロッパでも大きな蜂蜜生産国のひとつです。家庭の食卓では、紅茶、パン、菓子作り、そして体を温める日常の食品として、蜂蜜が長く親しまれてきました。\n\n強すぎない甘さ、花の香り、自然なコク。Sonyachnaでは、その背景まで感じられる蜂蜜を選んでいます。",
          image: "/images/products/honey-2.jpg",
        },
      ],
    },
    {
      title: "伝統的なチョコレート",
      label: "CHOCOLATE",
      preview: "/images/products/chocolate.jpg",
      category: "お菓子",
      text:
        "ヨーロッパの菓子文化を受け継ぎながら、ウクライナの日常に根づいたチョコレート。濃厚さと素朴さが同居する味わいです。",
      slides: [
        {
          title: "ウクライナのチョコレートは、日常の小さな贅沢",
          text:
            "ウクライナのチョコレート文化は、ヨーロッパの菓子作りの影響を受けながら、家庭のティータイムや贈り物の中で育ってきました。\n\n派手すぎる高級感ではなく、毎日の中で少し気分を変えてくれる甘さ。それがウクライナのお菓子の魅力です。",
          image: "/images/products/chocolate.jpg",
        },
        {
          title: "濃厚なカカオと、飽きのこない素朴さ",
          text:
            "良いチョコレートは、甘さだけで記憶に残るものではありません。カカオの深み、口どけ、紅茶やコーヒーとの相性。その小さなバランスが、満足感をつくります。\n\nウクライナのチョコレートは、気取らず、けれど印象に残る。そんな日常のための一枚です。",
          image: "/images/products/chocolate.jpg",
        },
      ],
    },
    {
      title: "大地が育てる農産物",
      label: "FARMING",
      preview: "/images/products/sunflower-oil.jpg",
      category: "食用油",
      text:
        "ウクライナの食文化を支える大地、黒土、ひまわり畑。そこから生まれる農産物には、土地そのものの力があります。",
      slides: [
        {
          title: "ヨーロッパの穀倉地帯と呼ばれる理由",
          text:
            "ウクライナは、肥沃な黒土に支えられた農業国です。穀物、ひまわり、果物、ハーブ。多くの食品が、この大地から生まれてきました。\n\nとくにひまわりは、ウクライナの風景を象徴する植物のひとつです。広大な畑に咲く黄色い花は、食卓に届く油の原点でもあります。",
          image: "/images/products/sunflower-oil.jpg",
        },
        {
          title: "ひまわり油は、日々の料理を支える静かな主役",
          text:
            "食用油は、料理の中で目立つ存在ではありません。しかし、素材の香りを引き出し、食感を整え、毎日の食卓を支える重要な食品です。\n\nウクライナのひまわり油は、農業国としての歴史と、自然の恵みを感じられる一品です。",
          image: "/images/products/sunflower-oil.jpg",
        },
      ],
    },
    {
      title: "果物と日々の食卓",
      label: "FRUITS",
      preview: "/images/products/dried-fruits.jpg",
      category: "ドライフルーツ",
      text:
        "果物を乾燥させることは、保存の知恵であり、自然な甘みを楽しむ文化でもあります。ウクライナの素朴な食卓を感じる食品です。",
      slides: [
        {
          title: "果物の甘みを、ゆっくり閉じ込める",
          text:
            "りんご、梨、プラムなどの果物は、乾燥させることで自然な甘みが凝縮されます。砂糖で飾りすぎるのではなく、素材がもともと持っている味を引き出す食品です。\n\n朝食、お茶の時間、軽い間食。ドライフルーツは、日常の中に静かに入り込む素朴な楽しみです。",
          image: "/images/products/dried-fruits.jpg",
        },
        {
          title: "保存食としての知恵が、今の食卓にも合う",
          text:
            "果物を乾燥させる文化は、長い冬や保存のための知恵でもありました。余計なものを加えすぎず、自然の味を残す。その考え方は、現代の健康的な間食にもよく合います。\n\nウクライナのドライフルーツは、派手ではありません。しかし、飽きずに続く味があります。",
          image: "/images/products/dried-fruits.jpg",
        },
      ],
    },
  ]

  return (
    <>
      <section className="mt-14">
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
            <button
              key={story.title}
              type="button"
              onClick={() => {
                setActiveStory(story)
                setIndex(0)
                setOpen(true)
                onStoryModalOpenChange?.(true)
              }}
              className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white text-left shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]"
            >
              <div className="relative h-52 overflow-hidden bg-neutral-100">
                <Image
                  src={story.preview}
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
                <p className="mt-4 text-sm font-medium text-neutral-900">
                  詳しく見る →
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <StoryModal
        open={open}
        onClose={closeStoryModal}
        story={activeStory}
        index={index}
        setIndex={setIndex}
      />
    </>
  )
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, cartTotal } = useCart()
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false)

  if (items.length === 0 || isStoryModalOpen) {
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
              でも、良い商品との出会いはここから始まります。ウクライナの食文化をたどりながら、気になる商品を見つけてみてください。
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#ukraine-stories"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:opacity-90"
              >
                ストーリーを見る
              </a>

              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                商品一覧を見る
              </Link>
            </div>
          </div>
        </section>

        <div id="ukraine-stories">
          <EmptyCartStoryBlocks onStoryModalOpenChange={setIsStoryModalOpen} />
        </div>

        <section className="mt-14 rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              PRODUCT DISCOVERY
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
              まず見ておきたい商品
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              ストーリーを読んだあとに選びやすいよう、注目商品をコンパクトにまとめました。
            </p>
          </div>

          <div className="space-y-12">
            <ProductDiscoverySection
              title="人気商品"
              description="Sonyachnaで注目されている商品です。"
              items={bestseller}
              compact
            />

            <ProductDiscoverySection
              title="新商品"
              description="新しく追加された商品です。"
              items={newItems}
              compact
            />

            <ProductDiscoverySection
              title="残りわずか"
              description="在庫が少なくなっている商品です。"
              items={limited}
              compact
            />
          </div>
        </section>

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
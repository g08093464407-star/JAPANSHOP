"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import { products } from '@/data/products'

type Slide = {
  title: string
  text: string
  image: string
}

type Story = {
  title: string
  slides: Slide[]
  category?: string
}

export default function StoryModal({
  open,
  onClose,
  story,
  index,
  setIndex,
}: {
  open: boolean
  onClose: () => void
  story: Story | null
  index: number
  setIndex: (i: number) => void
}) {
  const { addItem } = useCart()

  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animationKey, setAnimationKey] = useState(0)

  const relatedProducts = useMemo(() => {
    if (!story?.category) return []

    return products
      .filter((product) => product.category === story.category)
      .slice(0, 3)
  }, [story?.category])

  const slidesCount = story?.slides.length ?? 0
  const safeIndex =
    slidesCount > 0 ? Math.min(Math.max(index, 0), slidesCount - 1) : 0
  const slide = story?.slides[safeIndex]

  function goToSlide(nextIndex: number) {
    if (!story) return

    const clampedIndex = Math.min(
      Math.max(nextIndex, 0),
      story.slides.length - 1
    )

    if (clampedIndex === safeIndex) return

    setDirection(clampedIndex > safeIndex ? 'next' : 'prev')
    setAnimationKey((current) => current + 1)
    setIndex(clampedIndex)
  }

  useEffect(() => {
    if (!open || !story) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowRight') {
        goToSlide(safeIndex + 1)
      }

      if (event.key === 'ArrowLeft') {
        goToSlide(safeIndex - 1)
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, story, safeIndex, onClose])

  if (!open || !story || !slide) return null

  const isFirstSlide = safeIndex === 0
  const isLastSlide = safeIndex === story.slides.length - 1

  return (
    <>
      <button
        type="button"
        aria-label="ストーリーを閉じる"
        className="fixed inset-0 z-[200] bg-neutral-950/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="pointer-events-none fixed inset-0 z-[210] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={story.title}
          className="pointer-events-auto relative w-full max-w-5xl animate-[bookOpen_420ms_ease-out] overflow-hidden rounded-[34px] border border-white/40 bg-[#f8f3ea] shadow-[0_30px_100px_rgba(0,0,0,0.28)]"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="absolute right-4 top-4 z-20 rounded-full border border-neutral-200 bg-white/85 p-2 text-neutral-900 backdrop-blur transition hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid min-h-[620px] lg:grid-cols-[0.92fr_1.08fr]">
            <section className="relative overflow-hidden bg-neutral-200">
              <div
                key={`image-${animationKey}-${safeIndex}`}
                className={`absolute inset-0 ${
                  direction === 'next'
                    ? 'animate-[storyImageNext_520ms_cubic-bezier(0.22,1,0.36,1)]'
                    : 'animate-[storyImagePrev_520ms_cubic-bezier(0.22,1,0.36,1)]'
                }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  priority
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-1 text-xs font-medium tracking-[0.18em] backdrop-blur">
                  <BookOpen className="h-3.5 w-3.5" />
                  STORY BOOK
                </div>

                <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  {story.title}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">
                  写真と短い物語で、商品の背景にある土地と食文化をたどります。
                </p>
              </div>
            </section>

            <section className="relative flex flex-col bg-[linear-gradient(135deg,#fffaf2_0%,#ffffff_50%,#f6efe3_100%)]">
              <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-neutral-300 to-transparent lg:block" />

              <div className="flex-1 overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
                <div className="mb-8">
                  <p className="text-xs tracking-[0.24em] text-neutral-400">
                    {story.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Page {safeIndex + 1} / {story.slides.length}
                  </p>
                </div>

                <article
                  key={`text-${animationKey}-${safeIndex}`}
                  className={`mx-auto max-w-xl ${
                    direction === 'next'
                      ? 'animate-[storyPageNext_520ms_cubic-bezier(0.22,1,0.36,1)]'
                      : 'animate-[storyPagePrev_520ms_cubic-bezier(0.22,1,0.36,1)]'
                  }`}
                >
                  <div className="mb-6 h-px w-16 bg-neutral-300" />

                  <h3 className="text-3xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-4xl">
                    {slide.title}
                  </h3>

                  <p className="mt-6 whitespace-pre-line text-base leading-8 text-neutral-700">
                    {slide.text}
                  </p>

                  <div className="mt-8 rounded-3xl border border-neutral-200 bg-white/70 p-5 shadow-sm">
                    <p className="text-xs tracking-[0.2em] text-neutral-400">
                      NOTE
                    </p>
                    <p className="mt-2 text-sm leading-7 text-neutral-600">
                      この物語は、商品を単なる食品としてではなく、土地・人・食卓をつなぐものとして見るための小さな案内です。
                    </p>
                  </div>

                  {relatedProducts.length > 0 ? (
                    <div className="mt-6 rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs tracking-[0.2em] text-neutral-400">
                        CATEGORY SELECTION
                      </p>

                      <p className="mt-2 text-sm leading-7 text-neutral-600">
                        この物語に関連する商品をご覧ください。
                      </p>

                      <div className="mt-4 space-y-3">
                        {relatedProducts.map((product) => (
                          <div
                            key={product.id}
                            className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
                          >
                            <Link
                              href={`/product/${product.slug}`}
                              className="relative h-[72px] overflow-hidden rounded-xl bg-neutral-100"
                            >
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-500 hover:scale-105"
                                sizes="72px"
                              />
                            </Link>

                            <div className="min-w-0">
                              <Link
                                href={`/product/${product.slug}`}
                                className="line-clamp-2 text-sm font-medium text-neutral-900 transition hover:text-neutral-600"
                              >
                                {product.name}
                              </Link>

                              <p className="mt-1 text-sm text-neutral-600">
                                ¥{product.price.toLocaleString()}
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  addItem({
                                    id: product.id,
                                    slug: product.slug,
                                    name: product.name,
                                    price: product.price,
                                    image: product.image,
                                    stockStatus: product.stockStatus,
                                  })
                                }
                                className="mt-2 inline-flex h-9 items-center justify-center rounded-xl bg-neutral-900 px-4 text-xs font-medium text-white transition hover:opacity-90"
                              >
                                カートに追加
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              </div>

              <div className="border-t border-neutral-200 bg-white/65 px-6 py-5 backdrop-blur sm:px-10">
                <div className="mb-4 flex gap-2">
                  {story.slides.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      type="button"
                      aria-label={`${dotIndex + 1}ページへ移動`}
                      onClick={() => goToSlide(dotIndex)}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        dotIndex === safeIndex
                          ? 'bg-neutral-900'
                          : 'bg-neutral-200 hover:bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => goToSlide(safeIndex - 1)}
                    disabled={isFirstSlide}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    前のページ
                  </button>

                  <button
                    type="button"
                    onClick={() => goToSlide(safeIndex + 1)}
                    disabled={isLastSlide}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    次のページ
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <style jsx>{`
            @keyframes bookOpen {
              0% {
                opacity: 0;
                transform: perspective(1200px) rotateY(-10deg) scale(0.96)
                  translateY(12px);
              }
              100% {
                opacity: 1;
                transform: perspective(1200px) rotateY(0deg) scale(1)
                  translateY(0);
              }
            }

            @keyframes storyPageNext {
              0% {
                opacity: 0;
                transform: translateX(28px) scale(0.985);
                filter: blur(4px);
              }
              100% {
                opacity: 1;
                transform: translateX(0) scale(1);
                filter: blur(0);
              }
            }

            @keyframes storyPagePrev {
              0% {
                opacity: 0;
                transform: translateX(-28px) scale(0.985);
                filter: blur(4px);
              }
              100% {
                opacity: 1;
                transform: translateX(0) scale(1);
                filter: blur(0);
              }
            }

            @keyframes storyImageNext {
              0% {
                opacity: 0;
                transform: scale(1.045) translateX(22px);
                filter: blur(5px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateX(0);
                filter: blur(0);
              }
            }

            @keyframes storyImagePrev {
              0% {
                opacity: 0;
                transform: scale(1.045) translateX(-22px);
                filter: blur(5px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateX(0);
                filter: blur(0);
              }
            }
          `}</style>
        </div>
      </div>
    </>
  )
}
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import { trackAddToCart } from '@/lib/analytics'
import type { Story } from '@/data/stories'

type PublicCatalogProduct = {
  id: string
  legacyId: string
  slug: string
  name: string
  price: number
  image: string
  images?: string[]
  description: string
  category?: string | null
  tag?: string | null
  stockStatus: 'in-stock' | 'limited' | 'out-of-stock'
}

type PublicCatalogProductsResponse = {
  products?: PublicCatalogProduct[]
  error?: string
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
  const [addedProductId, setAddedProductId] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState<PublicCatalogProduct[]>([])

  const closeTimerRef = useRef<number | null>(null)
  const addedTimerRef = useRef<number | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)
  const touchEndYRef = useRef<number | null>(null)

  const relatedProducts = useMemo(() => {
    if (!story?.category) return []

    return catalogProducts
      .filter((product) => product.category === story.category)
      .filter((product) => product.stockStatus !== 'out-of-stock')
      .slice(0, 3)
  }, [catalogProducts, story?.category])

  const storySlidesCount = story?.slides.length ?? 0
  const hasProductPage = relatedProducts.length > 0
  const totalPages = storySlidesCount + (hasProductPage ? 1 : 0)
  const safeIndex =
    totalPages > 0 ? Math.min(Math.max(index, 0), totalPages - 1) : 0

  const isProductsPage = hasProductPage && safeIndex === totalPages - 1
  const slide = story?.slides[Math.min(safeIndex, Math.max(storySlidesCount - 1, 0))]

  const visualImage = isProductsPage
    ? relatedProducts[0]?.image ?? slide?.image
    : slide?.image

  const visualAlt = isProductsPage
    ? `${story?.title ?? 'Story'} category products`
    : slide?.title ?? story?.title ?? 'Story image'

  function closeWithAnimation() {
    if (isClosing) return

    setIsClosing(true)

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = window.setTimeout(() => {
      setIsClosing(false)
      setAddedProductId(null)
      onClose()
    }, 260)
  }

  function goToSlide(nextIndex: number, requestedDirection?: 'next' | 'prev') {
    if (!story || totalPages === 0 || isClosing) return

    const wrappedIndex = ((nextIndex % totalPages) + totalPages) % totalPages

    if (wrappedIndex === safeIndex) return

    setDirection(
      requestedDirection ?? (wrappedIndex > safeIndex ? 'next' : 'prev')
    )
    setAnimationKey((current) => current + 1)
    setIndex(wrappedIndex)
  }

  function handleAddToCart(product: PublicCatalogProduct) {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      stockStatus: product.stockStatus,
    })

    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      category: product.category,
      source: 'story',
      storyTitle: story?.title ?? '',
      storyCategory: story?.category,
    })

    setAddedProductId(product.id)

    if (addedTimerRef.current) {
      window.clearTimeout(addedTimerRef.current)
    }

    addedTimerRef.current = window.setTimeout(() => {
      closeWithAnimation()
    }, 520)
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (isClosing || totalPages <= 1) return

    const touch = event.touches[0]
    if (!touch) return

    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
    touchEndXRef.current = touch.clientX
    touchEndYRef.current = touch.clientY
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return
    }

    const touch = event.touches[0]
    if (!touch) return

    touchEndXRef.current = touch.clientX
    touchEndYRef.current = touch.clientY
  }

  function handleTouchEnd() {
    if (
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      touchEndXRef.current === null ||
      touchEndYRef.current === null
    ) {
      return
    }

    const deltaX = touchStartXRef.current - touchEndXRef.current
    const deltaY = touchStartYRef.current - touchEndYRef.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const swipeThreshold = 54

    touchStartXRef.current = null
    touchStartYRef.current = null
    touchEndXRef.current = null
    touchEndYRef.current = null

    if (absX < swipeThreshold || absX < absY * 1.18) {
      return
    }

    if (deltaX > 0) {
      goToSlide(safeIndex + 1, 'next')
    } else {
      goToSlide(safeIndex - 1, 'prev')
    }
  }

  useEffect(() => {
    if (!open) return

    let isCancelled = false

    async function loadCatalogProducts() {
      try {
        const response = await fetch('/api/catalog/products', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = (await response.json()) as PublicCatalogProductsResponse

        if (!isCancelled && response.ok && Array.isArray(data.products)) {
          setCatalogProducts(data.products)
        }
      } catch (error) {
        console.error('Failed to load story catalog products:', error)

        if (!isCancelled) {
          setCatalogProducts([])
        }
      }
    }

    void loadCatalogProducts()

    return () => {
      isCancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open || !story) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeWithAnimation()
      }

      if (event.key === 'ArrowRight') {
        goToSlide(safeIndex + 1, 'next')
      }

      if (event.key === 'ArrowLeft') {
        goToSlide(safeIndex - 1, 'prev')
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, story, safeIndex, totalPages, isClosing])

  useEffect(() => {
    if (!open) {
      setIsClosing(false)
      setAddedProductId(null)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }

      if (addedTimerRef.current) {
        window.clearTimeout(addedTimerRef.current)
      }
    }
  }, [])

  if (!open || !story || !slide || totalPages === 0 || !visualImage) return null

  return (
    <>
      <button
        type="button"
        aria-label="ストーリーを閉じる"
        className={`fixed inset-0 z-[200] bg-neutral-950/55 backdrop-blur-sm ${
          isClosing
            ? 'animate-[storyBackdropClose_260ms_ease-out_forwards]'
            : 'animate-[storyBackdropOpen_220ms_ease-out]'
        }`}
        onClick={closeWithAnimation}
      />

      <div className="pointer-events-none fixed inset-0 z-[210] flex items-center justify-center p-0 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={story.title}
          className={`pointer-events-auto relative flex h-[100dvh] w-full touch-pan-y flex-col overflow-hidden bg-[#f8f3ea] shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-[34px] sm:border sm:border-white/40 lg:max-h-[calc(100dvh-2rem)] ${
            isClosing
              ? 'animate-[storyModalClose_260ms_cubic-bezier(0.22,1,0.36,1)_forwards]'
              : 'animate-[bookOpen_420ms_ease-out]'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={closeWithAnimation}
            aria-label="閉じる"
            className="absolute right-4 top-4 z-30 rounded-full border border-neutral-200 bg-white/90 p-2 text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[0.92fr_1.08fr]">
            <section className="relative h-[32dvh] shrink-0 overflow-hidden bg-neutral-200 sm:h-[38dvh] lg:h-auto lg:min-h-0">
              <div
                key={`image-${animationKey}-${safeIndex}`}
                className={`absolute inset-0 ${
                  direction === 'next'
                    ? 'animate-[storyImageNext_800ms_cubic-bezier(0.23,1,0.32,1)]'
                    : 'animate-[storyImagePrev_800ms_cubic-bezier(0.23,1,0.32,1)]'
                }`}
              >
                <Image
                  src={visualImage}
                  alt={visualAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  priority
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-3 py-1 text-xs font-medium tracking-[0.18em] backdrop-blur">
                  <BookOpen className="h-3.5 w-3.5" />
                  STORY BOOK
                </div>

                <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-4xl">
                  {story.title}
                </h2>

                <p className="mt-2 hidden max-w-xl text-sm leading-7 text-white/85 sm:block">
                  写真と短い物語で、商品の背景にある土地と食文化をたどります。
                </p>
              </div>
            </section>

            <section className="relative flex min-h-0 flex-1 flex-col bg-[linear-gradient(135deg,#fffaf2_0%,#ffffff_50%,#f6efe3_100%)]">
              <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-neutral-300 to-transparent lg:block" />

              <div className="story-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-7 sm:px-10 sm:py-10">
                <div className="mb-6">
                  <p className="text-xs tracking-[0.24em] text-neutral-400">
                    {story.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Page {safeIndex + 1} / {totalPages}
                  </p>
                </div>

                <div className="storybook-stage relative mx-auto max-w-xl overflow-hidden">
                  <div
                    key={`turn-${animationKey}`}
                    aria-hidden="true"
                    className={`storybook-sheet ${
                      direction === 'next'
                        ? 'storybook-sheet-next'
                        : 'storybook-sheet-prev'
                    }`}
                  />

                  <article
                    key={`text-${animationKey}`}
                    className={`storybook-content mx-auto max-w-xl pb-4 ${
                      direction === 'next'
                        ? 'animate-[storyContentNext_700ms_cubic-bezier(0.23,1,0.32,1)]'
                        : 'animate-[storyContentPrev_700ms_cubic-bezier(0.23,1,0.32,1)]'
                    }`}
                  >
                  {isProductsPage ? (
                    <>
                      <div className="mb-6 h-px w-16 bg-neutral-300" />

                      <h3 className="text-3xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-4xl">
                        この物語の商品
                      </h3>

                      <p className="mt-5 text-base leading-8 text-neutral-700">
                        物語で触れた食文化を、実際の商品としてお楽しみください。Sonyachnaが選んだ、このカテゴリーの商品です。
                      </p>

                      <div className="mt-8 rounded-3xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
                        <p className="text-xs tracking-[0.2em] text-neutral-400">
                          CATEGORY SELECTION
                        </p>

                        <div className="mt-4 space-y-3">
                          {relatedProducts.map((product) => {
                            const isAdded = addedProductId === product.id

                            return (
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
                                    onClick={() => handleAddToCart(product)}
                                    disabled={isAdded || isClosing}
                                    className={`mt-2 inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-medium text-white transition duration-300 ${
                                      isAdded
                                        ? 'bg-emerald-600 shadow-[0_0_0_4px_rgba(5,150,105,0.12)]'
                                        : 'bg-neutral-900 hover:opacity-90'
                                    } disabled:cursor-default`}
                                  >
                                    {isAdded ? '追加しました' : 'カートに追加'}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <Link
                          href="/shop"
                          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          他の商品を見る
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                  </article>
                </div>
              </div>

              <div className="sticky bottom-0 z-20 border-t border-neutral-200 bg-white/92 px-6 py-4 backdrop-blur sm:px-10 sm:py-5">
                <div className="mb-4 flex gap-2">
                  {Array.from({ length: totalPages }).map((_, dotIndex) => (
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

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => goToSlide(safeIndex - 1, 'prev')}
                    aria-label="前のページへ"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => goToSlide(safeIndex + 1, 'next')}
                    aria-label="次のページへ"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:opacity-90"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <style jsx>{`
            @keyframes storyBackdropOpen {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }

            @keyframes storyBackdropClose {
              0% { opacity: 1; }
              100% { opacity: 0; }
            }

            @keyframes bookOpen {
              0% {
                opacity: 0;
                transform: perspective(1400px) rotateY(-10deg) scale(0.96) translateY(15px);
              }
              100% {
                opacity: 1;
                transform: perspective(1400px) rotateY(0deg) scale(1) translateY(0);
              }
            }

            @keyframes storyModalClose {
              0% {
                opacity: 1;
                transform: perspective(1400px) rotateY(0deg) scale(1) translateY(0);
              }
              100% {
                opacity: 0;
                transform: perspective(1400px) rotateY(6deg) scale(0.97) translateY(10px);
              }
            }

            .story-scroll {
              overscroll-behavior: contain;
            }

            .storybook-stage {
              perspective: 2000px;
              perspective-origin: center;
              contain: paint;
            }

            .storybook-sheet {
              pointer-events: none;
              position: absolute;
              top: -10%;
              bottom: -10%;
              z-index: 50;
              width: 100%;
              opacity: 0;
              will-change: transform, opacity;
              background: linear-gradient(
                to right,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.4) 30%,
                rgba(255, 255, 255, 0.8) 50%,
                rgba(240, 230, 210, 0.4) 70%,
                rgba(255, 255, 255, 0) 100%
              );
            }

            .storybook-sheet-next {
              animation: flipNext 800ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }

            .storybook-sheet-prev {
              animation: flipPrev 800ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }

            @keyframes flipNext {
              0% {
                opacity: 0;
                transform: translateX(100%) skewX(-15deg);
              }
              30% {
                opacity: 0.6;
              }
              100% {
                opacity: 0;
                transform: translateX(-120%) skewX(15deg);
              }
            }

            @keyframes flipPrev {
              0% {
                opacity: 0;
                transform: translateX(-100%) skewX(15deg);
              }
              30% {
                opacity: 0.6;
              }
              100% {
                opacity: 0;
                transform: translateX(120%) skewX(-15deg);
              }
            }

            @keyframes storyContentNext {
              0% {
                opacity: 0;
                transform: translateX(25px);
                filter: blur(4px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
                filter: blur(0);
              }
            }

            @keyframes storyContentPrev {
              0% {
                opacity: 0;
                transform: translateX(-25px);
                filter: blur(4px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
                filter: blur(0);
              }
            }

            @keyframes storyImageNext {
              0% {
                opacity: 0.8;
                transform: scale(1.04) translateX(20px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateX(0);
              }
            }

            @keyframes storyImagePrev {
              0% {
                opacity: 0.8;
                transform: scale(1.04) translateX(-20px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateX(0);
              }
            }
          `}</style>
        </div>
      </div>
    </>
  )
}
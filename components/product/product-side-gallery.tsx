'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react'

type ProductSideGalleryProps = {
  productName: string
  productImage: string
  images?: string[]
}

const proofNotes = [
  {
    label: 'TEXTURE',
    title: '質感を確認',
    text: '色味や素材感を、商品画像から丁寧に確認できます。',
  },
  {
    label: 'SERVING',
    title: '食卓での使い方',
    text: '朝食、ティータイム、ギフトなど日常の場面を想像しやすくします。',
  },
  {
    label: 'ORIGIN',
    title: '背景のある食品',
    text: '産地や食文化の文脈まで含めて選ぶための小さな導線です。',
  },
]

export default function ProductSideGallery({
  productName,
  productImage,
  images,
}: ProductSideGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const galleryImages = useMemo(() => {
    const source = images && images.length > 0 ? images : [productImage]
    const unique = Array.from(new Set([productImage, ...source])).filter(Boolean)

    return unique.length > 0 ? unique.slice(0, 7) : [productImage]
  }, [images, productImage])

  const selectedImage =
    selectedIndex !== null ? galleryImages[selectedIndex] : null

  const hasMultipleImages = galleryImages.length > 1

  function closeModal() {
    setSelectedIndex(null)
  }

  function goPrev() {
    setSelectedIndex((current) => {
      if (current === null) return current
      return (current - 1 + galleryImages.length) % galleryImages.length
    })
  }

  function goNext() {
    setSelectedIndex((current) => {
      if (current === null) return current
      return (current + 1) % galleryImages.length
    })
  }

  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex])

  return (
    <>
      <div className="mt-4 space-y-3">
        <div
          className={`grid gap-3 ${
            hasMultipleImages ? 'grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`group relative overflow-hidden rounded-3xl border border-[#e6d7c1] bg-white p-2 shadow-sm transition active:scale-[0.98] lg:p-3 lg:hover:-translate-y-1 lg:hover:shadow-[0_22px_54px_rgba(58,42,22,0.13)] ${
                hasMultipleImages ? 'aspect-square' : 'aspect-[16/6]'
              }`}
            >
              <div className="relative h-full overflow-hidden rounded-[22px] bg-[#f4ead9]">
                <Image
                  src={image}
                  alt={`${productName} image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 lg:group-hover:scale-105"
                  sizes={
                    hasMultipleImages
                      ? '(max-width: 768px) 30vw, 180px'
                      : '(max-width: 768px) 100vw, 520px'
                  }
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/34 via-black/6 to-transparent" />

                <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-white/92 px-2.5 py-1 text-[9px] tracking-[0.15em] text-neutral-900 shadow-sm sm:text-[10px]">
                  <Images className="h-3 w-3" />
                  VIEW {String(index + 1).padStart(2, '0')}
                </div>

                {!hasMultipleImages ? (
                  <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium tracking-[0.16em] text-white backdrop-blur">
                    DETAIL IMAGE
                  </div>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        {!hasMultipleImages ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {proofNotes.map((note) => (
              <div
                key={note.label}
                className="rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-sm"
              >
                <p className="text-[10px] tracking-[0.22em] text-neutral-500">
                  {note.label}
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-950">
                  {note.title}
                </p>
                <p className="mt-2 text-xs leading-6 text-neutral-600">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {selectedImage && selectedIndex !== null ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/76 p-4 backdrop-blur-sm sm:p-6"
          onClick={closeModal}
          onTouchStart={(event) => {
            setTouchStartX(event.touches[0]?.clientX ?? null)
          }}
          onTouchEnd={(event) => {
            if (touchStartX === null) return

            const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX
            const diff = touchStartX - touchEndX

            if (Math.abs(diff) > 45 && hasMultipleImages) {
              if (diff > 0) {
                goNext()
              } else {
                goPrev()
              }
            }

            setTouchStartX(null)
          }}
        >
          <button
            type="button"
            onClick={closeModal}
            aria-label="画像を閉じる"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" />
          </button>

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goPrev()
                }}
                aria-label="前の画像へ"
                className="absolute left-4 z-20 hidden h-11 w-11 items-center justify-center rounded-full bg-white/92 text-neutral-900 shadow-lg sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goNext()
                }}
                aria-label="次の画像へ"
                className="absolute right-4 z-20 hidden h-11 w-11 items-center justify-center rounded-full bg-white/92 text-neutral-900 shadow-lg sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div
            className="relative aspect-square w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/20 bg-[#f4ead9] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.34)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-full overflow-hidden rounded-[26px]">
              <Image
                src={selectedImage}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 92vw, 760px"
                priority
              />
            </div>
          </div>

          {hasMultipleImages ? (
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/16 px-4 py-2 backdrop-blur">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`${index + 1}番目の画像へ`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedIndex(index)
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === selectedIndex
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/45'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type ProductSideGalleryProps = {
  productName: string
  productImage: string
  images?: string[]
}

export default function ProductSideGallery({
  productName,
  productImage,
  images,
}: ProductSideGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const galleryImages = useMemo(() => {
    const source = images && images.length > 0 ? images : [productImage]
    const unique = Array.from(new Set([productImage, ...source]))

    while (unique.length < 3) {
      unique.push(productImage)
    }

    return unique.slice(0, 3)
  }, [images, productImage])

  const selectedImage =
    selectedIndex !== null ? galleryImages[selectedIndex] : null

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
      <div className="mt-4 grid grid-cols-3 gap-3">
        {galleryImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-3xl border border-[#e6d7c1] bg-white p-2 shadow-sm transition active:scale-[0.98] lg:p-3 lg:hover:-translate-y-1 lg:hover:shadow-[0_22px_54px_rgba(58,42,22,0.13)]"
          >
            <div className="relative h-full overflow-hidden rounded-[22px] bg-[#f4ead9]">
              <Image
                src={image}
                alt={`${productName} image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 lg:group-hover:scale-105"
                sizes="(max-width: 768px) 30vw, 180px"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/28 to-transparent" />

              <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[9px] tracking-[0.15em] text-neutral-900 shadow-sm sm:text-[10px]">
                VIEW {String(index + 1).padStart(2, '0')}
              </div>
            </div>
          </button>
        ))}
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

            if (Math.abs(diff) > 45) {
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
        </div>
      ) : null}
    </>
  )
}
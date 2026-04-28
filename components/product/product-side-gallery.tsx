'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

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
  const [hasScrolled, setHasScrolled] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const galleryImages = useMemo(() => {
    const sourceImages = images && images.length > 0 ? images : [productImage]
    const uniqueImages = Array.from(new Set([productImage, ...sourceImages]))

    while (uniqueImages.length < 3) {
      uniqueImages.push(productImage)
    }

    return uniqueImages.slice(0, 3)
  }, [images, productImage])

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 120)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage])

  return (
    <>
      <div className="hidden lg:block">
        <div
          className={`mt-4 flex justify-center transition-all duration-700 ${
            hasScrolled
              ? 'pointer-events-none -translate-y-4 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-3 rounded-full border border-[#e6d7c1] bg-white/55 px-5 py-4 shadow-sm">
            <span className="text-[10px] tracking-[0.32em] text-neutral-500">
              SCROLL
            </span>
            <span className="relative h-14 w-px overflow-hidden bg-[#dac8ac]">
              <span className="absolute left-0 top-0 h-5 w-px animate-[scrollLine_1.6s_ease-in-out_infinite] bg-neutral-900" />
            </span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-800" />
          </div>
        </div>

        <div
          className={`mt-4 grid grid-cols-3 gap-3 transition-all duration-700 ${
            hasScrolled
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-6 opacity-0'
          }`}
        >
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImage(image)}
              className="group relative aspect-square overflow-hidden rounded-3xl border border-[#e6d7c1] bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(58,42,22,0.13)]"
            >
              <div className="relative h-full overflow-hidden rounded-[22px] bg-[#f4ead9]">
                <Image
                  src={image}
                  alt={`${productName} image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="180px"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/32 via-transparent to-transparent opacity-80" />

                <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-neutral-900 shadow-sm">
                  VIEW {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 p-6 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={() => setSelectedImage(null)}
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg transition hover:bg-white"
          >
            <X className="h-5 w-5" />
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
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scrollLine {
          0% {
            transform: translateY(-120%);
          }
          55% {
            transform: translateY(120%);
          }
          100% {
            transform: translateY(120%);
          }
        }
      `}</style>
    </>
  )
}
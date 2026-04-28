'use client'

import { useMemo, useState, useEffect } from 'react'
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const galleryImages = useMemo(() => {
    const source = images && images.length > 0 ? images : [productImage]
    const unique = Array.from(new Set([productImage, ...source]))

    while (unique.length < 3) {
      unique.push(productImage)
    }

    return unique.slice(0, 3)
  }, [images, productImage])

  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null)
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
      {/* STATIC GALLERY */}
      <div className="hidden lg:grid grid-cols-3 gap-3 mt-4">
        {galleryImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setSelectedImage(image)}
            className="group relative aspect-square overflow-hidden rounded-3xl border border-[#e6d7c1] bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(58,42,22,0.13)]"
          >
            <div className="relative h-full overflow-hidden rounded-[22px] bg-[#f4ead9]">
              <Image
                src={image}
                alt={`${productName} image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="180px"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

              <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-1 text-[10px] tracking-[0.15em] text-neutral-900 shadow-sm">
                VIEW {String(index + 1).padStart(2, '0')}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* FULLSCREEN MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative aspect-square w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/20 bg-[#f4ead9] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.34)]"
            onClick={(e) => e.stopPropagation()}
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
    </>
  )
}
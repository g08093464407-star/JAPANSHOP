'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

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

  const galleryImages = useMemo(() => {
    const sourceImages =
      images && images.length > 0 ? images : [productImage]

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

  const scrollToDetails = () => {
    document.getElementById('product-details')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="hidden lg:block">
      <div
        className={`transition-all duration-700 ${
          hasScrolled
            ? 'pointer-events-none -translate-y-4 opacity-0'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={scrollToDetails}
          className="group mt-4 flex w-full items-center justify-between rounded-[30px] border border-[#e6d7c1] bg-white/72 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_44px_rgba(58,42,22,0.10)]"
        >
          <div>
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              SCROLL
            </p>
            <p className="mt-2 font-serif text-xl text-neutral-950">
              もう少し下へ進む
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              商品の背景、詳細情報、配送について確認できます。
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d8c5aa] bg-[#fff7e8] text-neutral-700 transition group-hover:translate-y-1">
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </div>
        </button>
      </div>

      <div
        className={`mt-4 space-y-4 transition-all duration-700 ${
          hasScrolled
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-6 opacity-0'
        }`}
      >
        {galleryImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="group relative h-32 overflow-hidden rounded-[30px] border border-[#e6d7c1] bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(58,42,22,0.13)]"
          >
            <div className="relative h-full overflow-hidden rounded-[24px] bg-[#f4ead9]">
              <Image
                src={image}
                alt={`${productName} image ${index + 1}`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="520px"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/36 via-black/6 to-transparent" />

              <div className="absolute bottom-4 left-4">
                <p className="text-[11px] tracking-[0.22em] text-white/78">
                  VIEW {String(index + 1).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
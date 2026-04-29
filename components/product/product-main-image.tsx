'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

type ProductMainImageProps = {
  productName: string
  productImage: string
  productTag?: string
  productOrigin: string
}

export default function ProductMainImage({
  productName,
  productImage,
  productTag,
  productOrigin,
}: ProductMainImageProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomStyle, setZoomStyle] = useState<CSSProperties>({
    transform: 'scale(1)',
    transformOrigin: 'center',
  })
  const [isOpen, setIsOpen] = useState(false)

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setIsZoomed(true)
    setZoomStyle({
      transform: 'scale(1.65)',
      transformOrigin: `${x}% ${y}%`,
    })
  }

  function handleMouseLeave() {
    setIsZoomed(false)
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center',
    })
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <div className="relative overflow-hidden rounded-[34px] border border-[#e6d7c1] bg-[#f4ead9] p-3 shadow-[0_28px_80px_rgba(58,42,22,0.14)]">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[26px] bg-neutral-100"
          aria-label={`${productName} の画像を拡大表示`}
        >
          <div
            className="absolute inset-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <Image
              src={productImage}
              alt={productName}
              fill
              className="object-cover transition-transform duration-300 ease-out"
              style={isZoomed ? zoomStyle : undefined}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-100" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {productTag ? (
                <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-neutral-950 shadow-sm">
                  {productTag}
                </span>
              ) : null}

              <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {productOrigin}
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/88 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-neutral-800 opacity-0 shadow-sm transition duration-300 group-hover:opacity-100">
            ZOOM
          </div>
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 p-6 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            aria-label="画像を閉じる"
            onClick={() => setIsOpen(false)}
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg transition hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative aspect-square w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/20 bg-[#f4ead9] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.34)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-full overflow-hidden rounded-[26px]">
              <Image
                src={productImage}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 92vw, 760px"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
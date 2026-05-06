'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import Image from 'next/image'
import { Maximize2, X } from 'lucide-react'

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
  const [isModalZoomed, setIsModalZoomed] = useState(false)

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setIsZoomed(true)
    setZoomStyle({
      transform: 'scale(1.68)',
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

  function closeModal() {
    setIsOpen(false)
    setIsModalZoomed(false)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
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
            className="absolute inset-0 hidden lg:block"
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

          <div className="absolute inset-0 lg:hidden">
            <Image
              src={productImage}
              alt={productName}
              fill
              className="object-cover transition-transform duration-700 group-active:scale-[1.03]"
              sizes="100vw"
              priority
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/48 via-black/10 to-transparent" />

          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/88 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-neutral-800 shadow-sm backdrop-blur lg:opacity-0 lg:transition lg:duration-300 lg:group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" />
            DETAIL
          </div>

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

            <p className="mt-3 max-w-[80%] text-left text-xs leading-5 text-white/82">
              画像を開いて、質感・色味・商品印象を確認できます。
            </p>
          </div>
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm sm:p-6"
          onClick={closeModal}
        >
          <button
            type="button"
            aria-label="画像を閉じる"
            onClick={closeModal}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg transition hover:bg-neutral-100 sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative aspect-square w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/20 bg-[#f4ead9] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.34)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsModalZoomed((current) => !current)}
              className="absolute left-5 top-5 z-20 rounded-full bg-white/90 px-4 py-2 text-xs font-medium tracking-[0.16em] text-neutral-800 shadow-sm transition hover:bg-white"
            >
              {isModalZoomed ? 'RESET' : 'ZOOM'}
            </button>

            <div className="relative h-full overflow-hidden rounded-[26px]">
              <Image
                src={productImage}
                alt={productName}
                fill
                className={`object-cover transition-transform duration-500 ${
                  isModalZoomed ? 'scale-[1.38]' : 'scale-100'
                }`}
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

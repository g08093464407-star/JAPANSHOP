'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

type Slide = {
  title: string
  text: string
  image: string
}

type Story = {
  title: string
  slides: Slide[]
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
  const slidesCount = story?.slides.length ?? 0
  const safeIndex = slidesCount > 0 ? Math.min(Math.max(index, 0), slidesCount - 1) : 0
  const slide = story?.slides[safeIndex]

  useEffect(() => {
    if (!open || !story) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }

      if (e.key === 'ArrowRight') {
        setIndex(Math.min(story.slides.length - 1, safeIndex + 1))
      }

      if (e.key === 'ArrowLeft') {
        setIndex(Math.max(0, safeIndex - 1))
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, story, safeIndex, onClose, setIndex])

  if (!open || !story || !slide) return null

  return (
    <>
      <button
        type="button"
        aria-label="ストーリーを閉じる"
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={story.title}
          className="pointer-events-auto relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 backdrop-blur transition hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative h-64 w-full">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-6">
            <p className="text-xs tracking-[0.22em] text-neutral-400">
              {story.title}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-neutral-900">
              {slide.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              {slide.text}
            </p>
          </div>

          <div className="flex items-center justify-between border-t px-6 py-4">
            <button
              type="button"
              onClick={() => setIndex(Math.max(0, safeIndex - 1))}
              disabled={safeIndex === 0}
              className="flex items-center gap-2 text-sm text-neutral-600 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </button>

            <span className="text-xs text-neutral-400">
              {safeIndex + 1} / {story.slides.length}
            </span>

            <button
              type="button"
              onClick={() => setIndex(Math.min(story.slides.length - 1, safeIndex + 1))}
              disabled={safeIndex === story.slides.length - 1}
              className="flex items-center gap-2 text-sm text-neutral-600 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
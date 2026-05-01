'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Send, Star, X } from 'lucide-react'

type Review = {
  rating: number
  text: string
  location: string
}

type PendingReview = {
  rating: number
  text: string
  name: string
  createdAt: string
}

const STORAGE_KEY = 'sonyachna_pending_reviews'

export default function ProductReviewsTrust({
  reviews,
}: {
  reviews: Review[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewName, setReviewName] = useState('')
  const [showThanks, setShowThanks] = useState(false)
  const [burstKey, setBurstKey] = useState(0)

  const visibleReviews = useMemo(() => {
    if (reviews.length <= 2) return reviews

    return [
      reviews[activeIndex % reviews.length],
      reviews[(activeIndex + 1) % reviews.length],
    ]
  }, [reviews, activeIndex])

  useEffect(() => {
    if (reviews.length <= 2) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 2) % reviews.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [reviews.length])

  function handleRatingClick(value: number) {
    setSelectedRating(value)
    setBurstKey((current) => current + 1)
    setShowThanks(true)
  }

  function handleSubmitReview() {
    if (!selectedRating || !reviewText.trim()) return

    const nextReview: PendingReview = {
      rating: selectedRating,
      text: reviewText.trim(),
      name: reviewName.trim() || '匿名',
      createdAt: new Date().toISOString(),
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const existing = raw ? (JSON.parse(raw) as PendingReview[]) : []
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([nextReview, ...existing].slice(0, 30))
      )
    } catch {
      // localStorage may be unavailable
    }

    setReviewText('')
    setReviewName('')
    setShowThanks(true)
    setBurstKey((current) => current + 1)
  }

  const displayRating = hoverRating || selectedRating

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#e6d7c1] bg-white/82 p-5 shadow-[0_18px_50px_rgba(58,42,22,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.24em] text-neutral-500">
            CUSTOMER VOICES
          </p>
          <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
            お客様の声
          </h2>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffaf2] px-4 py-2">
          <div className="flex items-center gap-0.5 text-[#b9852b]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <span className="text-xs font-semibold text-neutral-800">
            4.8 / 5
          </span>
        </div>
      </div>

      <div className="relative mt-5 min-h-[212px] overflow-hidden">
        <div
          key={activeIndex}
          className="grid animate-[reviewSoftEnter_700ms_cubic-bezier(0.22,1,0.36,1)] gap-3 sm:grid-cols-2"
        >
          {visibleReviews.map((review) => (
            <div
              key={`${review.location}-${review.text}`}
              className="rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(185,133,43,0.14)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-0.5 text-[#b9852b]">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>

                <span className="text-[11px] tracking-[0.18em] text-neutral-500">
                  review
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-neutral-700">
                “{review.text}”
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                — {review.location}
              </p>
            </div>
          ))}
        </div>
      </div>

      {reviews.length > 2 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: Math.ceil(reviews.length / 2) }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex((i * 2) % reviews.length)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                Math.floor(activeIndex / 2) === i
                  ? 'w-7 bg-[#b9852b]'
                  : 'w-1.5 bg-[#d8c5aa]'
              }`}
              aria-label={`レビュー ${i + 1}`}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-7 rounded-[26px] border border-[#eadfce] bg-white/70 p-5">
        <p className="text-xs tracking-[0.24em] text-neutral-500">
          YOUR IMPRESSION
        </p>

        <div className="relative mt-4 flex gap-2">
          {burstKey > 0 ? (
            <div
              key={burstKey}
              className="pointer-events-none absolute left-12 top-3 z-10"
            >
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute h-2 w-1 rounded-full bg-[#d6a144] opacity-0"
                  style={{
                    transform: `rotate(${i * 26}deg) translateY(-18px)`,
                    animation: `petalBurst 900ms cubic-bezier(0.22,1,0.36,1) forwards`,
                    animationDelay: `${i * 22}ms`,
                  }}
                />
              ))}
            </div>
          ) : null}

          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRatingClick(i)}
              className={`h-8 w-8 rounded-full border transition-all duration-300 ${
                i <= displayRating
                  ? 'scale-110 border-[#d6a144] bg-[#e6b85c] shadow-[0_10px_24px_rgba(185,133,43,0.28)]'
                  : 'border-[#eadfce] bg-neutral-200/80'
              }`}
              aria-label={`${i}点`}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          <input
            value={reviewName}
            onChange={(event) => setReviewName(event.target.value)}
            placeholder="お名前（任意）"
            className="h-11 rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 text-sm outline-none transition focus:border-[#c89a48]"
          />

          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            placeholder="商品の感想をお聞かせください"
            rows={3}
            className="resize-none rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#c89a48]"
          />

          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={!selectedRating || !reviewText.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
          >
            <Send className="h-4 w-4" />
            感想を送る
          </button>
        </div>

        <p className="mt-4 text-xs leading-6 text-neutral-500">
          投稿内容は確認後に掲載されます。不適切な内容は掲載されません。
        </p>
      </div>

      {showThanks ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#fffaf2]/82 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[28px] border border-[#eadfce] bg-white p-6 text-center shadow-[0_28px_80px_rgba(58,42,22,0.16)]">
            <button
              type="button"
              onClick={() => setShowThanks(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#fff4df] text-[#b9852b]">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <h3 className="mt-4 font-serif text-2xl text-neutral-950">
              ありがとうございます
            </h3>

            <p className="mt-3 text-sm leading-7 text-neutral-600">
              商品評価へのご参加ありがとうございます。いただいた内容は、
              Sonyachna内でより良い商品選びの参考にいたします。
            </p>

            <button
              type="button"
              onClick={() => setShowThanks(false)}
              className="mt-5 h-11 rounded-2xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:-translate-y-0.5"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes reviewSoftEnter {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes petalBurst {
          0% {
            opacity: 0;
            transform: rotate(var(--r, 0deg)) translateY(0) scale(0.6);
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--r, 0deg)) translateY(-42px) scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
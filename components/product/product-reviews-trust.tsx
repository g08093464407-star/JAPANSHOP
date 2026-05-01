'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

type Review = {
  rating: number
  text: string
  location: string
}

export default function ProductReviewsTrust({
  reviews,
}: {
  reviews: Review[]
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="rounded-[30px] border border-[#e6d7c1] bg-white/82 p-5 shadow-[0_18px_50px_rgba(58,42,22,0.07)]">
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

      {/* 🔥 М'який рух замість каруселі */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 animate-luxury">
        {reviews.map((review) => (
          <div
            key={`${review.location}-${review.text}`}
            className="review-glow rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-4 transition-all duration-300"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-0.5 text-[#b9852b]">
                {Array.from({ length: review.rating }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>

              <span className="text-[11px] tracking-[0.18em] text-neutral-500">
                ✔ verified
              </span>
            </div>

            <p className="mt-3 text-sm leading-7 text-neutral-700">
              “{review.text}”
            </p>

            <p className="text-xs text-neutral-500 mt-1">
              — {review.location}
            </p>
          </div>
        ))}
      </div>

      {/* ⭐ Інтерактив */}
      <div className="mt-6">
        <p className="text-xs tracking-[0.24em] text-neutral-500">
          YOUR IMPRESSION
        </p>

        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className={`h-6 w-6 rounded-full transition-all duration-300 ${
                i <= hover
                  ? 'bg-[#e6b85c] scale-110 shadow-md'
                  : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-neutral-500">
        Sonyachnaをご利用いただいたお客様の感想をもとに掲載しています。
      </p>
    </div>
  )
}
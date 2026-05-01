'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Mail, Send, Star } from 'lucide-react'

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
  path: string
}

const PENDING_REVIEWS_KEY = 'sonyachna_pending_reviews'
const PRODUCT_VOTES_KEY = 'sonyachna_product_votes'
const PRODUCT_COMMENTS_KEY = 'sonyachna_product_comments'

export default function ProductReviewsTrust({
  reviews,
}: {
  reviews: Review[]
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [voteCount, setVoteCount] = useState(0)
  const [notice, setNotice] = useState('')
  const [burstKey, setBurstKey] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewName, setReviewName] = useState('')
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false)
  const [pathKey, setPathKey] = useState('product')

  const displayRating = hoverRating || selectedRating

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
    }, 4600)

    return () => window.clearInterval(timer)
  }, [reviews.length])

  useEffect(() => {
    const currentPath = window.location.pathname
    setPathKey(currentPath)

    try {
      const rawVotes = window.localStorage.getItem(PRODUCT_VOTES_KEY)
      const votes = rawVotes
        ? (JSON.parse(rawVotes) as Record<string, { rating: number; count: number }>)
        : {}

      const existingVote = votes[currentPath]
      if (existingVote) {
        setSelectedRating(existingVote.rating)
        setVoteCount(existingVote.count)
      }

      const rawComments = window.localStorage.getItem(PRODUCT_COMMENTS_KEY)
      const comments = rawComments
        ? (JSON.parse(rawComments) as Record<string, boolean>)
        : {}

      setHasSubmittedReview(Boolean(comments[currentPath]))
    } catch {
      // localStorage may be unavailable
    }
  }, [])

  function handleRatingClick(value: number) {
    if (voteCount >= 2) {
      setNotice('この商品への投票はすでに完了しています。')
      window.setTimeout(() => setNotice(''), 2600)
      return
    }

    const nextCount = voteCount + 1

    try {
      const rawVotes = window.localStorage.getItem(PRODUCT_VOTES_KEY)
      const votes = rawVotes
        ? (JSON.parse(rawVotes) as Record<string, { rating: number; count: number }>)
        : {}

      votes[pathKey] = {
        rating: value,
        count: nextCount,
      }

      window.localStorage.setItem(PRODUCT_VOTES_KEY, JSON.stringify(votes))
    } catch {
      // localStorage may be unavailable
    }

    setSelectedRating(value)
    setVoteCount(nextCount)
    setBurstKey((current) => current + 1)
    setNotice('評価を受け付けました。ありがとうございます。')
    window.setTimeout(() => setNotice(''), 2800)
  }

  function handleSubmitReview() {
    if (!selectedRating || !reviewText.trim() || hasSubmittedReview) return

    const nextReview: PendingReview = {
      rating: selectedRating,
      text: reviewText.trim(),
      name: reviewName.trim() || '匿名',
      createdAt: new Date().toISOString(),
      path: pathKey,
    }

    try {
      const raw = window.localStorage.getItem(PENDING_REVIEWS_KEY)
      const existing = raw ? (JSON.parse(raw) as PendingReview[]) : []

      window.localStorage.setItem(
        PENDING_REVIEWS_KEY,
        JSON.stringify([nextReview, ...existing].slice(0, 50))
      )

      const rawComments = window.localStorage.getItem(PRODUCT_COMMENTS_KEY)
      const comments = rawComments
        ? (JSON.parse(rawComments) as Record<string, boolean>)
        : {}

      comments[pathKey] = true
      window.localStorage.setItem(PRODUCT_COMMENTS_KEY, JSON.stringify(comments))
    } catch {
      // localStorage may be unavailable
    }

    setReviewText('')
    setReviewName('')
    setHasSubmittedReview(true)
    setBurstKey((current) => current + 1)
    setNotice('感想を受け付けました。確認後に掲載されます。')
    window.setTimeout(() => setNotice(''), 3200)
  }

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-[30px] border border-[#e6d7c1] bg-white/82 p-5 shadow-[0_18px_50px_rgba(58,42,22,0.07)]">
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

      <div className="relative mt-5 min-h-[230px] overflow-hidden">
        <div
          key={activeIndex}
          className="grid animate-reviewPair gap-3 sm:grid-cols-2"
        >
          {visibleReviews.map((review) => (
            <div
              key={`${review.location}-${review.text}`}
              className="rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(185,133,43,0.14)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-0.5 text-[#b9852b]">
                  {Array.from({ length: review.rating }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-3.5 w-3.5 fill-current"
                    />
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

      <div className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: Math.ceil(reviews.length / 2) }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              Math.floor(activeIndex / 2) === i
                ? 'w-7 bg-[#b9852b]'
                : 'w-1.5 bg-[#d8c5aa]'
            }`}
          />
        ))}
      </div>

      <div className="mt-7 rounded-[26px] border border-[#eadfce] bg-white/70 p-5">
        <p className="text-xs tracking-[0.24em] text-neutral-500">
          YOUR IMPRESSION
        </p>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {burstKey > 0 ? (
            <div
              key={burstKey}
              className="pointer-events-none absolute left-28 top-5 z-10"
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className="petal-burst absolute h-2.5 w-1 rounded-full bg-[#d6a144]"
                  style={{
                    '--angle': `${i * 22.5}deg`,
                    '--delay': `${i * 18}ms`,
                  } as React.CSSProperties}
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
              disabled={voteCount >= 2}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
                i <= displayRating
                  ? 'scale-105 border-[#d6a144] bg-[radial-gradient(circle_at_30%_25%,#ffe8a8,#e6b85c_55%,#b9852b)] shadow-[0_14px_28px_rgba(185,133,43,0.28)]'
                  : 'border-[#eadfce] bg-[#f4ead9]'
              } ${voteCount >= 2 ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-1'}`}
              aria-label={`${i}点`}
            >
              <Star
                className={`h-5 w-5 transition-all duration-300 ${
                  i <= displayRating
                    ? 'fill-white text-white'
                    : 'text-[#b9852b]'
                }`}
              />
            </button>
          ))}

          {notice ? (
            <div className="inline-flex animate-noticeIn items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffaf2] px-4 py-2 text-xs text-neutral-700 shadow-sm">
              <Check className="h-3.5 w-3.5 text-[#b9852b]" />
              {notice}
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-xs leading-6 text-neutral-500">
          評価は商品ランキングの参考に使用されます。誤って違う評価を選んだ場合は、もう一度だけ再投票できます。2回目の評価が最終結果になります。
        </p>

        {!hasSubmittedReview ? (
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
        ) : (
          <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4">
            <p className="text-sm font-medium text-neutral-900">
              感想を受け付けました。
            </p>
            <p className="mt-2 text-xs leading-6 text-neutral-500">
              この商品への追加投稿はできません。修正や削除をご希望の場合はお問い合わせください。
            </p>

            <a
              href="/contact"
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8c5aa] bg-white px-4 text-sm text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-900"
            >
              <Mail className="h-4 w-4" />
              問い合わせ
            </a>
          </div>
        )}

        <p className="mt-4 text-xs leading-6 text-neutral-500">
          投稿内容は確認後に掲載されます。不適切な内容は掲載されません。
        </p>
      </div>

      <style jsx>{`
        @keyframes reviewPair {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.985);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .animate-reviewPair {
          animation: reviewPair 760ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes noticeIn {
          0% {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-noticeIn {
          animation: noticeIn 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes petalBurst {
          0% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(0) scale(0.5);
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(-46px) scale(1.25);
          }
        }

        .petal-burst {
          animation: petalBurst 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--delay);
        }
      `}</style>
    </div>
  )
}
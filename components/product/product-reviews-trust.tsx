'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Check, Mail, Send, ShieldCheck, Star } from 'lucide-react'

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

type StoredVote = {
  rating: number
  lastVote?: number
  count?: number
}

type RatingBurst = {
  index: number
  key: number
}

type RatingSummary = {
  average: string
  total: number
  breakdown: {
    rating: number
    count: number
    percentage: number
  }[]
}

const PENDING_REVIEWS_KEY = 'sonyachna_pending_reviews'
const PRODUCT_VOTES_KEY = 'sonyachna_product_votes'
const PRODUCT_COMMENTS_KEY = 'sonyachna_product_comments'
const VOTE_COOLDOWN_MS = 1000 * 60 * 60 * 12
const MAX_REVIEW_LENGTH = 220

function getRatingSummary(reviews: Review[]): RatingSummary {
  const safeReviews = reviews.filter(
    (review) => Number.isFinite(review.rating) && review.rating >= 1
  )
  const total = safeReviews.length
  const sum = safeReviews.reduce((current, review) => current + review.rating, 0)
  const average = total > 0 ? (sum / total).toFixed(1) : '0.0'

  const breakdown = [5, 4, 3, 2, 1].map((rating) => {
    const count = safeReviews.filter((review) => review.rating === rating).length

    return {
      rating,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })

  return {
    average,
    total,
    breakdown,
  }
}

function getReviewPreviewLabel(total: number) {
  if (total === 0) return '掲載レビューは準備中です'
  if (total === 1) return '1件の掲載レビュー'

  return `${total}件の掲載レビュー`
}

function formatPendingReviewDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '確認中'
  }

  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function SunRatingIcon({
  active,
  disabled,
}: {
  active: boolean
  disabled: boolean
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-8 w-8 transition-all duration-300 ${
        active ? 'scale-110' : 'scale-100'
      } ${disabled ? 'opacity-60 grayscale' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="sun-rating-core" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE8A8" />
          <stop offset="45%" stopColor="#E9B85B" />
          <stop offset="100%" stopColor="#B97922" />
        </radialGradient>

        <linearGradient id="sun-rating-petal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0B8" />
          <stop offset="45%" stopColor="#E8B354" />
          <stop offset="100%" stopColor="#A86D1D" />
        </linearGradient>
      </defs>

      <g fill={active ? 'url(#sun-rating-petal)' : '#d8c5aa'}>
        <path d="M50 9 C60 20, 61 26, 50 31 C39 26, 40 20, 50 9Z" />
        <path d="M71 15 C73 30, 70 36, 59 37 C57 26, 61 20, 71 15Z" />
        <path d="M88 36 C75 45, 69 46, 64 37 C72 29, 79 30, 88 36Z" />
        <path d="M88 64 C73 63, 67 59, 68 48 C79 47, 84 53, 88 64Z" />
        <path d="M50 91 C40 80, 39 74, 50 69 C61 74, 60 80, 50 91Z" />
        <path d="M29 85 C27 70, 30 64, 41 63 C43 74, 39 80, 29 85Z" />
        <path d="M12 64 C25 55, 31 54, 36 63 C28 71, 21 70, 12 64Z" />
        <path d="M12 36 C27 37, 33 41, 32 52 C21 53, 16 47, 12 36Z" />
        <path d="M29 15 C42 22, 45 28, 39 37 C29 32, 25 25, 29 15Z" />
      </g>

      <circle
        cx="50"
        cy="50"
        r="13"
        fill={active ? 'url(#sun-rating-core)' : '#eadfce'}
      />
      <circle cx="45" cy="44" r="4" fill="rgba(255,255,255,0.42)" />
    </svg>
  )
}

export default function ProductReviewsTrust({
  reviews,
}: {
  reviews: Review[]
}) {
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [notice, setNotice] = useState('')
  const [ratingBurst, setRatingBurst] = useState<RatingBurst | null>(null)
  const [submitBurstKey, setSubmitBurstKey] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewName, setReviewName] = useState('')
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false)
  const [pathKey, setPathKey] = useState('product')
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])

  const displayRating = hoverRating || selectedRating
  const ratingSummary = useMemo(() => getRatingSummary(reviews), [reviews])
  const animatedReviews = useMemo(() => [...reviews, ...reviews], [reviews])
  const hasCooldown = cooldownUntil !== null && Date.now() < cooldownUntil
  const remainingCharacters = MAX_REVIEW_LENGTH - reviewText.length

  useEffect(() => {
    const currentPath = window.location.pathname
    setPathKey(currentPath)

    try {
      const rawVotes = window.localStorage.getItem(PRODUCT_VOTES_KEY)
      const votes = rawVotes
        ? (JSON.parse(rawVotes) as Record<string, StoredVote>)
        : {}

      const existingVote = votes[currentPath]

      if (existingVote) {
        setSelectedRating(existingVote.rating)

        if (
          existingVote.lastVote &&
          Date.now() - existingVote.lastVote < VOTE_COOLDOWN_MS
        ) {
          setCooldownUntil(existingVote.lastVote + VOTE_COOLDOWN_MS)
        }
      }

      const rawComments = window.localStorage.getItem(PRODUCT_COMMENTS_KEY)
      const comments = rawComments
        ? (JSON.parse(rawComments) as Record<string, boolean>)
        : {}

      setHasSubmittedReview(Boolean(comments[currentPath]))

      const rawPending = window.localStorage.getItem(PENDING_REVIEWS_KEY)
      const pending = rawPending ? (JSON.parse(rawPending) as PendingReview[]) : []
      setPendingReviews(
        pending
          .filter((review) => review.path === currentPath)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      )
    } catch {
      // localStorage may be unavailable
    }
  }, [])

  function handleRatingClick(value: number, index: number) {
    try {
      const rawVotes = window.localStorage.getItem(PRODUCT_VOTES_KEY)
      const votes = rawVotes
        ? (JSON.parse(rawVotes) as Record<string, StoredVote>)
        : {}

      const now = Date.now()
      const existingVote = votes[pathKey]

      if (
        existingVote?.lastVote &&
        now - existingVote.lastVote < VOTE_COOLDOWN_MS
      ) {
        setCooldownUntil(existingVote.lastVote + VOTE_COOLDOWN_MS)
        setNotice('一定時間（約12時間）後に再評価できます。')
        window.setTimeout(() => setNotice(''), 2800)
        return
      }

      votes[pathKey] = {
        rating: value,
        lastVote: now,
        count: (existingVote?.count ?? 0) + 1,
      }

      window.localStorage.setItem(PRODUCT_VOTES_KEY, JSON.stringify(votes))
      setCooldownUntil(now + VOTE_COOLDOWN_MS)
    } catch {
      // localStorage may be unavailable
    }

    setSelectedRating(value)
    setRatingBurst((current) => ({
      index,
      key: current ? current.key + 1 : 1,
    }))
    window.setTimeout(() => setRatingBurst(null), 980)

    setNotice('評価を受け付けました。ありがとうございます。')
    window.setTimeout(() => setNotice(''), 2800)
  }

  function handleSubmitReview() {
    if (!selectedRating || !reviewText.trim() || hasSubmittedReview) return

    const nextReview: PendingReview = {
      rating: selectedRating,
      text: reviewText.trim().slice(0, MAX_REVIEW_LENGTH),
      name: reviewName.trim() || '匿名',
      createdAt: new Date().toISOString(),
      path: pathKey,
    }

    try {
      const raw = window.localStorage.getItem(PENDING_REVIEWS_KEY)
      const existing = raw ? (JSON.parse(raw) as PendingReview[]) : []
      const nextPendingReviews = [nextReview, ...existing].slice(0, 50)

      window.localStorage.setItem(
        PENDING_REVIEWS_KEY,
        JSON.stringify(nextPendingReviews)
      )

      setPendingReviews(
        nextPendingReviews
          .filter((review) => review.path === pathKey)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
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
    setSubmitBurstKey((current) => current + 1)
    setNotice('感想を受け付けました。確認後に掲載されます。')
    window.setTimeout(() => setNotice(''), 3200)
  }

  return (
    <div className="relative w-full max-w-full min-w-0 overflow-hidden rounded-[30px] border border-[#e6d7c1] bg-white/82 p-5 shadow-[0_18px_50px_rgba(58,42,22,0.07)]">
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
            {ratingSummary.average} / 5
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-[26px] border border-[#eadfce] bg-[linear-gradient(135deg,#fff8ea_0%,#fffdf8_58%,#f4ead9_100%)] p-4 sm:grid-cols-[0.9fr_1.1fr] sm:p-5">
        <div className="rounded-3xl border border-white/70 bg-white/78 p-4 shadow-sm">
          <p className="text-xs tracking-[0.22em] text-neutral-500">
            TRUST SUMMARY
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-serif text-4xl leading-none text-neutral-950">
              {ratingSummary.average}
            </span>
            <span className="pb-1 text-sm text-neutral-500">/ 5</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            {getReviewPreviewLabel(ratingSummary.total)}をもとに表示しています。
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-3 py-2 text-xs leading-5 text-neutral-600">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#b9852b]" />
            投稿内容は確認後に掲載されます。誇張よりも、実際の使用感を重視します。
          </div>
        </div>

        <div className="space-y-2 rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm">
          {ratingSummary.breakdown.map((item) => (
            <div
              key={item.rating}
              className="grid grid-cols-[46px_1fr_42px] items-center gap-3 text-xs text-neutral-600"
            >
              <div className="flex items-center gap-1 font-medium text-neutral-800">
                <Star className="h-3.5 w-3.5 fill-[#b9852b] text-[#b9852b]" />
                {item.rating}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eadfce]">
                <div
                  className="h-full rounded-full bg-[#b9852b] transition-all duration-700"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-right tabular-nums text-neutral-500">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 h-[214px] w-full max-w-full min-w-0 overflow-hidden [contain:layout_paint]">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-14 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-14 bg-gradient-to-l from-white/95 via-white/80 to-transparent" />

        <div className="absolute left-0 top-0 flex gap-3 animate-boundedReviewMarquee">
          {animatedReviews.map((review, index) => (
            <div
              key={`${review.location}-${review.text}-${index}`}
              className="h-[204px] w-[250px] shrink-0 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(185,133,43,0.14)]"
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

              <p className="mt-3 line-clamp-4 text-sm leading-7 text-neutral-700">
                “{review.text}”
              </p>

              <p className="mt-2 text-xs text-neutral-500">
                — {review.location}
              </p>
            </div>
          ))}
        </div>
      </div>

      {pendingReviews.length > 0 ? (
        <div className="mt-5 rounded-[24px] border border-[#eadfce] bg-[#fffaf2] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.22em] text-neutral-500">
                YOUR PENDING REVIEW
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                確認待ちの感想があります
              </p>
            </div>
            <span className="rounded-full border border-[#eadfce] bg-white px-3 py-1 text-xs text-neutral-600">
              {pendingReviews.length}件
            </span>
          </div>

          <div className="mt-3 grid gap-2">
            {pendingReviews.slice(0, 2).map((review) => (
              <div
                key={`${review.createdAt}-${review.text}`}
                className="rounded-2xl border border-[#eadfce] bg-white/78 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5 text-[#b9852b]">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    {formatPendingReviewDate(review.createdAt)} / 確認中
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-6 text-neutral-600">
                  “{review.text}”
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-7 rounded-[26px] border border-[#eadfce] bg-white/70 p-5">
        <p className="text-xs tracking-[0.24em] text-neutral-500">
          YOUR IMPRESSION
        </p>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((i, index) => (
            <div key={i} className="relative">
              {ratingBurst?.index === index ? (
                <div
                  key={ratingBurst.key}
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                >
                  {Array.from({ length: 20 }).map((_, burstIndex) => (
                    <span
                      key={burstIndex}
                      className="sun-rating-burst absolute h-2.5 w-1 rounded-full bg-[#d6a144]"
                      style={
                        {
                          '--angle': `${burstIndex * 18}deg`,
                          '--delay': `${burstIndex * 14}ms`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onMouseEnter={() => {
                  if (!hasCooldown) setHoverRating(i)
                }}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingClick(i, index)}
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  i <= displayRating
                    ? 'scale-105 shadow-[0_14px_28px_rgba(185,133,43,0.22)]'
                    : ''
                } ${
                  hasCooldown
                    ? 'cursor-not-allowed opacity-80'
                    : 'hover:-translate-y-1 hover:scale-105'
                }`}
                aria-label={`${i}点`}
              >
                <SunRatingIcon active={i <= displayRating} disabled={hasCooldown} />
              </button>
            </div>
          ))}

          {notice ? (
            <div
              className="inline-flex animate-noticeIn items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffaf2] px-4 py-2 text-xs text-neutral-700 shadow-sm"
              aria-live="polite"
            >
              <Check className="h-3.5 w-3.5 text-[#b9852b]" />
              {notice}
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-xs leading-6 text-neutral-500">
          評価は商品改善と表示順の参考に使用されます。一定時間（約12時間）後に再評価が可能です。
        </p>

        {!hasSubmittedReview ? (
          <div className="mt-5 grid gap-3">
            <input
              value={reviewName}
              onChange={(event) => setReviewName(event.target.value.slice(0, 40))}
              placeholder="お名前（任意）"
              className="h-11 rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 text-sm outline-none transition focus:border-[#c89a48]"
            />

            <div>
              <textarea
                value={reviewText}
                onChange={(event) =>
                  setReviewText(event.target.value.slice(0, MAX_REVIEW_LENGTH))
                }
                placeholder="商品の感想をお聞かせください"
                rows={3}
                className="w-full resize-none rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#c89a48]"
              />
              <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-neutral-500">
                <span>掲載前に内容を確認します。</span>
                <span className="tabular-nums">残り {remainingCharacters} 文字</span>
              </div>
            </div>

            <div className="relative inline-flex w-full">
              {submitBurstKey > 0 ? (
                <div
                  key={submitBurstKey}
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                >
                  {Array.from({ length: 18 }).map((_, burstIndex) => (
                    <span
                      key={burstIndex}
                      className="submit-rating-burst absolute h-2.5 w-1 rounded-full bg-[#d6a144]"
                      style={
                        {
                          '--angle': `${burstIndex * 20}deg`,
                          '--delay': `${burstIndex * 12}ms`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={!selectedRating || !reviewText.trim()}
                className="relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
              >
                <Send className="h-4 w-4" />
                感想を送る
              </button>
            </div>
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
        @keyframes boundedReviewMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .animate-boundedReviewMarquee {
          animation: boundedReviewMarquee 36s linear infinite;
          will-change: transform;
        }

        .animate-boundedReviewMarquee:hover {
          animation-play-state: paused;
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

        @keyframes sunRatingBurst {
          0% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(0) scale(0.4);
          }
          22% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(-50px) scale(1.25);
          }
        }

        .sun-rating-burst {
          animation: sunRatingBurst 940ms cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
          animation-delay: var(--delay);
          transform-origin: center;
        }

        @keyframes submitRatingBurst {
          0% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(0) scale(0.4);
          }
          22% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: rotate(var(--angle)) translateY(-42px) scale(1.15);
          }
        }

        .submit-rating-burst {
          animation: submitRatingBurst 900ms cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
          animation-delay: var(--delay);
          transform-origin: center;
        }
      `}</style>
    </div>
  )
}

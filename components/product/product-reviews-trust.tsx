'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { BarChart3, Check, Mail, Pencil, Send, Star } from 'lucide-react'

type Review = {
  rating: number
  text: string
  location: string
}

type ServerComment = {
  id: string
  productId: string
  rating: number
  text: string
  name: string
  createdAt: string
  updatedAt: string
  editable: boolean
}

type VoteSummary = {
  average: number
  total: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

type RatingBurst = {
  index: number
  key: number
}

const MAX_REVIEW_LENGTH = 220

function getProductIdFromPath() {
  if (typeof window === 'undefined') return 'product'

  const parts = window.location.pathname.split('/').filter(Boolean)
  const productIndex = parts.indexOf('product')

  if (productIndex >= 0 && parts[productIndex + 1]) {
    return parts[productIndex + 1]
  }

  return window.location.pathname
}

function createEmptyDistribution(): Record<1 | 2 | 3 | 4 | 5, number> {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
}

function getCuratedSummary(reviews: Review[]): VoteSummary {
  const distribution = createEmptyDistribution()

  for (const review of reviews) {
    const rating = Math.max(1, Math.min(5, Math.round(review.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5

    distribution[rating] += 1
  }

  const total = reviews.length
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)

  return {
    average: total > 0 ? Number((sum / total).toFixed(1)) : 0,
    total,
    distribution,
  }
}

function SunRatingIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-8 w-8 transition-all duration-300 ${
        active ? 'scale-110' : 'scale-100'
      }`}
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

function RatingBreakdown({ summary }: { summary: VoteSummary }) {
  const total = summary.total

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = summary.distribution[rating as 1 | 2 | 3 | 4 | 5] ?? 0
        const percent = total > 0 ? Math.round((count / total) * 100) : 0

        return (
          <div key={rating} className="grid grid-cols-[42px_1fr_54px] items-center gap-3">
            <div className="text-xs font-medium text-neutral-700">{rating}★</div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eadfce]">
              <div
                className="h-full rounded-full bg-[#b9852b] transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-right text-xs text-neutral-500">{count}件</div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProductReviewsTrust({
  reviews,
}: {
  reviews: Review[]
}) {
  const [productId, setProductId] = useState('product')
  const [serverComments, setServerComments] = useState<ServerComment[]>([])
  const [voteSummary, setVoteSummary] = useState<VoteSummary>(() =>
    getCuratedSummary(reviews)
  )
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [notice, setNotice] = useState('')
  const [ratingBurst, setRatingBurst] = useState<RatingBurst | null>(null)
  const [submitBurstKey, setSubmitBurstKey] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewName, setReviewName] = useState('')
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const displayRating = hoverRating || selectedRating
  const curatedSummary = useMemo(() => getCuratedSummary(reviews), [reviews])
  const effectiveSummary = voteSummary.total > 0 ? voteSummary : curatedSummary
  const editableComment = serverComments.find((comment) => comment.editable)

  const mixedReviews = useMemo(() => {
    const customerReviews = serverComments.map((comment) => ({
      rating: comment.rating,
      text: comment.text,
      location: comment.name,
      source: 'customer' as const,
      createdAt: comment.createdAt,
    }))

    const curatedReviews = reviews.map((review, index) => ({
      rating: review.rating,
      text: review.text,
      location: review.location,
      source: 'curated' as const,
      createdAt: `curated-${index}`,
    }))

    return [...customerReviews, ...curatedReviews]
  }, [reviews, serverComments])

  const animatedReviews = useMemo(() => {
    if (mixedReviews.length === 0) return []
    return [...mixedReviews, ...mixedReviews]
  }, [mixedReviews])

  async function loadVotes(nextProductId: string) {
    try {
      const response = await fetch(
        `/api/product-votes?productId=${encodeURIComponent(nextProductId)}`,
        { cache: 'no-store' }
      )

      if (!response.ok) return

      const data = (await response.json()) as {
        summary?: Partial<VoteSummary>
        average?: number
        total?: number
        distribution?: Record<string, number>
      }

      const source = data.summary ?? data
      const distribution = createEmptyDistribution()

      for (const key of [1, 2, 3, 4, 5] as const) {
        distribution[key] = Number(source.distribution?.[key] ?? 0)
      }

      setVoteSummary({
        average: Number(source.average ?? 0),
        total: Number(source.total ?? 0),
        distribution,
      })
    } catch {
      // vote summary is non-critical UI
    }
  }

  async function loadComments(nextProductId: string) {
    try {
      const response = await fetch(
        `/api/product-comments?productId=${encodeURIComponent(nextProductId)}`,
        { cache: 'no-store' }
      )

      if (!response.ok) return

      const data = (await response.json()) as { comments?: ServerComment[] }
      const comments = data.comments ?? []

      setServerComments(comments)

      const ownComment = comments.find((comment) => comment.editable)

      if (ownComment) {
        setSelectedRating(ownComment.rating)
        setReviewName(ownComment.name === '匿名' ? '' : ownComment.name)
        setReviewText(ownComment.text)
      }
    } catch {
      // comments are non-critical UI
    }
  }

  useEffect(() => {
    const nextProductId = getProductIdFromPath()
    setProductId(nextProductId)
    void loadVotes(nextProductId)
    void loadComments(nextProductId)
  }, [])

  async function handleRatingClick(value: number, index: number) {
    setSelectedRating(value)
    setRatingBurst((current) => ({
      index,
      key: current ? current.key + 1 : 1,
    }))
    window.setTimeout(() => setRatingBurst(null), 980)

    try {
      const response = await fetch('/api/product-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: value,
        }),
      })

      const data = (await response.json()) as {
        error?: string
        summary?: VoteSummary
      }

      if (!response.ok) {
        setNotice(data.error ?? '一定時間後に再評価できます。')
        window.setTimeout(() => setNotice(''), 2800)
        return
      }

      if (data.summary) {
        setVoteSummary(data.summary)
      } else {
        await loadVotes(productId)
      }

      setNotice('評価を受け付けました。')
      window.setTimeout(() => setNotice(''), 2800)
    } catch {
      setNotice('評価の保存に失敗しました。時間をおいて再度お試しください。')
      window.setTimeout(() => setNotice(''), 3200)
    }
  }

  async function handleSubmitReview() {
    if (!selectedRating || !reviewText.trim() || isSavingComment) return

    try {
      setIsSavingComment(true)

      const response = await fetch('/api/product-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: selectedRating,
          comment: reviewText.trim(),
          authorName: reviewName.trim() || '匿名',
        }),
      })

      const data = (await response.json()) as {
        comment?: ServerComment
        error?: string
      }

      if (!response.ok || !data.comment) {
        setNotice(data.error ?? '感想の保存に失敗しました。')
        window.setTimeout(() => setNotice(''), 3200)
        return
      }

      await loadComments(productId)
      setSubmitBurstKey((current) => current + 1)
      setNotice(editableComment ? '感想を更新しました。' : '感想を掲載しました。')
      window.setTimeout(() => setNotice(''), 3200)
    } catch {
      setNotice('通信エラーが発生しました。時間をおいて再度お試しください。')
      window.setTimeout(() => setNotice(''), 3200)
    } finally {
      setIsSavingComment(false)
    }
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffaf2] px-4 py-2">
            <div className="flex items-center gap-0.5 text-[#b9852b]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <span className="text-xs font-semibold text-neutral-800">
              {effectiveSummary.average.toFixed(1)} / 5
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDetailsOpen((current) => !current)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#eadfce] bg-white px-4 text-xs font-medium text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c89a48]"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#b9852b]" />
            詳細を見る
          </button>
        </div>
      </div>

      {isDetailsOpen ? (
        <div className="mt-5 rounded-[26px] border border-[#eadfce] bg-[#fffaf2] p-5">
          <div className="grid gap-5 md:grid-cols-[0.7fr_1fr] md:items-center">
            <div>
              <p className="text-xs tracking-[0.24em] text-neutral-500">
                RATING DETAILS
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="font-serif text-4xl tracking-tight text-neutral-950">
                  {effectiveSummary.average.toFixed(1)}
                </span>
                <span className="pb-1 text-sm text-neutral-500">
                  / 5 ・ {effectiveSummary.total}件
                </span>
              </div>
              <p className="mt-3 text-xs leading-6 text-neutral-500">
                評価の内訳は実際に送信された評価データをもとに表示されます。
              </p>
            </div>

            <RatingBreakdown summary={effectiveSummary} />
          </div>
        </div>
      ) : null}

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

      <div className="mt-7 rounded-[26px] border border-[#eadfce] bg-white/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs tracking-[0.24em] text-neutral-500">
            YOUR IMPRESSION
          </p>

          {editableComment ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#eadfce] bg-[#fffaf2] px-3 py-1 text-xs text-neutral-600">
              <Pencil className="h-3 w-3 text-[#b9852b]" />
              投稿済み・編集できます
            </span>
          ) : null}
        </div>

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
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => void handleRatingClick(i, index)}
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  i <= displayRating
                    ? 'scale-105 shadow-[0_14px_28px_rgba(185,133,43,0.22)]'
                    : ''
                } hover:-translate-y-1 hover:scale-105`}
                aria-label={`${i}点`}
              >
                <SunRatingIcon active={i <= displayRating} />
              </button>
            </div>
          ))}

          {notice ? (
            <div className="inline-flex animate-noticeIn items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffaf2] px-4 py-2 text-xs text-neutral-700 shadow-sm">
              <Check className="h-3.5 w-3.5 text-[#b9852b]" />
              {notice}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3">
          <input
            value={reviewName}
            onChange={(event) => setReviewName(event.target.value)}
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
              className="resize-none rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#c89a48]"
            />
            <div className="mt-1 text-right text-[11px] text-neutral-400">
              {reviewText.length} / {MAX_REVIEW_LENGTH}
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
              onClick={() => void handleSubmitReview()}
              disabled={!selectedRating || !reviewText.trim() || isSavingComment}
              className="relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              <Send className="h-4 w-4" />
              {isSavingComment
                ? '保存中...'
                : editableComment
                  ? '感想を更新する'
                  : '感想を掲載する'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs leading-6 text-neutral-500">
          投稿はこの商品の声として掲載されます。同じ環境からは1件のみ投稿でき、あとから内容を更新できます。
        </p>

        {editableComment ? (
          <a
            href="/contact"
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8c5aa] bg-white px-4 text-sm text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-900"
          >
            <Mail className="h-4 w-4" />
            問い合わせ
          </a>
        ) : null}
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

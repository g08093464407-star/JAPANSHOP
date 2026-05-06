'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { BarChart3, Check, Mail, Send, Star, X } from 'lucide-react'

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

type VoteBucket = {
  rating: number
  count: number
  percentage: number
}

type ProductVoteSummary = {
  productId: string
  productName: string
  total: number
  average: number
  distribution: VoteBucket[]
}

type ProductVotesResponse = {
  current: ProductVoteSummary | null
  products: ProductVoteSummary[]
  error?: string
  remainingMs?: number
}

const PENDING_REVIEWS_KEY = 'sonyachna_pending_reviews'
const PRODUCT_VOTES_KEY = 'sonyachna_product_votes'
const PRODUCT_COMMENTS_KEY = 'sonyachna_product_comments'
const VOTE_COOLDOWN_MS = 1000 * 60 * 60 * 12
const REVIEW_TEXT_LIMIT = 220

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
      } ${disabled ? 'opacity-55 grayscale' : ''}`}
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

function getProductIdFromPath(pathname: string) {
  if (!pathname) return 'product'

  if (pathname.startsWith('/product/')) {
    return pathname.replace('/product/', '').split('?')[0] || 'product'
  }

  return pathname
}

function getFallbackAverage(reviews: Review[]) {
  if (reviews.length === 0) return 0

  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return Number((total / reviews.length).toFixed(1))
}

function getFallbackDistribution(reviews: Review[]): VoteBucket[] {
  const total = reviews.length

  return [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length

    return {
      rating,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
}

function formatRemainingTime(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.ceil((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours <= 0) {
    return `約${minutes}分後`
  }

  return `約${hours}時間${minutes > 0 ? `${minutes}分` : ''}後`
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
  const [productId, setProductId] = useState('product')
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [voteSummary, setVoteSummary] = useState<ProductVoteSummary | null>(null)
  const [allProductSummaries, setAllProductSummaries] = useState<
    ProductVoteSummary[]
  >([])
  const [isVoteLoading, setIsVoteLoading] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [localCooldownUntil, setLocalCooldownUntil] = useState(0)

  const displayRating = hoverRating || selectedRating
  const animatedReviews = useMemo(() => [...reviews, ...reviews], [reviews])
  const fallbackAverage = useMemo(() => getFallbackAverage(reviews), [reviews])
  const fallbackDistribution = useMemo(
    () => getFallbackDistribution(reviews),
    [reviews]
  )
  const visiblePendingReviews = useMemo(
    () => pendingReviews.filter((review) => review.path === pathKey),
    [pathKey, pendingReviews]
  )

  const averageRating = voteSummary?.total
    ? voteSummary.average
    : fallbackAverage
  const totalServerVotes = voteSummary?.total ?? 0
  const visibleDistribution = voteSummary?.total
    ? voteSummary.distribution
    : fallbackDistribution
  const isCoolingDown = localCooldownUntil > Date.now()

  const loadVoteSummary = useCallback(async (nextProductId: string) => {
    try {
      const response = await fetch(
        `/api/product-votes?productId=${encodeURIComponent(nextProductId)}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      const data = (await response.json()) as ProductVotesResponse

      if (!response.ok) {
        return
      }

      setVoteSummary(data.current)
      setAllProductSummaries(data.products ?? [])
    } catch {
      // network or API may be unavailable
    }
  }, [])

  useEffect(() => {
    const currentPath = window.location.pathname
    const currentProductId = getProductIdFromPath(currentPath)

    setPathKey(currentPath)
    setProductId(currentProductId)

    try {
      const rawVotes = window.localStorage.getItem(PRODUCT_VOTES_KEY)
      const votes = rawVotes
        ? (JSON.parse(rawVotes) as Record<string, StoredVote>)
        : {}

      const existingVote = votes[currentPath]

      if (existingVote) {
        setSelectedRating(existingVote.rating)

        if (existingVote.lastVote) {
          setLocalCooldownUntil(existingVote.lastVote + VOTE_COOLDOWN_MS)
        }
      }

      const rawComments = window.localStorage.getItem(PRODUCT_COMMENTS_KEY)
      const comments = rawComments
        ? (JSON.parse(rawComments) as Record<string, boolean>)
        : {}

      setHasSubmittedReview(Boolean(comments[currentPath]))

      const rawPendingReviews = window.localStorage.getItem(PENDING_REVIEWS_KEY)
      const parsedPendingReviews = rawPendingReviews
        ? (JSON.parse(rawPendingReviews) as PendingReview[])
        : []

      setPendingReviews(parsedPendingReviews)
    } catch {
      // localStorage may be unavailable
    }

    void loadVoteSummary(currentProductId)
  }, [loadVoteSummary])

  async function handleRatingClick(value: number, index: number) {
    if (isVoteLoading) return

    if (isCoolingDown) {
      setNotice(`再評価は${formatRemainingTime(localCooldownUntil - Date.now())}に可能です。`)
      window.setTimeout(() => setNotice(''), 3000)
      return
    }

    setIsVoteLoading(true)

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

      const data = (await response.json()) as ProductVotesResponse

      if (!response.ok) {
        if (response.status === 429 && data.remainingMs) {
          const nextCooldownUntil = Date.now() + data.remainingMs
          setLocalCooldownUntil(nextCooldownUntil)
          setNotice(`一定時間後に再評価できます。次回：${formatRemainingTime(data.remainingMs)}`)
          window.setTimeout(() => setNotice(''), 3200)
          return
        }

        setNotice('評価を送信できませんでした。時間をおいて再度お試しください。')
        window.setTimeout(() => setNotice(''), 3200)
        return
      }

      setVoteSummary(data.current)
      setAllProductSummaries(data.products ?? [])

      const now = Date.now()

      try {
        const rawVotes = window.localStorage.getItem(PRODUCT_VOTES_KEY)
        const votes = rawVotes
          ? (JSON.parse(rawVotes) as Record<string, StoredVote>)
          : {}

        const existingVote = votes[pathKey]

        votes[pathKey] = {
          rating: value,
          lastVote: now,
          count: (existingVote?.count ?? 0) + 1,
        }

        window.localStorage.setItem(PRODUCT_VOTES_KEY, JSON.stringify(votes))
      } catch {
        // localStorage may be unavailable
      }

      setSelectedRating(value)
      setLocalCooldownUntil(now + VOTE_COOLDOWN_MS)
      setRatingBurst((current) => ({
        index,
        key: current ? current.key + 1 : 1,
      }))
      window.setTimeout(() => setRatingBurst(null), 980)

      setNotice('評価を受け付けました。ありがとうございます。')
      window.setTimeout(() => setNotice(''), 2800)
    } catch {
      setNotice('通信エラーが発生しました。時間をおいて再度お試しください。')
      window.setTimeout(() => setNotice(''), 3200)
    } finally {
      setIsVoteLoading(false)
    }
  }

  function handleSubmitReview() {
    if (!selectedRating || !reviewText.trim() || hasSubmittedReview) return

    const nextReview: PendingReview = {
      rating: selectedRating,
      text: reviewText.trim().slice(0, REVIEW_TEXT_LIMIT),
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

      setPendingReviews(nextPendingReviews)

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

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffaf2] px-4 py-2">
            <div className="flex items-center gap-0.5 text-[#b9852b]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-current'
                      : 'text-[#d8c5aa]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-neutral-800">
              {averageRating > 0 ? averageRating.toFixed(1) : '—'} / 5
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c89a48] hover:text-neutral-950"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#b9852b]" />
            詳細を見る
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-[24px] border border-[#eadfce] bg-[#fffaf2]/80 p-4 sm:grid-cols-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-neutral-500">
            SERVER VOTES
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-950">
            {totalServerVotes > 0 ? `${totalServerVotes}件` : '集計開始'}
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.2em] text-neutral-500">
            TRANSPARENCY
          </p>
          <p className="mt-1 text-sm leading-6 text-neutral-700">
            詳細は実際の投票データから表示されます。
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.2em] text-neutral-500">
            MODERATION
          </p>
          <p className="mt-1 text-sm leading-6 text-neutral-700">
            感想文は確認後に掲載されます。
          </p>
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

      {visiblePendingReviews.length > 0 ? (
        <div className="mt-5 rounded-[24px] border border-dashed border-[#d6b278] bg-[#fffaf2] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs tracking-[0.22em] text-neutral-500">
              YOUR PENDING REVIEW
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] text-neutral-600 shadow-sm">
              確認待ち
            </span>
          </div>

          {visiblePendingReviews.slice(0, 2).map((review) => (
            <div key={`${review.createdAt}-${review.text}`} className="mt-3">
              <div className="flex items-center gap-0.5 text-[#b9852b]">
                {Array.from({ length: review.rating }).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className="h-3.5 w-3.5 fill-current"
                  />
                ))}
              </div>
              <p className="mt-2 text-sm leading-7 text-neutral-700">
                “{review.text}”
              </p>
              <p className="mt-1 text-xs text-neutral-500">— {review.name}</p>
            </div>
          ))}
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
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingClick(i, index)}
                disabled={isVoteLoading}
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  i <= displayRating
                    ? 'scale-105 shadow-[0_14px_28px_rgba(185,133,43,0.22)]'
                    : ''
                } ${
                  isVoteLoading
                    ? 'cursor-wait opacity-70'
                    : 'hover:-translate-y-1 hover:scale-105'
                }`}
                aria-label={`${i}点`}
              >
                <SunRatingIcon active={i <= displayRating} disabled={isVoteLoading} />
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

        <p className="mt-3 text-xs leading-6 text-neutral-500">
          評価はサーバー側で集計されます。短時間の連続評価は制限されます。
        </p>

        {!hasSubmittedReview ? (
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
                  setReviewText(event.target.value.slice(0, REVIEW_TEXT_LIMIT))
                }
                placeholder="商品の感想をお聞かせください"
                rows={3}
                className="w-full resize-none rounded-2xl border border-[#eadfce] bg-[#fffaf2] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#c89a48]"
              />
              <p className="mt-1 text-right text-[11px] text-neutral-400">
                {reviewText.length}/{REVIEW_TEXT_LIMIT}
              </p>
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

      {isDetailsOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-[#eadfce] bg-[#fffaf2] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.26)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.24em] text-neutral-500">
                  RATING DETAILS
                </p>
                <h3 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
                  評価の内訳
                </h3>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  下の数字はサーバーに保存された投票データです。レビュー本文とは別に集計されます。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadfce] bg-white text-neutral-600 transition hover:-translate-y-0.5 hover:text-neutral-950"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-neutral-500">この商品</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-950">
                    {voteSummary?.productName ?? '現在の商品'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-neutral-950">
                    {totalServerVotes > 0 ? voteSummary?.average.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {totalServerVotes}件の評価
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {visibleDistribution.map((bucket) => (
                  <div key={bucket.rating} className="grid grid-cols-[52px_1fr_64px] items-center gap-3">
                    <div className="flex items-center gap-1 text-sm font-medium text-neutral-700">
                      {bucket.rating}
                      <Star className="h-3.5 w-3.5 fill-current text-[#b9852b]" />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#eadfce]">
                      <div
                        className="h-full rounded-full bg-[#b9852b] transition-all duration-700"
                        style={{ width: `${bucket.percentage}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-neutral-600">
                      {bucket.count}件
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-sm">
              <p className="text-xs tracking-[0.22em] text-neutral-500">
                ALL PRODUCTS
              </p>
              <div className="mt-4 grid gap-3">
                {allProductSummaries.map((summary) => (
                  <div
                    key={summary.productId}
                    className="rounded-2xl border border-[#f0e4d4] bg-[#fffaf2] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-neutral-900">
                        {summary.productName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {summary.total > 0
                          ? `${summary.average.toFixed(1)} / 5 ・ ${summary.total}件`
                          : 'まだ評価はありません'}
                      </p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {summary.distribution.map((bucket) => (
                        <div key={bucket.rating} className="grid grid-cols-[44px_1fr_52px] items-center gap-2">
                          <span className="text-[11px] text-neutral-500">
                            {bucket.rating}★
                          </span>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#eadfce]">
                            <div
                              className="h-full rounded-full bg-[#b9852b]"
                              style={{ width: `${bucket.percentage}%` }}
                            />
                          </div>
                          <span className="text-right text-[11px] text-neutral-500">
                            {bucket.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

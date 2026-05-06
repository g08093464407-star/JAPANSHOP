import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, gt, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { productVotes } from "@/lib/db/schema"
import { logger } from "@/lib/logger"
import { products } from "@/data/products"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VOTE_COOLDOWN_MS = 1000 * 60 * 60 * 12
const VALID_RATINGS = [1, 2, 3, 4, 5] as const

type Rating = (typeof VALID_RATINGS)[number]

type ProductVoteBody = {
  productId?: string
  rating?: number
}

type VoteBucket = {
  rating: Rating
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

function normalizeProductId(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return ""

  if (trimmed.startsWith("/product/")) {
    return trimmed.replace("/product/", "").split("?")[0]?.trim() ?? ""
  }

  return trimmed.split("?")[0]?.trim() ?? ""
}

function isValidRating(value: unknown): value is Rating {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    VALID_RATINGS.includes(value as Rating)
  )
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown"
  }

  return realIp?.trim() || "unknown"
}

function getVoterHash(request: NextRequest) {
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent"
  const acceptLanguage = request.headers.get("accept-language") ?? "unknown-language"
  const salt = process.env.PRODUCT_VOTE_HASH_SALT ?? "sonyachna-product-votes"

  return createHash("sha256")
    .update(`${salt}:${ip}:${userAgent}:${acceptLanguage}`)
    .digest("hex")
}

function createEmptyDistribution(): VoteBucket[] {
  return [5, 4, 3, 2, 1].map((rating) => ({
    rating: rating as Rating,
    count: 0,
    percentage: 0,
  }))
}

function buildProductSummaries(
  rows: { productId: string; rating: number; count: number }[]
) {
  const summaryMap = new Map<string, ProductVoteSummary>()

  products.forEach((product) => {
    summaryMap.set(product.slug, {
      productId: product.slug,
      productName: product.name,
      total: 0,
      average: 0,
      distribution: createEmptyDistribution(),
    })
  })

  rows.forEach((row) => {
    const product = products.find((item) => item.slug === row.productId)
    if (!product || !isValidRating(row.rating)) return

    const summary = summaryMap.get(product.slug)
    if (!summary) return

    const bucket = summary.distribution.find(
      (item) => item.rating === row.rating
    )

    if (!bucket) return

    bucket.count += Number(row.count ?? 0)
    summary.total += Number(row.count ?? 0)
  })

  summaryMap.forEach((summary) => {
    if (summary.total === 0) {
      summary.average = 0
      return
    }

    const weightedTotal = summary.distribution.reduce(
      (sum, bucket) => sum + bucket.rating * bucket.count,
      0
    )

    summary.average = Number((weightedTotal / summary.total).toFixed(1))
    summary.distribution = summary.distribution.map((bucket) => ({
      ...bucket,
      percentage: Math.round((bucket.count / summary.total) * 100),
    }))
  })

  return Array.from(summaryMap.values())
}

async function getVoteSummaries() {
  const rows = await db
    .select({
      productId: productVotes.productId,
      rating: productVotes.rating,
      count: sql<number>`count(*)::int`,
    })
    .from(productVotes)
    .groupBy(productVotes.productId, productVotes.rating)

  return buildProductSummaries(rows)
}

export async function GET(request: NextRequest) {
  try {
    const requestedProductId = normalizeProductId(
      request.nextUrl.searchParams.get("productId") ?? ""
    )

    const summaries = await getVoteSummaries()
    const current = requestedProductId
      ? summaries.find((summary) => summary.productId === requestedProductId) ?? null
      : null

    return NextResponse.json({
      current,
      products: summaries,
    })
  } catch (error) {
    logger.error("Failed to fetch product vote summaries", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch product votes." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProductVoteBody
    const productId = normalizeProductId(body.productId ?? "")
    const rating = body.rating

    if (!productId) {
      return NextResponse.json({ error: "Missing productId." }, { status: 400 })
    }

    const product = products.find((item) => item.slug === productId)

    if (!product) {
      return NextResponse.json({ error: "Unknown product." }, { status: 400 })
    }

    if (!isValidRating(rating)) {
      return NextResponse.json({ error: "Invalid rating." }, { status: 400 })
    }

    const voterHash = getVoterHash(request)
    const cooldownStartedAt = new Date(Date.now() - VOTE_COOLDOWN_MS)

    const recentVote = await db
      .select({
        id: productVotes.id,
        createdAt: productVotes.createdAt,
      })
      .from(productVotes)
      .where(
        and(
          eq(productVotes.productId, product.slug),
          eq(productVotes.voterHash, voterHash),
          gt(productVotes.createdAt, cooldownStartedAt)
        )
      )
      .orderBy(desc(productVotes.createdAt))
      .limit(1)

    if (recentVote[0]) {
      const createdAt = new Date(recentVote[0].createdAt).getTime()
      const remainingMs = Math.max(
        VOTE_COOLDOWN_MS - (Date.now() - createdAt),
        0
      )

      return NextResponse.json(
        {
          error: "Vote cooldown is active.",
          remainingMs,
        },
        { status: 429 }
      )
    }

    await db.insert(productVotes).values({
      productId: product.slug,
      rating,
      voterHash,
    })

    logger.info("Product vote recorded", {
      productId: product.slug,
      rating,
    })

    const summaries = await getVoteSummaries()
    const current = summaries.find((summary) => summary.productId === product.slug) ?? null

    return NextResponse.json({
      current,
      products: summaries,
    })
  } catch (error) {
    logger.error("Failed to record product vote", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to record product vote." },
      { status: 500 }
    )
  }
}

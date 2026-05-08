import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { productVotes } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

function parseRatingFilter(value: string | null) {
  if (!value) return ""

  const rating = Number(value)

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return ""
  }

  return String(rating)
}

function buildFilters(searchQuery: string, productId: string, rating: string) {
  const conditions = []

  if (searchQuery) {
    const pattern = `%${searchQuery}%`

    conditions.push(
      or(
        ilike(productVotes.productId, pattern),
        ilike(productVotes.voterHash, pattern)
      )
    )
  }

  if (productId) {
    conditions.push(eq(productVotes.productId, productId))
  }

  if (rating) {
    conditions.push(eq(productVotes.rating, Number(rating)))
  }

  if (conditions.length === 0) {
    return undefined
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return and(...conditions)
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return new Date(value).toISOString()
  return new Date().toISOString()
}

function mapVote(row: typeof productVotes.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    rating: row.rating,
    voterHash: row.voterHash,
    createdAt: normalizeDate(row.createdAt),
  }
}

function createEmptyDistribution() {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  } as Record<1 | 2 | 3 | 4 | 5, number>
}

function summarizeVotes(rows: { productId: string; rating: number }[]) {
  const distribution = createEmptyDistribution()
  const productMap = new Map<string, { productId: string; total: number; sum: number; distribution: Record<1 | 2 | 3 | 4 | 5, number> }>()
  let sum = 0

  for (const row of rows) {
    const rating = Math.max(1, Math.min(5, Math.round(row.rating))) as 1 | 2 | 3 | 4 | 5

    distribution[rating] += 1
    sum += rating

    const current =
      productMap.get(row.productId) ??
      {
        productId: row.productId,
        total: 0,
        sum: 0,
        distribution: createEmptyDistribution(),
      }

    current.total += 1
    current.sum += rating
    current.distribution[rating] += 1
    productMap.set(row.productId, current)
  }

  const total = rows.length

  return {
    average: total > 0 ? Number((sum / total).toFixed(1)) : 0,
    total,
    distribution,
    productSummaries: Array.from(productMap.values())
      .map((item) => ({
        productId: item.productId,
        average: item.total > 0 ? Number((item.sum / item.total).toFixed(1)) : 0,
        total: item.total,
        distribution: item.distribution,
      }))
      .sort((a, b) => b.total - a.total),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE)
    const requestedPageSize = parsePositiveInt(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE
    )

    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
    const offset = (page - 1) * pageSize

    const searchQuery = (searchParams.get("q") ?? "").trim()
    const productId = (searchParams.get("productId") ?? "").trim()
    const rating = parseRatingFilter(searchParams.get("rating"))
    const filters = buildFilters(searchQuery, productId, rating)

    const dataQuery = db
      .select()
      .from(productVotes)
      .orderBy(desc(productVotes.createdAt))
      .limit(pageSize)
      .offset(offset)

    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(productVotes)

    const summaryQuery = db
      .select({ productId: productVotes.productId, rating: productVotes.rating })
      .from(productVotes)

    const rows = filters ? await dataQuery.where(filters) : await dataQuery
    const totalCountResult = filters
      ? await countQuery.where(filters)
      : await countQuery
    const summaryRows = filters
      ? await summaryQuery.where(filters)
      : await summaryQuery

    const totalItems = totalCountResult[0]?.count ?? 0
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1

    return NextResponse.json({
      votes: rows.map(mapVote),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      filters: {
        q: searchQuery,
        productId,
        rating,
      },
      summary: summarizeVotes(summaryRows),
    })
  } catch (error) {
    logger.error("Failed to fetch admin product votes", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch product votes" },
      { status: 500 }
    )
  }
}

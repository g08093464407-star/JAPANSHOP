import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { productComments } from "@/lib/db/schema"
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

function buildFilters(searchQuery: string, productId: string) {
  const conditions = []

  if (searchQuery) {
    const pattern = `%${searchQuery}%`

    conditions.push(
      or(
        ilike(productComments.authorName, pattern),
        ilike(productComments.comment, pattern),
        ilike(productComments.productId, pattern)
      )
    )
  }

  if (productId) {
    conditions.push(eq(productComments.productId, productId))
  }

  if (conditions.length === 0) {
    return undefined
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return and(...conditions)
}

function mapComment(row: typeof productComments.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    rating: row.rating,
    comment: row.comment,
    authorName: row.authorName,
    voterHash: row.voterHash,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
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

    const filters = buildFilters(searchQuery, productId)

    const dataQuery = db
      .select()
      .from(productComments)
      .orderBy(desc(productComments.createdAt))
      .limit(pageSize)
      .offset(offset)

    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(productComments)

    const rows = filters ? await dataQuery.where(filters) : await dataQuery
    const totalCountResult = filters
      ? await countQuery.where(filters)
      : await countQuery

    const totalItems = totalCountResult[0]?.count ?? 0
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1

    return NextResponse.json({
      comments: rows.map(mapComment),
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
      },
    })
  } catch (error) {
    logger.error("Failed to fetch admin product comments", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch product comments" },
      { status: 500 }
    )
  }
}

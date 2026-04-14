import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const allowedStatuses = ["paid", "processing", "shipped", "delivered"] as const
type AllowedStatus = (typeof allowedStatuses)[number]

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

function isAllowedStatus(value: string | null): value is AllowedStatus {
  if (!value) return false
  return allowedStatuses.includes(value as AllowedStatus)
}

function buildFilters(searchQuery: string, status: string | null) {
  const conditions = []

  if (searchQuery) {
    const pattern = `%${searchQuery}%`

    conditions.push(
      or(
        ilike(orders.customerName, pattern),
        ilike(orders.customerEmail, pattern)
      )
    )
  }

  if (isAllowedStatus(status)) {
    conditions.push(eq(orders.status, status))
  }

  if (conditions.length === 0) {
    return undefined
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return and(...conditions)
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

    const rawQuery = searchParams.get("q") ?? ""
    const searchQuery = rawQuery.trim()
    const status = searchParams.get("status")

    const filters = buildFilters(searchQuery, status)

    const dataQuery = db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset)

    const countQuery = db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(orders)

    const data = filters ? await dataQuery.where(filters) : await dataQuery
    const totalCountResult = filters
      ? await countQuery.where(filters)
      : await countQuery

    const totalItems = totalCountResult[0]?.count ?? 0
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1

    return NextResponse.json({
      orders: data,
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
        status: isAllowedStatus(status) ? status : "",
      },
    })
  } catch (error) {
    console.error("Failed to fetch admin orders:", error)

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
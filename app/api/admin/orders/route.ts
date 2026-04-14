import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { desc, sql } from "drizzle-orm"

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

    const data = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset)

    const totalCountResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(orders)

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
    })
  } catch (error) {
    console.error("Failed to fetch admin orders:", error)

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
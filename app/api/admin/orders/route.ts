import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { logger } from "@/lib/logger"
import type { OrderItem, OrderShippingSnapshot } from "@/types/order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const allowedStatuses = ["paid", "processing", "shipped", "delivered"] as const
type AllowedStatus = (typeof allowedStatuses)[number]

type AdminOrderRow = typeof orders.$inferSelect

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
        ilike(orders.customerEmail, pattern),
        ilike(orders.publicOrderNumber, pattern),
        ilike(orders.stripeSessionId, pattern)
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

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return new Date(value).toISOString()
  return new Date().toISOString()
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value

  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeItems(value: unknown): OrderItem[] {
  const parsed = parseJsonLike(value)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.map((item) => {
    const record = item as Record<string, unknown>

    return {
      id: typeof record.id === "string" ? record.id : "",
      slug: typeof record.slug === "string" ? record.slug : "",
      name: typeof record.name === "string" ? record.name : "",
      price: normalizeNumber(record.price),
      image: typeof record.image === "string" ? record.image : "",
      quantity: normalizeNumber(record.quantity),
      lengthCm: normalizeOptionalNumber(record.lengthCm),
      widthCm: normalizeOptionalNumber(record.widthCm),
      heightCm: normalizeOptionalNumber(record.heightCm),
      volumeCm3: normalizeOptionalNumber(record.volumeCm3),
      weightGrams: normalizeOptionalNumber(record.weightGrams),
    }
  })
}

function normalizeShippingSnapshot(value: unknown): OrderShippingSnapshot | null {
  const parsed = parseJsonLike(value)

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null
  }

  const record = parsed as Record<string, unknown>

  return {
    carrier: typeof record.carrier === "string" ? record.carrier : "",
    service: typeof record.service === "string" ? record.service : "",
    originPrefecture:
      typeof record.originPrefecture === "string" ? record.originPrefecture : "",
    destinationPrefecture:
      typeof record.destinationPrefecture === "string"
        ? record.destinationPrefecture
        : "",
    zone: typeof record.zone === "string" ? record.zone : "",
    shippingSize: normalizeNumber(record.shippingSize),
    boxType: normalizeOptionalNumber(record.boxType),
    boxLabel: typeof record.boxLabel === "string" ? record.boxLabel : "",
    boxInnerVolumeCm3: normalizeOptionalNumber(record.boxInnerVolumeCm3),
    boxUsableVolumeCm3: normalizeOptionalNumber(record.boxUsableVolumeCm3),
    totalVolumeCm3: normalizeOptionalNumber(record.totalVolumeCm3),
    remainingVolumeCm3: normalizeOptionalNumber(record.remainingVolumeCm3),
    fillPercent: normalizeOptionalNumber(record.fillPercent),
    totalWeightGrams: normalizeOptionalNumber(record.totalWeightGrams),
  }
}

function mapOrder(row: AdminOrderRow) {
  return {
    id: row.id,
    publicOrderNumber: row.publicOrderNumber,
    stripeSessionId: row.stripeSessionId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPostalCode: row.customerPostalCode,
    customerPrefecture: row.customerPrefecture,
    customerCity: row.customerCity,
    customerAddressLine1: row.customerAddressLine1,
    customerAddressLine2: row.customerAddressLine2,
    totalAmount: row.totalAmount,
    itemsSubtotal: row.itemsSubtotal,
    shippingAmount: row.shippingAmount,
    items: normalizeItems(row.items),
    shippingSnapshot: normalizeShippingSnapshot(row.shippingSnapshot),
    status: row.status,
    shippingCarrier: row.shippingCarrier,
    trackingNumber: row.trackingNumber,
    shippingNote: row.shippingNote,
    createdAt: normalizeDate(row.createdAt),
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
      orders: data.map(mapOrder),
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
    logger.error("Failed to fetch admin orders", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

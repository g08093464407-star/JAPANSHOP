import { NextRequest, NextResponse } from "next/server"
import { and, desc, inArray, isNull } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50
const POPULAR_ORDER_STATUSES = ["paid", "processing", "shipped", "delivered"]

type PopularProduct = {
  productKey: string
  slug: string | null
  id: string | null
  name: string
  image: string | null
  quantityTotal: number
  orderCount: number
  revenueTotal: number
  lastOrderedAt: string
}

type PopularProductAccumulator = Omit<
  PopularProduct,
  "orderCount" | "lastOrderedAt"
> & {
  orderIds: Set<string>
  lastOrderedAt: Date
}

function parseLimit(value: string | null) {
  if (!value) return DEFAULT_LIMIT

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT
  }

  return Math.min(parsed, MAX_LIMIT)
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value
  if (typeof value === "string") return new Date(value)
  return new Date(0)
}

function normalizePositiveQuantity(value: unknown) {
  const quantity = Number(value)

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 1
  }

  return quantity
}

function normalizePrice(value: unknown) {
  const price = Number(value)

  if (!Number.isFinite(price) || price < 0) {
    return 0
  }

  return price
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeOrderItems(value: unknown) {
  const parsed = parseJsonLike(value)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .filter((item): item is Record<string, unknown> => {
      return Boolean(item) && typeof item === "object" && !Array.isArray(item)
    })
    .map((item) => {
      const slug = normalizeOptionalText(item.slug)
      const id = normalizeOptionalText(item.id)
      const name = normalizeOptionalText(item.name)
      const image = normalizeOptionalText(item.image)
      const productKey = slug ?? id ?? name ?? ""

      return {
        productKey,
        slug,
        id,
        name: name ?? productKey,
        image,
        quantity: normalizePositiveQuantity(item.quantity),
        price: normalizePrice(item.price),
      }
    })
    .filter((item) => item.productKey.length > 0)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseLimit(searchParams.get("limit"))

    const orderRows = await db
      .select({
        id: orders.id,
        items: orders.items,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, POPULAR_ORDER_STATUSES),
          isNull(orders.archivedAt)
        )
      )
      .orderBy(desc(orders.createdAt))

    const productMap = new Map<string, PopularProductAccumulator>()

    for (const order of orderRows) {
      const orderedAt = normalizeDate(order.createdAt)
      const items = normalizeOrderItems(order.items)

      for (const item of items) {
        const current =
          productMap.get(item.productKey) ??
          {
            productKey: item.productKey,
            slug: item.slug,
            id: item.id,
            name: item.name,
            image: item.image,
            quantityTotal: 0,
            orderIds: new Set<string>(),
            revenueTotal: 0,
            lastOrderedAt: orderedAt,
          }

        current.quantityTotal += item.quantity
        current.orderIds.add(order.id)
        current.revenueTotal += item.quantity * item.price

        if (orderedAt > current.lastOrderedAt) {
          current.lastOrderedAt = orderedAt
        }

        if (!current.slug && item.slug) current.slug = item.slug
        if (!current.id && item.id) current.id = item.id
        if (!current.name && item.name) current.name = item.name
        if (!current.image && item.image) current.image = item.image

        productMap.set(item.productKey, current)
      }
    }

    const products = Array.from(productMap.values())
      .map((product): PopularProduct => ({
        productKey: product.productKey,
        slug: product.slug,
        id: product.id,
        name: product.name || product.slug || product.id || product.productKey,
        image: product.image,
        quantityTotal: product.quantityTotal,
        orderCount: product.orderIds.size,
        revenueTotal: product.revenueTotal,
        lastOrderedAt: product.lastOrderedAt.toISOString(),
      }))
      .sort((first, second) => {
        return (
          second.quantityTotal - first.quantityTotal ||
          second.orderCount - first.orderCount ||
          second.revenueTotal - first.revenueTotal ||
          new Date(second.lastOrderedAt).getTime() -
            new Date(first.lastOrderedAt).getTime()
        )
      })
      .slice(0, limit)

    return NextResponse.json({ products })
  } catch (error) {
    logger.error("Failed to fetch admin popular products", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch popular products" },
      { status: 500 }
    )
  }
}

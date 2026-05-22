import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { buildTrackingUrl } from "@/lib/order-tracking"
import type { OrderItem, OrderShippingSnapshot, PaidOrder } from "@/types/order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>

    return {
      id: typeof record.id === "string" ? record.id : "",
      slug: typeof record.slug === "string" ? record.slug : "",
      name: typeof record.name === "string" ? record.name : "",
      price:
        typeof record.price === "number"
          ? record.price
          : Number(record.price ?? 0),
      image: typeof record.image === "string" ? record.image : "",
      quantity:
        typeof record.quantity === "number"
          ? record.quantity
          : Number(record.quantity ?? 0),
      lengthCm: normalizeNullableNumber(record.lengthCm),
      widthCm: normalizeNullableNumber(record.widthCm),
      heightCm: normalizeNullableNumber(record.heightCm),
      volumeCm3: normalizeNullableNumber(record.volumeCm3),
      weightGrams: normalizeNullableNumber(record.weightGrams),
    }
  })
}

function normalizeShippingSnapshot(value: unknown): OrderShippingSnapshot | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const shippingSize = normalizeNullableNumber(record.shippingSize)

  return {
    carrier: typeof record.carrier === "string" ? record.carrier : "日本郵便",
    service: typeof record.service === "string" ? record.service : "ゆうパック",
    originPrefecture:
      typeof record.originPrefecture === "string" ? record.originPrefecture : "愛知県",
    destinationPrefecture:
      typeof record.destinationPrefecture === "string"
        ? record.destinationPrefecture
        : "",
    zone: typeof record.zone === "string" ? record.zone : "",
    shippingSize: shippingSize ?? 60,
    boxType: normalizeNullableNumber(record.boxType),
    boxLabel: typeof record.boxLabel === "string" ? record.boxLabel : "",
    boxInnerVolumeCm3: normalizeNullableNumber(record.boxInnerVolumeCm3),
    boxUsableVolumeCm3: normalizeNullableNumber(record.boxUsableVolumeCm3),
    totalVolumeCm3: normalizeNullableNumber(record.totalVolumeCm3),
    remainingVolumeCm3: normalizeNullableNumber(record.remainingVolumeCm3),
    fillPercent: normalizeNullableNumber(record.fillPercent),
    totalWeightGrams: normalizeNullableNumber(record.totalWeightGrams),
  }
}

function mapDbOrderToPaidOrder(order: typeof orders.$inferSelect): PaidOrder {
  return {
    id: order.publicOrderNumber ?? order.id,
    internalOrderId: order.id,
    stripeSessionId: order.stripeSessionId,
    stripePaymentIntentId: null,
    stripeReceiptUrl: null,
    currency: "jpy",
    total: order.totalAmount,
    itemsSubtotal: order.itemsSubtotal,
    shippingAmount: order.shippingAmount,
    shippingSnapshot: normalizeShippingSnapshot(order.shippingSnapshot),
    paymentStatus: "paid",
    customer: {
      fullName: order.customerName,
      email: order.customerEmail,
      postalCode: order.customerPostalCode,
      prefecture: order.customerPrefecture,
      city: order.customerCity,
      addressLine1: order.customerAddressLine1,
      addressLine2: order.customerAddressLine2 || "",
    },
    items: normalizeItems(order.items),
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : new Date(order.createdAt).toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id")?.trim()

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id." },
        { status: 400 }
      )
    }

    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, sessionId))
      .limit(1)

    const dbOrder = result[0]

    if (!dbOrder) {
      return NextResponse.json(
        { error: "Order not found yet." },
        { status: 404 }
      )
    }

    const order = mapDbOrderToPaidOrder(dbOrder)
    const trackingUrl = buildTrackingUrl(dbOrder.id, dbOrder.customerEmail)

    return NextResponse.json({ order, trackingUrl })
  } catch (error) {
    console.error("Order lookup by session_id failed:", error)

    return NextResponse.json(
      { error: "Failed to retrieve order." },
      { status: 500 }
    )
  }
}

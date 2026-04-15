import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { buildTrackingUrl } from "@/lib/order-tracking"
import type { OrderItem, PaidOrder } from "@/types/order"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    }
  })
}

function mapDbOrderToPaidOrder(order: typeof orders.$inferSelect): PaidOrder {
  return {
    id: order.id,
    stripeSessionId: order.stripeSessionId,
    stripePaymentIntentId: null,
    stripeReceiptUrl: null,
    currency: "jpy",
    total: order.totalAmount,
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
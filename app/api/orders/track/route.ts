import { NextRequest, NextResponse } from "next/server"
import { eq, desc } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import {
  buildTrackingUrlFromToken,
  createTrackingToken,
  normalizeTrackingLookupEmail,
  parseTrackingToken,
  verifyTrackingToken,
} from "@/lib/order-tracking"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type TrackableItem = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
}

type TrackableOrder = {
  id: string
  status: "paid" | "processing" | "shipped" | "delivered"
  createdAt: string
  totalAmount: number
  customer: {
    fullName: string
    maskedEmail: string
    postalCode: string
    prefecture: string
    city: string
    addressLine1: string
    addressLine2: string
  }
  items: TrackableItem[]
  shippingCarrier: string | null
  trackingNumber: string | null
  shippingNote: string | null
}

function maskEmail(email: string) {
  const normalized = email.trim()
  const [localPart = "", domain = ""] = normalized.split("@")

  if (!localPart || !domain) {
    return normalized
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`
  }

  return `${localPart.slice(0, 2)}***@${domain}`
}

function normalizeItems(value: unknown): TrackableItem[] {
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

function mapDbOrderToTrackableOrder(
  order: typeof orders.$inferSelect
): TrackableOrder {
  return {
    id: order.id,
    status: order.status as TrackableOrder["status"],
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : new Date(order.createdAt).toISOString(),
    totalAmount: order.totalAmount,
    customer: {
      fullName: order.customerName,
      maskedEmail: maskEmail(order.customerEmail),
      postalCode: order.customerPostalCode,
      prefecture: order.customerPrefecture,
      city: order.customerCity,
      addressLine1: order.customerAddressLine1,
      addressLine2: order.customerAddressLine2 || "",
    },
    items: normalizeItems(order.items),
    shippingCarrier: order.shippingCarrier,
    trackingNumber: order.trackingNumber,
    shippingNote: order.shippingNote,
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim()

    if (!token) {
      return NextResponse.json({ error: "Missing token." }, { status: 400 })
    }

    const parsed = parseTrackingToken(token)

    if (!parsed) {
      return NextResponse.json({ error: "Invalid token." }, { status: 400 })
    }

    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parsed.orderId))
      .limit(1)

    const dbOrder = result[0]

    if (!dbOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    if (!verifyTrackingToken(token, dbOrder.customerEmail)) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 })
    }

    const order = mapDbOrderToTrackableOrder(dbOrder)

    return NextResponse.json({
      order,
      trackingUrl: buildTrackingUrlFromToken(token),
    })
  } catch (error) {
    console.error("Tracking lookup failed:", error)

    return NextResponse.json(
      { error: "Failed to retrieve tracking data." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      orderId?: string
      email?: string
    }

    const orderId = body.orderId?.trim()
    const email = body.email?.trim()

    if (!orderId || !email) {
      return NextResponse.json(
        { error: "Order ID and email are required." },
        { status: 400 }
      )
    }

    let dbOrder: typeof orders.$inferSelect | undefined

    // --- 1. СПРОБА ЯК UUID ---
    if (orderId.includes("-") && orderId.length === 36) {
      const result = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)

      dbOrder = result[0]
    }

    // --- 2. FALLBACK: ПОШУК ПО EMAIL + ОСТАННІЙ ORDER ---
    if (!dbOrder) {
      const result = await db
        .select()
        .from(orders)
        .where(eq(orders.customerEmail, email))
        .orderBy(orders.createdAt)

      // беремо останній
      dbOrder = result[result.length - 1]
    }

    // --- ВАЛІДАЦІЯ ---
    if (
      !dbOrder ||
      normalizeTrackingLookupEmail(dbOrder.customerEmail) !==
        normalizeTrackingLookupEmail(email)
    ) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      )
    }

    const token = createTrackingToken(dbOrder.id, dbOrder.customerEmail)
    const trackingUrl = buildTrackingUrlFromToken(token)

    return NextResponse.json({
      token,
      trackingUrl,
    })
  } catch (error) {
    console.error("Tracking access creation failed:", error)

    return NextResponse.json(
      { error: "Failed to create tracking access." },
      { status: 500 }
    )
  }
}
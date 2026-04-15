import { NextRequest, NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { fortunes } from "@/lib/fortunes"
import { parseTrackingToken, verifyTrackingToken } from "@/lib/order-tracking"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ReceiptItem = {
  id: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
}

type ReceiptPayload = {
  order: {
    id: string
    status: "paid" | "processing" | "shipped" | "delivered"
    createdAt: string
    totalAmount: number
    customer: {
      fullName: string
      email: string
      postalCode: string
      prefecture: string
      city: string
      addressLine1: string
      addressLine2: string
    }
    items: ReceiptItem[]
    shippingCarrier: string | null
    trackingNumber: string | null
    shippingNote: string | null
  }
  fortune: string
}

function normalizeItems(value: unknown): ReceiptItem[] {
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

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parsed.orderId))
      .limit(1)

    const dbOrder = orderResult[0]

    if (!dbOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 })
    }

    if (!verifyTrackingToken(token, dbOrder.customerEmail)) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 })
    }

    const sameCustomerOrders = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerEmail, dbOrder.customerEmail))
      .orderBy(asc(orders.createdAt), asc(orders.id))

    const currentOrderIndex = Math.max(
      0,
      sameCustomerOrders.findIndex((row) => row.id === dbOrder.id)
    )

    const fortune = fortunes[currentOrderIndex % fortunes.length]

    const payload: ReceiptPayload = {
      order: {
        id: dbOrder.id,
        status: dbOrder.status as ReceiptPayload["order"]["status"],
        createdAt:
          dbOrder.createdAt instanceof Date
            ? dbOrder.createdAt.toISOString()
            : new Date(dbOrder.createdAt).toISOString(),
        totalAmount: dbOrder.totalAmount,
        customer: {
          fullName: dbOrder.customerName,
          email: dbOrder.customerEmail,
          postalCode: dbOrder.customerPostalCode,
          prefecture: dbOrder.customerPrefecture,
          city: dbOrder.customerCity,
          addressLine1: dbOrder.customerAddressLine1,
          addressLine2: dbOrder.customerAddressLine2 || "",
        },
        items: normalizeItems(dbOrder.items),
        shippingCarrier: dbOrder.shippingCarrier,
        trackingNumber: dbOrder.trackingNumber,
        shippingNote: dbOrder.shippingNote,
      },
      fortune,
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Receipt lookup failed:", error)

    return NextResponse.json(
      { error: "Failed to retrieve receipt data." },
      { status: 500 }
    )
  }
}
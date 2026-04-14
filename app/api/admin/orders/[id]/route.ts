import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const allowedStatuses = ["paid", "processing", "shipped", "delivered"] as const
type AllowedStatus = (typeof allowedStatuses)[number]

function isAllowedStatus(value: string): value is AllowedStatus {
  return allowedStatuses.includes(value as AllowedStatus)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as { status?: string }

    const status = body.status?.trim()

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 })
    }

    if (!status || !isAllowedStatus(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const updated = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning()

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ order: updated[0] })
  } catch (error) {
    console.error("Failed to update order status:", error)

    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    )
  }
}
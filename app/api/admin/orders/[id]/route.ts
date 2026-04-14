import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { sendOrderShippedEmail } from "@/lib/email"

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
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const existing = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    if (!existing[0]) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const prevStatus = existing[0].status

    const updated = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning()

    const updatedOrder = updated[0]

    if (!updatedOrder) {
      throw new Error("Failed to update order")
    }

    if (prevStatus !== status && status === "shipped") {
      try {
        await sendOrderShippedEmail({
          id: updatedOrder.id,
          customerEmail: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
        })

        console.log("📦 Shipped email sent", {
          orderId: updatedOrder.id,
          email: updatedOrder.customerEmail,
          status: updatedOrder.status,
        })
      } catch (emailError) {
        console.error("❌ Failed to send shipped status email:", emailError)
      }
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error("Failed to update order status:", error)

    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    )
  }
}
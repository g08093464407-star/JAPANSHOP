import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))

    return NextResponse.json({ orders: data })
  } catch (error) {
    console.error("Failed to fetch admin orders:", error)

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
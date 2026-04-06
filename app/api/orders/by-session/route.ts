import { NextRequest, NextResponse } from "next/server"

import { getOrderBySessionId } from "@/lib/blob-orders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id")?.trim()

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id." },
        { status: 400 }
      )
    }

    const order = await getOrderBySessionId(sessionId)

    if (!order) {
      return NextResponse.json(
        { error: "Order not found yet." },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Order lookup by session_id failed:", error)

    return NextResponse.json(
      { error: "Failed to retrieve order." },
      { status: 500 }
    )
  }
}
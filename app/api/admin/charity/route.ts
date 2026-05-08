import { NextResponse } from "next/server"

import { getCharityStats } from "@/lib/charity/get-charity-stats"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stats = await getCharityStats()

    return NextResponse.json({ stats })
  } catch (error) {
    logger.error("Failed to fetch admin charity stats", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch charity stats" },
      { status: 500 }
    )
  }
}

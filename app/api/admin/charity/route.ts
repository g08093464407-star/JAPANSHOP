import { NextRequest, NextResponse } from "next/server"

import {
  getCharityStats,
  normalizeCharityPeriod,
} from "@/lib/charity/get-charity-stats"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = normalizeCharityPeriod(searchParams.get("period"))
    const stats = await getCharityStats(period)

    return NextResponse.json({ stats, filters: { period } })
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

import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { productComments } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_COMMENT_LENGTH = 220

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown_ip"
  )
}

function getVoterHash(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "unknown_agent"
  const ip = getClientIp(request)

  return createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex")
}

function normalizeProductId(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : ""
}

function normalizeAuthorName(value: unknown) {
  const next = typeof value === "string" ? value.trim() : ""
  return next ? next.slice(0, 40) : "匿名"
}

function normalizeComment(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, MAX_COMMENT_LENGTH) : ""
}

function normalizeRating(value: unknown) {
  const rating = Number(value)

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null
  }

  return rating
}

function mapComment(row: typeof productComments.$inferSelect, voterHash?: string) {
  return {
    id: row.id,
    productId: row.productId,
    rating: row.rating,
    text: row.comment,
    name: row.authorName,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
    editable: voterHash ? row.voterHash === voterHash : false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId")?.trim()

    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId." },
        { status: 400 }
      )
    }

    const voterHash = getVoterHash(request)

    const rows = await db
      .select()
      .from(productComments)
      .where(eq(productComments.productId, productId))
      .orderBy(desc(productComments.createdAt))
      .limit(100)

    return NextResponse.json({
      comments: rows.map((row) => mapComment(row, voterHash)),
    })
  } catch (error) {
    logger.error("Failed to fetch product comments", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to fetch comments." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>

    const productId = normalizeProductId(body.productId)
    const rating = normalizeRating(body.rating)
    const comment = normalizeComment(body.comment)
    const authorName = normalizeAuthorName(body.authorName)
    const voterHash = getVoterHash(request)

    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId." },
        { status: 400 }
      )
    }

    if (!rating) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5." },
        { status: 400 }
      )
    }

    if (!comment) {
      return NextResponse.json(
        { error: "Comment is required." },
        { status: 400 }
      )
    }

    const existing = await db
      .select()
      .from(productComments)
      .where(
        and(
          eq(productComments.productId, productId),
          eq(productComments.voterHash, voterHash)
        )
      )
      .limit(1)

    const existingComment = existing[0]

    if (existingComment) {
      const updated = await db
        .update(productComments)
        .set({
          rating,
          comment,
          authorName,
          updatedAt: new Date(),
        })
        .where(eq(productComments.id, existingComment.id))
        .returning()

      return NextResponse.json({ comment: mapComment(updated[0], voterHash) })
    }

    const inserted = await db
      .insert(productComments)
      .values({
        productId,
        rating,
        comment,
        authorName,
        voterHash,
      })
      .returning()

    return NextResponse.json({ comment: mapComment(inserted[0], voterHash) })
  } catch (error) {
    logger.error("Failed to save product comment", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to save comment." },
      { status: 500 }
    )
  }
}

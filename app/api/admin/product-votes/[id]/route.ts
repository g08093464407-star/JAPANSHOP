import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { productVotes } from "@/lib/db/schema"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateVoteBody = {
  rating?: unknown
}

function normalizeRating(value: unknown) {
  const rating = Number(value)

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null
  }

  return rating
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return new Date(value).toISOString()
  return new Date().toISOString()
}

function mapVote(row: typeof productVotes.$inferSelect) {
  return {
    id: row.id,
    productId: row.productId,
    rating: row.rating,
    voterHash: row.voterHash,
    createdAt: normalizeDate(row.createdAt),
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as UpdateVoteBody
    const rating = normalizeRating(body.rating)

    if (!id) {
      return NextResponse.json({ error: "Missing vote id" }, { status: 400 })
    }

    if (!rating) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    const updated = await db
      .update(productVotes)
      .set({
        rating,
        createdAt: new Date(),
      })
      .where(eq(productVotes.id, id))
      .returning()

    const updatedVote = updated[0]

    if (!updatedVote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 })
    }

    return NextResponse.json({ vote: mapVote(updatedVote) })
  } catch (error) {
    logger.error("Failed to update product vote", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to update product vote" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: "Missing vote id" }, { status: 400 })
    }

    const deleted = await db
      .delete(productVotes)
      .where(eq(productVotes.id, id))
      .returning()

    if (!deleted[0]) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error("Failed to delete product vote", {
      error: error instanceof Error ? error.message : "unknown_error",
    })

    return NextResponse.json(
      { error: "Failed to delete product vote" },
      { status: 500 }
    )
  }
}

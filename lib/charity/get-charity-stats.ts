import { desc, eq, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { donationContributions } from "@/lib/db/schema"

export type CharityMonthlyPoint = {
  month: string
  amount: number
  orders: number
}

export type CharityRecentContribution = {
  id: string
  publicOrderNumber: string
  amount: number
  orderTotal: number
  currency: string
  createdAt: string
}

export type CharityStats = {
  confirmedTotal: number
  confirmedOrders: number
  averageDonation: number
  firstTarget: number
  progress: number
  donationRate: number
  monthly: CharityMonthlyPoint[]
  recentContributions: CharityRecentContribution[]
}

const FIRST_TARGET = 50000
const DONATION_RATE = 5

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizeDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === "string") {
    return new Date(value).toISOString()
  }

  return new Date().toISOString()
}

export async function getCharityStats(): Promise<CharityStats> {
  const [summary] = await db
    .select({
      confirmedTotal: sql<number>`coalesce(sum(${donationContributions.amount}), 0)::int`,
      confirmedOrders: sql<number>`count(*)::int`,
    })
    .from(donationContributions)
    .where(eq(donationContributions.status, "confirmed"))

  const confirmedTotal = toNumber(summary?.confirmedTotal)
  const confirmedOrders = toNumber(summary?.confirmedOrders)
  const averageDonation =
    confirmedOrders > 0 ? Math.round(confirmedTotal / confirmedOrders) : 0

  const monthlyRows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${donationContributions.createdAt}), 'YYYY-MM')`,
      amount: sql<number>`coalesce(sum(${donationContributions.amount}), 0)::int`,
      orders: sql<number>`count(*)::int`,
    })
    .from(donationContributions)
    .where(eq(donationContributions.status, "confirmed"))
    .groupBy(sql`date_trunc('month', ${donationContributions.createdAt})`)
    .orderBy(sql`date_trunc('month', ${donationContributions.createdAt})`)

  const recentRows = await db
    .select({
      id: donationContributions.id,
      publicOrderNumber: donationContributions.publicOrderNumber,
      amount: donationContributions.amount,
      orderTotal: donationContributions.orderTotal,
      currency: donationContributions.currency,
      createdAt: donationContributions.createdAt,
    })
    .from(donationContributions)
    .where(eq(donationContributions.status, "confirmed"))
    .orderBy(desc(donationContributions.createdAt))
    .limit(5)

  return {
    confirmedTotal,
    confirmedOrders,
    averageDonation,
    firstTarget: FIRST_TARGET,
    progress: Math.min(100, Math.round((confirmedTotal / FIRST_TARGET) * 100)),
    donationRate: DONATION_RATE,
    monthly: monthlyRows.map((row) => ({
      month: row.month,
      amount: toNumber(row.amount),
      orders: toNumber(row.orders),
    })),
    recentContributions: recentRows.map((row) => ({
      id: row.id,
      publicOrderNumber: row.publicOrderNumber,
      amount: row.amount,
      orderTotal: row.orderTotal,
      currency: row.currency,
      createdAt: normalizeDate(row.createdAt),
    })),
  }
}

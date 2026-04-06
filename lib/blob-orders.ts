import { get, put } from "@vercel/blob"
import type { PaidOrder } from "../types/order"

async function readPrivateJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: "private" })

  if (!result || result.statusCode !== 200) {
    return null
  }

  const text = await new Response(result.stream).text()
  return JSON.parse(text) as T
}

export async function savePaidOrder(order: PaidOrder) {
  const orderPath = `orders/${order.id}.json`
  const sessionIndexPath = `orders/by-session/${order.stripeSessionId}.json`

  await put(orderPath, JSON.stringify(order, null, 2), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
  })

  await put(
    sessionIndexPath,
    JSON.stringify({ orderId: order.id }, null, 2),
    {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json; charset=utf-8",
    }
  )

  return orderPath
}

export async function getOrderBySessionId(sessionId: string) {
  try {
    const indexPath = `orders/by-session/${sessionId}.json`

    const indexData = await readPrivateJson<{ orderId: string }>(indexPath)

    if (!indexData) {
      return null
    }

    const order = await readPrivateJson<PaidOrder>(`orders/${indexData.orderId}.json`)

    return order
  } catch (error) {
    console.error("Failed to get order by sessionId:", error)
    return null
  }
}
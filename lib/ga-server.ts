type PurchaseItem = {
  id: string
  name: string
  price: number
  quantity: number
}

function hashToNumber(value: string) {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

function normalizeClientId(clientId: string, fallbackSeed: string) {
  if (/^\d+\.\d+$/.test(clientId)) {
    return clientId
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const hash = hashToNumber(fallbackSeed || clientId || "sonyachna")

  return `${timestamp}.${hash}`
}

export async function sendPurchaseToGA({
  clientId,
  orderId,
  value,
  currency,
  items,
}: {
  clientId: string
  orderId: string
  value: number
  currency: string
  items: PurchaseItem[]
}) {
  const measurementId =
    process.env.GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  const apiSecret = process.env.GA_API_SECRET

  if (!measurementId || !apiSecret) {
    console.error("GA purchase not sent: missing GA env", {
      hasMeasurementId: Boolean(measurementId),
      hasApiSecret: Boolean(apiSecret),
    })
    return
  }

  const normalizedClientId = normalizeClientId(clientId, orderId)
  const sessionId = String(hashToNumber(orderId))

  const payload = {
    client_id: normalizedClientId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: orderId,
          value: value / 100,
          currency: currency.toUpperCase(),
          session_id: sessionId,
          engagement_time_msec: 100,
          debug_mode: true,
          items: items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price / 100,
            quantity: item.quantity,
          })),
        },
      },
    ],
  }

  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    const body = await response.text()

    console.error("GA purchase failed", {
      status: response.status,
      statusText: response.statusText,
      body,
    })

    return
  }

  console.info("GA purchase sent", {
    orderId,
    clientId: normalizedClientId,
    value: value / 100,
    currency: currency.toUpperCase(),
    itemsCount: items.length,
  })
}
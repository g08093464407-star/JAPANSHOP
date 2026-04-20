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
  items: { id: string; name: string; price: number; quantity: number }[]
}) {
  const measurementId = process.env.GA_MEASUREMENT_ID
  const apiSecret = process.env.GA_API_SECRET

  if (!measurementId || !apiSecret) {
    console.error("GA env missing")
    return
  }

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: "purchase",
            params: {
              transaction_id: orderId,
              value: value / 100,
              currency,
              items: items.map((i) => ({
                item_id: i.id,
                item_name: i.name,
                price: i.price / 100,
                quantity: i.quantity,
              })),
            },
          },
        ],
      }),
    }
  )
}
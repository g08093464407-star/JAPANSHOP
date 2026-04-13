import { Resend } from "resend"
import type { PaidOrder } from "../types/order"

const resend = new Resend(process.env.RESEND_API_KEY)

function formatYen(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount)
}

function buildItemsHtml(order: PaidOrder) {
  return order.items
    .map((item) => {
      const lineTotal = item.price * item.quantity

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">${formatYen(item.price)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">${formatYen(lineTotal)}</td>
        </tr>
      `
    })
    .join("")
}

export async function sendOrderConfirmationEmail(order: PaidOrder) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY")
  }

  if (!order.customer.email) {
    throw new Error("Missing customer email")
  }

  const { data, error } = await resend.emails.send({
    from: "JAPANSHOP <onboarding@resend.dev>",
    to: [order.customer.email],
    subject: `ご注文ありがとうございます｜注文番号 ${order.id}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;">
        <h1 style="margin-bottom:16px;">ご注文ありがとうございます。</h1>

        <p style="margin:0 0 8px;">注文番号: <strong>${order.id}</strong></p>
        <p style="margin:0 0 8px;">ご注文合計: <strong>${formatYen(order.total)}</strong></p>
        <p style="margin:0 0 24px;">お支払い状況: <strong>${order.paymentStatus}</strong></p>

        <h2 style="margin:24px 0 12px;">ご注文内容</h2>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              <th style="padding:8px;border-bottom:2px solid #ccc;text-align:left;">商品</th>
              <th style="padding:8px;border-bottom:2px solid #ccc;text-align:center;">数量</th>
              <th style="padding:8px;border-bottom:2px solid #ccc;text-align:right;">単価</th>
              <th style="padding:8px;border-bottom:2px solid #ccc;text-align:right;">小計</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemsHtml(order)}
          </tbody>
        </table>

        <h2 style="margin:24px 0 12px;">お届け先</h2>
        <p style="margin:0;">${order.customer.fullName}</p>
        <p style="margin:0;">〒${order.customer.postalCode}</p>
        <p style="margin:0;">${order.customer.prefecture}${order.customer.city}</p>
        <p style="margin:0;">${order.customer.addressLine1}</p>
        <p style="margin:0 0 24px;">${order.customer.addressLine2 ?? ""}</p>

        <p style="margin-top:24px;">このメールはご注文確認の自動送信メールです。</p>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
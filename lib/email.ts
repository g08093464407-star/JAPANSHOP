import { Resend } from "resend"
import { buildTrackingUrl } from "@/lib/order-tracking"
import type { PaidOrder } from "../types/order"

function getResend() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY")
  }

  return new Resend(apiKey)
}

function formatYen(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getSiteUrl() {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"

  return value.replace(/\/+$/, "")
}

function toAbsoluteImageUrl(url: string) {
  if (!url) {
    return ""
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  return `${getSiteUrl()}${url.startsWith("/") ? "" : "/"}${url}`
}

function buildItemsRows(order: PaidOrder) {
  return order.items
    .map((item) => {
      const lineTotal = item.price * item.quantity
      const absoluteImageUrl = toAbsoluteImageUrl(item.image)

      const imageHtml = absoluteImageUrl
        ? `
          <img
            src="${escapeHtml(absoluteImageUrl)}"
            alt="${escapeHtml(item.name)}"
            width="72"
            height="72"
            style="display:block;width:72px;height:72px;object-fit:cover;border-radius:12px;border:1px solid #e5e5e5;background:#fafafa;"
          />
        `
        : `
          <div
            style="
              width:72px;
              height:72px;
              border-radius:12px;
              border:1px solid #e5e5e5;
              background:#fafafa;
              color:#999999;
              font-size:11px;
              line-height:72px;
              text-align:center;
            "
          >
            No image
          </div>
        `

      return `
        <tr>
          <td style="padding:16px 12px;border-bottom:1px solid #ece7df;vertical-align:top;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;padding-right:12px;">
                  ${imageHtml}
                </td>
                <td style="vertical-align:top;">
                  <div style="font-size:14px;font-weight:600;color:#1f1f1f;line-height:1.5;">
                    ${escapeHtml(item.name)}
                  </div>
                  ${
                    item.slug
                      ? `<div style="margin-top:4px;font-size:12px;color:#7a7a7a;">${escapeHtml(item.slug)}</div>`
                      : ""
                  }
                </td>
              </tr>
            </table>
          </td>
          <td style="padding:16px 12px;border-bottom:1px solid #ece7df;vertical-align:top;text-align:center;font-size:14px;color:#1f1f1f;">
            ${item.quantity}
          </td>
          <td style="padding:16px 12px;border-bottom:1px solid #ece7df;vertical-align:top;text-align:right;font-size:14px;color:#1f1f1f;">
            ${formatYen(item.price)}
          </td>
          <td style="padding:16px 12px;border-bottom:1px solid #ece7df;vertical-align:top;text-align:right;font-size:14px;font-weight:600;color:#1f1f1f;">
            ${formatYen(lineTotal)}
          </td>
        </tr>
      `
    })
    .join("")
}

function buildActionButton(iconUrl: string, label: string, url: string | null) {
  if (!url) return ""

  return `
    <td style="padding:0 4px; width:33.33%;">
      <a href="${escapeHtml(url)}"
         style="
           display:block;
           width:100%;
           max-width:150px;
           margin:0 auto;
           text-decoration:none;
         ">
        <div style="
          border:1px solid #e6dfd5;
          border-radius:16px;
          background:#ffffff;
          background:linear-gradient(180deg,#ffffff 0%,#fbf9f6 100%);
          padding:18px 10px;
          text-align:center;
          box-shadow:
            0 4px 12px rgba(0,0,0,0.06),
            0 1px 2px rgba(0,0,0,0.04),
            inset 0 1px 0 rgba(255,255,255,0.8);
        ">
          <div style="margin-bottom:8px; line-height:1;">
            <img 
              src="${escapeHtml(iconUrl)}"
              width="26"
              height="26"
              border="0"
              style="display:block;margin:0 auto;width:26px;height:26px;"
              alt=""
            />
          </div>
          <div style="
            font-size:13px;
            font-weight:600;
            color:#2a2a2a;
            letter-spacing:0.02em;
            white-space:nowrap;
          ">
            ${label}
          </div>
        </div>
      </a>
    </td>
  `
}

function buildActionButtonsRow(
  order: PaidOrder,
  trackingUrl: string | null
) {
  const stripeUrl = order.stripeReceiptUrl || ""
  const baseUrl = getSiteUrl()

  const pdfUrl = (() => {
    if (!order.internalOrderId || !order.customer.email) return ""
    const tracking = buildTrackingUrl(order.internalOrderId, order.customer.email)
    try {
      const url = new URL(tracking)
      const token = url.searchParams.get("token")
      if (!token) return ""
      return `${baseUrl}/orders/receipt?token=${encodeURIComponent(token)}&download=1`
    } catch {
      return ""
    }
  })()

  return `
    <div style="margin-top:28px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;width:100%;max-width:480px;border-collapse:separate;border-spacing:0;">
        <tr>
          ${buildActionButton(`${baseUrl}/email/icon-track.png`, "配送を確認", trackingUrl)}
          ${buildActionButton(`${baseUrl}/email/icon-pdf.png`, "PDF保存", pdfUrl)}
          ${buildActionButton(`${baseUrl}/email/icon-receipt.png`, "領収書", stripeUrl)}
        </tr>
      </table>

      <div style="font-size:12px;color:#9a8f83;margin-top:16px;">
        注文内容の確認・ダウンロード・配送追跡が可能です
      </div>
    </div>
  `
}

export async function sendOrderConfirmationEmail(order: PaidOrder) {
  const resend = getResend()

  if (!order.customer.email) {
    throw new Error("Missing customer email")
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const trackingUrl = order.internalOrderId
    ? buildTrackingUrl(order.internalOrderId, order.customer.email)
    : null

  const { data, error } = await resend.emails.send({
    from: "Sonyachna <noreply@tokyotelservice.com>",
    to: [order.customer.email],
    subject: `【Sonyachna】ご注文を承りました｜注文番号 ${order.id}`,
    html: `
      <div style="margin:0;padding:0;background:#f6f3ee;">
        <div style="max-width:760px;margin:0 auto;padding:32px 16px;">
          <div
            style="
              background:#ffffff;
              border:1px solid #ece7df;
              border-radius:28px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(0,0,0,0.04);
            "
          >
            <div
              style="
                background:linear-gradient(135deg, #fff7e8 0%, #fffdf8 55%, #f7f2ea 100%);
                padding:32px 32px 24px;
                border-bottom:1px solid #ece7df;
              "
            >
              <div style="font-size:12px;letter-spacing:0.18em;color:#9a8666;margin-bottom:12px;">
                SONYACHNA
              </div>

              <h1 style="margin:0 0 4px;font-size:30px;line-height:1.25;color:#1f1f1f;">
                ご注文を承りました。
              </h1>
              <div style="font-size:13px;color:#8a7f72;margin-bottom:12px;">
                大切にお届けいたします
              </div>

              <p style="margin:0;font-size:15px;line-height:1.8;color:#5a5248;">
                お支払いを確認いたしました。<br />
                商品の発送準備が整い次第、あらためてご案内いたします。
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;border-collapse:separate;">
                <tr>
                  <td style="padding-right:10px;">
                    <span
                      style="
                        display:inline-block;
                        background:#effaf0;
                        color:#1d6b31;
                        border:1px solid #cfe9d5;
                        padding:8px 12px;
                        border-radius:999px;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      決済完了
                    </span>
                  </td>
                  <td>
                    <span
                      style="
                        display:inline-block;
                        background:#faf7f2;
                        color:#5a5248;
                        border:1px solid #e7ddd0;
                        padding:8px 12px;
                        border-radius:999px;
                        font-size:13px;
                        font-weight:600;
                      "
                    >
                      注文番号 ${escapeHtml(order.id)}
                    </span>
                  </td>
                </tr>
              </table>

              ${buildActionButtonsRow(order, trackingUrl)}
            </div>

            <div style="padding:28px 32px;">
              <h2 style="margin:0 0 14px;font-size:22px;color:#1f1f1f;">
                ご注文内容
              </h2>

              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                border="0"
                width="100%"
                style="
                  border-collapse:separate;
                  border-spacing:0;
                  border:1px solid #ece7df;
                  border-radius:20px;
                  overflow:hidden;
                  background:#ffffff;
                  margin-bottom:28px;
                "
              >
                <thead>
                  <tr style="background:#faf7f2;">
                    <th style="padding:14px 12px;text-align:left;font-size:13px;color:#6d6256;border-bottom:1px solid #ece7df;">
                      商品
                    </th>
                    <th style="padding:14px 12px;text-align:center;font-size:13px;color:#6d6256;border-bottom:1px solid #ece7df;">
                      数量
                    </th>
                    <th style="padding:14px 12px;text-align:right;font-size:13px;color:#6d6256;border-bottom:1px solid #ece7df;">
                      単価
                    </th>
                    <th style="padding:14px 12px;text-align:right;font-size:13px;color:#6d6256;border-bottom:1px solid #ece7df;">
                      小計
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${buildItemsRows(order)}
                </tbody>
              </table>

              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                border="0"
                width="100%"
                style="border-collapse:collapse;margin-bottom:28px;"
              >
                <tr>
                  <td
                    style="
                      width:33.33%;
                      padding:16px;
                      border:1px solid #ece7df;
                      border-radius:18px;
                      background:#fcfbf8;
                      vertical-align:top;
                    "
                  >
                    <div style="font-size:12px;letter-spacing:0.08em;color:#8f8373;margin-bottom:8px;">
                      ご注文合計
                    </div>
                    <div style="font-size:22px;font-weight:700;color:#1f1f1f;">
                      ${formatYen(order.total)}
                    </div>
                  </td>

                  <td style="width:12px;"></td>

                  <td
                    style="
                      width:33.33%;
                      padding:16px;
                      border:1px solid #ece7df;
                      border-radius:18px;
                      background:#fcfbf8;
                      vertical-align:top;
                    "
                  >
                    <div style="font-size:12px;letter-spacing:0.08em;color:#8f8373;margin-bottom:8px;">
                      商品点数
                    </div>
                    <div style="font-size:22px;font-weight:700;color:#1f1f1f;">
                      ${itemCount}点
                    </div>
                  </td>

                  <td style="width:12px;"></td>

                  <td
                    style="
                      width:33.33%;
                      padding:16px;
                      border:1px solid #ece7df;
                      border-radius:18px;
                      background:#fcfbf8;
                      vertical-align:top;
                    "
                  >
                    <div style="font-size:12px;letter-spacing:0.08em;color:#8f8373;margin-bottom:8px;">
                      お支払い状況
                    </div>
                    <div style="font-size:22px;font-weight:700;color:#1f1f1f;">
                      決済完了
                    </div>
                  </td>
                </tr>
              </table>

              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                border="0"
                width="100%"
                style="border-collapse:collapse;"
              >
                <tr>
                  <td
                    style="
                      width:100%;
                      padding:22px;
                      border:1px solid #ece7df;
                      border-radius:20px;
                      background:#fcfbf8;
                      vertical-align:top;
                    "
                  >
                    <h2 style="margin:0 0 14px;font-size:22px;color:#1f1f1f;">
                      お届け先
                    </h2>

                    <div style="font-size:15px;line-height:1.9;color:#3e372f;">
                      <div><strong>${escapeHtml(order.customer.fullName)}</strong></div>
                      <div>〒${escapeHtml(order.customer.postalCode)}</div>
                      <div>${escapeHtml(order.customer.prefecture)}${escapeHtml(order.customer.city)}</div>
                      <div>${escapeHtml(order.customer.addressLine1)}</div>
                      ${
                        order.customer.addressLine2
                          ? `<div>${escapeHtml(order.customer.addressLine2)}</div>`
                          : ""
                      }
                    </div>
                  </td>
                </tr>
              </table>

              <div style="height:28px;"></div>

              <div
                style="
                  border-top:1px solid #ece7df;
                  padding-top:20px;
                  font-size:13px;
                  line-height:1.9;
                  color:#7b7167;
                "
              >
                このメールはご注文確認の自動送信メールです。<br />
                内容にお心当たりがない場合は、そのまま破棄してください。
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
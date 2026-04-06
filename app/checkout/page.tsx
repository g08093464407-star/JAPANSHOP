"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { useCart } from "@/hooks/use-cart"

type CustomerForm = {
  fullName: string
  email: string
  postalCode: string
  prefecture: string
  city: string
  addressLine1: string
  addressLine2: string
}

type FormErrors = Partial<Record<keyof CustomerForm, string>>

const initialCustomer: CustomerForm = {
  fullName: "",
  email: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine1: "",
  addressLine2: "",
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizePostalCode(value: string) {
  return value.replace(/[^\d-]/g, "").slice(0, 8)
}

export default function CheckoutPage() {
  const { items, cartTotal } = useCart()

  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const handleChange = (field: keyof CustomerForm, value: string) => {
    let nextValue = value

    if (field === "email") {
      nextValue = value.trim()
    }

    if (field === "postalCode") {
      nextValue = normalizePostalCode(value)
    }

    setCustomer((prev) => ({
      ...prev,
      [field]: nextValue,
    }))

    setErrors((prev) => {
      if (!prev[field]) return prev
      return { ...prev, [field]: undefined }
    })

    if (submitError) {
      setSubmitError("")
    }
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (!customer.fullName.trim()) {
      nextErrors.fullName = "お名前を入力してください。"
    }

    if (!customer.email.trim()) {
      nextErrors.email = "メールアドレスを入力してください。"
    } else if (!isValidEmail(customer.email.trim())) {
      nextErrors.email = "有効なメールアドレスを入力してください。"
    }

    if (!customer.postalCode.trim()) {
      nextErrors.postalCode = "郵便番号を入力してください。"
    }

    if (!customer.prefecture.trim()) {
      nextErrors.prefecture = "都道府県を入力してください。"
    }

    if (!customer.city.trim()) {
      nextErrors.city = "市区町村を入力してください。"
    }

    if (!customer.addressLine1.trim()) {
      nextErrors.addressLine1 = "住所を入力してください。"
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      setSubmitError("カートが空です。商品を追加してからお進みください。")
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          customer: {
            ...customer,
            fullName: customer.fullName.trim(),
            email: customer.email.trim(),
            postalCode: customer.postalCode.trim(),
            prefecture: customer.prefecture.trim(),
            city: customer.city.trim(),
            addressLine1: customer.addressLine1.trim(),
            addressLine2: customer.addressLine2.trim(),
          },
        }),
      })

      const data = (await response.json()) as { url?: string; error?: string }

      if (!response.ok) {
        setSubmitError(data.error ?? "決済ページの作成に失敗しました。")
        setIsSubmitting(false)
        return
      }

      if (!data.url) {
        setSubmitError("Stripe の決済URLを取得できませんでした。")
        setIsSubmitting(false)
        return
      }

      window.location.href = data.url
    } catch (error) {
      console.error("Checkout request failed:", error)
      setSubmitError("通信エラーが発生しました。時間をおいて再度お試しください。")
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-10 shadow-sm">
          <p className="text-sm tracking-[0.2em] text-neutral-500">CHECKOUT</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">
            カートが空です
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
            ご購入手続きに進むには、まず商品をカートに追加してください。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition hover:opacity-90"
            >
              商品一覧へ戻る
            </Link>

            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 px-6 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              ホームへ戻る
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-sm text-neutral-500">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/cart" className="hover:underline">
            Cart
          </Link>{" "}
          / Checkout
        </p>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm tracking-[0.2em] text-neutral-500">CHECKOUT</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              ご購入手続き
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              配送先情報をご入力のうえ、Stripeの安全な決済ページへお進みください。
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] text-neutral-500">ORDER SUMMARY</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              {itemCount}点 / ¥{cartTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">配送先情報</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                ご注文内容の確認およびお届けのために必要な情報です。
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  お名前
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={customer.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="山田 花子"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
                {errors.fullName ? (
                  <p className="mt-2 text-xs text-red-600">{errors.fullName}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={customer.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="example@email.com"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
                {errors.email ? (
                  <p className="mt-2 text-xs text-red-600">{errors.email}</p>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500">
                    注文確認メールとレシート案内をこのアドレスへ送信します。
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="postalCode"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  郵便番号
                </label>
                <input
                  id="postalCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={customer.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="470-0353"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
                {errors.postalCode ? (
                  <p className="mt-2 text-xs text-red-600">{errors.postalCode}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="prefecture"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  都道府県
                </label>
                <input
                  id="prefecture"
                  type="text"
                  autoComplete="address-level1"
                  value={customer.prefecture}
                  onChange={(e) => handleChange("prefecture", e.target.value)}
                  placeholder="愛知県"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
                {errors.prefecture ? (
                  <p className="mt-2 text-xs text-red-600">{errors.prefecture}</p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  市区町村
                </label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  value={customer.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="豊田市"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
                {errors.city ? (
                  <p className="mt-2 text-xs text-red-600">{errors.city}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="addressLine1"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  住所
                </label>
                <input
                  id="addressLine1"
                  type="text"
                  autoComplete="address-line1"
                  value={customer.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  placeholder="〇〇町 1-2-3"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
                {errors.addressLine1 ? (
                  <p className="mt-2 text-xs text-red-600">{errors.addressLine1}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="addressLine2"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  建物名・部屋番号 <span className="text-neutral-400">（任意）</span>
                </label>
                <input
                  id="addressLine2"
                  type="text"
                  autoComplete="address-line2"
                  value={customer.addressLine2}
                  onChange={(e) => handleChange("addressLine2", e.target.value)}
                  placeholder="サンプルマンション 301"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-neutral-900">安心してご注文いただくために</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-medium text-neutral-900">安全な決済</p>
                <p className="mt-2 text-xs leading-6 text-neutral-600">
                  お支払いはStripeの決済ページで安全に処理されます。
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-medium text-neutral-900">注文情報の保存</p>
                <p className="mt-2 text-xs leading-6 text-neutral-600">
                  決済完了後、注文情報はサーバー側で記録されます。
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm font-medium text-neutral-900">確認しやすい設計</p>
                <p className="mt-2 text-xs leading-6 text-neutral-600">
                  入力内容と注文内容を同じ画面で確認できます。
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-neutral-500">ORDER DETAILS</p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-900">ご注文内容</h2>
            </div>

            <Link
              href="/cart"
              className="text-sm font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline"
            >
              カートを見る
            </Link>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-neutral-900">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    数量: {item.quantity}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-neutral-900">
                    ¥{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5 text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>商品数</span>
              <span>{itemCount}点</span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span>送料</span>
              <span>決済画面で確認</span>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
              <span>小計</span>
              <span>¥{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          {submitError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "決済ページへ接続中..." : "Stripeで安全に支払う"}
          </button>

          <p className="mt-4 text-xs leading-6 text-neutral-500">
            ご入力内容をもとに、次の画面でStripeの決済ページへ移動します。
          </p>
        </aside>
      </div>
    </main>
  )
}
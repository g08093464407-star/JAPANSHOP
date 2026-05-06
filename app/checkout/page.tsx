'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useCart } from '@/hooks/use-cart'
import { trackBeginCheckout } from '@/lib/analytics'

type CustomerForm = {
  fullName: string
  email: string
  phone: string
  postalCode: string
  prefecture: string
  city: string
  addressLine1: string
  addressLine2: string
}

type FormErrors = Partial<Record<keyof CustomerForm, string>>

type PostalLookupStatus = 'idle' | 'loading' | 'success' | 'not_found' | 'error'

type ZipCloudResponse = {
  status: number
  message: string | null
  results:
    | {
        zipcode: string
        prefcode: string
        address1: string
        address2: string
        address3: string
        kana1: string
        kana2: string
        kana3: string
      }[]
    | null
}

const initialCustomer: CustomerForm = {
  fullName: '',
  email: '',
  phone: '',
  postalCode: '',
  prefecture: '',
  city: '',
  addressLine1: '',
  addressLine2: '',
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizePostalCode(value: string) {
  return value.replace(/[^\d-]/g, '').slice(0, 8)
}

function getPostalCodeDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 7)
}

function formatPostalCode(value: string) {
  const digits = getPostalCodeDigits(value)

  if (digits.length <= 3) {
    return digits
  }

  return `${digits.slice(0, 3)}-${digits.slice(3)}`
}

export default function CheckoutPage() {
  const { items, cartTotal } = useCart()

  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postalLookupStatus, setPostalLookupStatus] =
    useState<PostalLookupStatus>('idle')
  const [postalLookupMessage, setPostalLookupMessage] = useState('')

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  useEffect(() => {
    if (items.length === 0) return

    const checkoutSignature = items
      .map((item) => `${item.id}:${item.quantity}`)
      .sort()
      .join('|')
    const trackingKey = `sonyachna_begin_checkout_${checkoutSignature}_${cartTotal}`

    try {
      if (window.sessionStorage.getItem(trackingKey)) return
      window.sessionStorage.setItem(trackingKey, '1')
    } catch {
      // sessionStorage may be unavailable; analytics should not block checkout
    }

    trackBeginCheckout({
      total: cartTotal,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  }, [cartTotal, items])

  useEffect(() => {
    const digits = getPostalCodeDigits(customer.postalCode)

    if (digits.length === 0) {
      setPostalLookupStatus('idle')
      setPostalLookupMessage('')
      return
    }

    if (digits.length < 7) {
      setPostalLookupStatus('idle')
      setPostalLookupMessage('')
      return
    }

    const controller = new AbortController()

    async function lookupAddress() {
      setPostalLookupStatus('loading')
      setPostalLookupMessage('住所を検索しています...')

      try {
        const response = await fetch(
          `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(
            digits
          )}`,
          {
            method: 'GET',
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          setPostalLookupStatus('error')
          setPostalLookupMessage(
            '住所を自動取得できませんでした。手入力してください。'
          )
          return
        }

        const data = (await response.json()) as ZipCloudResponse
        const result = data.results?.[0]

        if (!result) {
          setPostalLookupStatus('not_found')
          setPostalLookupMessage(
            '該当する住所が見つかりませんでした。手入力してください。'
          )
          return
        }

        setCustomer((prev) => ({
          ...prev,
          prefecture: result.address1,
          city: result.address2,
          addressLine1: result.address3,
        }))

        setErrors((prev) => ({
          ...prev,
          prefecture: undefined,
          city: undefined,
          addressLine1: undefined,
        }))

        setPostalLookupStatus('success')
        setPostalLookupMessage('住所を自動入力しました。')
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Postal code lookup failed:', error)
        setPostalLookupStatus('error')
        setPostalLookupMessage(
          '住所を自動取得できませんでした。手入力してください。'
        )
      }
    }

    void lookupAddress()

    return () => {
      controller.abort()
    }
  }, [customer.postalCode])

  const handleChange = (field: keyof CustomerForm, value: string) => {
    let nextValue = value

    if (field === 'phone') {
  const digits = value.replace(/\D/g, '').slice(0, 11)

    if (digits.length <= 3) {
    nextValue = digits
    }  else if (digits.length <= 7) {
      nextValue = `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else {
      nextValue = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    }
    }

    if (field === 'email') {
      nextValue = value.trim()
    }

    if (field === 'postalCode') {
      nextValue = formatPostalCode(value)
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
      setSubmitError('')
    }

    if (field === 'postalCode') {
      setPostalLookupMessage('')
      setPostalLookupStatus('idle')
    }
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    if (!customer.fullName.trim()) {
      nextErrors.fullName = 'お名前を入力してください。'
    }

    if (!customer.email.trim()) {
      nextErrors.email = 'メールアドレスを入力してください。'
    } else if (!isValidEmail(customer.email.trim())) {
      nextErrors.email = '有効なメールアドレスを入力してください。'
    }
    const phoneDigits = customer.phone.replace(/\D/g, '')

    if (!phoneDigits) {
      nextErrors.phone = '電話番号を入力してください。'
    } else if (phoneDigits.length < 11) {
      nextErrors.phone = '有効な電話番号を入力してください。'
    }

    if (!customer.postalCode.trim()) {
      nextErrors.postalCode = '郵便番号を入力してください。'
    } else if (getPostalCodeDigits(customer.postalCode).length !== 7) {
      nextErrors.postalCode = '郵便番号は7桁で入力してください。'
    }

    if (!customer.prefecture.trim()) {
      nextErrors.prefecture = '都道府県を入力してください。'
    }

    if (!customer.city.trim()) {
      nextErrors.city = '市区町村を入力してください。'
    }

    if (!customer.addressLine1.trim()) {
      nextErrors.addressLine1 = '住所を入力してください。'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      setSubmitError('カートが空です。商品を追加してからお進みください。')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customer: {
            ...customer,
            fullName: customer.fullName.trim(),
            email: customer.email.trim(),
            phone: customer.phone.trim(),
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
        setSubmitError(data.error ?? '決済ページの作成に失敗しました。')
        setIsSubmitting(false)
        return
      }

      if (!data.url) {
        setSubmitError('Stripe の決済URLを取得できませんでした。')
        setIsSubmitting(false)
        return
      }

      window.location.href = data.url
    } catch (error) {
      console.error('Checkout request failed:', error)
      setSubmitError('通信エラーが発生しました。時間をおいて再度お試しください。')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#fffaf2] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-[#eadfce] bg-white p-10 text-center shadow-[0_24px_70px_rgba(58,42,22,0.08)] sm:p-16">
            <p className="text-xs tracking-[0.24em] text-neutral-500">
              CHECKOUT
            </p>

            <h1 className="mt-4 font-serif text-3xl tracking-tight text-neutral-950">
              カートが空です
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
              ご購入手続きに進むには、まず商品をカートに追加してください。
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:opacity-90"
              >
                商品一覧へ戻る
              </Link>

              <Link
                href="/stories"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d8c5aa] bg-white px-6 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                ストーリーから選ぶ
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-sm text-neutral-500">
            <Link href="/" className="hover:underline">
              Home
            </Link>{' '}
            /{' '}
            <Link href="/cart" className="hover:underline">
              Cart
            </Link>{' '}
            / Checkout
          </p>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs tracking-[0.24em] text-neutral-500">
                SECURE CHECKOUT
              </p>
              <h1 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
                ご購入手続き
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
                配送先情報をご入力ください。お支払いはStripeの安全な決済ページで行われます。
              </p>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-white px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.2em] text-neutral-500">
                ORDER SUMMARY
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-950">
                {itemCount}点 / ¥{cartTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="order-1 space-y-6 lg:order-1">
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
                  配送先情報
                </h2>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  注文確認メールと配送手配に使用します。入力内容をご確認ください。
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
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="山田 花子"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.fullName ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.fullName}
                    </p>
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
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="example@email.com"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.email ? (
                    <p className="mt-2 text-xs text-red-600">{errors.email}</p>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">
                      注文確認メール、追跡情報、レシート案内を送信します。
                    </p>
                  )}
                </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  電話番号
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={customer.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="090-1234-5678"
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                />
                {errors.phone ? (
                  <p className="mt-2 text-xs text-red-600">{errors.phone}</p>
                ) : (
                  <p className="mt-2 text-xs text-neutral-500">
                    配送会社の連絡用です。通常こちらからお電話することはありません。
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
                    onChange={(e) =>
                      handleChange('postalCode', e.target.value)
                    }
                    placeholder="470-0353"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.postalCode ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.postalCode}
                    </p>
                  ) : postalLookupMessage ? (
                    <p
                      className={`mt-2 text-xs ${
                        postalLookupStatus === 'success'
                          ? 'text-[#3f6d52]'
                          : postalLookupStatus === 'loading'
                            ? 'text-neutral-500'
                            : 'text-amber-700'
                      }`}
                    >
                      {postalLookupMessage}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">
                      7桁入力すると住所を自動入力します。
                    </p>
                  )}
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
                    onChange={(e) =>
                      handleChange('prefecture', e.target.value)
                    }
                    placeholder="愛知県"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.prefecture ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.prefecture}
                    </p>
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
                    onChange={(e) => handleChange('city', e.target.value)}
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
                    onChange={(e) =>
                      handleChange('addressLine1', e.target.value)
                    }
                    placeholder="〇〇町 1-2-3"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                  {errors.addressLine1 ? (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.addressLine1}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="addressLine2"
                    className="mb-2 block text-sm font-medium text-neutral-800"
                  >
                    建物名・部屋番号{' '}
                    <span className="text-neutral-400">（任意）</span>
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    autoComplete="address-line2"
                    value={customer.addressLine2}
                    onChange={(e) =>
                      handleChange('addressLine2', e.target.value)
                    }
                    placeholder="サンプルマンション 301"
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          </section>

          <aside className="order-2 h-fit rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:order-2">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.2em] text-neutral-500">
                  ORDER DETAILS
                </p>
                <h2 className="mt-2 font-serif text-2xl tracking-tight text-neutral-950">
                  ご注文内容
                </h2>
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
                  className="flex items-start gap-4 rounded-2xl border border-neutral-100 bg-[#fffaf2] p-3"
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
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? '決済ページへ接続中...'
                : 'Stripeで安全に支払う'}
            </button>

            <p className="mt-4 text-xs leading-6 text-neutral-500">
              ボタンを押すとStripeの安全な決済ページへ移動します。
            </p>
          </aside>

          <section className="order-3 lg:order-3 lg:col-span-1">
            <div className="rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
                安心してご注文いただくために
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4">
                  <p className="text-sm font-medium text-neutral-900">
                    安全な決済
                  </p>
                  <p className="mt-2 text-xs leading-6 text-neutral-600">
                    お支払い情報はStripeの決済ページで安全に処理されます。
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4">
                  <p className="text-sm font-medium text-neutral-900">
                    注文確認メール
                  </p>
                  <p className="mt-2 text-xs leading-6 text-neutral-600">
                    決済完了後、ご注文内容と追跡情報をメールでお送りします。
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4">
                  <p className="text-sm font-medium text-neutral-900">
                    入力内容の確認
                  </p>
                  <p className="mt-2 text-xs leading-6 text-neutral-600">
                    この画面で配送先と注文内容を確認してから決済へ進めます。
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
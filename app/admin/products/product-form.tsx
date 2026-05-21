"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type ProductStatus = "draft" | "active" | "hidden" | "out-of-stock" | "archived"
type StockStatus = "in-stock" | "limited" | "out-of-stock"
type ImageRole = "main" | "gallery" | "og" | "story" | "thumbnail"

type ProductImageForm = {
  url: string
  alt: string
  role: ImageRole
  sortOrder: number
}

type ProductFaqForm = {
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
}

type ProductShippingProfileForm = {
  shippingOriginPrefecture: string
  sizeClass: number
  volumeUnits: number
  lengthCm: string
  widthCm: string
  heightCm: string
  volumeCm3: number | null
  weightGrams: string
  packageType: string
  temperatureType: string
}

type ProductFormState = {
  legacyId: string
  slug: string
  name: string
  price: string
  shortDescription: string
  description: string
  origin: string
  ingredients: string
  allergens: string
  shelfLife: string
  storage: string
  category: string
  tag: string
  stockStatus: StockStatus
  stockQuantity: string
  status: ProductStatus
  isActive: boolean
  isArchived: boolean
  seoTitle: string
  seoDescription: string
  canonicalSlug: string
  images: ProductImageForm[]
  shippingProfile: ProductShippingProfileForm
  faqItems: ProductFaqForm[]
}

type AdminProductImage = {
  id: string
  productId: string
  url: string
  alt: string | null
  role: ImageRole | string
  sortOrder: number
  createdAt: string
}

type AdminProductShippingProfile = {
  id: string
  productId: string
  shippingOriginPrefecture: string
  sizeClass: number
  volumeUnits: number
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  volumeCm3: number | null
  weightGrams: number | null
  packageType: string
  temperatureType: string
  createdAt: string
  updatedAt: string
}

type AdminProductFaqItem = {
  id: string
  productId: string
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type AdminProductDetail = {
  id: string
  legacyId: string
  slug: string
  name: string
  price: number
  shortDescription: string | null
  description: string
  origin: string | null
  ingredients: string | null
  allergens: string | null
  shelfLife: string | null
  storage: string | null
  category: string | null
  tag: string | null
  stockStatus: StockStatus
  stockQuantity: number | null
  status: ProductStatus
  isActive: boolean
  isArchived: boolean
  seoTitle: string | null
  seoDescription: string | null
  canonicalSlug: string | null
  createdAt: string
  updatedAt: string
  images: AdminProductImage[]
  mainImage: AdminProductImage | null
  shippingProfile: AdminProductShippingProfile | null
  faqItems: AdminProductFaqItem[]
}

const productStatusOptions: ProductStatus[] = [
  "draft",
  "active",
  "hidden",
  "out-of-stock",
  "archived",
]

const stockStatusOptions: StockStatus[] = [
  "in-stock",
  "limited",
  "out-of-stock",
]

const imageRoleOptions: ImageRole[] = [
  "main",
  "gallery",
  "og",
  "story",
  "thumbnail",
]


const prefectureOptions = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "山梨県",
  "新潟県",
  "長野県",
  "富山県",
  "石川県",
  "福井県",
  "静岡県",
  "愛知県",
  "岐阜県",
  "三重県",
  "奈良県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "和歌山県",
  "岡山県",
  "広島県",
  "鳥取県",
  "島根県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
]

const initialFormState: ProductFormState = {
  legacyId: "",
  slug: "",
  name: "",
  price: "",
  shortDescription: "",
  description: "",
  origin: "",
  ingredients: "",
  allergens: "",
  shelfLife: "",
  storage: "",
  category: "",
  tag: "",
  stockStatus: "in-stock",
  stockQuantity: "",
  status: "draft",
  isActive: false,
  isArchived: false,
  seoTitle: "",
  seoDescription: "",
  canonicalSlug: "",
  images: [
    {
      url: "",
      alt: "",
      role: "main",
      sortOrder: 0,
    },
  ],
  shippingProfile: {
    shippingOriginPrefecture: "愛知県",
    sizeClass: 60,
    volumeUnits: 1,
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    volumeCm3: null,
    weightGrams: "",
    packageType: "standard",
    temperatureType: "ambient",
  },
  faqItems: [],
}

function getStatusLabel(status: ProductStatus) {
  const labels: Record<ProductStatus, string> = {
    draft: "下書き",
    active: "公開中",
    hidden: "非表示",
    "out-of-stock": "在庫切れ",
    archived: "アーカイブ",
  }

  return labels[status]
}

function getStockLabel(status: StockStatus) {
  const labels: Record<StockStatus, string> = {
    "in-stock": "在庫あり",
    limited: "残りわずか",
    "out-of-stock": "在庫切れ",
  }

  return labels[status]
}

function normalizeSlugInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function mapProductToForm(product: AdminProductDetail): ProductFormState {
  return {
    legacyId: product.legacyId,
    slug: product.slug,
    name: product.name,
    price: String(product.price),
    shortDescription: product.shortDescription ?? "",
    description: product.description,
    origin: product.origin ?? "",
    ingredients: product.ingredients ?? "",
    allergens: product.allergens ?? "",
    shelfLife: product.shelfLife ?? "",
    storage: product.storage ?? "",
    category: product.category ?? "",
    tag: product.tag ?? "",
    stockStatus: product.stockStatus,
    stockQuantity:
      typeof product.stockQuantity === "number"
        ? String(product.stockQuantity)
        : "",
    status: product.status,
    isActive: product.isActive,
    isArchived: product.isArchived,
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    canonicalSlug: product.canonicalSlug ?? "",
    images:
      product.images.length > 0
        ? product.images.map((image, index) => ({
            url: image.url,
            alt: image.alt ?? "",
            role: imageRoleOptions.includes(image.role as ImageRole)
              ? (image.role as ImageRole)
              : "gallery",
            sortOrder: image.sortOrder ?? index,
          }))
        : initialFormState.images,
    shippingProfile: {
      shippingOriginPrefecture:
        product.shippingProfile?.shippingOriginPrefecture ?? "愛知県",
      sizeClass: product.shippingProfile?.sizeClass ?? 60,
      volumeUnits: product.shippingProfile?.volumeUnits ?? 1,
      lengthCm:
        typeof product.shippingProfile?.lengthCm === "number"
          ? String(product.shippingProfile.lengthCm)
          : "",
      widthCm:
        typeof product.shippingProfile?.widthCm === "number"
          ? String(product.shippingProfile.widthCm)
          : "",
      heightCm:
        typeof product.shippingProfile?.heightCm === "number"
          ? String(product.shippingProfile.heightCm)
          : "",
      volumeCm3:
        typeof product.shippingProfile?.volumeCm3 === "number"
          ? product.shippingProfile.volumeCm3
          : null,
      weightGrams:
        typeof product.shippingProfile?.weightGrams === "number"
          ? String(product.shippingProfile.weightGrams)
          : "",
      packageType: product.shippingProfile?.packageType ?? "standard",
      temperatureType: product.shippingProfile?.temperatureType ?? "ambient",
    },
    faqItems: product.faqItems.map((item, index) => ({
      question: item.question,
      answer: item.answer,
      sortOrder: item.sortOrder ?? index,
      isActive: item.isActive,
    })),
  }
}

function parseDimensionCm(value: string) {
  const parsed = Number.parseInt(value.replace(/\D/g, ""), 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function calculateVolumeCm3FromShippingProfile(
  shippingProfile: ProductShippingProfileForm
) {
  const lengthCm = parseDimensionCm(shippingProfile.lengthCm)
  const widthCm = parseDimensionCm(shippingProfile.widthCm)
  const heightCm = parseDimensionCm(shippingProfile.heightCm)

  if (lengthCm === null || widthCm === null || heightCm === null) {
    return { lengthCm, widthCm, heightCm, volumeCm3: null }
  }

  return {
    lengthCm,
    widthCm,
    heightCm,
    volumeCm3: lengthCm * widthCm * heightCm,
  }
}

function buildPayload(form: ProductFormState) {
  const dimensions = calculateVolumeCm3FromShippingProfile(form.shippingProfile)

  return {
    legacyId: form.legacyId.trim(),
    slug: normalizeSlugInput(form.slug),
    name: form.name.trim(),
    price: Number.parseInt(form.price || "0", 10),
    shortDescription: form.shortDescription.trim() || null,
    description: form.description.trim(),
    origin: form.origin.trim() || null,
    ingredients: form.ingredients.trim() || null,
    allergens: form.allergens.trim() || null,
    shelfLife: form.shelfLife.trim() || null,
    storage: form.storage.trim() || null,
    category: form.category.trim() || null,
    tag: form.tag.trim() || null,
    stockStatus: form.stockStatus,
    stockQuantity:
      form.stockQuantity.trim() === ""
        ? null
        : Number.parseInt(form.stockQuantity.trim(), 10),
    status: form.status,
    isActive: form.status === "active" ? true : form.isActive,
    isArchived: form.status === "archived" ? true : form.isArchived,
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
    canonicalSlug: form.canonicalSlug.trim() || null,
    images: form.images
      .map((image, index) => ({
        url: image.url.trim(),
        alt: image.alt.trim() || null,
        role: image.role,
        sortOrder: Number.isInteger(image.sortOrder) ? image.sortOrder : index,
      }))
      .filter((image) => image.url),
    shippingProfile: {
      shippingOriginPrefecture: form.shippingProfile.shippingOriginPrefecture,
      // Legacy fallback only. Smart Box does not use product-level sizeClass.
      sizeClass: 60,
      volumeUnits: Number(form.shippingProfile.volumeUnits),
      lengthCm: dimensions.lengthCm,
      widthCm: dimensions.widthCm,
      heightCm: dimensions.heightCm,
      volumeCm3: dimensions.volumeCm3,
      weightGrams:
        form.shippingProfile.weightGrams.trim() === ""
          ? null
          : Number.parseInt(form.shippingProfile.weightGrams.trim(), 10),
      packageType: form.shippingProfile.packageType.trim() || "standard",
      temperatureType: form.shippingProfile.temperatureType.trim() || "ambient",
    },
    faqItems: form.faqItems
      .map((item, index) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
        sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
        isActive: item.isActive,
      }))
      .filter((item) => item.question && item.answer),
  }
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  inputMode?: "numeric" | "text" | "url"
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-neutral-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  rows?: number
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-neutral-800">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm leading-6 text-neutral-900 outline-none transition focus:border-neutral-900"
      />
    </label>
  )
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
      </div>
      {children}
    </section>
  )
}

export default function ProductForm({
  mode,
  productId,
}: {
  mode: "new" | "edit"
  productId?: string
}) {
  const router = useRouter()

  const [form, setForm] = useState<ProductFormState>(initialFormState)
  const [product, setProduct] = useState<AdminProductDetail | null>(null)

  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const mainImagePreview = useMemo(
    () =>
      form.images.find((image) => image.role === "main" && image.url.trim()) ??
      form.images.find((image) => image.url.trim()) ??
      null,
    [form.images]
  )

  useEffect(() => {
    if (mode !== "edit" || !productId) return

    async function loadProduct() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(`/api/admin/products/${productId}`, {
          cache: "no-store",
        })
        const data = (await response.json()) as {
          product?: AdminProductDetail
          error?: string
        }

        if (!response.ok || !data.product) {
          setError(data.error ?? "商品情報の取得に失敗しました。")
          return
        }

        setProduct(data.product)
        setForm(mapProductToForm(data.product))
      } catch (loadError) {
        console.error("Failed to load product:", loadError)
        setError("商品情報の取得中に通信エラーが発生しました。")
      } finally {
        setLoading(false)
      }
    }

    void loadProduct()
  }, [mode, productId])

  function patchForm(patch: Partial<ProductFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }))
  }

  function patchShippingProfile(patch: Partial<ProductShippingProfileForm>) {
    setForm((current) => {
      const nextShippingProfile = {
        ...current.shippingProfile,
        ...patch,
      }
      const dimensions = calculateVolumeCm3FromShippingProfile(nextShippingProfile)

      return {
        ...current,
        shippingProfile: {
          ...nextShippingProfile,
          // Kept only for old DB/API compatibility. Checkout Smart Box ignores this field.
          sizeClass: 60,
          volumeCm3: dimensions.volumeCm3,
        },
      }
    })
  }

  function updateImage(index: number, patch: Partial<ProductImageForm>) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...patch } : image
      ),
    }))
  }

  function addImage() {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          url: "",
          alt: "",
          role: "gallery",
          sortOrder: current.images.length,
        },
      ],
    }))
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }))
  }

  function updateFaq(index: number, patch: Partial<ProductFaqForm>) {
    setForm((current) => ({
      ...current,
      faqItems: current.faqItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }))
  }

  function addFaq() {
    setForm((current) => ({
      ...current,
      faqItems: [
        ...current.faqItems,
        {
          question: "",
          answer: "",
          sortOrder: current.faqItems.length,
          isActive: true,
        },
      ],
    }))
  }

  function removeFaq(index: number) {
    setForm((current) => ({
      ...current,
      faqItems: current.faqItems.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = buildPayload(form)

    if (!payload.legacyId) {
      setError("legacyId は必須です。")
      return
    }

    if (!payload.slug) {
      setError("slug は必須です。")
      return
    }

    if (!payload.name) {
      setError("商品名は必須です。")
      return
    }

    if (!payload.description) {
      setError("説明文は必須です。")
      return
    }

    if (!Number.isInteger(payload.price) || payload.price < 0) {
      setError("価格は0以上の整数で入力してください。")
      return
    }

    if (
      payload.shippingProfile.lengthCm === null ||
      payload.shippingProfile.widthCm === null ||
      payload.shippingProfile.heightCm === null ||
      payload.shippingProfile.volumeCm3 === null
    ) {
      setError("商品サイズ（長さ・幅・高さ）を入力してください。")
      return
    }

    try {
      setSaving(true)
      setError("")
      setNotice("")

      const endpoint =
        mode === "edit" && productId
          ? `/api/admin/products/${productId}`
          : "/api/admin/products"
      const method = mode === "edit" ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as {
        product?: AdminProductDetail
        error?: string
      }

      if (!response.ok || !data.product) {
        setError(data.error ?? "商品の保存に失敗しました。")
        return
      }

      setNotice("保存しました。")
      setProduct(data.product)

      if (mode === "new") {
        router.replace(`/admin/products/${data.product.id}`)
        router.refresh()
        return
      }

      setForm(mapProductToForm(data.product))
      router.refresh()
    } catch (saveError) {
      console.error("Failed to save product:", saveError)
      setError("商品の保存中に通信エラーが発生しました。")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          商品情報を読み込んでいます...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="sticky top-3 z-30 mb-8 rounded-2xl border border-neutral-200 bg-white/92 p-3 shadow-sm backdrop-blur">
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-7">
          <Link
            href="/admin"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            管理トップ
          </Link>
          <Link
            href="/admin/products"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            商品一覧
          </Link>
          <a
            href="#basic"
            className="rounded-xl bg-neutral-900 px-4 py-3 text-center font-medium text-white transition hover:opacity-90"
          >
            基本
          </a>
          <a
            href="#public"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            公開情報
          </a>
          <a
            href="#shipping"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            配送
          </a>
          <a
            href="#images"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            画像
          </a>
          <a
            href="#seo"
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            SEO
          </a>
        </div>
      </nav>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm tracking-[0.2em] text-neutral-500">
            ADMIN / PRODUCTS / {mode === "new" ? "NEW" : "EDIT"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {mode === "new" ? "新規商品登録" : "商品編集"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            公開情報、配送・梱包情報、画像、FAQ、SEOを商品ごとに管理します。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {product?.slug ? (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              商品ページを見る
            </Link>
          ) : null}

          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            一覧へ戻る
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-8">
        <Section
          id="basic"
          title="基本情報"
          description="管理・公開・在庫状態に関わる最小限の情報です。"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput
              label="Legacy ID"
              value={form.legacyId}
              onChange={(value) => patchForm({ legacyId: value })}
              placeholder="例: 7"
              required
            />

            <TextInput
              label="Slug"
              value={form.slug}
              onChange={(value) => patchForm({ slug: normalizeSlugInput(value) })}
              placeholder="example-product-slug"
              required
            />

            <TextInput
              label="商品名"
              value={form.name}
              onChange={(value) => patchForm({ name: value })}
              placeholder="ウクライナ産..."
              required
            />

            <TextInput
              label="価格 JPY"
              value={form.price}
              onChange={(value) =>
                patchForm({ price: value.replace(/\D/g, "") })
              }
              placeholder="2480"
              inputMode="numeric"
              required
            />

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-neutral-800">公開状態</span>
              <select
                value={form.status}
                onChange={(event) =>
                  patchForm({ status: event.target.value as ProductStatus })
                }
                className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
              >
                {productStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-neutral-800">在庫状態</span>
              <select
                value={form.stockStatus}
                onChange={(event) =>
                  patchForm({ stockStatus: event.target.value as StockStatus })
                }
                className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
              >
                {stockStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getStockLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <TextInput
              label="在庫数"
              value={form.stockQuantity}
              onChange={(value) =>
                patchForm({ stockQuantity: value.replace(/\D/g, "") })
              }
              placeholder="未設定の場合は空欄"
              inputMode="numeric"
            />

            <TextInput
              label="カテゴリー"
              value={form.category}
              onChange={(value) => patchForm({ category: value })}
              placeholder="蜂蜜 / お茶 / お菓子..."
            />

            <TextInput
              label="タグ"
              value={form.tag}
              onChange={(value) => patchForm({ tag: value })}
              placeholder="人気商品 / 新商品 / 残りわずか"
            />
          </div>
        </Section>

        <Section
          id="public"
          title="公開情報"
          description="商品ページで顧客に見える説明情報です。"
        >
          <div className="grid gap-5">
            <TextArea
              label="短い説明"
              value={form.shortDescription}
              onChange={(value) => patchForm({ shortDescription: value })}
              placeholder="一覧・SEO補助用の短い説明"
              rows={3}
            />

            <TextArea
              label="商品説明"
              value={form.description}
              onChange={(value) => patchForm({ description: value })}
              placeholder="商品ページに表示される本文"
              required
              rows={6}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput
                label="産地"
                value={form.origin}
                onChange={(value) => patchForm({ origin: value })}
                placeholder="ウクライナ・..."
              />

              <TextInput
                label="原材料"
                value={form.ingredients}
                onChange={(value) => patchForm({ ingredients: value })}
                placeholder="..."
              />

              <TextInput
                label="アレルゲン"
                value={form.allergens}
                onChange={(value) => patchForm({ allergens: value })}
                placeholder="なし / 大豆 / 乳成分..."
              />

              <TextInput
                label="賞味期限"
                value={form.shelfLife}
                onChange={(value) => patchForm({ shelfLife: value })}
                placeholder="製造日より..."
              />
            </div>

            <TextArea
              label="保存方法"
              value={form.storage}
              onChange={(value) => patchForm({ storage: value })}
              placeholder="直射日光を避け..."
              rows={3}
            />
          </div>
        </Section>

        <Section
          id="shipping"
          title="配送・梱包情報"
          description="送料計算、Smart Box、配送ルート表示に使う技術情報です。"
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-neutral-800">配送元都道府県</span>
              <select
                value={form.shippingProfile.shippingOriginPrefecture}
                onChange={(event) =>
                  patchShippingProfile({
                    shippingOriginPrefecture: event.target.value,
                  })
                }
                className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
              >
                {prefectureOptions.map((prefecture) => (
                  <option key={prefecture} value={prefecture}>
                    {prefecture}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 text-sm">
              <span className="font-medium text-neutral-800">商品体積</span>
              <div className="flex h-11 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-900">
                {form.shippingProfile.volumeCm3 !== null
                  ? `${form.shippingProfile.volumeCm3.toLocaleString()} cm³`
                  : "未計算"}
              </div>
              <p className="text-xs leading-5 text-neutral-500">
                箱サイズはここでは決めません。Smart Boxがカート全体の体積から自動判定します。
              </p>
            </div>

            <TextInput
              label="長さ cm"
              value={form.shippingProfile.lengthCm}
              onChange={(value) =>
                patchShippingProfile({
                  lengthCm: value.replace(/\D/g, ""),
                })
              }
              placeholder="例: 20"
              inputMode="numeric"
              required
            />

            <TextInput
              label="幅 cm"
              value={form.shippingProfile.widthCm}
              onChange={(value) =>
                patchShippingProfile({
                  widthCm: value.replace(/\D/g, ""),
                })
              }
              placeholder="例: 12"
              inputMode="numeric"
              required
            />

            <TextInput
              label="高さ cm"
              value={form.shippingProfile.heightCm}
              onChange={(value) =>
                patchShippingProfile({
                  heightCm: value.replace(/\D/g, ""),
                })
              }
              placeholder="例: 8"
              inputMode="numeric"
              required
            />

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-neutral-800 lg:col-span-3">
              <p className="font-medium text-neutral-900">Smart Box用の商品体積</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {form.shippingProfile.volumeCm3 !== null
                  ? `${form.shippingProfile.volumeCm3.toLocaleString()} cm³`
                  : "未計算"}
              </p>
              <p className="mt-2 text-xs leading-5 text-neutral-600">
                長さ × 幅 × 高さで自動計算します。この商品体積だけを商品データとして保存し、箱サイズはcheckoutのSmart Boxがカート全体から判定します。
              </p>
            </div>

            <div className="hidden">
              <TextInput
                label="Legacy Volume Units"
                value={String(form.shippingProfile.volumeUnits)}
                onChange={(value) =>
                  patchShippingProfile({
                    volumeUnits: Number(value.replace(/\D/g, "") || 1),
                  })
                }
                placeholder="1〜24"
                inputMode="numeric"
              />
            </div>

            <TextInput
              label="重量 g"
              value={form.shippingProfile.weightGrams}
              onChange={(value) =>
                patchShippingProfile({
                  weightGrams: value.replace(/\D/g, ""),
                })
              }
              placeholder="未設定の場合は空欄"
              inputMode="numeric"
            />

            <TextInput
              label="Package Type"
              value={form.shippingProfile.packageType}
              onChange={(value) => patchShippingProfile({ packageType: value })}
              placeholder="standard"
            />

            <TextInput
              label="Temperature Type"
              value={form.shippingProfile.temperatureType}
              onChange={(value) =>
                patchShippingProfile({ temperatureType: value })
              }
              placeholder="ambient"
            />
          </div>
        </Section>

        <Section
          id="images"
          title="画像"
          description="main画像は商品カード・商品ページ・checkoutでも重要です。"
        >
          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-neutral-200 bg-[#fffaf2] p-4">
              <p className="text-sm font-medium text-neutral-900">Preview</p>
              <div className="mt-4 aspect-square overflow-hidden rounded-2xl bg-white">
                {mainImagePreview?.url ? (
                  <img
                    src={mainImagePreview.url}
                    alt={mainImagePreview.alt || form.name || "Product preview"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {form.images.map((image, index) => (
                <div
                  key={`${index}-${image.role}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_1fr_140px_90px_auto]">
                    <TextInput
                      label="URL"
                      value={image.url}
                      onChange={(value) => updateImage(index, { url: value })}
                      placeholder="/images/products/..."
                    />

                    <TextInput
                      label="Alt"
                      value={image.alt}
                      onChange={(value) => updateImage(index, { alt: value })}
                      placeholder="画像説明"
                    />

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-neutral-800">Role</span>
                      <select
                        value={image.role}
                        onChange={(event) =>
                          updateImage(index, {
                            role: event.target.value as ImageRole,
                          })
                        }
                        className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
                      >
                        {imageRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>

                    <TextInput
                      label="Order"
                      value={String(image.sortOrder)}
                      onChange={(value) =>
                        updateImage(index, {
                          sortOrder: Number(value.replace(/\D/g, "") || 0),
                        })
                      }
                      inputMode="numeric"
                    />

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="h-11 rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addImage}
                className="h-11 rounded-xl border border-dashed border-neutral-300 bg-white text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                画像を追加
              </button>
            </div>
          </div>
        </Section>

        <Section
          id="faq"
          title="FAQ"
          description="商品ごとのQ&Aです。まだ公開側には未接続ですが、データモデルは準備済みです。"
        >
          <div className="grid gap-4">
            {form.faqItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-500">
                FAQはまだありません。
              </div>
            ) : null}

            {form.faqItems.map((item, index) => (
              <div key={index} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="grid gap-4">
                  <TextInput
                    label="Question"
                    value={item.question}
                    onChange={(value) => updateFaq(index, { question: value })}
                    placeholder="質問"
                  />

                  <TextArea
                    label="Answer"
                    value={item.answer}
                    onChange={(value) => updateFaq(index, { answer: value })}
                    placeholder="回答"
                    rows={3}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(event) =>
                          updateFaq(index, { isActive: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                      表示する
                    </label>

                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      FAQ削除
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addFaq}
              className="h-11 rounded-xl border border-dashed border-neutral-300 bg-white text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              FAQを追加
            </button>
          </div>
        </Section>

        <Section
          id="seo"
          title="SEO"
          description="OG・検索結果・canonicalのための補助情報です。"
        >
          <div className="grid gap-5">
            <TextInput
              label="SEO Title"
              value={form.seoTitle}
              onChange={(value) => patchForm({ seoTitle: value })}
              placeholder="商品名 | Sonyachna"
            />

            <TextArea
              label="SEO Description"
              value={form.seoDescription}
              onChange={(value) => patchForm({ seoDescription: value })}
              rows={3}
              placeholder="検索結果やOG向けの説明"
            />

            <TextInput
              label="Canonical Slug"
              value={form.canonicalSlug}
              onChange={(value) =>
                patchForm({ canonicalSlug: normalizeSlugInput(value) })
              }
              placeholder="通常は空欄でOK"
            />
          </div>
        </Section>

        <div className="sticky bottom-4 z-30 rounded-2xl border border-neutral-200 bg-white/94 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-600">
              {mode === "new"
                ? "新規商品をNeonの商品カタログに保存します。"
                : "変更内容は商品カタログに保存され、audit logにも記録されます。"}
            </div>

            <div className="flex gap-3">
              <Link
                href="/admin/products"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                キャンセル
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}

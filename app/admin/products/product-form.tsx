"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { FileText, Globe, ImageIcon, Package, Truck } from "lucide-react"
import {
  flatProductCategoryOptions,
  productCategoryGroups,
} from "@/lib/product/category-taxonomy"

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

const newProductStatusOptions: ProductStatus[] = ["draft", "active"]
const editProductStatusOptions: ProductStatus[] = [
  "draft",
  "active",
  "hidden",
  "archived",
]

const stockStatusOptions: StockStatus[] = [
  "in-stock",
  "limited",
  "out-of-stock",
]

const productBadgeOptions = ["人気商品", "新商品", "おすすめ", "限定", "再入荷"] as const
const fullProductBadgeOptions = [
  "人気商品",
  "新商品",
  "おすすめ",
  "限定",
  "再入荷",
  "残りわずか",
  "セール",
  "ギフト向け",
  "季節限定",
  "店長おすすめ",
] as const
const categoryQuickOptionKeys = [
  "honey",
  "tea",
  "sweets",
  "oil",
  "dried_fruits",
] as const
const categoryQuickOptions = categoryQuickOptionKeys
  .map((key) => flatProductCategoryOptions.find((option) => option.key === key))
  .filter((option): option is NonNullable<typeof option> => option !== undefined)
  .map((option) => ({
    label: option.labelUk,
    value: option.labelJa,
  }))

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
    draft: "Чернетка",
    active: "Опубліковано",
    hidden: "Приховано",
    "out-of-stock": "Немає на складі",
    archived: "Архів",
  }

  return labels[status]
}

function getStockLabel(status: StockStatus) {
  const labels: Record<StockStatus, string> = {
    "in-stock": "Є на складі",
    limited: "Малий залишок",
    "out-of-stock": "Немає на складі",
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

function buildPayload(form: ProductFormState, mode: "new" | "edit") {
  const dimensions = calculateVolumeCm3FromShippingProfile(form.shippingProfile)
  const stockQuantity =
    form.stockQuantity.trim() === ""
      ? null
      : Number.parseInt(form.stockQuantity.trim(), 10)
  const stockStatus =
    mode === "new"
      ? stockQuantity === null || stockQuantity === 0
        ? "out-of-stock"
        : "in-stock"
      : form.stockStatus

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
    stockStatus,
    stockQuantity,
    status: form.status,
    isActive: form.status === "active",
    isArchived: form.status === "archived",
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

function CategoryPickerField({
  value,
  onChange,
  isOpen,
  onToggleOpen,
}: {
  value: string
  onChange: (value: string) => void
  isOpen: boolean
  onToggleOpen: () => void
}) {
  return (
    <div className="grid gap-2 text-sm">
      <TextInput
        label="Категорія"
        value={value}
        onChange={onChange}
        placeholder="Мед / чай / солодощі..."
      />
      <div className="flex flex-wrap gap-2">
        {categoryQuickOptions.map((option) => {
          const isActive = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-[#fffaf2]"
              }`}
            >
              {option.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
        >
          Очистити
        </button>
      </div>
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-fit rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-[#fffaf2]"
      >
        {isOpen ? "Сховати всі категорії" : "Показати всі категорії"}
      </button>
      {isOpen ? (
        <div className="rounded-[18px] border border-neutral-200 bg-white/70 p-3">
          <div className="mb-3 grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Усі категорії
            </span>
            <span className="text-xs text-neutral-500">
              Вибери категорію з повного списку або залиш ручне значення.
            </span>
          </div>
          <div className="grid gap-3">
            {productCategoryGroups.map((group) => (
              <div key={group.key} className="grid gap-2">
                <span className="text-xs font-semibold text-neutral-700">
                  {group.labelUk}
                </span>
                <div className="flex flex-wrap gap-2">
                  {group.categories.map((category) => {
                    const isActive = value === category.labelJa

                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => onChange(category.labelJa)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-[#fffaf2]"
                        }`}
                      >
                        {category.labelUk}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BadgePickerField({
  value,
  onChange,
  isOpen,
  onToggleOpen,
}: {
  value: string
  onChange: (value: string) => void
  isOpen: boolean
  onToggleOpen: () => void
}) {
  return (
    <div className="grid gap-2 text-sm">
      <span className="font-medium text-neutral-800">Бейдж товару</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例: 人気商品, 新商品, おすすめ"
        className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
      />
      <div className="flex flex-wrap gap-2">
        {productBadgeOptions.map((badge) => {
          const isActive = value === badge

          return (
            <button
              key={badge}
              type="button"
              onClick={() => onChange(badge)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-[#fffaf2] ${
                isActive
                  ? "border-[#c99a4a] bg-[#fff7e4] text-[#8a5d18]"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              {badge}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
        >
          Очистити
        </button>
      </div>
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-fit rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-[#fffaf2]"
      >
        {isOpen ? "Сховати всі бейджі" : "Показати всі бейджі"}
      </button>
      {isOpen ? (
        <div className="rounded-[18px] border border-neutral-200 bg-white/70 p-3">
          <div className="flex flex-wrap gap-2">
            {fullProductBadgeOptions.map((badge) => {
              const isActive = value === badge

              return (
                <button
                  key={badge}
                  type="button"
                  onClick={() => onChange(badge)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-[#fffaf2] ${
                    isActive
                      ? "border-[#c99a4a] bg-[#fff7e4] text-[#8a5d18]"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  {badge}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
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
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)
  const [isBadgePickerOpen, setIsBadgePickerOpen] = useState(false)
  const [activeFormNav, setActiveFormNav] = useState<
    "basic" | "public" | "shipping" | "images" | "seo"
  >("basic")

  const mainImagePreview = useMemo(
    () =>
      form.images.find((image) => image.role === "main" && image.url.trim()) ??
      form.images.find((image) => image.url.trim()) ??
      null,
    [form.images]
  )
  const visibleProductStatusOptions =
    mode === "new" ? newProductStatusOptions : editProductStatusOptions
  const showLegacyOutOfStockStatus =
    mode === "edit" && form.status === "out-of-stock"

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
          setError(data.error ?? "Не вдалося отримати дані товару.")
          return
        }

        setProduct(data.product)
        setForm(mapProductToForm(data.product))
      } catch (loadError) {
        console.error("Failed to load product:", loadError)
        setError("Під час отримання даних товару сталася помилка звʼязку.")
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

    const payload = buildPayload(form, mode)

    if (!payload.legacyId) {
      setError("Legacy ID є обовʼязковим.")
      return
    }

    if (!payload.slug) {
      setError("Slug є обовʼязковим.")
      return
    }

    if (!payload.name) {
      setError("Назва товару є обовʼязковою.")
      return
    }

    if (!payload.description) {
      setError("Опис товару є обовʼязковим.")
      return
    }

    if (!Number.isInteger(payload.price) || payload.price < 0) {
      setError("Ціну потрібно вказати цілим числом 0 або більше.")
      return
    }

    if (
      payload.shippingProfile.lengthCm === null ||
      payload.shippingProfile.widthCm === null ||
      payload.shippingProfile.heightCm === null ||
      payload.shippingProfile.volumeCm3 === null
    ) {
      setError("Вкажіть габарити товару: довжину, ширину й висоту.")
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
        setError(data.error ?? "Не вдалося зберегти товар.")
        return
      }

      setNotice("Збережено.")
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
      setError("Під час збереження товару сталася помилка звʼязку.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          Завантаження даних товару...
        </div>
      </main>
    )
  }

  const sectionCompleteness = {
    basic:
      Boolean(form.legacyId.trim()) &&
      Boolean(form.slug.trim()) &&
      Boolean(form.name.trim()) &&
      Boolean(form.price.trim()) &&
      Boolean(form.status) &&
      Boolean(form.stockStatus),
    public:
      Boolean(form.description.trim()) &&
      [
        form.shortDescription,
        form.origin,
        form.ingredients,
        form.allergens,
        form.shelfLife,
        form.storage,
      ].filter((value) => value.trim()).length >= 2,
    shipping:
      Boolean(form.shippingProfile.shippingOriginPrefecture.trim()) &&
      Boolean(form.shippingProfile.lengthCm.trim()) &&
      Boolean(form.shippingProfile.widthCm.trim()) &&
      Boolean(form.shippingProfile.heightCm.trim()) &&
      form.shippingProfile.volumeCm3 !== null &&
      Boolean(form.shippingProfile.packageType.trim()) &&
      Boolean(form.shippingProfile.temperatureType.trim()),
    images: form.images.some((image) => image.url.trim()),
    seo: Boolean(form.seoTitle.trim()) && Boolean(form.seoDescription.trim()),
  }

  const getFormNavClass = (item: typeof activeFormNav, isComplete: boolean) => {
    const stateClass =
      activeFormNav === item
        ? "border-neutral-900 bg-neutral-900 text-white hover:opacity-90"
        : isComplete
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          : "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"

    return `inline-flex h-11 w-11 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 lg:hover:translate-x-0.5 lg:hover:translate-y-0 ${stateClass}`
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pr-24">
      <nav
        aria-label="Навігація форми товару"
        className="z-30 mb-8 flex justify-end lg:fixed lg:right-6 lg:top-1/2 lg:mb-0 lg:-translate-y-1/2"
      >
        <div className="inline-flex gap-2 rounded-2xl border border-neutral-200 bg-white/92 p-2 shadow-sm backdrop-blur lg:flex-col">
          <a
            href="#basic"
            onClick={() => setActiveFormNav("basic")}
            aria-label="Основне"
            title="Основне"
            className={getFormNavClass("basic", sectionCompleteness.basic)}
          >
            <Package className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#public"
            onClick={() => setActiveFormNav("public")}
            aria-label="Публічна інформація"
            title="Публічна інформація"
            className={getFormNavClass("public", sectionCompleteness.public)}
          >
            <FileText className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#shipping"
            onClick={() => setActiveFormNav("shipping")}
            aria-label="Доставка"
            title="Доставка"
            className={getFormNavClass("shipping", sectionCompleteness.shipping)}
          >
            <Truck className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#images"
            onClick={() => setActiveFormNav("images")}
            aria-label="Зображення"
            title="Зображення"
            className={getFormNavClass("images", sectionCompleteness.images)}
          >
            <ImageIcon className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#seo"
            onClick={() => setActiveFormNav("seo")}
            aria-label="SEO"
            title="SEO"
            className={getFormNavClass("seo", sectionCompleteness.seo)}
          >
            <Globe className="h-[18px] w-[18px]" />
          </a>
        </div>
      </nav>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm tracking-[0.2em] text-neutral-500">
            АДМІН / ТОВАРИ / {mode === "new" ? "НОВИЙ" : "РЕДАГУВАННЯ"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {mode === "new" ? "Новий товар" : "Редагування товару"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            Керуйте публічними даними, доставкою, зображеннями, FAQ і SEO товару.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {product?.slug ? (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Відкрити сторінку товару
            </Link>
          ) : null}

          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            До списку товарів
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
          title="Основна інформація"
          description="Мінімальні дані для керування товаром, публікацією та складом."
        >
          <div className="grid items-start gap-5 md:grid-cols-2">
            <TextInput
              label="Legacy ID"
              value={form.legacyId}
              onChange={(value) => patchForm({ legacyId: value })}
              placeholder="Наприклад: 7"
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
              label="Назва товару"
              value={form.name}
              onChange={(value) => patchForm({ name: value })}
              placeholder="Український..."
              required
            />

            <TextInput
              label="Ціна, JPY"
              value={form.price}
              onChange={(value) =>
                patchForm({ price: value.replace(/\D/g, "") })
              }
              placeholder="2480"
              inputMode="numeric"
              required
            />

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-neutral-800">Статус публікації</span>
              <select
                value={form.status}
                onChange={(event) =>
                  patchForm({ status: event.target.value as ProductStatus })
                }
                className="h-11 rounded-xl border border-neutral-300 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-900"
              >
                {showLegacyOutOfStockStatus ? (
                  <option value="out-of-stock" disabled>
                    Немає на складі — застарілий статус
                  </option>
                ) : null}
                {visibleProductStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            {mode === "edit" ? (
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-neutral-800">Стан складу</span>
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
            ) : null}

            <div className="grid gap-2">
              <TextInput
                label="Кількість на складі"
                value={form.stockQuantity}
                onChange={(value) =>
                  patchForm({ stockQuantity: value.replace(/\D/g, "") })
                }
                inputMode="numeric"
              />
            </div>

            <CategoryPickerField
              value={form.category}
              onChange={(value) => patchForm({ category: value })}
              isOpen={isCategoryPickerOpen}
              onToggleOpen={() =>
                setIsCategoryPickerOpen((current) => !current)
              }
            />

            <BadgePickerField
              value={form.tag}
              onChange={(value) => patchForm({ tag: value })}
              isOpen={isBadgePickerOpen}
              onToggleOpen={() => setIsBadgePickerOpen((current) => !current)}
            />
          </div>
        </Section>

        <Section
          id="public"
          title="Публічна інформація"
          description="Дані, які покупець бачить на сторінці товару."
        >
          <div className="grid gap-5">
            <TextArea
              label="Короткий опис"
              value={form.shortDescription}
              onChange={(value) => patchForm({ shortDescription: value })}
              placeholder="Короткий опис для списку товарів і SEO"
              rows={3}
            />

            <TextArea
              label="Опис товару"
              value={form.description}
              onChange={(value) => patchForm({ description: value })}
              placeholder="Основний текст для сторінки товару"
              required
              rows={6}
            />

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput
                label="Походження"
                value={form.origin}
                onChange={(value) => patchForm({ origin: value })}
                placeholder="Україна, ..."
              />

              <TextInput
                label="Склад"
                value={form.ingredients}
                onChange={(value) => patchForm({ ingredients: value })}
                placeholder="..."
              />

              <TextInput
                label="Алергени"
                value={form.allergens}
                onChange={(value) => patchForm({ allergens: value })}
                placeholder="Немає / соя / молочні компоненти..."
              />

              <TextInput
                label="Термін придатності"
                value={form.shelfLife}
                onChange={(value) => patchForm({ shelfLife: value })}
                placeholder="Від дати виробництва..."
              />
            </div>

            <TextArea
              label="Умови зберігання"
              value={form.storage}
              onChange={(value) => patchForm({ storage: value })}
              placeholder="Уникати прямого сонячного світла..."
              rows={3}
            />
          </div>
        </Section>

        <Section
          id="shipping"
          title="Доставка й пакування"
          description="Технічні дані для розрахунку доставки, Smart Box і маршруту доставки."
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-neutral-800">Префектура відправлення</span>
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
              <span className="font-medium text-neutral-800">Обʼєм товару</span>
              <div className="flex h-11 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-900">
                {form.shippingProfile.volumeCm3 !== null
                  ? `${form.shippingProfile.volumeCm3.toLocaleString()} cm³`
                  : "Не розраховано"}
              </div>

            </div>

            <TextInput
              label="Довжина, см"
              value={form.shippingProfile.lengthCm}
              onChange={(value) =>
                patchShippingProfile({
                  lengthCm: value.replace(/\D/g, ""),
                })
              }
              placeholder="Наприклад: 20"
              inputMode="numeric"
              required
            />

            <TextInput
              label="Ширина, см"
              value={form.shippingProfile.widthCm}
              onChange={(value) =>
                patchShippingProfile({
                  widthCm: value.replace(/\D/g, ""),
                })
              }
              placeholder="Наприклад: 12"
              inputMode="numeric"
              required
            />

            <TextInput
              label="Висота, см"
              value={form.shippingProfile.heightCm}
              onChange={(value) =>
                patchShippingProfile({
                  heightCm: value.replace(/\D/g, ""),
                })
              }
              placeholder="Наприклад: 8"
              inputMode="numeric"
              required
            />

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-neutral-800 lg:col-span-3">
              <p className="font-medium text-neutral-900">Обʼєм товару для Smart Box</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {form.shippingProfile.volumeCm3 !== null
                  ? `${form.shippingProfile.volumeCm3.toLocaleString()} cm³`
                  : "Не розраховано"}
              </p>
              <p className="mt-2 text-xs leading-5 text-neutral-600">
                Автоматично рахується як довжина × ширина × висота. У товарі зберігається тільки цей обʼєм; розмір коробки Smart Box визначає на checkout за всім кошиком.
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
              label="Вага, г"
              value={form.shippingProfile.weightGrams}
              onChange={(value) =>
                patchShippingProfile({
                  weightGrams: value.replace(/\D/g, ""),
                })
              }
              placeholder="Якщо не задано — залиш порожнім"
              inputMode="numeric"
            />

            <TextInput
              label="Тип пакування"
              value={form.shippingProfile.packageType}
              onChange={(value) => patchShippingProfile({ packageType: value })}
              placeholder="standard"
            />

            <TextInput
              label="Температурний режим"
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
          title="Зображення"
          description="Головне зображення використовується в картці товару, на сторінці товару й у checkout."
        >
          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-neutral-200 bg-[#fffaf2] p-4">
              <p className="text-sm font-medium text-neutral-900">Перегляд</p>
              <div className="mt-4 aspect-square overflow-hidden rounded-2xl bg-white">
                {mainImagePreview?.url ? (
                  <img
                    src={mainImagePreview.url}
                    alt={mainImagePreview.alt || form.name || "Перегляд товару"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                    Немає зображення
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
                      label="Alt-текст"
                      value={image.alt}
                      onChange={(value) => updateImage(index, { alt: value })}
                      placeholder="Опис зображення"
                    />

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-neutral-800">Роль</span>
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
                      label="Порядок"
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
                        Видалити
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
                Додати зображення
              </button>
            </div>
          </div>
        </Section>

        <Section
          id="faq"
          title="FAQ"
          description="Q&A для окремого товару. Публічна частина ще не підключена, але модель даних уже готова."
        >
          <div className="grid gap-4">
            {form.faqItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-500">
                FAQ ще не додано.
              </div>
            ) : null}

            {form.faqItems.map((item, index) => (
              <div key={index} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="grid gap-4">
                  <TextInput
                    label="Питання"
                    value={item.question}
                    onChange={(value) => updateFaq(index, { question: value })}
                    placeholder="Питання"
                  />

                  <TextArea
                    label="Відповідь"
                    value={item.answer}
                    onChange={(value) => updateFaq(index, { answer: value })}
                    placeholder="Відповідь"
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
                      Показувати
                    </label>

                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Видалити FAQ
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
              Додати FAQ
            </button>
          </div>
        </Section>

        <Section
          id="seo"
          title="SEO"
          description="Допоміжні дані для OG, пошуку й canonical."
        >
          <div className="grid gap-5">
            <TextInput
              label="SEO-заголовок"
              value={form.seoTitle}
              onChange={(value) => patchForm({ seoTitle: value })}
              placeholder="Назва товару | Sonyachna"
            />

            <TextArea
              label="SEO-опис"
              value={form.seoDescription}
              onChange={(value) => patchForm({ seoDescription: value })}
              rows={3}
              placeholder="Опис для пошукової видачі та OG"
            />

            <TextInput
              label="Canonical Slug"
              value={form.canonicalSlug}
              onChange={(value) =>
                patchForm({ canonicalSlug: normalizeSlugInput(value) })
              }
              placeholder="Зазвичай можна залишити порожнім"
            />
          </div>
        </Section>

        <div className="sticky bottom-4 z-30 rounded-2xl border border-neutral-200 bg-white/94 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-600">
              {mode === "new"
                ? "Новий товар буде збережено в каталозі Neon."
                : "Зміни буде збережено в каталозі товарів і записано в audit log."}
            </div>

            <div className="flex gap-3">
              <Link
                href="/admin/products"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Скасувати
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-950 px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}

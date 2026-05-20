export type ShippingSize = 60 | 80 | 100 | 120 | 140 | 160 | 170

export type JapanPostZone =
  | "aichi"
  | "hokkaido"
  | "tohoku"
  | "kanto_shinetsu_hokuriku_tokai_kinki"
  | "chugoku_shikoku"
  | "kyushu"
  | "okinawa"

export type ShippingCartItem = {
  id: string
  quantity: number
  shippingProfile?: ProductShippingProfile | null
}

export type ProductShippingProfile = {
  sizeClass: ShippingSize
  volumeUnits: number
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  volumeCm3?: number | null
  weightGrams?: number | null
}

export type SmartBoxType = 50 | 60 | 80 | 100

export type SmartBoxDefinition = {
  boxType: SmartBoxType
  label: string
  shippingSizeClass: ShippingSize
  outerLengthMm: number
  outerWidthMm: number
  outerHeightMm: number
  innerLengthMm: number
  innerWidthMm: number
  innerHeightMm: number
  innerLengthCm: number
  innerWidthCm: number
  innerHeightCm: number
  innerVolumeCm3: number
  usableVolumeCm3: number
}

export type SmartBoxSelection = {
  box: SmartBoxDefinition
  shippingSize: ShippingSize
  totalVolumeCm3: number
  usableVolumeCm3: number
  remainingVolumeCm3: number
  fillPercent: number
}

export type JapanPostShippingQuote = {
  originPrefecture: "愛知県"
  destinationPrefecture: string
  zone: JapanPostZone
  size: ShippingSize
  amount: number
  carrier: "日本郵便"
  service: "ゆうパック"
}

const SHIPPING_ORIGIN_PREFECTURE = "愛知県" as const

const SHIPPING_SIZES: ShippingSize[] = [60, 80, 100, 120, 140, 160, 170]

export const SMART_BOX_USABLE_VOLUME_RATIO = 0.95

function calculateUsableVolume(innerVolumeCm3: number) {
  return Math.floor(innerVolumeCm3 * SMART_BOX_USABLE_VOLUME_RATIO)
}

export const SMART_BOXES: SmartBoxDefinition[] = [
  {
    boxType: 50,
    label: "50 box",
    shippingSizeClass: 60,
    outerLengthMm: 207,
    outerWidthMm: 173,
    outerHeightMm: 112,
    innerLengthMm: 201,
    innerWidthMm: 167,
    innerHeightMm: 102,
    innerLengthCm: 20.1,
    innerWidthCm: 16.7,
    innerHeightCm: 10.2,
    innerVolumeCm3: 3425,
    usableVolumeCm3: calculateUsableVolume(3425),
  },
  {
    boxType: 60,
    label: "60 box",
    shippingSizeClass: 60,
    outerLengthMm: 266,
    outerWidthMm: 196,
    outerHeightMm: 120,
    innerLengthMm: 260,
    innerWidthMm: 190,
    innerHeightMm: 110,
    innerLengthCm: 26,
    innerWidthCm: 19,
    innerHeightCm: 11,
    innerVolumeCm3: 5434,
    usableVolumeCm3: calculateUsableVolume(5434),
  },
  {
    boxType: 80,
    label: "80 box",
    shippingSizeClass: 80,
    outerLengthMm: 320,
    outerWidthMm: 227,
    outerHeightMm: 151,
    innerLengthMm: 314,
    innerWidthMm: 221,
    innerHeightMm: 141,
    innerLengthCm: 31.4,
    innerWidthCm: 22.1,
    innerHeightCm: 14.1,
    innerVolumeCm3: 9790,
    usableVolumeCm3: calculateUsableVolume(9790),
  },
  {
    boxType: 100,
    label: "100 box",
    shippingSizeClass: 100,
    outerLengthMm: 383,
    outerWidthMm: 273,
    outerHeightMm: 294,
    innerLengthMm: 377,
    innerWidthMm: 267,
    innerHeightMm: 284,
    innerLengthCm: 37.7,
    innerWidthCm: 26.7,
    innerHeightCm: 28.4,
    innerVolumeCm3: 28597,
    usableVolumeCm3: calculateUsableVolume(28597),
  },
]

const JAPAN_POST_RATES_FROM_AICHI: Record<
  JapanPostZone,
  Record<ShippingSize, number>
> = {
  aichi: {
    60: 820,
    80: 1130,
    100: 1450,
    120: 1770,
    140: 2120,
    160: 2450,
    170: 3000,
  },
  hokkaido: {
    60: 1590,
    80: 1890,
    100: 2190,
    120: 2500,
    140: 2850,
    160: 3170,
    170: 4860,
  },
  tohoku: {
    60: 990,
    80: 1310,
    100: 1620,
    120: 1940,
    140: 2300,
    160: 2610,
    170: 3750,
  },
  kanto_shinetsu_hokuriku_tokai_kinki: {
    60: 880,
    80: 1200,
    100: 1500,
    120: 1830,
    140: 2170,
    160: 2500,
    170: 3070,
  },
  chugoku_shikoku: {
    60: 990,
    80: 1310,
    100: 1620,
    120: 1940,
    140: 2300,
    160: 2610,
    170: 3750,
  },
  kyushu: {
    60: 1150,
    80: 1440,
    100: 1780,
    120: 2080,
    140: 2440,
    160: 2750,
    170: 3890,
  },
  okinawa: {
    60: 1450,
    80: 1810,
    100: 2160,
    120: 2490,
    140: 2860,
    160: 3180,
    170: 4350,
  },
}

const PREFECTURE_TO_ZONE: Record<string, JapanPostZone> = {
  北海道: "hokkaido",
  青森県: "tohoku",
  岩手県: "tohoku",
  宮城県: "tohoku",
  秋田県: "tohoku",
  山形県: "tohoku",
  福島県: "tohoku",

  茨城県: "kanto_shinetsu_hokuriku_tokai_kinki",
  栃木県: "kanto_shinetsu_hokuriku_tokai_kinki",
  群馬県: "kanto_shinetsu_hokuriku_tokai_kinki",
  埼玉県: "kanto_shinetsu_hokuriku_tokai_kinki",
  千葉県: "kanto_shinetsu_hokuriku_tokai_kinki",
  東京都: "kanto_shinetsu_hokuriku_tokai_kinki",
  神奈川県: "kanto_shinetsu_hokuriku_tokai_kinki",
  山梨県: "kanto_shinetsu_hokuriku_tokai_kinki",

  新潟県: "kanto_shinetsu_hokuriku_tokai_kinki",
  長野県: "kanto_shinetsu_hokuriku_tokai_kinki",
  富山県: "kanto_shinetsu_hokuriku_tokai_kinki",
  石川県: "kanto_shinetsu_hokuriku_tokai_kinki",
  福井県: "kanto_shinetsu_hokuriku_tokai_kinki",

  静岡県: "kanto_shinetsu_hokuriku_tokai_kinki",
  岐阜県: "kanto_shinetsu_hokuriku_tokai_kinki",
  愛知県: "aichi",
  三重県: "kanto_shinetsu_hokuriku_tokai_kinki",

  滋賀県: "kanto_shinetsu_hokuriku_tokai_kinki",
  京都府: "kanto_shinetsu_hokuriku_tokai_kinki",
  大阪府: "kanto_shinetsu_hokuriku_tokai_kinki",
  兵庫県: "kanto_shinetsu_hokuriku_tokai_kinki",
  奈良県: "kanto_shinetsu_hokuriku_tokai_kinki",
  和歌山県: "kanto_shinetsu_hokuriku_tokai_kinki",

  鳥取県: "chugoku_shikoku",
  島根県: "chugoku_shikoku",
  岡山県: "chugoku_shikoku",
  広島県: "chugoku_shikoku",
  山口県: "chugoku_shikoku",
  徳島県: "chugoku_shikoku",
  香川県: "chugoku_shikoku",
  愛媛県: "chugoku_shikoku",
  高知県: "chugoku_shikoku",

  福岡県: "kyushu",
  佐賀県: "kyushu",
  長崎県: "kyushu",
  熊本県: "kyushu",
  大分県: "kyushu",
  宮崎県: "kyushu",
  鹿児島県: "kyushu",

  沖縄県: "okinawa",
}

const PRODUCT_SHIPPING_PROFILES: Record<string, ProductShippingProfile> = {
  "1": {
    sizeClass: 60,
    volumeUnits: 2,
    lengthCm: 15,
    widthCm: 10,
    heightCm: 8,
    volumeCm3: 1200,
    weightGrams: 650,
  },
  "2": {
    sizeClass: 60,
    volumeUnits: 2,
    lengthCm: 15,
    widthCm: 10,
    heightCm: 8,
    volumeCm3: 1200,
    weightGrams: 650,
  },
  "3": {
    sizeClass: 60,
    volumeUnits: 3,
    lengthCm: 18,
    widthCm: 12,
    heightCm: 9,
    volumeCm3: 1944,
    weightGrams: 900,
  },
  "4": {
    sizeClass: 60,
    volumeUnits: 1,
    lengthCm: 12,
    widthCm: 8,
    heightCm: 6,
    volumeCm3: 576,
    weightGrams: 250,
  },
  "5": {
    sizeClass: 60,
    volumeUnits: 1,
    lengthCm: 10,
    widthCm: 8,
    heightCm: 5,
    volumeCm3: 400,
    weightGrams: 180,
  },
  "6": {
    sizeClass: 60,
    volumeUnits: 1,
    lengthCm: 10,
    widthCm: 8,
    heightCm: 5,
    volumeCm3: 400,
    weightGrams: 160,
  },
}

function normalizePrefecture(value: string) {
  return value.trim().replace(/\s/g, "")
}

function getNextAvailableSize(size: number): ShippingSize {
  for (const shippingSize of SHIPPING_SIZES) {
    if (size <= shippingSize) {
      return shippingSize
    }
  }

  return 170
}

function getSizeFromVolumeUnits(volumeUnits: number): ShippingSize {
  if (volumeUnits <= 2) return 60
  if (volumeUnits <= 5) return 80
  if (volumeUnits <= 8) return 100
  if (volumeUnits <= 12) return 120
  if (volumeUnits <= 16) return 140
  if (volumeUnits <= 20) return 160
  return 170
}

function getShippingProfileForCartItem(item: ShippingCartItem) {
  return item.shippingProfile ?? getProductShippingProfile(item.id)
}

export function getProductShippingProfile(productId: string) {
  return (
    PRODUCT_SHIPPING_PROFILES[productId] ?? {
      sizeClass: 60,
      volumeUnits: 1,
      lengthCm: null,
      widthCm: null,
      heightCm: null,
      volumeCm3: null,
    }
  )
}

export function getJapanPostZoneByPrefecture(prefecture: string): JapanPostZone {
  const normalizedPrefecture = normalizePrefecture(prefecture)
  const zone = PREFECTURE_TO_ZONE[normalizedPrefecture]

  if (!zone) {
    throw new Error(`Unsupported destination prefecture: ${prefecture}`)
  }

  return zone
}

function getProfileVolumeCm3(profile: ProductShippingProfile) {
  if (typeof profile.volumeCm3 === "number" && profile.volumeCm3 > 0) {
    return profile.volumeCm3
  }

  if (
    typeof profile.lengthCm === "number" &&
    profile.lengthCm > 0 &&
    typeof profile.widthCm === "number" &&
    profile.widthCm > 0 &&
    typeof profile.heightCm === "number" &&
    profile.heightCm > 0
  ) {
    return profile.lengthCm * profile.widthCm * profile.heightCm
  }

  return null
}

function canSingleProductFitBox(
  profile: ProductShippingProfile,
  box: SmartBoxDefinition
) {
  if (
    typeof profile.lengthCm !== "number" ||
    typeof profile.widthCm !== "number" ||
    typeof profile.heightCm !== "number" ||
    profile.lengthCm <= 0 ||
    profile.widthCm <= 0 ||
    profile.heightCm <= 0
  ) {
    return true
  }

  const productSides = [profile.lengthCm, profile.widthCm, profile.heightCm].sort(
    (a, b) => b - a
  )
  const boxSides = [box.innerLengthCm, box.innerWidthCm, box.innerHeightCm].sort(
    (a, b) => b - a
  )

  return productSides.every((side, index) => side <= boxSides[index])
}

export function calculateSmartBoxSelection(
  items: ShippingCartItem[]
): SmartBoxSelection {
  let totalVolumeCm3 = 0
  let fallbackVolumeUnits = 0
  let largestSize: ShippingSize = 60
  const profiles: ProductShippingProfile[] = []

  for (const item of items) {
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const profile = getShippingProfileForCartItem(item)
    const volumeCm3 = getProfileVolumeCm3(profile)

    profiles.push(profile)

    if (volumeCm3 !== null) {
      totalVolumeCm3 += volumeCm3 * quantity
    } else {
      fallbackVolumeUnits += Math.max(1, profile.volumeUnits || 1) * quantity
    }

    if (profile.sizeClass > largestSize) {
      largestSize = profile.sizeClass
    }
  }

  if (totalVolumeCm3 <= 0 && fallbackVolumeUnits > 0) {
    const fallbackSize = getSizeFromVolumeUnits(fallbackVolumeUnits)
    const fallbackBox =
      SMART_BOXES.find((box) => box.shippingSizeClass >= fallbackSize) ??
      SMART_BOXES[SMART_BOXES.length - 1]

    return {
      box: fallbackBox,
      shippingSize: getNextAvailableSize(Math.max(largestSize, fallbackBox.shippingSizeClass)),
      totalVolumeCm3: fallbackBox.usableVolumeCm3,
      usableVolumeCm3: fallbackBox.usableVolumeCm3,
      remainingVolumeCm3: 0,
      fillPercent: 100,
    }
  }

  const selectedBox =
    SMART_BOXES.find(
      (box) =>
        totalVolumeCm3 <= box.usableVolumeCm3 &&
        profiles.every((profile) => canSingleProductFitBox(profile, box))
    ) ?? SMART_BOXES[SMART_BOXES.length - 1]

  const remainingVolumeCm3 = Math.max(
    0,
    selectedBox.usableVolumeCm3 - totalVolumeCm3
  )
  const fillPercent = Math.min(
    100,
    Math.round((totalVolumeCm3 / selectedBox.usableVolumeCm3) * 100)
  )

  return {
    box: selectedBox,
    shippingSize: getNextAvailableSize(
      Math.max(largestSize, selectedBox.shippingSizeClass)
    ),
    totalVolumeCm3,
    usableVolumeCm3: selectedBox.usableVolumeCm3,
    remainingVolumeCm3,
    fillPercent,
  }
}

export function calculateCartShippingSize(items: ShippingCartItem[]): ShippingSize {
  if (items.length === 0) {
    return 60
  }

  return calculateSmartBoxSelection(items).shippingSize
}

export function getJapanPostRate({
  zone,
  size,
}: {
  zone: JapanPostZone
  size: ShippingSize
}) {
  return JAPAN_POST_RATES_FROM_AICHI[zone][size]
}

export function calculateJapanPostShipping({
  destinationPrefecture,
  items,
}: {
  destinationPrefecture: string
  items: ShippingCartItem[]
}): JapanPostShippingQuote {
  const normalizedPrefecture = normalizePrefecture(destinationPrefecture)
  const zone = getJapanPostZoneByPrefecture(normalizedPrefecture)
  const size = calculateCartShippingSize(items)
  const amount = getJapanPostRate({ zone, size })

  return {
    originPrefecture: SHIPPING_ORIGIN_PREFECTURE,
    destinationPrefecture: normalizedPrefecture,
    zone,
    size,
    amount,
    carrier: "日本郵便",
    service: "ゆうパック",
  }
}

export function getShippingEstimateRange(items: ShippingCartItem[]) {
  const size = calculateCartShippingSize(items)
  const rates = Object.values(JAPAN_POST_RATES_FROM_AICHI).map((zoneRates) => zoneRates[size])

  return {
    originPrefecture: SHIPPING_ORIGIN_PREFECTURE,
    size,
    min: Math.min(...rates),
    max: Math.max(...rates),
    carrier: "日本郵便" as const,
    service: "ゆうパック" as const,
  }
}


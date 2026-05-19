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
  weightGrams?: number
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
    weightGrams: 650,
  },
  "2": {
    sizeClass: 60,
    volumeUnits: 2,
    weightGrams: 650,
  },
  "3": {
    sizeClass: 60,
    volumeUnits: 3,
    weightGrams: 900,
  },
  "4": {
    sizeClass: 60,
    volumeUnits: 1,
    weightGrams: 250,
  },
  "5": {
    sizeClass: 60,
    volumeUnits: 1,
    weightGrams: 180,
  },
  "6": {
    sizeClass: 60,
    volumeUnits: 1,
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

export function calculateCartShippingSize(items: ShippingCartItem[]): ShippingSize {
  if (items.length === 0) {
    return 60
  }

  let totalVolumeUnits = 0
  let largestSize: ShippingSize = 60

  for (const item of items) {
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const profile = getShippingProfileForCartItem(item)

    totalVolumeUnits += profile.volumeUnits * quantity

    if (profile.sizeClass > largestSize) {
      largestSize = profile.sizeClass
    }
  }

  const volumeSize = getSizeFromVolumeUnits(totalVolumeUnits)

  return getNextAvailableSize(Math.max(largestSize, volumeSize))
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


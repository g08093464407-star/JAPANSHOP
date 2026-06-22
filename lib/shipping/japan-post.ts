import {
  YU_PACK_RATES_FROM_AICHI,
  getYuPackRateFromAichi,
  getYuPackZoneByPrefecture,
  normalizeYuPackPrefecture,
  type YuPackShippingSize,
  type YuPackZone,
} from "./yu-pack-rates"

export type ShippingSize = YuPackShippingSize

export type JapanPostZone = YuPackZone

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
  totalWeightGrams: number
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
  return getYuPackZoneByPrefecture(prefecture)
}

export function getProfileVolumeCm3(profile: ProductShippingProfile) {
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

export function canSingleProductFitBox(
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


export function getSmallestSmartBoxForProfile(profile: ProductShippingProfile) {
  const volumeCm3 = getProfileVolumeCm3(profile)

  if (volumeCm3 === null) {
    return SMART_BOXES[0]
  }

  return (
    SMART_BOXES.find(
      (box) =>
        volumeCm3 <= box.usableVolumeCm3 && canSingleProductFitBox(profile, box)
    ) ?? SMART_BOXES[SMART_BOXES.length - 1]
  )
}

export function calculateSmartBoxSelection(
  items: ShippingCartItem[]
): SmartBoxSelection {
  let totalVolumeCm3 = 0
  let fallbackVolumeUnits = 0
  let totalWeightGrams = 0
  const profiles: ProductShippingProfile[] = []

  for (const item of items) {
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const profile = getShippingProfileForCartItem(item)
    const volumeCm3 = getProfileVolumeCm3(profile)

    profiles.push(profile)

    if (typeof profile.weightGrams === "number" && profile.weightGrams > 0) {
      totalWeightGrams += profile.weightGrams * quantity
    }

    if (volumeCm3 !== null) {
      totalVolumeCm3 += volumeCm3 * quantity
    } else {
      fallbackVolumeUnits += Math.max(1, profile.volumeUnits || 1) * quantity
    }

  }

  if (totalVolumeCm3 <= 0 && fallbackVolumeUnits > 0) {
    const fallbackSize = getSizeFromVolumeUnits(fallbackVolumeUnits)
    const fallbackBox =
      SMART_BOXES.find((box) => box.shippingSizeClass >= fallbackSize) ??
      SMART_BOXES[SMART_BOXES.length - 1]

    return {
      box: fallbackBox,
      shippingSize: fallbackBox.shippingSizeClass,
      totalVolumeCm3: fallbackBox.usableVolumeCm3,
      usableVolumeCm3: fallbackBox.usableVolumeCm3,
      remainingVolumeCm3: 0,
      fillPercent: 100,
      totalWeightGrams,
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
    shippingSize: selectedBox.shippingSizeClass,
    totalVolumeCm3,
    usableVolumeCm3: selectedBox.usableVolumeCm3,
    remainingVolumeCm3,
    fillPercent,
    totalWeightGrams,
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
  return getYuPackRateFromAichi({ zone, size })
}

export function calculateJapanPostShipping({
  destinationPrefecture,
  items,
}: {
  destinationPrefecture: string
  items: ShippingCartItem[]
}): JapanPostShippingQuote {
  const normalizedPrefecture = normalizeYuPackPrefecture(destinationPrefecture)
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
  const rates = Object.values(YU_PACK_RATES_FROM_AICHI).map(
    (zoneRates) => zoneRates[size]
  )

  return {
    originPrefecture: SHIPPING_ORIGIN_PREFECTURE,
    size,
    min: Math.min(...rates),
    max: Math.max(...rates),
    carrier: "日本郵便" as const,
    service: "ゆうパック" as const,
  }
}

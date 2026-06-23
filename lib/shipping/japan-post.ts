import {
  YU_PACK_RATES_FROM_AICHI,
  getYuPackRateFromAichi,
  getYuPackZoneByPrefecture,
  normalizeYuPackPrefecture,
  type YuPackShippingSize,
  type YuPackZone,
} from "./yu-pack-rates"
import {
  calculateSmartBoxSelection,
  type ShippingCartItem,
} from "./packing-engine"

export {
  SMART_BOXES,
  SMART_BOX_USABLE_VOLUME_RATIO,
  calculateSmartBoxSelection,
  canSingleProductFitBox,
  getProductShippingProfile,
  getProfileVolumeCm3,
  getSmallestSmartBoxForProfile,
} from "./packing-engine"
export type {
  ProductShippingProfile,
  ShippingCartItem,
  SmartBoxDefinition,
  SmartBoxSelection,
  SmartBoxType,
} from "./packing-engine"

export type ShippingSize = YuPackShippingSize

export type JapanPostZone = YuPackZone

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

export function getJapanPostZoneByPrefecture(prefecture: string): JapanPostZone {
  return getYuPackZoneByPrefecture(prefecture)
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

export function calculateCartShippingSize(
  items: ShippingCartItem[]
): ShippingSize {
  if (items.length === 0) {
    return 60
  }

  return calculateSmartBoxSelection(items).shippingSize
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

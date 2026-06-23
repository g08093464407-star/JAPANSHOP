import {
  calculateSmartBoxSelection,
  type ShippingCartItem,
  type SmartBoxType,
} from "./packing-engine"
import type { ShippingOption } from "./packing-types"
import {
  YU_PACK_RATE_TABLE_VERSION,
  getYuPackRateFromAichi,
  getYuPackZoneByPrefecture,
  normalizeYuPackPrefecture,
} from "./yu-pack-rates"

export const SHIPPING_ALGORITHM_VERSION = "yu-pack-smart-box-v1"

const SMART_BOX_PACKAGE_TEMPLATE_IDS: Record<SmartBoxType, string> = {
  50: "smart-box-50",
  60: "smart-box-60",
  80: "smart-box-80",
  100: "smart-box-100",
}

export function calculateYuPackShippingOption({
  destinationPrefecture,
  items,
}: {
  destinationPrefecture: string
  items: ShippingCartItem[]
}): ShippingOption {
  const normalizedDestinationPrefecture =
    normalizeYuPackPrefecture(destinationPrefecture)
  const zone = getYuPackZoneByPrefecture(normalizedDestinationPrefecture)
  const selection = calculateSmartBoxSelection(items)
  const deliveryFeeYen = getYuPackRateFromAichi({
    zone,
    size: selection.shippingSize,
  })

  return {
    carrier: "jp_post",
    service: "yu_pack",
    packageTemplateId: SMART_BOX_PACKAGE_TEMPLATE_IDS[selection.box.boxType],
    destinationPrefecture: normalizedDestinationPrefecture,
    zone,
    deliveryFeeYen,
    materialCostYen: 0,
    customerShippingTotalYen: deliveryFeeYen,
    rateTableVersion: YU_PACK_RATE_TABLE_VERSION,
    algorithmVersion: SHIPPING_ALGORITHM_VERSION,
    selectedReason: "Selected Yu-Pack from Smart Box size.",
    rejectedAlternatives: [],
  }
}

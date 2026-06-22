export type ShippingCarrier = "jp_post" | "yamato"

export type ShippingService = "click_post" | "ta_q_bin_compact" | "yu_pack"

export type PackageKind = "envelope" | "compact_box" | "parcel_box"

export type PackingConfidence = "exact" | "estimated" | "manual_review"

export type PackageDimensionsCm = {
  length: number
  width: number
  height: number
}

export type PackageTemplate = {
  id: string
  kind: PackageKind
  label: string
  carrierIndependent: boolean
  innerDimensionsCm?: PackageDimensionsCm | null
  outerDimensionsCm?: PackageDimensionsCm | null
  maxWeightGrams: number | null
  usableVolumeFactor: number
  materialCostYen?: number
  notes?: string
}

export type PackingRejectedReason = {
  code: string
  message: string
}

export type PackingUpsellCapacity = {
  remainingVolumeCm3?: number | null
  remainingWeightGrams?: number | null
  remainingThicknessCm?: number | null
  canSuggestWithoutTierChange: boolean
}

export type PackingCandidate = {
  packageTemplateId: string
  kind: PackageKind
  label: string
  innerDimensionsCm?: PackageDimensionsCm | null
  outerDimensionsCm?: PackageDimensionsCm | null
  maxWeightGrams: number | null
  totalVolumeCm3: number | null
  totalWeightGrams: number | null
  remainingVolumeCm3: number | null
  remainingWeightGrams: number | null
  remainingThicknessCm?: number | null
  fillPercent: number | null
  confidence: PackingConfidence
  rejectedReasons: PackingRejectedReason[]
  upsellCapacity: PackingUpsellCapacity
}

export type ShippingRejectedAlternative = {
  carrier: ShippingCarrier
  service: ShippingService
  packageTemplateId?: string
  reason: string
}

export type ShippingOption = {
  carrier: ShippingCarrier
  service: ShippingService
  packageTemplateId: string
  destinationPrefecture: string
  zone: string
  deliveryFeeYen: number
  materialCostYen: number
  customerShippingTotalYen: number
  rateTableVersion: string
  algorithmVersion: string
  selectedReason: string
  rejectedAlternatives: ShippingRejectedAlternative[]
}

export type ShippingSelectionSnapshotDraft = {
  carrier: ShippingCarrier
  service: ShippingService
  packageTemplateId: string
  packageKind: PackageKind
  packageLabel: string
  deliveryFeeYen: number
  materialCostYen: number
  customerShippingTotalYen: number
  rateTableVersion: string
  algorithmVersion: string
  selectedReason: string
  rejectedAlternatives: ShippingRejectedAlternative[]
}

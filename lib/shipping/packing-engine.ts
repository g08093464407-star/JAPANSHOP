import {
  SMART_BOX_PACKAGE_TEMPLATES,
  SMART_BOX_USABLE_VOLUME_FACTOR,
} from "./package-templates"
import type { YuPackShippingSize } from "./yu-pack-rates"

export type ProductShippingProfile = {
  sizeClass: YuPackShippingSize
  volumeUnits: number
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  volumeCm3?: number | null
  weightGrams?: number | null
}

export type ShippingCartItem = {
  id: string
  quantity: number
  shippingProfile?: ProductShippingProfile | null
}

export type SmartBoxType = 50 | 60 | 80 | 100

export type SmartBoxDefinition = {
  boxType: SmartBoxType
  label: string
  shippingSizeClass: YuPackShippingSize
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
  shippingSize: YuPackShippingSize
  totalVolumeCm3: number
  usableVolumeCm3: number
  remainingVolumeCm3: number
  fillPercent: number
  totalWeightGrams: number
}

export const SMART_BOX_USABLE_VOLUME_RATIO = SMART_BOX_USABLE_VOLUME_FACTOR

type SmartBoxPackageTemplateId =
  (typeof SMART_BOX_PACKAGE_TEMPLATES)[number]["id"]

const SMART_BOX_LEGACY_FIELDS: Record<
  SmartBoxPackageTemplateId,
  { boxType: SmartBoxType; shippingSizeClass: YuPackShippingSize }
> = {
  "smart-box-50": { boxType: 50, shippingSizeClass: 60 },
  "smart-box-60": { boxType: 60, shippingSizeClass: 60 },
  "smart-box-80": { boxType: 80, shippingSizeClass: 80 },
  "smart-box-100": { boxType: 100, shippingSizeClass: 100 },
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

function dimensionsCmToMm(value: number) {
  return Math.round(value * 10)
}

function buildSmartBoxDefinition(
  template: (typeof SMART_BOX_PACKAGE_TEMPLATES)[number]
): SmartBoxDefinition {
  const legacyFields = SMART_BOX_LEGACY_FIELDS[template.id]

  if (!legacyFields) {
    throw new Error(
      `Missing Smart Box legacy mapping for package template: ${template.id}`
    )
  }

  if (!template.innerDimensionsCm) {
    throw new Error(
      `Missing Smart Box inner dimensions for package template: ${template.id}`
    )
  }

  if (!template.outerDimensionsCm) {
    throw new Error(
      `Missing Smart Box outer dimensions for package template: ${template.id}`
    )
  }

  if (typeof template.innerVolumeCm3 !== "number") {
    throw new Error(
      `Missing Smart Box inner volume for package template: ${template.id}`
    )
  }

  return {
    boxType: legacyFields.boxType,
    label: template.label,
    shippingSizeClass: legacyFields.shippingSizeClass,
    outerLengthMm: dimensionsCmToMm(template.outerDimensionsCm.length),
    outerWidthMm: dimensionsCmToMm(template.outerDimensionsCm.width),
    outerHeightMm: dimensionsCmToMm(template.outerDimensionsCm.height),
    innerLengthMm: dimensionsCmToMm(template.innerDimensionsCm.length),
    innerWidthMm: dimensionsCmToMm(template.innerDimensionsCm.width),
    innerHeightMm: dimensionsCmToMm(template.innerDimensionsCm.height),
    innerLengthCm: template.innerDimensionsCm.length,
    innerWidthCm: template.innerDimensionsCm.width,
    innerHeightCm: template.innerDimensionsCm.height,
    innerVolumeCm3: template.innerVolumeCm3,
    usableVolumeCm3: Math.floor(
      template.innerVolumeCm3 * template.usableVolumeFactor
    ),
  }
}

function getSizeFromVolumeUnits(volumeUnits: number): YuPackShippingSize {
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

export const SMART_BOXES: SmartBoxDefinition[] =
  SMART_BOX_PACKAGE_TEMPLATES.map(buildSmartBoxDefinition)

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

import type { PackageTemplate } from "./packing-types"
import { YAMATO_COMPACT_BOX_MATERIAL_COST_YEN } from "./yamato-compact-rates"

export const SMART_BOX_USABLE_VOLUME_FACTOR = 0.95

export const YAMATO_COMPACT_STANDARD_BOX_INNER_VOLUME_CM3 = 2240.437

export const SMART_BOX_PACKAGE_TEMPLATES = [
  {
    id: "smart-box-50",
    kind: "parcel_box",
    label: "50 box",
    carrierIndependent: true,
    innerDimensionsCm: {
      length: 20.1,
      width: 16.7,
      height: 10.2,
    },
    outerDimensionsCm: {
      length: 20.7,
      width: 17.3,
      height: 11.2,
    },
    innerVolumeCm3: 3425,
    maxWeightGrams: null,
    usableVolumeFactor: SMART_BOX_USABLE_VOLUME_FACTOR,
  },
  {
    id: "smart-box-60",
    kind: "parcel_box",
    label: "60 box",
    carrierIndependent: true,
    innerDimensionsCm: {
      length: 26,
      width: 19,
      height: 11,
    },
    outerDimensionsCm: {
      length: 26.6,
      width: 19.6,
      height: 12,
    },
    innerVolumeCm3: 5434,
    maxWeightGrams: null,
    usableVolumeFactor: SMART_BOX_USABLE_VOLUME_FACTOR,
  },
  {
    id: "smart-box-80",
    kind: "parcel_box",
    label: "80 box",
    carrierIndependent: true,
    innerDimensionsCm: {
      length: 31.4,
      width: 22.1,
      height: 14.1,
    },
    outerDimensionsCm: {
      length: 32,
      width: 22.7,
      height: 15.1,
    },
    innerVolumeCm3: 9790,
    maxWeightGrams: null,
    usableVolumeFactor: SMART_BOX_USABLE_VOLUME_FACTOR,
  },
  {
    id: "smart-box-100",
    kind: "parcel_box",
    label: "100 box",
    carrierIndependent: true,
    innerDimensionsCm: {
      length: 37.7,
      width: 26.7,
      height: 28.4,
    },
    outerDimensionsCm: {
      length: 38.3,
      width: 27.3,
      height: 29.4,
    },
    innerVolumeCm3: 28597,
    maxWeightGrams: null,
    usableVolumeFactor: SMART_BOX_USABLE_VOLUME_FACTOR,
  },
] as const satisfies readonly PackageTemplate[]

export const YAMATO_COMPACT_PACKAGE_TEMPLATES = [
  {
    id: "yamato-compact-box",
    kind: "compact_box",
    label: "Yamato TA-Q-BIN Compact box",
    carrierIndependent: false,
    innerDimensionsCm: {
      length: 24.7,
      width: 19.3,
      height: 4.7,
    },
    outerDimensionsCm: {
      length: 25,
      width: 20,
      height: 5,
    },
    innerVolumeCm3: YAMATO_COMPACT_STANDARD_BOX_INNER_VOLUME_CM3,
    maxWeightGrams: null,
    usableVolumeFactor: 1,
    materialCostYen: YAMATO_COMPACT_BOX_MATERIAL_COST_YEN,
    notes: "Dedicated Yamato TA-Q-BIN Compact material.",
  },
] as const satisfies readonly PackageTemplate[]

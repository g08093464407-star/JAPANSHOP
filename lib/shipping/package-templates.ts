import type { PackageTemplate } from "./packing-types"

export const SMART_BOX_USABLE_VOLUME_FACTOR = 0.95

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

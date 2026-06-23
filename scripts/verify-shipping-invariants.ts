import assert from "node:assert/strict"

import {
  SMART_BOXES,
  calculateSmartBoxSelection,
  calculateJapanPostShipping,
  canSingleProductFitBox,
  getJapanPostRate,
  getJapanPostZoneByPrefecture,
  type ShippingCartItem,
  type ShippingSize,
} from "../lib/shipping/japan-post"
import { getSmartBoxPackingCandidates } from "../lib/shipping/packing-engine"
import {
  SHIPPING_ALGORITHM_VERSION,
  calculateYuPackShippingOption,
} from "../lib/shipping/shipping-engine"
import { YU_PACK_RATE_TABLE_VERSION } from "../lib/shipping/yu-pack-rates"
import {
  YAMATO_COMPACT_BOX_MATERIAL_COST_YEN,
  YAMATO_COMPACT_RATE_TABLE_VERSION,
  getYamatoCompactRateFromChubu,
  getYamatoCompactRegionByPrefecture,
} from "../lib/shipping/yamato-compact-rates"

const expectedSmartBoxes = [
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
    usableVolumeCm3: 3253,
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
    usableVolumeCm3: 5162,
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
    usableVolumeCm3: 9300,
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
    usableVolumeCm3: 27167,
  },
]

function pickSmartBoxInvariantFields(box: (typeof SMART_BOXES)[number]) {
  return {
    boxType: box.boxType,
    label: box.label,
    shippingSizeClass: box.shippingSizeClass,
    outerLengthMm: box.outerLengthMm,
    outerWidthMm: box.outerWidthMm,
    outerHeightMm: box.outerHeightMm,
    innerLengthMm: box.innerLengthMm,
    innerWidthMm: box.innerWidthMm,
    innerHeightMm: box.innerHeightMm,
    innerLengthCm: box.innerLengthCm,
    innerWidthCm: box.innerWidthCm,
    innerHeightCm: box.innerHeightCm,
    innerVolumeCm3: box.innerVolumeCm3,
    usableVolumeCm3: box.usableVolumeCm3,
  }
}

function shippingItem({
  id,
  sizeClass,
  volumeUnits,
  lengthCm,
  widthCm,
  heightCm,
  volumeCm3,
  weightGrams,
}: {
  id: string
  sizeClass: ShippingSize
  volumeUnits: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  volumeCm3?: number
  weightGrams?: number
}): ShippingCartItem {
  return {
    id,
    quantity: 1,
    shippingProfile: {
      sizeClass,
      volumeUnits,
      lengthCm,
      widthCm,
      heightCm,
      volumeCm3,
      weightGrams,
    },
  }
}

assert.deepEqual(
  SMART_BOXES.map(pickSmartBoxInvariantFields),
  expectedSmartBoxes
)

const rateCases = [
  { prefecture: "愛知県", size: 60, amount: 820 },
  { prefecture: "東京都", size: 60, amount: 880 },
  { prefecture: "北海道", size: 60, amount: 1590 },
  { prefecture: "宮城県", size: 80, amount: 1310 },
  { prefecture: "福岡県", size: 100, amount: 1780 },
  { prefecture: "沖縄県", size: 100, amount: 2160 },
] as const

for (const rateCase of rateCases) {
  const zone = getJapanPostZoneByPrefecture(rateCase.prefecture)
  assert.equal(
    getJapanPostRate({ zone, size: rateCase.size }),
    rateCase.amount
  )
}

assert.equal(
  getJapanPostZoneByPrefecture(" 東 京 都 "),
  getJapanPostZoneByPrefecture("東京都")
)

assert.throws(() => getJapanPostZoneByPrefecture("未対応県"))

assert.equal(getYamatoCompactRegionByPrefecture("愛知県"), "chubu")
assert.equal(getYamatoCompactRegionByPrefecture("東京都"), "kanto")
assert.equal(getYamatoCompactRegionByPrefecture("北海道"), "hokkaido")
assert.equal(getYamatoCompactRegionByPrefecture("沖縄県"), "okinawa")
assert.equal(
  getYamatoCompactRegionByPrefecture(" 東 京 都 "),
  getYamatoCompactRegionByPrefecture("東京都")
)
assert.throws(() => getYamatoCompactRegionByPrefecture("未対応県"))
assert.equal(
  getYamatoCompactRateFromChubu(
    getYamatoCompactRegionByPrefecture("愛知県")
  ),
  650
)
assert.equal(
  getYamatoCompactRateFromChubu(
    getYamatoCompactRegionByPrefecture("東京都")
  ),
  650
)
assert.equal(
  getYamatoCompactRateFromChubu(
    getYamatoCompactRegionByPrefecture("北海道")
  ),
  930
)
assert.equal(
  getYamatoCompactRateFromChubu(
    getYamatoCompactRegionByPrefecture("沖縄県")
  ),
  870
)
assert.equal(YAMATO_COMPACT_BOX_MATERIAL_COST_YEN, 70)
assert.equal(
  YAMATO_COMPACT_RATE_TABLE_VERSION,
  "yamato-compact-chubu-2025-10-01-cash"
)

const selectionCases = [
  {
    name: "small cart",
    item: shippingItem({
      id: "cart-a",
      lengthCm: 10,
      widthCm: 8,
      heightCm: 5,
      volumeCm3: 400,
      weightGrams: 100,
      sizeClass: 60,
      volumeUnits: 1,
    }),
    expectedBoxType: 50,
  },
  {
    name: "60 box cart",
    item: shippingItem({
      id: "cart-b",
      lengthCm: 20,
      widthCm: 15,
      heightCm: 11,
      volumeCm3: 3300,
      weightGrams: 200,
      sizeClass: 60,
      volumeUnits: 1,
    }),
    expectedBoxType: 60,
  },
  {
    name: "80 box cart",
    item: shippingItem({
      id: "cart-c",
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      volumeCm3: 6000,
      weightGrams: 300,
      sizeClass: 80,
      volumeUnits: 1,
    }),
    expectedBoxType: 80,
  },
  {
    name: "100 box cart",
    item: shippingItem({
      id: "cart-d",
      lengthCm: 35,
      widthCm: 24,
      heightCm: 14,
      volumeCm3: 12000,
      weightGrams: 500,
      sizeClass: 100,
      volumeUnits: 1,
    }),
    expectedBoxType: 100,
  },
  {
    name: "too long for 50 box",
    item: shippingItem({
      id: "cart-e",
      lengthCm: 25,
      widthCm: 10,
      heightCm: 4,
      volumeCm3: 1000,
      weightGrams: 100,
      sizeClass: 60,
      volumeUnits: 1,
    }),
    expectedBoxType: 60,
  },
] as const

for (const selectionCase of selectionCases) {
  assert.equal(
    calculateSmartBoxSelection([selectionCase.item]).box.boxType,
    selectionCase.expectedBoxType,
    `${selectionCase.name} selected an unexpected Smart Box`
  )
}

const smallCartCandidates = getSmartBoxPackingCandidates([selectionCases[0].item])

assert.equal(smallCartCandidates.length, 4)
assert.deepEqual(
  smallCartCandidates.map((candidate) => candidate.packageTemplateId),
  ["smart-box-50", "smart-box-60", "smart-box-80", "smart-box-100"]
)
assert.deepEqual(
  smallCartCandidates.map((candidate) => candidate.rejectedReasons),
  [[], [], [], []]
)
assert.equal(
  calculateSmartBoxSelection([selectionCases[0].item]).box.boxType,
  50
)

const eightyBoxCandidates = getSmartBoxPackingCandidates([
  selectionCases[2].item,
])

assert.equal(
  calculateSmartBoxSelection([selectionCases[2].item]).box.boxType,
  80
)
assert.deepEqual(
  eightyBoxCandidates.map(
    (candidate) => candidate.rejectedReasons.length === 0
  ),
  [false, false, true, true]
)
assert.ok(
  eightyBoxCandidates[0].rejectedReasons.some(
    (reason) => reason.code === "volume_exceeds_capacity"
  )
)
assert.ok(
  eightyBoxCandidates[1].rejectedReasons.some(
    (reason) => reason.code === "volume_exceeds_capacity"
  )
)

const hundredBoxCandidates = getSmartBoxPackingCandidates([
  selectionCases[3].item,
])

assert.equal(
  calculateSmartBoxSelection([selectionCases[3].item]).box.boxType,
  100
)
assert.deepEqual(
  hundredBoxCandidates.map(
    (candidate) => candidate.rejectedReasons.length === 0
  ),
  [false, false, false, true]
)

const fallbackSelection = calculateSmartBoxSelection([
  shippingItem({
    id: "cart-f",
    sizeClass: 80,
    volumeUnits: 3,
  }),
])

assert.equal(fallbackSelection.box.boxType, 80)
assert.equal(fallbackSelection.fillPercent, 100)

const smallCartYuPackOption = calculateYuPackShippingOption({
  destinationPrefecture: "愛知県",
  items: [selectionCases[0].item],
})

assert.equal(smallCartYuPackOption.carrier, "jp_post")
assert.equal(smallCartYuPackOption.service, "yu_pack")
assert.equal(smallCartYuPackOption.packageTemplateId, "smart-box-50")
assert.equal(smallCartYuPackOption.destinationPrefecture, "愛知県")
assert.equal(smallCartYuPackOption.zone, "aichi")
assert.equal(smallCartYuPackOption.deliveryFeeYen, 820)
assert.equal(smallCartYuPackOption.materialCostYen, 0)
assert.equal(smallCartYuPackOption.customerShippingTotalYen, 820)
assert.equal(smallCartYuPackOption.rateTableVersion, YU_PACK_RATE_TABLE_VERSION)
assert.equal(
  smallCartYuPackOption.algorithmVersion,
  SHIPPING_ALGORITHM_VERSION
)
assert.deepEqual(smallCartYuPackOption.rejectedAlternatives, [])
assert.equal(
  calculateJapanPostShipping({
    destinationPrefecture: "愛知県",
    items: [selectionCases[0].item],
  }).amount,
  smallCartYuPackOption.customerShippingTotalYen
)

const eightyBoxYuPackOption = calculateYuPackShippingOption({
  destinationPrefecture: "東京都",
  items: [selectionCases[2].item],
})

assert.equal(calculateSmartBoxSelection([selectionCases[2].item]).box.boxType, 80)
assert.equal(eightyBoxYuPackOption.packageTemplateId, "smart-box-80")
assert.equal(
  eightyBoxYuPackOption.zone,
  "kanto_shinetsu_hokuriku_tokai_kinki"
)
assert.equal(eightyBoxYuPackOption.deliveryFeeYen, 1200)
assert.equal(eightyBoxYuPackOption.customerShippingTotalYen, 1200)
assert.equal(
  calculateJapanPostShipping({
    destinationPrefecture: "東京都",
    items: [selectionCases[2].item],
  }).amount,
  eightyBoxYuPackOption.customerShippingTotalYen
)

const fiftyBox = SMART_BOXES.find((box) => box.boxType === 50)

assert.ok(fiftyBox)
assert.equal(
  canSingleProductFitBox(
    {
      sizeClass: 60,
      volumeUnits: 1,
      lengthCm: 20.1,
      widthCm: 16.7,
      heightCm: 10.2,
    },
    fiftyBox
  ),
  true
)
assert.equal(
  canSingleProductFitBox(
    {
      sizeClass: 60,
      volumeUnits: 1,
      lengthCm: 20.2,
      widthCm: 16.7,
      heightCm: 10.2,
    },
    fiftyBox
  ),
  false
)

console.log("Shipping invariants verified.")

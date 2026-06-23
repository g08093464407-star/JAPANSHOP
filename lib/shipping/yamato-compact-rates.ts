export type YamatoCompactRegion =
  | "hokkaido"
  | "kita_tohoku"
  | "minami_tohoku"
  | "kanto"
  | "shinetsu"
  | "hokuriku"
  | "chubu"
  | "kansai"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "okinawa"

export const YAMATO_COMPACT_RATE_TABLE_VERSION =
  "yamato-compact-chubu-2025-10-01-cash"

// Dedicated Yamato TA-Q-BIN Compact box cost, tax included.
export const YAMATO_COMPACT_BOX_MATERIAL_COST_YEN = 70

// Chubu-origin Yamato TA-Q-BIN Compact cash rates from the 2025-10-01 table.
export const YAMATO_COMPACT_RATES_FROM_CHUBU: Record<
  YamatoCompactRegion,
  number
> = {
  hokkaido: 930,
  kita_tohoku: 760,
  minami_tohoku: 710,
  kanto: 650,
  shinetsu: 650,
  hokuriku: 650,
  chubu: 650,
  kansai: 650,
  chugoku: 710,
  shikoku: 710,
  kyushu: 760,
  okinawa: 870,
}

export const PREFECTURE_TO_YAMATO_COMPACT_REGION: Record<
  string,
  YamatoCompactRegion
> = {
  北海道: "hokkaido",

  青森県: "kita_tohoku",
  岩手県: "kita_tohoku",
  秋田県: "kita_tohoku",

  宮城県: "minami_tohoku",
  山形県: "minami_tohoku",
  福島県: "minami_tohoku",

  茨城県: "kanto",
  栃木県: "kanto",
  群馬県: "kanto",
  埼玉県: "kanto",
  千葉県: "kanto",
  東京都: "kanto",
  神奈川県: "kanto",
  山梨県: "kanto",

  新潟県: "shinetsu",
  長野県: "shinetsu",

  富山県: "hokuriku",
  石川県: "hokuriku",
  福井県: "hokuriku",

  静岡県: "chubu",
  愛知県: "chubu",
  三重県: "chubu",
  岐阜県: "chubu",

  滋賀県: "kansai",
  京都府: "kansai",
  大阪府: "kansai",
  兵庫県: "kansai",
  奈良県: "kansai",
  和歌山県: "kansai",

  鳥取県: "chugoku",
  島根県: "chugoku",
  岡山県: "chugoku",
  広島県: "chugoku",
  山口県: "chugoku",

  徳島県: "shikoku",
  香川県: "shikoku",
  愛媛県: "shikoku",
  高知県: "shikoku",

  福岡県: "kyushu",
  佐賀県: "kyushu",
  長崎県: "kyushu",
  熊本県: "kyushu",
  大分県: "kyushu",
  宮崎県: "kyushu",
  鹿児島県: "kyushu",

  沖縄県: "okinawa",
}

export function normalizeYamatoPrefecture(value: string) {
  return value.trim().replace(/\s/g, "")
}

export function getYamatoCompactRegionByPrefecture(
  prefecture: string
): YamatoCompactRegion {
  const normalizedPrefecture = normalizeYamatoPrefecture(prefecture)
  const region = PREFECTURE_TO_YAMATO_COMPACT_REGION[normalizedPrefecture]

  if (!region) {
    throw new Error(
      `Unsupported Yamato Compact destination prefecture: ${prefecture}`
    )
  }

  return region
}

export function getYamatoCompactRateFromChubu(region: YamatoCompactRegion) {
  return YAMATO_COMPACT_RATES_FROM_CHUBU[region]
}

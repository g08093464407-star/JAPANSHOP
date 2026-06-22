export type YuPackShippingSize = 60 | 80 | 100 | 120 | 140 | 160 | 170

export type YuPackZone =
  | "aichi"
  | "hokkaido"
  | "tohoku"
  | "kanto_shinetsu_hokuriku_tokai_kinki"
  | "chugoku_shikoku"
  | "kyushu"
  | "okinawa"

export const YU_PACK_RATE_TABLE_VERSION = "yu-pack-aichi-v1"

export const YU_PACK_RATES_FROM_AICHI: Record<
  YuPackZone,
  Record<YuPackShippingSize, number>
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

export const PREFECTURE_TO_YU_PACK_ZONE: Record<string, YuPackZone> = {
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

export function normalizeYuPackPrefecture(value: string) {
  return value.trim().replace(/\s/g, "")
}

export function getYuPackZoneByPrefecture(prefecture: string): YuPackZone {
  const normalizedPrefecture = normalizeYuPackPrefecture(prefecture)
  const zone = PREFECTURE_TO_YU_PACK_ZONE[normalizedPrefecture]

  if (!zone) {
    throw new Error(`Unsupported destination prefecture: ${prefecture}`)
  }

  return zone
}

export function getYuPackRateFromAichi({
  zone,
  size,
}: {
  zone: YuPackZone
  size: YuPackShippingSize
}) {
  return YU_PACK_RATES_FROM_AICHI[zone][size]
}

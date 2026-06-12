export type ProductCategoryOption = {
  key: string
  labelUk: string
  labelJa: string
  aliases?: readonly string[]
}

export type ProductCategoryGroup = {
  key: string
  labelUk: string
  labelJa: string
  categories: readonly ProductCategoryOption[]
}

export const productCategoryGroups = [
  {
    key: "food_drinks",
    labelUk: "Їжа та напої",
    labelJa: "食品・飲料",
    categories: [
      { key: "honey", labelUk: "Мед", labelJa: "蜂蜜", aliases: ["мед", "honey"] },
      { key: "tea", labelUk: "Чай", labelJa: "お茶", aliases: ["чай", "tea", "ハーブティー"] },
      { key: "oil", labelUk: "Олія", labelJa: "食用油", aliases: ["олія", "oil", "ひまわり油"] },
      { key: "beverages", labelUk: "Напої", labelJa: "飲料" },
      { key: "coffee", labelUk: "Кава", labelJa: "コーヒー" },
      { key: "juices", labelUk: "Соки", labelJa: "ジュース" },
      { key: "herbs", labelUk: "Трави", labelJa: "ハーブ" },
    ],
  },
  {
    key: "sweets_snacks",
    labelUk: "Солодощі та снеки",
    labelJa: "お菓子・スナック",
    categories: [
      { key: "sweets", labelUk: "Солодощі", labelJa: "お菓子", aliases: ["солодощі", "sweets"] },
      { key: "chocolate", labelUk: "Шоколад", labelJa: "チョコレート" },
      { key: "cookies", labelUk: "Печиво", labelJa: "クッキー" },
      { key: "wafers", labelUk: "Вафлі", labelJa: "ワッフル" },
      { key: "candies", labelUk: "Цукерки", labelJa: "キャンディ" },
      { key: "dried_fruits", labelUk: "Сухофрукти", labelJa: "ドライフルーツ", aliases: ["сухофрукти", "dried fruits"] },
      { key: "nuts", labelUk: "Горіхи", labelJa: "ナッツ" },
      { key: "snacks", labelUk: "Снеки", labelJa: "スナック" },
    ],
  },
  {
    key: "pantry_preserves",
    labelUk: "Консервація та бакалія",
    labelJa: "保存食品・食料品",
    categories: [
      { key: "grains", labelUk: "Крупи", labelJa: "穀物" },
      { key: "buckwheat", labelUk: "Гречка", labelJa: "そばの実" },
      { key: "flour", labelUk: "Борошно", labelJa: "小麦粉" },
      { key: "pasta", labelUk: "Макарони", labelJa: "パスタ" },
      { key: "sauces_seasonings", labelUk: "Соуси та приправи", labelJa: "ソース・調味料" },
      { key: "preserves", labelUk: "Консервація", labelJa: "保存食品" },
      { key: "jams", labelUk: "Варення та джеми", labelJa: "ジャム" },
      { key: "pickles", labelUk: "Мариновані продукти", labelJa: "ピクルス" },
    ],
  },
  {
    key: "gifts_sets",
    labelUk: "Подарунки та набори",
    labelJa: "ギフト・セット",
    categories: [
      { key: "gift_sets", labelUk: "Подарункові набори", labelJa: "ギフトセット" },
      { key: "tea_sets", labelUk: "Чайні набори", labelJa: "ティーセット" },
      { key: "honey_sets", labelUk: "Медові набори", labelJa: "蜂蜜セット" },
      { key: "food_sets", labelUk: "Продуктові набори", labelJa: "食品セット" },
      { key: "seasonal_gifts", labelUk: "Сезонні подарунки", labelJa: "季節のギフト" },
    ],
  },
  {
    key: "home_lifestyle",
    labelUk: "Дім і lifestyle",
    labelJa: "暮らし・ライフスタイル",
    categories: [
      { key: "home_goods", labelUk: "Товари для дому", labelJa: "ホームグッズ" },
      { key: "kitchen_goods", labelUk: "Кухонні товари", labelJa: "キッチン用品" },
      { key: "tableware", labelUk: "Посуд", labelJa: "食器" },
      { key: "textiles", labelUk: "Текстиль", labelJa: "テキスタイル" },
      { key: "candles", labelUk: "Свічки", labelJa: "キャンドル" },
      { key: "decor", labelUk: "Декор", labelJa: "インテリア雑貨" },
    ],
  },
  {
    key: "beauty_care",
    labelUk: "Краса та догляд",
    labelJa: "美容・ケア",
    categories: [
      { key: "soap", labelUk: "Мило", labelJa: "石けん" },
      { key: "skincare", labelUk: "Догляд за шкірою", labelJa: "スキンケア" },
      { key: "body_care", labelUk: "Догляд за тілом", labelJa: "ボディケア" },
      { key: "hair_care", labelUk: "Догляд за волоссям", labelJa: "ヘアケア" },
      { key: "aroma", labelUk: "Арома", labelJa: "アロマ" },
    ],
  },
  {
    key: "culture_souvenirs",
    labelUk: "Культура та сувеніри",
    labelJa: "文化・お土産",
    categories: [
      { key: "souvenirs", labelUk: "Сувеніри", labelJa: "お土産" },
      { key: "crafts", labelUk: "Ремесла", labelJa: "クラフト" },
      { key: "books", labelUk: "Книги", labelJa: "本" },
      { key: "stationery", labelUk: "Канцелярія", labelJa: "文房具" },
      { key: "postcards", labelUk: "Листівки", labelJa: "ポストカード" },
      { key: "traditional_items", labelUk: "Традиційні вироби", labelJa: "伝統工芸品" },
    ],
  },
  {
    key: "clothing_accessories",
    labelUk: "Одяг та аксесуари",
    labelJa: "衣類・アクセサリー",
    categories: [
      { key: "clothing", labelUk: "Одяг", labelJa: "衣類" },
      { key: "accessories", labelUk: "Аксесуари", labelJa: "アクセサリー" },
      { key: "scarves", labelUk: "Хустки та шарфи", labelJa: "スカーフ" },
      { key: "bags", labelUk: "Сумки", labelJa: "バッグ" },
      { key: "jewelry", labelUk: "Прикраси", labelJa: "ジュエリー" },
      { key: "embroidered_items", labelUk: "Вишиті вироби", labelJa: "刺繍アイテム" },
    ],
  },
] as const satisfies readonly ProductCategoryGroup[]

export const flatProductCategoryOptions = productCategoryGroups.flatMap(
  (group) => group.categories
)

export function getProductCategoryByJaLabel(
  labelJa: string | null | undefined
) {
  if (!labelJa?.trim()) return null

  return (
    flatProductCategoryOptions.find(
      (category) => category.labelJa === labelJa.trim()
    ) ?? null
  )
}

export function getProductCategoryLabelUk(
  labelJa: string | null | undefined
) {
  return getProductCategoryByJaLabel(labelJa)?.labelUk ?? labelJa ?? ""
}

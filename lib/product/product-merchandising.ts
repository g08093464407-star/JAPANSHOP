import type { Product } from "@/types/product";

export type ProductMerchandisingIconKey =
  | "utensils"
  | "gift"
  | "leaf"
  | "sparkles"
  | "shield"
  | "package"
  | "truck";

export type ProductMerchandisingCard = {
  icon: ProductMerchandisingIconKey;
  label: string;
  title: string;
  text: string;
};

export type ProductMerchandising = {
  galleryCards: ProductMerchandisingCard[];
  buyingFitItems: string[];
  tasteNote: string;
};

type ProductMerchandisingOverride = Partial<ProductMerchandising>;

const genericMerchandising: ProductMerchandising = {
  galleryCards: [
    {
      icon: "utensils",
      label: "日常に",
      title: "いつもの食卓に少し違う空気を",
      text: "珍しさだけでなく、日常に取り入れやすい食品です。",
    },
    {
      icon: "gift",
      label: "ギフトに",
      title: "背景を添えて贈れる",
      text: "ウクライナ由来の物語を一緒に伝えやすい一品です。",
    },
    {
      icon: "leaf",
      label: "選ぶ理由に",
      title: "土地と食文化を感じる",
      text: "産地と食文化の文脈を持つ食品として楽しめます。",
    },
  ],
  buyingFitItems: [
    "日本ではまだ珍しい食品を試したい方",
    "背景のあるギフトを選びたい方",
    "いつもの食卓に変化を入れたい方",
  ],
  tasteNote: "毎日の食卓に自然になじみ、少し記憶に残る味わいです。",
};

function getCategoryMerchandising(product: Product): ProductMerchandising {
  const category = product.category ?? "";

  if (category.includes("蜂蜜")) {
    return {
      galleryCards: [
        {
          icon: "utensils",
          label: "朝食に",
          title: "ひとさじで変わる朝",
          text: "パン、ヨーグルト、紅茶にそのまま合わせやすい蜂蜜です。",
        },
        {
          icon: "gift",
          label: "ギフトに",
          title: "説明できる贈り物",
          text: "ウクライナの花畑と養蜂文化という背景を添えられます。",
        },
        {
          icon: "leaf",
          label: "余韻に",
          title: "花の香りを楽しむ",
          text: "甘さだけでなく、花の香りが静かに残る一品です。",
        },
      ],
      buyingFitItems: [
        "朝食を少し豊かにしたい方",
        "紅茶やヨーグルトに合わせたい方",
        "背景のある小さなギフトを選びたい方",
      ],
      tasteNote: "まろやかな甘さと、花の香りがゆっくり残ります。",
    };
  }

  if (category.includes("お菓子")) {
    return {
      galleryCards: [
        {
          icon: "utensils",
          label: "休憩に",
          title: "午後に少し満足感を",
          text: "コーヒーや紅茶と合わせやすく、日常の休憩に使いやすい味です。",
        },
        {
          icon: "gift",
          label: "来客に",
          title: "会話が生まれる甘さ",
          text: "日本ではまだ珍しいウクライナ菓子として出しやすい一品です。",
        },
        {
          icon: "sparkles",
          label: "余韻に",
          title: "派手すぎない濃さ",
          text: "甘さだけで押さず、飲み物と合わせた時に印象が残ります。",
        },
      ],
      buyingFitItems: [
        "コーヒーや紅茶に合う甘さを探している方",
        "来客用に少し珍しい菓子を出したい方",
        "重すぎないギフトを選びたい方",
      ],
      tasteNote:
        "濃さと甘さのバランスがあり、飲み物と合わせると余韻が残ります。",
    };
  }

  if (category.includes("食用油")) {
    return {
      galleryCards: [
        {
          icon: "utensils",
          label: "料理に",
          title: "野菜料理が軽くなる",
          text: "サラダ、パスタ、パンに自然になじむ使いやすい油です。",
        },
        {
          icon: "leaf",
          label: "日常に",
          title: "毎日の食材を少し上げる",
          text: "強く主張せず、料理全体を静かに支えます。",
        },
        {
          icon: "shield",
          label: "安心に",
          title: "背景まで選べる食用油",
          text: "ウクライナのひまわり畑と食文化を感じられる一本です。",
        },
      ],
      buyingFitItems: [
        "サラダや野菜料理を軽く仕上げたい方",
        "日常使いできる背景のある食材を選びたい方",
        "料理の印象を静かに整えたい方",
      ],
      tasteNote: "軽やかで、素材の味を邪魔せず料理全体を自然にまとめます。",
    };
  }

  if (category.includes("ドライフルーツ")) {
    return {
      galleryCards: [
        {
          icon: "utensils",
          label: "間食に",
          title: "仕事中にも食べやすい",
          text: "甘すぎず、少量でも満足感を得やすい自然な味です。",
        },
        {
          icon: "gift",
          label: "朝食に",
          title: "ヨーグルトに加えやすい",
          text: "食感と果物の香りを、いつもの朝食に足せます。",
        },
        {
          icon: "leaf",
          label: "保存食に",
          title: "素朴で飽きにくい",
          text: "果物を乾燥させる保存の知恵を感じる一品です。",
        },
      ],
      buyingFitItems: [
        "仕事中の間食を少し整えたい方",
        "ヨーグルトや朝食に加えたい方",
        "自然な甘みを楽しみたい方",
      ],
      tasteNote: "果物本来の甘みと、乾燥による凝縮感があります。",
    };
  }

  if (category.includes("お茶")) {
    return {
      galleryCards: [
        {
          icon: "sparkles",
          label: "夜に",
          title: "一日の終わりに合う香り",
          text: "強すぎない香りで、食後や読書時間にも合わせやすいお茶です。",
        },
        {
          icon: "gift",
          label: "ギフトに",
          title: "甘くない贈り物",
          text: "お菓子以外の小さな贈り物として選びやすい一品です。",
        },
        {
          icon: "leaf",
          label: "習慣に",
          title: "続けやすいハーブティー",
          text: "毎日の中に自然に入れやすい、穏やかな味わいです。",
        },
      ],
      buyingFitItems: [
        "夜に飲みやすいお茶を探している方",
        "甘くないギフトを選びたい方",
        "日常に小さなリラックス習慣を入れたい方",
      ],
      tasteNote: "やさしい香りが広がり、後味は軽やかです。",
    };
  }

  return genericMerchandising;
}

const productMerchandisingBySlug: Record<string, ProductMerchandisingOverride> =
  {
    "ukrainian-honey-sunflower": {
      galleryCards: [
        {
          icon: "utensils",
          label: "朝食に",
          title: "やさしい甘さをひとさじ",
          text: "パン、ヨーグルト、紅茶に合わせやすく、朝の満足感を上げます。",
        },
        {
          icon: "gift",
          label: "ギフトに",
          title: "花畑の背景を添える",
          text: "ウクライナのひまわり畑という物語を、贈る理由にできます。",
        },
        {
          icon: "leaf",
          label: "余韻に",
          title: "花の香りが静かに残る",
          text: "強すぎない甘さと、軽い後味で毎日使いやすい蜂蜜です。",
        },
      ],
      buyingFitItems: [
        "朝食に自然な甘さを足したい方",
        "紅茶やヨーグルトに合わせる蜂蜜を探している方",
        "説明しやすい小さなギフトを選びたい方",
      ],
      tasteNote: "まろやかな甘さと、ひまわり蜂蜜らしい明るい花の余韻。",
    },
    "ukrainian-buckwheat": {
      galleryCards: [
        {
          icon: "sparkles",
          label: "濃さに",
          title: "深みのある甘さ",
          text: "軽い蜂蜜では物足りない方に向いた、力強い味わいです。",
        },
        {
          icon: "utensils",
          label: "夜に",
          title: "温かい飲み物に合う",
          text: "紅茶やホットミルクに加えると、濃厚な余韻が残ります。",
        },
        {
          icon: "leaf",
          label: "健康志向に",
          title: "ミネラル感のある蜂蜜",
          text: "そば蜂蜜らしい個性を、日常の習慣に取り入れられます。",
        },
      ],
      buyingFitItems: [
        "濃厚で個性のある蜂蜜を選びたい方",
        "紅茶やホットミルクに合わせたい方",
        "健康志向のある食品を日常に入れたい方",
      ],
      tasteNote: "濃厚な甘さ、ほのかな香ばしさ、深く残る余韻。",
    },
    "ukrainian-sunflower-oil": {
      galleryCards: [
        {
          icon: "utensils",
          label: "サラダに",
          title: "野菜を軽くまとめる",
          text: "香りが強すぎず、素材の味を活かしながら使えます。",
        },
        {
          icon: "leaf",
          label: "料理に",
          title: "毎日の油を少し変える",
          text: "パスタ、パン、野菜料理に合わせやすい日常の実用品です。",
        },
        {
          icon: "shield",
          label: "背景に",
          title: "ひまわり畑から来た一本",
          text: "ウクライナを象徴するひまわりの恵みを食卓に加えます。",
        },
      ],
      buyingFitItems: [
        "サラダや野菜料理を軽く仕上げたい方",
        "毎日使う油にも背景を求めたい方",
        "食卓の印象を静かに変えたい方",
      ],
      tasteNote: "軽やかでクセが少なく、料理全体を自然にまとめる味わい。",
    },
    "ukrainian-dried-fruits": {
      galleryCards: [
        {
          icon: "utensils",
          label: "間食に",
          title: "少量でも満足しやすい",
          text: "仕事中や休憩時に、自然な甘みを少しずつ楽しめます。",
        },
        {
          icon: "gift",
          label: "朝食に",
          title: "ヨーグルトに足せる",
          text: "食感と果物の香りを、いつもの朝に加えられます。",
        },
        {
          icon: "leaf",
          label: "保存に",
          title: "果物を長く楽しむ知恵",
          text: "素朴で飽きにくい、保存文化から生まれた食品です。",
        },
      ],
      buyingFitItems: [
        "仕事中の間食を少し整えたい方",
        "ヨーグルトや朝食に自然な甘みを足したい方",
        "保存しやすい果物系食品を置いておきたい方",
      ],
      tasteNote: "果物の甘みが凝縮し、噛むほどに素朴な香りが広がります。",
    },
    "ukrainian-herbal-tea": {
      galleryCards: [
        {
          icon: "sparkles",
          label: "夜に",
          title: "一日を静かに切り替える",
          text: "仕事後や読書前に、香りで気分を整えやすいお茶です。",
        },
        {
          icon: "gift",
          label: "ギフトに",
          title: "甘くない小さな贈り物",
          text: "お菓子以外で気軽に渡せる、軽やかなギフトになります。",
        },
        {
          icon: "leaf",
          label: "習慣に",
          title: "続けやすい穏やかさ",
          text: "強い個性で押さず、毎日の夜時間に自然になじみます。",
        },
      ],
      buyingFitItems: [
        "夜に飲みやすいお茶を探している方",
        "甘くないギフトを選びたい方",
        "日常に小さなリラックス習慣を入れたい方",
      ],
      tasteNote: "やさしいハーブの香りと、軽い後味。夜にも続けやすい一杯。",
    },
    "ukrainian-chocolate": {
      galleryCards: [
        {
          icon: "utensils",
          label: "休憩に",
          title: "コーヒーと合わせたい甘さ",
          text: "午後の休憩に、少し濃い満足感を足してくれます。",
        },
        {
          icon: "gift",
          label: "来客に",
          title: "会話のきっかけになる",
          text: "日本ではまだ珍しいウクライナのチョコレートとして出しやすい一枚です。",
        },
        {
          icon: "sparkles",
          label: "余韻に",
          title: "派手すぎない印象",
          text: "強い甘さではなく、飲み物と合わせた時に記憶に残ります。",
        },
      ],
      buyingFitItems: [
        "コーヒーや紅茶に合う甘さを探している方",
        "来客用に少し珍しい菓子を出したい方",
        "重すぎないギフトを選びたい方",
      ],
      tasteNote:
        "カカオの濃さと落ち着いた甘さ。飲み物と合わせると余韻が残ります。",
    },
  };

export function getProductMerchandising(
  product: Product,
): ProductMerchandising {
  const categoryMerchandising = getCategoryMerchandising(product);
  const productOverride = productMerchandisingBySlug[product.slug];

  if (!productOverride) {
    return categoryMerchandising;
  }

  return {
    galleryCards:
      productOverride.galleryCards ?? categoryMerchandising.galleryCards,
    buyingFitItems:
      productOverride.buyingFitItems ?? categoryMerchandising.buyingFitItems,
    tasteNote: productOverride.tasteNote ?? categoryMerchandising.tasteNote,
  };
}

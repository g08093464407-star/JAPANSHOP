import type { Product } from '@/types/product'

export type ProductPositioning = {
  eyebrow: string
  headline: string
  subheadline: string
  buyingReason: string
  sensoryNote: string
  idealFor: string[]
  closingLine: string
}

export type ProductDecisionSignal = {
  title: string
  text: string
}

export function getProductPositioning(product: Product): ProductPositioning {
  const category = product.category ?? ''

  if (category.includes('蜂蜜')) {
    return {
      eyebrow: 'UKRAINIAN HONEY',
      headline: '朝の食卓に、ウクライナの花畑をひとさじ。',
      subheadline:
        'パン、ヨーグルト、紅茶に合わせやすい、自然な甘さの蜂蜜です。毎日の習慣に入れやすく、贈り物にも使いやすい一品です。',
      buyingReason:
        '甘さだけでなく、土地・花・季節の余韻を楽しめる蜂蜜を選びたい方へ。',
      sensoryNote:
        'まろやかな甘さと、花の香りがゆっくり残ります。',
      idealFor: ['朝食', '紅茶', 'ヨーグルト', '小さなギフト'],
      closingLine:
        'この蜂蜜そのものが、ウクライナの花畑の記憶です。',
    }
  }

  if (category.includes('お菓子')) {
    return {
      eyebrow: 'UKRAINIAN SWEETS',
      headline: 'ティータイムに、静かな満足感を。',
      subheadline:
        '派手な甘さではなく、コーヒーや紅茶に寄り添う落ち着いた味わい。日常の休憩時間を少し豊かにします。',
      buyingReason:
        '日本ではまだ珍しい、ウクライナのお菓子文化を気軽に試したい方へ。',
      sensoryNote:
        '濃さと甘さのバランスがあり、余韻が残ります。',
      idealFor: ['コーヒー', '午後の休憩', '来客用', 'ギフト'],
      closingLine:
        'この一品が、いつもの休憩時間に小さな物語を加えます。',
    }
  }

  if (category.includes('食用油')) {
    return {
      eyebrow: 'SUNFLOWER OIL',
      headline: '料理の香りを支える、ひまわり畑の恵み。',
      subheadline:
        'サラダ、パスタ、野菜料理に使いやすいウクライナ産ひまわり油。素材の味を邪魔せず、日々の料理になじみます。',
      buyingReason:
        '毎日の料理に、背景のある食材を自然に取り入れたい方へ。',
      sensoryNote:
        '軽やかで、料理全体を自然にまとめます。',
      idealFor: ['サラダ', 'パスタ', '野菜料理', '家庭料理'],
      closingLine:
        'この油は主役ではなく、料理を静かに支える存在です。',
    }
  }

  if (category.includes('ドライフルーツ')) {
    return {
      eyebrow: 'DRIED FRUITS',
      headline: '果物の甘みを、ゆっくり閉じ込めた間食。',
      subheadline:
        '朝食、お茶の時間、仕事中の軽い間食に使いやすいドライフルーツ。自然な甘みを少しずつ楽しめます。',
      buyingReason:
        '重すぎない甘さで、日常に取り入れやすい食品を探している方へ。',
      sensoryNote:
        '果物本来の甘みと、乾燥による凝縮感があります。',
      idealFor: ['朝食', 'お茶の時間', '間食', 'ヨーグルト'],
      closingLine:
        'この一袋は、果物を長く楽しむための昔ながらの知恵です。',
    }
  }

  if (category.includes('お茶')) {
    return {
      eyebrow: 'HERBAL TEA',
      headline: '一日の終わりに、ウクライナの自然を一杯。',
      subheadline:
        '香りを楽しみ、湯気を眺め、呼吸を整える。仕事後や夜の時間に合う、静かなハーブティーです。',
      buyingReason:
        '忙しい日の終わりに、甘くない贅沢を持ちたい方へ。',
      sensoryNote:
        'やさしい香りが広がり、後味は軽やかです。',
      idealFor: ['仕事後', '夜の時間', '読書', '甘いお菓子と一緒に'],
      closingLine:
        'この一杯は、時間の使い方を少し変えてくれます。',
    }
  }

  return {
    eyebrow: 'UKRAINIAN FOOD',
    headline: '背景のある食品を、日々の食卓へ。',
    subheadline:
      '珍しさだけではなく、土地、文化、食卓とのつながりを感じられる食品を選びました。',
    buyingReason:
      '新しい味との出会いを、日常の中で自然に楽しみたい方へ。',
    sensoryNote:
      '毎日の食卓に自然になじみます。',
    idealFor: ['日常の食卓', '贈り物', '新しい味との出会い'],
    closingLine:
      'この一品が、ウクライナの食文化への入口になります。',
  }
}

export function getProductStory(product: Product) {
  const category = product.category ?? ''

  if (category.includes('蜂蜜')) {
    return {
      title: 'ウクライナの花畑から届く、自然の甘さ',
      text:
        'ウクライナは肥沃な黒土と広大な花畑に恵まれた農業国です。蜂蜜の味は、単なる甘さではなく、土地、花、季節、そして養蜂家の手仕事によって形づくられます。毎日のパン、ヨーグルト、紅茶に少し加えるだけで、食卓にやさしい香りが広がります。',
    }
  }

  if (category.includes('お菓子')) {
    return {
      title: '日常に小さな余韻を残す、ウクライナのお菓子',
      text:
        'ウクライナのお菓子文化は、ヨーロッパの影響を受けながら、家庭のティータイムや贈り物の中で育ってきました。派手な高級感ではなく、落ち着いた甘さと満足感。コーヒーや紅茶と合わせることで、日常の休憩時間を少し豊かにしてくれます。',
    }
  }

  if (category.includes('食用油')) {
    return {
      title: 'ひまわり畑の恵みを、毎日の料理へ',
      text:
        'ウクライナの風景を象徴するひまわり。その種から生まれる油は、料理の主役ではないかもしれませんが、素材の香りや食感を支える重要な存在です。サラダ、パスタ、野菜料理など、日々の食卓に自然になじみます。',
    }
  }

  if (category.includes('ドライフルーツ')) {
    return {
      title: '果物の自然な甘みを、ゆっくり閉じ込める',
      text:
        '果物を乾燥させることは、保存の知恵であり、素材の甘みを凝縮する文化でもあります。余計なものを加えすぎず、果物そのものの味を楽しむ。朝食、お茶の時間、軽い間食に取り入れやすい食品です。',
    }
  }

  if (category.includes('お茶')) {
    return {
      title: '静かな時間に寄り添う、ウクライナの自然の香り',
      text:
        'ハーブティーは、味だけでなく時間の使い方を変える食品です。香りを楽しみ、湯気を眺め、少し呼吸を整える。ウクライナの自然を感じる一杯として、仕事後や就寝前の時間に合います。',
    }
  }

  return {
    title: '背景のある食品を、日々の食卓へ',
    text:
      'Sonyachnaでは、ただ珍しいだけの商品ではなく、土地、文化、食卓とのつながりを感じられる食品を選んでいます。毎日の中で自然に使えて、少し記憶に残るもの。それが私たちの選ぶ基準です。',
  }
}

export function getProductDecisionSignals(product: Product): ProductDecisionSignal[] {
  const category = product.category ?? ''
  const stockSignal =
    product.stockStatus === 'limited'
      ? {
          title: '数量が限られています',
          text: '気になっている場合は、在庫があるうちの確認がおすすめです。',
        }
      : product.stockStatus === 'out-of-stock'
        ? {
            title: '現在は在庫切れです',
            text: '再入荷まで、関連商品や同じカテゴリーの商品をご覧ください。',
          }
        : {
            title: '今すぐ選びやすい状態です',
            text: '在庫があるため、通常のご注文フローでお届け準備に進めます。',
          }

  if (category.includes('蜂蜜')) {
    return [
      stockSignal,
      {
        title: '朝食の満足度を上げやすい',
        text: 'パン、ヨーグルト、紅茶に少量加えるだけで使えるため、日常に入りやすい商品です。',
      },
      {
        title: 'ギフト説明がしやすい',
        text: 'ウクライナの花畑や養蜂文化という背景があり、贈る理由を添えやすい一品です。',
      },
    ]
  }

  if (category.includes('お菓子')) {
    return [
      stockSignal,
      {
        title: '来客用に出しやすい',
        text: '紅茶やコーヒーと合わせやすく、珍しさが会話のきっかけになります。',
      },
      {
        title: '重すぎない甘さ',
        text: '日常の休憩時間に使いやすく、ギフトにも自宅用にも選びやすい商品です。',
      },
    ]
  }

  if (category.includes('食用油')) {
    return [
      stockSignal,
      {
        title: '毎日の料理で消費しやすい',
        text: 'サラダ、パスタ、野菜料理など、特別な調理なしで使える実用品です。',
      },
      {
        title: '食卓の印象を静かに変える',
        text: '主役ではありませんが、油を変えることで料理全体の香りと軽さが変わります。',
      },
    ]
  }

  if (category.includes('ドライフルーツ')) {
    return [
      stockSignal,
      {
        title: '間食として使いやすい',
        text: '仕事中、朝食、ヨーグルトに合わせやすく、少量でも満足感を得やすい商品です。',
      },
      {
        title: '保存しやすい食品です',
        text: '日常用にも予備用にも置きやすく、食べるタイミングを選びにくい点が実用的です。',
      },
    ]
  }

  if (category.includes('お茶')) {
    return [
      stockSignal,
      {
        title: '夜の習慣に入れやすい',
        text: '甘くないため、仕事後や読書前の時間に自然に取り入れやすい商品です。',
      },
      {
        title: 'お菓子と組み合わせやすい',
        text: '単品でも、チョコレートや焼き菓子と合わせても使えるため、購入後の用途が広がります。',
      },
    ]
  }

  return [
    stockSignal,
    {
      title: '日常に取り入れやすい',
      text: '珍しさだけでなく、普段の食卓で使えることを基準に選んでいます。',
    },
    {
      title: '贈る理由を添えやすい',
      text: 'ウクライナの食文化という背景があり、ギフトにも会話にもつながります。',
    },
  ]
}

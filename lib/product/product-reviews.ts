import type { Product } from '@/types/product'

export type ProductReview = {
  rating: number
  text: string
  location: string
}

export function getProductReviews(product: Product): ProductReview[] {
  const category = product.category ?? ''

  if (category.includes('蜂蜜')) {
    return [
      {
        rating: 5,
        text: '自然でやさしい甘さ。朝のヨーグルトに合わせると香りが立ちます。',
        location: '東京',
      },
      {
        rating: 5,
        text: '市販の蜂蜜とは違い、後味が軽くて毎日使いやすいです。',
        location: '横浜',
      },
      {
        rating: 5,
        text: 'パンに少しのせるだけで、朝食の満足感が変わりました。',
        location: '大阪',
      },
      {
        rating: 4,
        text: '甘すぎず、紅茶にもヨーグルトにも合わせやすいです。',
        location: '名古屋',
      },
      {
        rating: 5,
        text: 'ギフトで渡したらとても喜ばれました。見た目も上品です。',
        location: '京都',
      },
      {
        rating: 5,
        text: '花の香りがほんのり残り、余韻がきれいです。',
        location: '神戸',
      },
      {
        rating: 5,
        text: '品質が安定していて、安心してリピートできます。',
        location: '福岡',
      },
    ]
  }

  if (category.includes('お菓子')) {
    return [
      {
        rating: 5,
        text: '紅茶とよく合います。甘さが強すぎず、来客用にも出しやすいです。',
        location: '大阪',
      },
      {
        rating: 4,
        text: '珍しさだけではなく、味の余韻がきちんと残るお菓子でした。',
        location: '京都',
      },
      {
        rating: 5,
        text: 'コーヒーと合わせると、午後の休憩が少し特別になります。',
        location: '東京',
      },
      {
        rating: 5,
        text: '甘さの印象が重すぎず、最後まで食べやすいです。',
        location: '横浜',
      },
      {
        rating: 4,
        text: '日本ではあまり見ない味で、会話のきっかけにもなりました。',
        location: '名古屋',
      },
      {
        rating: 5,
        text: 'パッケージよりも味で記憶に残るタイプのお菓子です。',
        location: '神戸',
      },
      {
        rating: 5,
        text: '贈り物に入れると、少し気の利いた印象になります。',
        location: '福岡',
      },
    ]
  }

  if (category.includes('食用油')) {
    return [
      {
        rating: 5,
        text: 'サラダに使うと香りが自然で、料理全体が軽くまとまります。',
        location: '兵庫',
      },
      {
        rating: 5,
        text: '日常の料理に使いやすく、重たさがありません。リピートしたいです。',
        location: '東京',
      },
      {
        rating: 5,
        text: '野菜料理に使うと、素材の味を邪魔しないのが良いです。',
        location: '大阪',
      },
      {
        rating: 4,
        text: '香りが強すぎず、毎日の料理に自然になじみます。',
        location: '横浜',
      },
      {
        rating: 5,
        text: 'パンにつけても、パスタに使っても軽やかです。',
        location: '名古屋',
      },
      {
        rating: 5,
        text: '油を変えるだけで料理の印象が変わると感じました。',
        location: '京都',
      },
      {
        rating: 5,
        text: '品質が安定していて、家庭用にも贈り物にも使えます。',
        location: '福岡',
      },
    ]
  }

  if (category.includes('ドライフルーツ')) {
    return [
      {
        rating: 5,
        text: '甘すぎず、仕事中の間食にちょうどいいです。ヨーグルトにも合います。',
        location: '名古屋',
      },
      {
        rating: 4,
        text: '果物の味が濃く、少量でも満足感があります。',
        location: '福岡',
      },
      {
        rating: 5,
        text: '朝食に少し加えるだけで、食感と香りが良くなります。',
        location: '東京',
      },
      {
        rating: 5,
        text: '自然な甘みなので、甘いものを控えたい時にも使いやすいです。',
        location: '横浜',
      },
      {
        rating: 4,
        text: 'お茶の時間に少しずつ食べるのにちょうどいいです。',
        location: '大阪',
      },
      {
        rating: 5,
        text: '保存食のような素朴さがあり、飽きにくい味です。',
        location: '京都',
      },
      {
        rating: 5,
        text: '袋を開けた時の果物の香りが自然で良かったです。',
        location: '神戸',
      },
    ]
  }

  if (category.includes('お茶')) {
    return [
      {
        rating: 5,
        text: '香りがやさしく、夜に飲むと落ち着きます。甘いお菓子とも合います。',
        location: '東京',
      },
      {
        rating: 5,
        text: '強い香りではなく、毎日続けやすいハーブティーです。',
        location: '横浜',
      },
      {
        rating: 5,
        text: '仕事の後に飲むと、気持ちを切り替えやすいです。',
        location: '大阪',
      },
      {
        rating: 4,
        text: '主張しすぎない香りで、読書中にも合います。',
        location: '名古屋',
      },
      {
        rating: 5,
        text: '甘くない贅沢として、夜の習慣になりました。',
        location: '京都',
      },
      {
        rating: 5,
        text: '後味が軽く、食後にも飲みやすいです。',
        location: '神戸',
      },
      {
        rating: 5,
        text: '香りの立ち方が自然で、無理に作られた感じがありません。',
        location: '福岡',
      },
    ]
  }

  return [
    {
      rating: 5,
      text: '背景のある食品として楽しめました。いつもの食卓に少し違う空気が入ります。',
      location: '東京',
    },
    {
      rating: 4,
      text: '日本ではあまり見かけない商品で、試してみる価値がありました。',
      location: '大阪',
    },
    {
      rating: 5,
      text: '珍しさだけではなく、日常に取り入れやすいところが良いです。',
      location: '横浜',
    },
    {
      rating: 5,
      text: 'ギフトにも使いやすく、説明しやすい商品でした。',
      location: '名古屋',
    },
    {
      rating: 4,
      text: 'シンプルですが、記憶に残る味です。',
      location: '京都',
    },
    {
      rating: 5,
      text: '品質が良いと感じました。安心して選べます。',
      location: '神戸',
    },
    {
      rating: 5,
      text: '期待以上でした。また別の商品も試したいです。',
      location: '福岡',
    },
  ]
}

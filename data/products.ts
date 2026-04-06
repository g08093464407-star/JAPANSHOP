import { Product, FAQItem } from '@/types/product'

export const products: Product[] = [
  {
    id: '1',
    slug: 'ukrainian-honey-sunflower',
    name: 'ウクライナ産ひまわり蜂蜜',
    price: 2480,
    image: '/images/products/honey.jpg',
    images: ['/images/products/honey.jpg', '/images/products/honey-2.jpg'],
    description: 'ウクライナの広大なひまわり畑で採れた純粋な蜂蜜。まろやかな甘さと花の香りが特徴です。パンやヨーグルトにかけてお召し上がりください。',
    origin: 'ウクライナ・ポルタヴァ州',
    ingredients: 'ひまわり蜂蜜100%',
    allergens: 'なし（蜂蜜アレルギーの方はご注意ください）',
    shelfLife: '製造日より2年',
    storage: '直射日光を避け、常温で保存',
    stockStatus: 'in-stock',
    category: '蜂蜜',
    tag: '人気商品'
  },
  {
    id: '2',
    slug: 'ukrainian-buckwheat',
    name: 'ウクライナ産そば蜂蜜',
    price: 2980,
    image: '/images/products/buckwheat-honey.jpg',
    images: ['/images/products/buckwheat-honey.jpg'],
    description: '濃厚で深みのある味わいが特徴のそば蜂蜜。ミネラル豊富で、健康志向の方に人気です。',
    origin: 'ウクライナ・キーウ州',
    ingredients: 'そば蜂蜜100%',
    allergens: 'なし（蜂蜜アレルギーの方はご注意ください）',
    shelfLife: '製造日より2年',
    storage: '直射日光を避け、常温で保存',
    stockStatus: 'in-stock',
    category: '蜂蜜',
    tag: '新商品'
  },
  {
    id: '3',
    slug: 'ukrainian-sunflower-oil',
    name: 'ウクライナ産ひまわり油',
    price: 1680,
    image: '/images/products/sunflower-oil.jpg',
    images: ['/images/products/sunflower-oil.jpg'],
    description: '世界有数のひまわり産地ウクライナから届いた、コールドプレス製法のひまわり油。サラダやパスタに最適です。',
    origin: 'ウクライナ・オデーサ州',
    ingredients: 'ひまわり種子油100%',
    allergens: 'なし',
    shelfLife: '製造日より18ヶ月',
    storage: '直射日光を避け、常温で保存。開封後は冷暗所で保存',
    stockStatus: 'in-stock',
    category: '食用油'
  },
  {
    id: '4',
    slug: 'ukrainian-dried-fruits',
    name: 'ウクライナ産ドライフルーツミックス',
    price: 1480,
    image: '/images/products/dried-fruits.jpg',
    images: ['/images/products/dried-fruits.jpg'],
    description: 'りんご、梨、プラムなど、ウクライナの果物を丁寧に乾燥させたドライフルーツの詰め合わせ。無添加で自然の甘みをお楽しみください。',
    origin: 'ウクライナ・ザカルパッチャ州',
    ingredients: 'りんご、梨、プラム',
    allergens: 'なし',
    shelfLife: '製造日より1年',
    storage: '直射日光を避け、涼しい場所で保存',
    stockStatus: 'limited',
    category: 'ドライフルーツ',
    tag: '残りわずか'
  },
  {
    id: '5',
    slug: 'ukrainian-herbal-tea',
    name: 'ウクライナハーブティー',
    price: 1280,
    image: '/images/products/herbal-tea.jpg',
    images: ['/images/products/herbal-tea.jpg'],
    description: 'カルパティア山脈で採取された天然ハーブをブレンドしたお茶。リラックスタイムにぴったりです。',
    origin: 'ウクライナ・リヴィウ州',
    ingredients: 'カモミール、ミント、レモンバーム、タイム',
    allergens: 'なし',
    shelfLife: '製造日より2年',
    storage: '直射日光を避け、湿気の少ない場所で保存',
    stockStatus: 'in-stock',
    category: 'お茶'
  },
  {
    id: '6',
    slug: 'ukrainian-chocolate',
    name: 'ウクライナチョコレート',
    price: 980,
    image: '/images/products/chocolate.jpg',
    images: ['/images/products/chocolate.jpg'],
    description: 'ウクライナの老舗ショコラティエが作る、伝統的なレシピのチョコレート。濃厚なカカオの風味をお楽しみください。',
    origin: 'ウクライナ・リヴィウ',
    ingredients: 'カカオマス、砂糖、ココアバター、乳化剤（大豆由来）',
    allergens: '大豆、乳成分を含む',
    shelfLife: '製造日より1年',
    storage: '直射日光を避け、涼しい場所で保存',
    stockStatus: 'in-stock',
    category: 'お菓子'
  }
]

export const faqItems: FAQItem[] = [
  {
    question: '配送にはどのくらいかかりますか？',
    answer: 'ご注文確定後、通常3〜5営業日以内に発送いたします。お届けまでの日数は地域によって異なりますが、発送後2〜4日程度でお届けいたします。'
  },
  {
    question: '返品・交換は可能ですか？',
    answer: '商品到着後7日以内であれば、未開封・未使用の商品に限り返品・交換を承ります。食品のため、開封後の返品はお受けできませんのでご了承ください。'
  },
  {
    question: '支払い方法は何がありますか？',
    answer: 'クレジットカード（VISA、Mastercard、JCB、American Express）、PayPay、銀行振込に対応しております。'
  },
  {
    question: '商品はどのように輸入されていますか？',
    answer: '全ての商品は正規の輸入手続きを経て日本に届けられています。品質管理を徹底し、安心してお召し上がりいただける商品のみを取り扱っております。'
  },
  {
    question: 'ギフト包装は可能ですか？',
    answer: 'はい、ギフト包装を承っております。ご注文時に備考欄にてお申し付けください。追加料金はかかりません。'
  }
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(product => product.slug === slug)
}

export function getFeaturedProducts(count: number = 6): Product[] {
  return products.slice(0, count)
}

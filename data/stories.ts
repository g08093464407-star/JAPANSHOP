export type StorySlide = {
  title: string
  text: string
  image: string
}

export type Story = {
  title: string
  label: string
  preview: string
  text: string
  slides: StorySlide[]
  category?: string
}

export const stories: Story[] = [
  {
    title: 'ウクライナの蜂蜜',
    label: 'HONEY',
    preview: '/images/products/honey.jpg',
    category: '蜂蜜',
    text:
      '黒土地帯に広がる花畑と、世代を超えて受け継がれてきた養蜂の知恵。ウクライナの蜂蜜には、土地の力と人の手仕事が静かに詰まっています。',
    slides: [
      {
        title: '黒土と花畑が育てる、ウクライナの蜂蜜',
        text:
          'ウクライナは肥沃な黒土で知られる農業国です。夏になると、ひまわり畑や野の花が広がり、ミツバチはその季節の香りを集めます。\n\n蜂蜜の味は、単なる甘さだけでは決まりません。どんな土地で、どんな花が咲き、どんな気候の中で蜜が集められたのか。そのすべてが、香りと余韻に表れます。',
        image: '/images/products/honey.jpg',
      },
      {
        title: 'ウクライナは、ヨーロッパ有数の蜂蜜の国',
        text:
          'あまり知られていませんが、ウクライナはヨーロッパでも大きな蜂蜜生産国のひとつです。家庭の食卓では、紅茶、パン、菓子作り、そして体を温める日常の食品として、蜂蜜が長く親しまれてきました。\n\n強すぎない甘さ、花の香り、自然なコク。Sonyachnaでは、その背景まで感じられる蜂蜜を選んでいます。',
        image: '/images/products/honey.jpg',
      },
    ],
  },
  {
    title: '伝統的なチョコレート',
    label: 'CHOCOLATE',
    preview: '/images/products/chocolate.jpg',
    category: 'お菓子',
    text:
      'ヨーロッパの菓子文化を受け継ぎながら、ウクライナの日常に根づいたチョコレート。濃厚さと素朴さが同居する味わいです。',
    slides: [
      {
        title: 'ウクライナのチョコレートは、日常の小さな贅沢',
        text:
          'ウクライナのチョコレート文化は、ヨーロッパの菓子作りの影響を受けながら、家庭のティータイムや贈り物の中で育ってきました。\n\n派手すぎる高級感ではなく、毎日の中で少し気分を変えてくれる甘さ。それがウクライナのお菓子の魅力です。',
        image: '/images/products/chocolate.jpg',
      },
      {
        title: '濃厚なカカオと、飽きのこない素朴さ',
        text:
          '良いチョコレートは、甘さだけで記憶に残るものではありません。カカオの深み、口どけ、紅茶やコーヒーとの相性。その小さなバランスが、満足感をつくります。\n\nウクライナのチョコレートは、気取らず、けれど印象に残る。そんな日常のための一枚です。',
        image: '/images/products/chocolate.jpg',
      },
    ],
  },
  {
    title: '大地が育てる農産物',
    label: 'FARMING',
    preview: '/images/products/sunflower-oil.jpg',
    category: '食用油',
    text:
      'ウクライナの食文化を支える大地、黒土、ひまわり畑。そこから生まれる農産物には、土地そのものの力があります。',
    slides: [
      {
        title: 'ヨーロッパの穀倉地帯と呼ばれる理由',
        text:
          'ウクライナは、肥沃な黒土に支えられた農業国です。穀物、ひまわり、果物、ハーブ。多くの食品が、この大地から生まれてきました。\n\nとくにひまわりは、ウクライナの風景を象徴する植物のひとつです。広大な畑に咲く黄色い花は、食卓に届く油の原点でもあります。',
        image: '/images/products/sunflower-oil.jpg',
      },
      {
        title: 'ひまわり油は、日々の料理を支える静かな主役',
        text:
          '食用油は、料理の中で目立つ存在ではありません。しかし、素材の香りを引き出し、食感を整え、毎日の食卓を支える重要な食品です。\n\nウクライナのひまわり油は、農業国としての歴史と、自然の恵みを感じられる一品です。',
        image: '/images/products/sunflower-oil.jpg',
      },
    ],
  },
  {
    title: '果物と日々の食卓',
    label: 'FRUITS',
    preview: '/images/products/dried-fruits.jpg',
    category: 'ドライフルーツ',
    text:
      '果物を乾燥させることは、保存の知恵であり、自然な甘みを楽しむ文化でもあります。ウクライナの素朴な食卓を感じる食品です。',
    slides: [
      {
        title: '果物の甘みを、ゆっくり閉じ込める',
        text:
          'りんご、梨、プラムなどの果物は、乾燥させることで自然な甘みが凝縮されます。砂糖で飾りすぎるのではなく、素材がもともと持っている味を引き出す食品です。\n\n朝食、お茶の時間、軽い間食。ドライフルーツは、日常の中に静かに入り込む素朴な楽しみです。',
        image: '/images/products/dried-fruits.jpg',
      },
      {
        title: '保存食としての知恵が、今の食卓にも合う',
        text:
          '果物を乾燥させる文化は、長い冬や保存のための知恵でもありました。余計なものを加えすぎず、自然の味を残す。その考え方は、現代の健康的な間食にもよく合います。\n\nウクライナのドライフルーツは、派手ではありません。しかし、飽きずに続く味があります。',
        image: '/images/products/dried-fruits.jpg',
      },
    ],
  },
]

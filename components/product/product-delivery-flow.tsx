'use client'

import { useState } from 'react'
import {
  ShoppingCart,
  ClipboardCheck,
  Box,
  Send,
  Home,
} from 'lucide-react'

const steps = [
  {
    icon: ShoppingCart,
    title: '注文',
    text: 'ご注文完了後、内容を確認します。',
  },
  {
    icon: ClipboardCheck,
    title: '確認',
    text: '在庫・商品情報を確認します。',
  },
  {
    icon: Box,
    title: '梱包',
    text: '食品に適した状態で丁寧に梱包します。',
  },
  {
    icon: Send,
    title: '発送',
    text: '3〜5営業日以内に発送します。',
  },
  {
    icon: Home,
    title: '到着',
    text: 'ご自宅まで商品をお届けします。',
  },
]

export default function ProductDeliveryFlow() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="mt-5 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5">
      <p className="text-xs tracking-[0.24em] text-neutral-500">
        ORDER FLOW
      </p>

      <div className="mt-4 flex gap-3 overflow-x-auto">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isActive = active === i

          return (
            <div
              key={i}
              onClick={() => setActive(isActive ? null : i)}
              className={`
                relative shrink-0 cursor-pointer
                rounded-2xl border border-[#e6d7c1] bg-white
                transition-all duration-300
                ${isActive ? 'w-[140px] h-[140px]' : 'w-[70px] h-[70px] hover:scale-110'}
              `}
              style={{ perspective: 800 }}
            >
              <div
                className={`
                  absolute inset-0
                  transition-transform duration-500
                  ${isActive ? 'rotate-y-180' : ''}
                `}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* FRONT */}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden">
                  <Icon className="h-6 w-6 text-neutral-700" />
                </div>

                {/* BACK */}
                <div
                  className="absolute inset-0 flex flex-col justify-center p-3 text-center rotate-y-180 backface-hidden"
                >
                  <p className="text-sm font-semibold text-neutral-900">
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-neutral-600 leading-5">
                    {step.text}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
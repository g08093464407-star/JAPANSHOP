'use client'

import { useState } from 'react'
import { ShoppingCart, ClipboardCheck, Box, Send, Home, X } from 'lucide-react'

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
    <div className="relative mt-5 rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-5">
      <p className="text-xs tracking-[0.24em] text-neutral-500">
        ORDER FLOW
      </p>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon

          return (
            <button
              key={step.title}
              type="button"
              onClick={() => setActive(index)}
              className="group flex aspect-square items-center justify-center rounded-2xl border border-[#e6d7c1] bg-white/90 shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-md"
              aria-label={step.title}
            >
              <Icon className="h-6 w-6 text-neutral-800 transition duration-300 group-hover:rotate-6 group-hover:scale-110" />
            </button>
          )
        })}
      </div>

      {active !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-[#fffaf2]/92 p-5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#e6d7c1] bg-white text-neutral-500 transition hover:text-neutral-950"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="h-[150px] w-[150px] [perspective:900px]">
            <div className="relative h-full w-full animate-[deliveryFlip_520ms_ease-out_forwards] [transform-style:preserve-3d]">
              <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-[#e6d7c1] bg-white shadow-lg [backface-visibility:hidden]">
                {(() => {
                  const Icon = steps[active].icon
                  return <Icon className="h-10 w-10 text-neutral-800" />
                })()}
              </div>

              <div className="absolute inset-0 flex rotate-y-180 flex-col items-center justify-center rounded-3xl border border-[#e6d7c1] bg-white p-5 text-center shadow-lg [backface-visibility:hidden]">
                <p className="text-base font-semibold text-neutral-950">
                  {steps[active].title}
                </p>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {steps[active].text}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes deliveryFlip {
          from {
            transform: rotateY(0deg) scale(0.82);
            opacity: 0.4;
          }
          to {
            transform: rotateY(180deg) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
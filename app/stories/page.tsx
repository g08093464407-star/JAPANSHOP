'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import StoryModal from '@/components/ui/story-modal'

import { stories, type Story } from '@/data/stories'

export default function StoriesPage() {
  const [open, setOpen] = useState(false)
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [index, setIndex] = useState(0)

  return (
    <main className="min-h-screen bg-[#fffaf2] px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-[#eadfce] bg-white shadow-[0_24px_70px_rgba(58,42,22,0.09)]">
        <div className="relative bg-[linear-gradient(135deg,#fff4df_0%,#fffdf8_52%,#f3eadb_100%)] px-6 py-14 text-center sm:px-10 sm:py-20">
          <div className="pointer-events-none absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#d7c4a8] to-transparent" />

          <p className="text-xs tracking-[0.28em] text-neutral-500">
            SONYACHNA STORIES
          </p>

          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-neutral-950 sm:text-6xl">
            物語を、食卓へ。
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-neutral-600 sm:text-base">
            ウクライナの豊かな土壌から届いた、ひとつひとつの食材に宿る物語。
            商品を見る前に、その背景にある土地、文化、食卓の記憶をたどります。
          </p>

          <div className="mx-auto mt-8 flex w-fit flex-col items-center gap-3">
            <span className="text-[11px] tracking-[0.28em] text-neutral-500">
              SCROLL TO STORIES
            </span>
            <div className="relative h-16 w-px overflow-hidden bg-[#d8c5aa]">
              <span className="absolute left-0 top-0 h-7 w-px animate-[premiumScrollLine_1.9s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-neutral-900" />
            </div>
            <span className="h-2 w-2 animate-[premiumScrollDot_1.9s_cubic-bezier(0.65,0,0.35,1)_infinite] rounded-full bg-neutral-900" />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.24em] text-neutral-500">
            STORIES FROM UKRAINE
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-neutral-950">
            商品の背景にある、ウクライナの食文化
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((story) => (
            <button
              key={story.title}
              type="button"
              onClick={() => {
                setActiveStory(story)
                setIndex(0)
                setOpen(true)
              }}
              className="group relative aspect-[4/5] overflow-hidden rounded-[32px] border border-[#e6d7c1] bg-neutral-200 text-left shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(58,42,22,0.14)]"
            >
              <Image
                src={story.preview}
                alt={story.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-neutral-800 backdrop-blur">
                {story.label}
              </span>

              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-serif text-2xl leading-tight text-white">
                  {story.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/78">
                  {story.text}
                </p>
                <p className="mt-4 text-sm font-medium text-white">
                  物語を開く →
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-4xl rounded-[32px] border border-[#eadfce] bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-xs tracking-[0.24em] text-neutral-500">
          PRODUCT CATALOG
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight text-neutral-950">
          すべての商品を見る
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
          ストーリーではなく、商品一覧から直接選びたい場合はこちらからご覧ください。
        </p>

        <div className="mt-7">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-6 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
          >
            商品一覧へ
          </Link>
        </div>
      </section>

      <StoryModal
        open={open}
        onClose={() => setOpen(false)}
        story={activeStory}
        index={index}
        setIndex={setIndex}
      />

      <style jsx>{`
        @keyframes premiumScrollLine {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          22% {
            opacity: 1;
          }
          72% {
            opacity: 1;
          }
          100% {
            transform: translateY(180%);
            opacity: 0;
          }
        }

        @keyframes premiumScrollDot {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(6px);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  )
}
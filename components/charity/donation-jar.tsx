"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { HandCoins, Heart, Info, X } from "lucide-react";

import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

const DONATION_RATE = 0.05;
const FULL_SUN_AMOUNT = 1000;

type FillStyle = CSSProperties & {
  "--fill": string;
};

type CoinStyle = CSSProperties & {
  "--start-x": string;
  "--start-y": string;
  "--mid-x": string;
  "--coin-scale": string;
  "--rot": string;
  "--delay": string;
  "--duration": string;
};

const sunPetals = [
  "M50 9 C60 20, 61 26, 50 31 C39 26, 40 20, 50 9Z",
  "M71 15 C73 30, 70 36, 59 37 C57 26, 61 20, 71 15Z",
  "M88 36 C75 45, 69 46, 64 37 C72 29, 79 30, 88 36Z",
  "M88 64 C73 63, 67 59, 68 48 C79 47, 84 53, 88 64Z",
  "M50 91 C40 80, 39 74, 50 69 C61 74, 60 80, 50 91Z",
  "M29 85 C27 70, 30 64, 41 63 C43 74, 39 80, 29 85Z",
  "M12 64 C25 55, 31 54, 36 63 C28 71, 21 70, 12 64Z",
  "M12 36 C27 37, 33 41, 32 52 C21 53, 16 47, 12 36Z",
  "M29 15 C42 22, 45 28, 39 37 C29 32, 24 25, 28 15Z",
];

function formatYen(value: number) {
  return Math.max(0, Math.round(value)).toLocaleString("ja-JP");
}

function DonationSun({
  fillPercent,
  isFull,
  burstKey,
}: {
  fillPercent: number;
  isFull: boolean;
  burstKey: number;
}) {
  const fillStyle: FillStyle = {
    "--fill": `${fillPercent}%`,
  };

  return (
    <Link
      href="/charity"
      aria-label="Sonyachnaの慈善活動ページへ"
      className={cn(
        "group relative flex h-[122px] w-[122px] items-center justify-center overflow-visible transition duration-500 hover:-translate-y-1",
        isFull
          ? "drop-shadow-[0_0_22px_rgba(251,202,86,0.78)]"
          : "drop-shadow-[0_18px_35px_rgba(58,42,22,0.14)]",
      )}
    >
      <FallingCoins burstKey={burstKey} />

      <svg
        viewBox="0 0 100 100"
        className="relative h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient
            id="donationSunFilledGradient"
            cx="35%"
            cy="30%"
            r="72%"
          >
            <stop offset="0%" stopColor="#fff4bc" />
            <stop offset="42%" stopColor="#e9b85b" />
            <stop offset="100%" stopColor="#a86d1d" />
          </radialGradient>

          <linearGradient
            id="donationSunOutlineGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="rgba(255, 226, 159, 0.70)" />
            <stop offset="50%" stopColor="rgba(184, 127, 37, 0.55)" />
            <stop offset="100%" stopColor="rgba(91, 56, 14, 0.34)" />
          </linearGradient>

          <clipPath id="donationSunFillClip">
            <rect
              x="0"
              y={100 - fillPercent}
              width="100"
              height={fillPercent}
              className="transition-all duration-700 ease-out"
            />
          </clipPath>

          <filter
            id="donationSunSoftGlow"
            x="-45%"
            y="-45%"
            width="190%"
            height="190%"
          >
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0.98  0 1 0 0 0.72  0 0 1 0 0.24  0 0 0 0.72 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          className={cn(
            "transition duration-700",
            isFull
              ? "animate-[donationSunPulse_2.4s_ease-in-out_infinite]"
              : "",
          )}
          filter={isFull ? "url(#donationSunSoftGlow)" : undefined}
        >
          <g className="opacity-45 transition duration-700 group-hover:opacity-65">
            {sunPetals.map((path, index) => (
              <path
                key={`outline-${index}`}
                d={path}
                fill="rgba(255,255,255,0.08)"
                stroke="url(#donationSunOutlineGradient)"
                strokeWidth="2.1"
                strokeLinejoin="round"
              />
            ))}

            <circle
              cx="50"
              cy="50"
              r="13"
              fill="rgba(255,255,255,0.10)"
              stroke="url(#donationSunOutlineGradient)"
              strokeWidth="2.1"
            />
          </g>

          <g clipPath="url(#donationSunFillClip)" style={fillStyle}>
            {sunPetals.map((path, index) => (
              <path
                key={`filled-${index}`}
                d={path}
                fill="url(#donationSunFilledGradient)"
                className="transition duration-700"
              />
            ))}

            <circle
              cx="50"
              cy="50"
              r="13"
              fill="url(#donationSunFilledGradient)"
            />
            <circle cx="45" cy="44" r="4" fill="rgba(255,255,255,0.38)" />
          </g>
        </g>
      </svg>
    </Link>
  );
}

function FallingCoins({ burstKey }: { burstKey: number }) {
  if (!burstKey) return null;

  const coins: CoinStyle[] = Array.from({ length: 11 }).map(
    (_, index): CoinStyle => {
      const starts = [-42, 36, -18, 22, -6, 48, -34, 12, -54, 30, 0];
      const mids = [-20, 18, -8, 12, -3, 22, -14, 6, -26, 15, 0];
      const startYs = [
        -92, -104, -88, -114, -98, -122, -108, -90, -118, -100, -110,
      ];

      return {
        "--start-x": `${starts[index] ?? 0}px`,
        "--start-y": `${startYs[index] ?? -100}px`,
        "--mid-x": `${mids[index] ?? 0}px`,
        "--coin-scale": `${0.82 + (index % 4) * 0.06}`,
        "--rot": `${180 + index * 46}deg`,
        "--delay": `${index * 68}ms`,
        "--duration": `${1880 + (index % 4) * 140}ms`,
        animationDelay: `${index * 68}ms`,
      };
    },
  );

  return (
    <div
      key={burstKey}
      className="pointer-events-none absolute inset-0 z-30 overflow-visible"
      aria-hidden="true"
    >
      {coins.map((style, index) => (
        <span
          key={`${burstKey}-${index}`}
          className="donation-coin absolute left-1/2 top-1/2 h-5 w-5 animate-[donationCoinIntoSun_var(--duration)_cubic-bezier(0.16,0.76,0.22,1)_forwards] rounded-full opacity-0"
          style={style}
        >
          <span className="absolute inset-0 rounded-full border border-[#ffe79a] bg-[radial-gradient(circle_at_30%_24%,#fffbd2_0%,#f8df82_30%,#d9a03a_66%,#8e5b18_100%)] shadow-[0_8px_18px_rgba(185,133,43,0.30)]" />
          <span className="absolute inset-[4px] rounded-full border border-[#fff2b2]/70" />
          <span className="absolute inset-x-[7px] top-[5px] h-[3px] rounded-full bg-white/48" />
        </span>
      ))}
    </div>
  );
}

function CounterDigit({ char, index }: { char: string; index: number }) {
  const isDigit = /\d/.test(char);

  if (!isDigit) {
    return (
      <span className="flex h-10 items-center justify-center px-0.5 font-serif text-xl font-semibold text-[#7a5521]">
        {char}
      </span>
    );
  }

  return (
    <span className="relative flex h-10 w-[27px] overflow-hidden rounded-xl border border-[#d8c5aa] bg-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_8px_16px_rgba(58,42,22,0.08)]">
      <span className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-px bg-[#d8c5aa]/70" />
      <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white" />
      <span
        key={`${char}-${index}`}
        className="flex h-full w-full animate-[donationSequentialDigitRoll_1380ms_cubic-bezier(0.2,0.82,0.2,1)] items-center justify-center font-serif text-2xl font-semibold tabular-nums text-neutral-950"
        style={{
          animationDelay: `${index * 90}ms`,
        }}
      >
        {char}
      </span>
    </span>
  );
}

function SoftCounter({ amount }: { amount: number }) {
  const formatted = `¥${formatYen(amount)}`;

  return (
    <div className="flex h-[54px] w-[192px] items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 px-3 shadow-[0_16px_38px_rgba(58,42,22,0.12)] backdrop-blur-md">
      <div
        className="flex items-center justify-center gap-1"
        aria-label={`寄付予定額 ${formatted}`}
      >
        {formatted.split("").map((char, index) => (
          <CounterDigit
            key={`${formatted}-${char}-${index}`}
            char={char}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default function DonationJar() {
  const { cartCount, cartTotal, lastAddedAt } = useCart();
  const pathname = usePathname();

  const [showInfo, setShowInfo] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const previousLastAddedAt = useRef<number | null>(null);

  const shouldHide = useMemo(() => {
    if (!pathname) return false;

    return (
      pathname.startsWith("/cart") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/admin")
    );
  }, [pathname]);

  const projectedDonation = useMemo(() => {
    return Math.round(cartTotal * DONATION_RATE);
  }, [cartTotal]);

  const fillPercent = useMemo(() => {
    if (projectedDonation <= 0) return 0;
    return Math.min(
      100,
      Math.round((projectedDonation / FULL_SUN_AMOUNT) * 100),
    );
  }, [projectedDonation]);

  const isFull = projectedDonation >= FULL_SUN_AMOUNT;

  useEffect(() => {
    if (previousLastAddedAt.current === null) {
      previousLastAddedAt.current = lastAddedAt;
      return;
    }

    if (!lastAddedAt || previousLastAddedAt.current === lastAddedAt) return;

    previousLastAddedAt.current = lastAddedAt;
    setBurstKey((current) => current + 1);
  }, [lastAddedAt]);

  if (shouldHide || cartCount === 0 || projectedDonation <= 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-3 z-[82] hidden flex-col items-center gap-2 sm:flex lg:left-6">
      <div className="relative flex items-center gap-3">
        <DonationSun
          fillPercent={fillPercent}
          isFull={isFull}
          burstKey={burstKey}
        />

        <div className="flex flex-col items-center gap-2">
          <SoftCounter amount={projectedDonation} />

          <div className="grid w-[192px] grid-cols-3 gap-2">
            <Link
              href="/charity"
              aria-label="慈善活動ページへ"
              className="flex h-11 items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 text-neutral-800 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6d24] hover:bg-[#fff8ea] hover:shadow-md"
            >
              <Heart className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setShowInfo((current) => !current)}
              aria-label="寄付の説明を開く"
              className="flex h-11 items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 text-neutral-800 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6d24] hover:bg-[#fff8ea] hover:shadow-md"
            >
              <Info className="h-4 w-4" />
            </button>

            <Link
              href="/charity#voluntary-donation"
              aria-label="任意の寄付へ"
              className="flex h-11 items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 text-neutral-800 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6d24] hover:bg-[#fff8ea] hover:shadow-md"
            >
              <HandCoins className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {showInfo ? (
        <div className="relative ml-[134px] w-[192px] rounded-3xl border border-[#eadfce] bg-white/96 p-4 text-xs leading-6 text-neutral-700 shadow-[0_18px_46px_rgba(58,42,22,0.16)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowInfo(false)}
            className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="説明を閉じる"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="pr-6 font-medium text-neutral-950">5% for good</p>
          <p className="mt-2">
            カート内商品の5%を、決済完了後に活動資金として集計します。表示額は購入前の見込み額です。
          </p>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes donationDoubleDigitFlip {
          0% {
            opacity: 0;
            transform: translateY(-3200%) rotateX(84deg);
            filter: blur(1.3px);
          }
          14% {
            opacity: 1;
            transform: translateY(-240%) rotateX(72deg);
            filter: blur(1px);
          }
          28% {
            transform: translateY(-160%) rotateX(58deg);
            filter: blur(0.75px);
          }
          42% {
            transform: translateY(-80%) rotateX(38deg);
            filter: blur(0.45px);
          }
          58% {
            transform: translateY(18%) rotateX(-16deg);
            filter: blur(0.18px);
          }
          72% {
            transform: translateY(-8%) rotateX(8deg);
          }
          86% {
            transform: translateY(4%) rotateX(-4deg);
          }

          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
            filter: blur(0);
          }
        }

        @keyframes donationCoinIntoSun {
          0% {
            opacity: 0;
            filter: blur(6px);
            transform: translateX(calc(-50% + var(--start-x)))
              translateY(var(--start-y)) rotateY(70deg) rotateZ(0deg)
              scale(0.34);
          }
          10% {
            opacity: 0.35;
            filter: blur(3.4px);
            transform: translateX(calc(-50% + var(--start-x)))
              translateY(calc(var(--start-y) * 0.92)) rotateY(105deg)
              rotateZ(calc(var(--rot) * 0.12))
              scale(calc(var(--coin-scale) * 0.58));
          }
          28% {
            opacity: 0.82;
            filter: blur(1px);
            transform: translateX(calc(-50% + ((var(--start-x) * 0.58) + (var(--mid-x) * 0.42))))
              translateY(calc(var(--start-y) * 0.45)) rotateY(170deg)
              rotateZ(calc(var(--rot) * 0.34))
              scale(calc(var(--coin-scale) * 0.9));
          }
          56% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(calc(-50% + var(--mid-x))) translateY(-34px)
              rotateY(248deg) rotateZ(calc(var(--rot) * 0.64))
              scale(var(--coin-scale));
          }
          82% {
            opacity: 0.95;
            filter: blur(0);
            transform: translateX(-50%) translateY(-7px) rotateY(336deg)
              rotateZ(var(--rot)) scale(calc(var(--coin-scale) * 0.82));
          }
          100% {
            opacity: 0;
            filter: blur(2px);
            transform: translateX(-50%) translateY(0) rotateY(390deg)
              rotateZ(calc(var(--rot) + 36deg)) scale(0.14);
          }
        }

        @keyframes donationSunPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.035);
          }
        }
      `}</style>
    </div>
  );
}

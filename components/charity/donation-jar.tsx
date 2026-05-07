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

  const coins: CoinStyle[] = [
    { "--start-x": "-44px", "--start-y": "-104px", "--mid-x": "-18px", "--coin-scale": "1.08", "--rot": "300deg", "--delay": "0ms", "--duration": "1960ms", animationDelay: "0ms", filter: "blur(0px)" },
    { "--start-x": "34px", "--start-y": "-112px", "--mid-x": "16px", "--coin-scale": "0.92", "--rot": "356deg", "--delay": "95ms", "--duration": "1880ms", animationDelay: "95ms", filter: "blur(0.4px)" },
    { "--start-x": "-18px", "--start-y": "-118px", "--mid-x": "-6px", "--coin-scale": "0.74", "--rot": "250deg", "--delay": "180ms", "--duration": "1800ms", animationDelay: "180ms", filter: "blur(1.2px)" },
    { "--start-x": "52px", "--start-y": "-98px", "--mid-x": "22px", "--coin-scale": "1.16", "--rot": "410deg", "--delay": "260ms", "--duration": "2020ms", animationDelay: "260ms", filter: "blur(0px)" },
    { "--start-x": "-56px", "--start-y": "-124px", "--mid-x": "-24px", "--coin-scale": "0.68", "--rot": "278deg", "--delay": "360ms", "--duration": "1740ms", animationDelay: "360ms", filter: "blur(1.5px)" },
    { "--start-x": "8px", "--start-y": "-108px", "--mid-x": "4px", "--coin-scale": "0.96", "--rot": "332deg", "--delay": "450ms", "--duration": "1920ms", animationDelay: "450ms", filter: "blur(0.2px)" },
    { "--start-x": "-28px", "--start-y": "-95px", "--mid-x": "-10px", "--coin-scale": "1.12", "--rot": "388deg", "--delay": "560ms", "--duration": "2040ms", animationDelay: "560ms", filter: "blur(0px)" },
    { "--start-x": "26px", "--start-y": "-126px", "--mid-x": "10px", "--coin-scale": "0.72", "--rot": "296deg", "--delay": "670ms", "--duration": "1780ms", animationDelay: "670ms", filter: "blur(1.3px)" },
  ];

  return (
    <div
      key={burstKey}
      className="pointer-events-none absolute inset-0 z-30 overflow-visible"
      aria-hidden="true"
    >
      {coins.map((style, index) => (
        <span
          key={`${burstKey}-${index}`}
          className="donation-coin absolute left-1/2 top-1/2 h-5 w-5 animate-[premiumCoinFall_var(--duration)_cubic-bezier(0.25,0.46,0.45,0.94)_forwards] rounded-full opacity-0 will-change-transform"
          style={style}
        >
          <span className="absolute inset-0 rounded-full border border-[#ffe79a]/85 bg-[radial-gradient(circle_at_30%_26%,#fffdf1_0%,#fff2b8_18%,#f4cf69_42%,#cf8f2d_70%,#7d4a11_100%)] shadow-[0_10px_24px_rgba(185,133,43,0.28)]" />
          <span className="absolute inset-[2px] rounded-full bg-[radial-gradient(circle_at_34%_28%,rgba(255,255,255,0.92)_0%,rgba(255,250,210,0.18)_24%,rgba(255,255,255,0)_46%)] opacity-95" />
          <span className="absolute inset-y-[4px] left-[3px] w-[6px] rounded-full bg-gradient-to-r from-white/0 via-white/55 to-white/0 opacity-80 animate-[coinShimmer_1.4s_ease-in-out_infinite]" />
          <span className="absolute inset-[4px] rounded-full border border-[#fff2b2]/55" />
        </span>
      ))}
    </div>
  );
}

function RollingDigit({
  value,
  index,
}: {
  value: number;
  index: number;
}) {
  const [targetIndex, setTargetIndex] = useState(30 + value);
  const [instantReset, setInstantReset] = useState(false);
  const digitHeight = 40;

  useEffect(() => {
    setTargetIndex((current) => {
      const currentDigit = current % 10;
      const forwardDistance = (value - currentDigit + 10) % 10;
      return current + 20 + forwardDistance;
    });
  }, [value]);

  useEffect(() => {
    if (targetIndex < 200) return;

    const resetTimer = window.setTimeout(() => {
      setInstantReset(true);
      setTargetIndex(30 + (targetIndex % 10));

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setInstantReset(false);
        });
      });
    }, 1700 + index * 95);

    return () => window.clearTimeout(resetTimer);
  }, [targetIndex, index]);

  return (
    <span className="relative flex h-10 w-[27px] overflow-hidden rounded-xl border border-[#d8c5aa] bg-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_8px_16px_rgba(58,42,22,0.08)]">
      <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white" />
      <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-3 bg-gradient-to-b from-white/85 to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-3 bg-gradient-to-t from-[#fffaf2]/85 to-transparent" />

      <span
        className={cn(
          "flex w-full flex-col ease-[cubic-bezier(0.2,0.78,0.2,1)]",
          instantReset
            ? "transition-none"
            : "transition-transform duration-[1650ms]",
        )}
        style={{
          transform: `translateY(-${targetIndex * digitHeight}px)`,
          transitionDelay: instantReset ? "0ms" : `${index * 95}ms`,
        }}
      >
        {Array.from({ length: 260 }).map((_, digitIndex) => (
          <span
            key={digitIndex}
            className="flex h-10 w-full shrink-0 items-center justify-center font-serif text-2xl font-semibold tabular-nums text-neutral-950"
          >
            {digitIndex % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

function StaticCounterChar({ char }: { char: string }) {
  return (
    <span className="flex h-10 items-center justify-center px-0.5 font-serif text-xl font-semibold text-[#7a5521]">
      {char}
    </span>
  );
}

function SoftCounter({ amount }: { amount: number }) {
  const roundedAmount = Math.max(0, Math.round(amount));
  const visibleLength = roundedAmount > 999 ? 4 : 3;
  const rawDigits = String(roundedAmount).slice(-visibleLength);
  const paddedDigits = rawDigits.padStart(visibleLength, " ").split("");
  let digitIndex = 0;

  return (
    <div className="flex h-[54px] min-w-[154px] items-center justify-center rounded-2xl border border-[#d8c5aa] bg-white/92 px-3 shadow-[0_16px_38px_rgba(58,42,22,0.12)] backdrop-blur-md">
      <div
        className="flex items-center justify-center gap-1"
        aria-label={`寄付予定額 ¥${roundedAmount.toLocaleString("ja-JP")}`}
      >
        <StaticCounterChar char="¥" />

        {paddedDigits.map((char, index) => {
          if (char === " ") {
            return <span key={`blank-${index}`} className="h-10 w-[27px]" />;
          }

          const currentDigitIndex = digitIndex;
          digitIndex += 1;

          return (
            <RollingDigit
              key={`digit-${visibleLength}-${index}-${char}`}
              value={Number(char)}
              index={currentDigitIndex}
            />
          );
        })}
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

          <div className="grid w-[154px] grid-cols-3 gap-2">
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
        <div className="relative ml-[134px] w-[154px] rounded-3xl border border-[#eadfce] bg-white/96 p-4 text-xs leading-6 text-neutral-700 shadow-[0_18px_46px_rgba(58,42,22,0.16)] backdrop-blur-md">
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
        @keyframes premiumCoinFall {
          0% {
            opacity: 0;
            transform: translateX(calc(-50% + var(--start-x)))
              translateY(var(--start-y)) scale(calc(var(--coin-scale) * 0.55))
              rotateX(68deg) rotateZ(0deg);
          }
          12% {
            opacity: 0.95;
            transform: translateX(calc(-50% + var(--start-x)))
              translateY(calc(var(--start-y) * 0.84)) scale(calc(var(--coin-scale) * 0.72))
              rotateX(52deg) rotateZ(calc(var(--rot) * 0.16));
          }
          46% {
            opacity: 1;
            transform: translateX(calc(-50% + var(--mid-x)))
              translateY(-34px) scale(var(--coin-scale))
              rotateX(8deg) rotateZ(calc(var(--rot) * 0.62));
          }
          84% {
            opacity: 1;
            transform: translateX(-50%) translateY(-2px)
              scale(calc(var(--coin-scale) * 0.86)) rotateX(-10deg)
              rotateZ(var(--rot));
          }
          92% {
            opacity: 0.84;
            transform: translateX(-50%) translateY(1px)
              scale(calc(var(--coin-scale) * 0.72)) rotateX(-18deg)
              rotateZ(calc(var(--rot) + 24deg));
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(0)
              scale(calc(var(--coin-scale) * 0.4)) rotateX(-24deg)
              rotateZ(calc(var(--rot) + 40deg));
          }
        }

        @keyframes coinShimmer {
          0%, 100% {
            opacity: 0.12;
            transform: translateX(-2px);
          }
          50% {
            opacity: 0.8;
            transform: translateX(8px);
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Coins,
  Heart,
  Info,
  Leaf,
  Sparkles,
  X,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

const DONATION_RATE = 0.05;
const VISUAL_FULL_AMOUNT = 5000;

function formatYen(value: number) {
  return `¥${Math.max(0, Math.floor(value)).toLocaleString("ja-JP")}`;
}

function RollingDigit({
  char,
  index,
  pulseKey,
}: {
  char: string;
  index: number;
  pulseKey: number;
}) {
  if (!/\d/.test(char)) {
    return (
      <span className="inline-flex w-[0.46em] justify-center">{char}</span>
    );
  }

  const digit = Number(char);
  const digitStyle = {
    "--digit-offset": digit,
    "--digit-delay": `${Math.min(index * 28, 180)}ms`,
  } as CSSProperties;

  return (
    <span className="relative inline-flex h-[1.1em] w-[0.62em] overflow-hidden rounded-[6px] align-[-0.08em] [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)]">
      <span
        key={`${pulseKey}-${index}-${char}`}
        style={digitStyle}
        className="absolute left-0 top-0 inline-flex w-full animate-[donationSlotRoll_720ms_cubic-bezier(0.16,1,0.3,1)_both] flex-col items-center [animation-delay:var(--digit-delay)]"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <span
            key={number}
            className="flex h-[1.1em] w-full items-center justify-center"
          >
            {number}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingAmount({
  amount,
  pulseKey,
}: {
  amount: number;
  pulseKey: number;
}) {
  const formatted = formatYen(amount);

  return (
    <span className="font-serif text-[30px] font-semibold leading-none tracking-tight text-neutral-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
      {formatted.split("").map((char, index) => (
        <RollingDigit
          key={`${index}-${char}`}
          char={char}
          index={index}
          pulseKey={pulseKey}
        />
      ))}
    </span>
  );
}

function ActionButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e3cfad] bg-white/92 text-neutral-800 shadow-[0_10px_28px_rgba(58,42,22,0.12)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#c79434] hover:bg-[#fff7e8] hover:text-neutral-950 hover:shadow-[0_16px_40px_rgba(58,42,22,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.72),transparent_58%)] opacity-80" />
      <span className="relative transition duration-300 group-hover:scale-110">
        {children}
      </span>
    </button>
  );
}

export default function DonationJar() {
  const { cartCount, cartTotal, lastAddedAt } = useCart();
  const pathname = usePathname();

  const [pulseKey, setPulseKey] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [coinBurstKey, setCoinBurstKey] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const previousLastAddedAt = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  const shouldHide = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith("/cart") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/orders")
    );
  }, [pathname]);

  const projectedDonation = useMemo(() => {
    return Math.floor(cartTotal * DONATION_RATE);
  }, [cartTotal]);

  const fillLevel = useMemo(() => {
    if (projectedDonation <= 0) return 4;
    return Math.min(
      96,
      Math.max(9, Math.round((projectedDonation / VISUAL_FULL_AMOUNT) * 100)),
    );
  }, [projectedDonation]);

  const progressLabel = useMemo(() => {
    return `${Math.min(100, Math.round((projectedDonation / VISUAL_FULL_AMOUNT) * 100))}%`;
  }, [projectedDonation]);

  useEffect(() => {
    if (previousLastAddedAt.current === null) {
      previousLastAddedAt.current = lastAddedAt;
      return;
    }

    if (!lastAddedAt || previousLastAddedAt.current === lastAddedAt) return;

    previousLastAddedAt.current = lastAddedAt;
    setPulseKey((current) => current + 1);
    setCoinBurstKey((current) => current + 1);
    setIsPulsing(true);

    if (pulseTimerRef.current) {
      window.clearTimeout(pulseTimerRef.current);
    }

    pulseTimerRef.current = window.setTimeout(() => {
      setIsPulsing(false);
    }, 1200);

    return () => {
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, [lastAddedAt]);

  useEffect(() => {
    setShowInfo(false);
  }, [pathname]);

  if (shouldHide || cartCount === 0 || projectedDonation <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed left-4 z-[86] hidden items-end gap-3 transition-all duration-500 ease-out sm:flex",
        pathname?.startsWith("/product/") ? "bottom-28" : "bottom-24",
        isPulsing ? "scale-[1.025]" : "scale-100",
      )}
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -left-8 -top-16 h-52 w-52 rounded-full bg-[#ffe7a8]/28 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-8 h-44 w-44 rounded-full bg-emerald-100/38 blur-3xl" />

      <div className="relative h-[184px] w-[112px] shrink-0">
        <div
          key={coinBurstKey}
          className="pointer-events-none absolute -top-10 left-0 right-0 z-30 h-32"
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((coin) => (
            <span
              key={coin}
              className="absolute left-1/2 top-1 h-3 w-3 rounded-full border border-[#8f5f17]/45 bg-[radial-gradient(circle_at_35%_30%,#fff3b8_0%,#f4c05a_44%,#a66d1e_100%)] opacity-0 shadow-[0_3px_9px_rgba(58,42,22,0.22)] animate-[donationCoinIntoJar_980ms_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
              style={{
                marginLeft: `${[-38, -24, -13, -4, 8, 19, 31, 42][coin]}px`,
                animationDelay: `${coin * 52}ms`,
              }}
            />
          ))}
        </div>

        <div className="absolute left-1/2 top-0 z-10 h-7 w-16 -translate-x-1/2 rounded-t-[22px] border border-[#d9c39d] bg-[linear-gradient(180deg,#fffdf8_0%,#fff1cf_100%)] shadow-[0_10px_24px_rgba(58,42,22,0.08)]" />
        <div className="absolute left-1/2 top-[18px] z-20 h-5 w-20 -translate-x-1/2 rounded-full border border-[#d7bc8f] bg-white/90 shadow-[0_8px_18px_rgba(58,42,22,0.10)]" />

        <div className="absolute bottom-0 left-1/2 h-[154px] w-[98px] -translate-x-1/2 overflow-hidden rounded-b-[34px] rounded-t-[24px] border border-[#d8c29c] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(255,250,242,0.88)_44%,rgba(250,238,215,0.72)_100%)] shadow-[inset_0_2px_14px_rgba(255,255,255,0.8),inset_0_-18px_34px_rgba(95,61,20,0.10),0_22px_54px_rgba(58,42,22,0.18)] backdrop-blur-md">
          <div
            className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(180deg,#fff2b8_0%,#e3ad42_38%,#a86e1f_100%)] transition-all duration-1000 ease-out"
            style={{ height: `${fillLevel}%` }}
          >
            <div className="absolute -top-2 left-0 right-0 h-5 rounded-[50%] bg-[#fff0b7]/78 blur-[0.2px]" />
            <div className="absolute inset-x-0 top-0 h-8 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)]" />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.18)_34%,rgba(87,55,18,0.11)_100%)]" />
          <div className="absolute left-5 top-10 h-12 w-5 rounded-full bg-white/34 blur-[1px]" />
          <div className="absolute bottom-4 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/72 bg-white/28 text-[11px] font-semibold text-white/90 shadow-inner">
            5%
          </div>
        </div>

        <div className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#dfc99f] bg-white/90 px-3 py-1 text-[10px] font-medium tracking-[0.16em] text-[#8a611f] shadow-sm backdrop-blur">
          {progressLabel}
        </div>
      </div>

      <div className="relative mb-1 flex flex-col gap-2">
        <div
          className={cn(
            "relative min-w-[174px] rounded-[24px] border border-[#e6d7c1] bg-white/88 px-4 py-3 shadow-[0_18px_52px_rgba(58,42,22,0.14)] backdrop-blur-xl transition duration-500",
            isPulsing && "shadow-[0_24px_64px_rgba(185,133,43,0.20)]",
          )}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_22%_18%,rgba(255,236,180,0.56),transparent_50%)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#b9852b]" />
              <p className="text-[10px] tracking-[0.24em] text-neutral-500">
                5% FOR GOOD
              </p>
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-950">
              やさしい循環
            </p>
            <div className="mt-2 rounded-2xl border border-[#eadfce] bg-[#fffaf2]/78 px-3 py-2 shadow-inner">
              <RollingAmount amount={projectedDonation} pulseKey={pulseKey} />
              <p className="mt-1 text-[10px] leading-4 text-neutral-500">
                このカートからの見込み
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <Link
            href="/charity"
            aria-label="チャリティーページを見る"
            title="チャリティーページ"
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e3cfad] bg-white/92 text-neutral-800 shadow-[0_10px_28px_rgba(58,42,22,0.12)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#c79434] hover:bg-[#fff7e8] hover:text-neutral-950 hover:shadow-[0_16px_40px_rgba(58,42,22,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <Heart className="h-4 w-4 transition duration-300 group-hover:scale-110" />
          </Link>

          <ActionButton
            label="説明を見る"
            onClick={() => setShowInfo((current) => !current)}
          >
            <Info className="h-4 w-4" />
          </ActionButton>

          <Link
            href="/charity#voluntary-donation"
            aria-label="任意の寄付について見る"
            title="任意の寄付"
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e3cfad] bg-white/92 text-neutral-800 shadow-[0_10px_28px_rgba(58,42,22,0.12)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#c79434] hover:bg-[#fff7e8] hover:text-neutral-950 hover:shadow-[0_16px_40px_rgba(58,42,22,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <Coins className="h-4 w-4 transition duration-300 group-hover:scale-110" />
          </Link>
        </div>

        {showInfo ? (
          <div className="absolute bottom-[48px] left-0 z-40 w-[238px] animate-[donationInfoIn_220ms_ease-out] rounded-[24px] border border-[#eadfce] bg-white/96 p-4 shadow-[0_24px_70px_rgba(58,42,22,0.18)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#eadfce] bg-[#fffaf2] text-neutral-600 transition hover:bg-white hover:text-neutral-950"
              aria-label="説明を閉じる"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <p className="pr-8 text-[10px] tracking-[0.22em] text-neutral-500">
              ABOUT THIS JAR
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-950">
              購入が小さな循環になります。
            </p>
            <p className="mt-2 text-xs leading-6 text-neutral-600">
              表示額はカート合計の5%です。実際の活動資金として集計されるのは、決済完了後の金額だけです。
            </p>
            <Link
              href="/charity"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#805617] transition hover:text-neutral-950"
              onClick={() => setShowInfo(false)}
            >
              詳しく見る
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes donationSlotRoll {
          0% {
            transform: translateY(-10.9em);
            opacity: 0.78;
            filter: blur(1.1px);
          }
          56% {
            opacity: 1;
            filter: blur(0.2px);
          }
          100% {
            transform: translateY(calc(var(--digit-offset) * -1.1em));
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes donationCoinIntoJar {
          0% {
            opacity: 0;
            transform: translateY(-26px) scale(0.62) rotate(-34deg);
          }
          18% {
            opacity: 1;
          }
          72% {
            opacity: 1;
            transform: translateY(86px) scale(1.04) rotate(140deg);
          }
          100% {
            opacity: 0;
            transform: translateY(116px) scale(0.78) rotate(210deg);
          }
        }

        @keyframes donationInfoIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

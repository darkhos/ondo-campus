"use client";

import React, { useEffect, useState } from "react";
import { Flame, Heart, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/components/ondo-ui";
import { useInViewOnce, usePrefersReducedMotion } from "@/components/reveal";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

type CoupleStage = 0 | 1 | 2;

const STAGES_KO: {
  stage: CoupleStage;
  temp: string;
  label: string;
  badge: string;
}[] = [
  {
    stage: 0,
    temp: "35.0°",
    label: "1. 밤 9시 매칭",
    badge: "💌 매일 밤 9시, 조건 맞는 상대 도착",
  },
  {
    stage: 1,
    temp: "36.0°",
    label: "2. 블라인드 대화",
    badge: "💬 서로 수락 후 앱 안에서 5마디 대화",
  },
  {
    stage: 2,
    temp: "36.5°",
    label: "3. 설레는 만남",
    badge: "☕ 카톡 ID 공개 & 설레는 첫 만남!",
  },
];

const STAGES_JA: {
  stage: CoupleStage;
  temp: string;
  label: string;
  badge: string;
}[] = [
  {
    stage: 0,
    temp: "35.0°",
    label: "1. 21時マッチング",
    badge: "💌 毎晩21時、条件の合うお相手が到着",
  },
  {
    stage: 1,
    temp: "36.0°",
    label: "2. ブラインド会話",
    badge: "💬 お互いOKならアプリ内で5往復トーク",
  },
  {
    stage: 2,
    temp: "36.5°",
    label: "3. トキメキの出会い",
    badge: "☕ カカオID公開＆カフェで初対面！",
  },
];

export function CoupleInteractiveHero({ isJa = false }: { isJa?: boolean }) {
  const reduceMotion = usePrefersReducedMotion();
  const [containerRef, seen] = useInViewOnce<HTMLDivElement>(0.2);
  const [stage, setStage] = useState<CoupleStage>(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const stages = isJa ? STAGES_JA : STAGES_KO;
  const current = stages[stage];

  // Auto-cycle smoothly 0 -> 1 -> 2 until the user taps or drags
  useEffect(() => {
    if (!seen || userInteracted || reduceMotion) return;
    const id = window.setInterval(() => {
      setStage((prev) => ((prev + 1) % 3) as CoupleStage);
    }, 3200);
    return () => window.clearInterval(id);
  }, [seen, userInteracted, reduceMotion]);

  const selectStage = (next: CoupleStage) => {
    setUserInteracted(true);
    setStage(next);
  };

  const cycleNextStage = () => {
    setUserInteracted(true);
    setStage((prev) => ((prev + 1) % 3) as CoupleStage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: ny * -7, y: nx * 7 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="ondo-rise mx-auto mt-5 w-full max-w-lg select-none sm:mt-6"
      style={{ "--ondo-rise-delay": "210ms" } as React.CSSProperties}
    >
      {/* Main Interactive Visual Card */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          isJa
            ? "タップしてカップルのストーリーを進める"
            : "터치하여 커플 매칭 단계를 넘겨보세요"
        }
        onClick={cycleNextStage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cycleNextStage();
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(900px) rotateX(${tilt.x.toFixed(
            2
          )}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
        }}
        className="group relative cursor-pointer overflow-hidden rounded-3xl border border-stone-200/90 bg-gradient-to-b from-[#FFF9F6] via-[#FFF3EE] to-[#F9EAE4] p-3.5 shadow-[0_14px_34px_rgba(225,29,72,0.09)] transition-[transform,box-shadow] duration-300 ease-out hover:shadow-[0_18px_42px_rgba(225,29,72,0.14)] sm:p-4"
      >
        {/* Top Floating Temperature & Stage Status Pill */}
        <div className="relative z-20 mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11.5px] font-extrabold text-zinc-800 shadow-2xs backdrop-blur-xs sm:text-[12px]">
            <span>{current.badge}</span>
          </span>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-black tabular-nums text-white shadow-xs transition-colors duration-300",
              stage === 2
                ? "bg-rose-600 ring-2 ring-rose-200"
                : stage === 1
                ? "bg-rose-500"
                : "bg-zinc-900"
            )}
          >
            <Flame className="h-3 w-3" fill="currentColor" />
            <span>{current.temp}</span>
          </span>
        </div>

        {/* Visual Stage Container (Fixed Aspect Ratio so layout never jumps) */}
        <div className="relative h-[220px] w-full overflow-hidden rounded-2xl sm:h-[256px]">
          {/* Stage 0 & Stage 1: Split Male & Female Portrait Cards Gliding Closer */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center px-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-3",
              stage === 2
                ? "pointer-events-none scale-105 opacity-0"
                : "scale-100 opacity-100"
            )}
          >
            {/* Left: Male Student Card */}
            <div
              className={cn(
                "relative h-[196px] w-[46%] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:h-[228px]",
                stage === 0
                  ? "-translate-x-2 -rotate-3"
                  : "translate-x-1 -rotate-1 border-rose-200 shadow-lg"
              )}
            >
              <img
                src={`${BASE_PATH}/couple-male.jpg`}
                alt={isJa ? "韓国の男子大学生" : "남학생 프로필 일러스트"}
                className={cn(
                  "h-full w-full object-cover transition-all duration-500",
                  stage === 0 ? "scale-105 blur-[1.5px] brightness-95" : "scale-100 blur-none"
                )}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 text-left text-white">
                <span className="inline-block rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                  {isJa ? "🇰🇷 延世大 · 23" : "🇰🇷 연세대 · 23"}
                </span>
                <p className="mt-0.5 truncate text-[11px] font-bold text-white/95">
                  {isJa ? "#温かい印象 ☕" : "#따뜻한인상 ☕"}
                </p>
              </div>
            </div>

            {/* Center Connection Badge & Floating Chat Bubbles */}
            <div className="relative z-20 -mx-3 flex flex-col items-center justify-center">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-500",
                  stage === 0
                    ? "bg-zinc-900 text-rose-400"
                    : "scale-110 bg-rose-600 text-white"
                )}
              >
                {stage === 0 ? (
                  <Sparkles className="h-5 w-5 animate-pulse" />
                ) : (
                  <MessageCircle className="h-5 w-5" fill="currentColor" />
                )}
              </div>
            </div>

            {/* Right: Female Student Card */}
            <div
              className={cn(
                "relative h-[196px] w-[46%] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:h-[228px]",
                stage === 0
                  ? "translate-x-2 rotate-3"
                  : "-translate-x-1 rotate-1 border-rose-200 shadow-lg"
              )}
            >
              <img
                src={`${BASE_PATH}/couple-female.jpg`}
                alt={isJa ? "女子大学生・留学生" : "여학생 프로필 일러스트"}
                className={cn(
                  "h-full w-full object-cover transition-all duration-500",
                  stage === 0 ? "scale-105 blur-[1.5px] brightness-95" : "scale-100 blur-none"
                )}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 text-left text-white">
                <span className="inline-block rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                  {isJa ? "🇯🇵 梨花女子大 語学堂 · 22" : "이화여대 · 22"}
                </span>
                <p className="mt-0.5 truncate text-[11px] font-bold text-white/95">
                  {isJa ? "#カフェ巡り 🌿" : "#카페산책 🌿"}
                </p>
              </div>
            </div>

            {/* Stage 1 Floating Chat Bubbles */}
            <div
              className={cn(
                "pointer-events-none absolute inset-x-3 top-2.5 z-30 flex flex-col gap-1.5 transition-all duration-400",
                stage === 1
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              )}
            >
              <div className="self-start rounded-2xl rounded-bl-xs border border-stone-200/80 bg-white/95 px-3 py-1.5 text-[11.5px] font-bold text-zinc-800 shadow-md backdrop-blur-xs">
                {isJa
                  ? "「週末、延南洞のカフェに行きませんか？☕」"
                  : "“주말에 연남동 카페 같이 갈래요? ☕”"}
              </div>
              <div className="self-end rounded-2xl rounded-br-xs bg-rose-600/95 px-3 py-1.5 text-[11.5px] font-bold text-white shadow-md backdrop-blur-xs">
                {isJa
                  ? "「いいですね！ぜひお話ししましょう 😊」"
                  : "“좋아요! 커피 마시면서 얘기해요 😊”"}
              </div>
            </div>
          </div>

          {/* Stage 2: Merged Couple First-Date Illustration */}
          <div
            className={cn(
              "absolute inset-0 overflow-hidden rounded-2xl border-2 border-white shadow-inner transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              stage === 2
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0"
            )}
          >
            <img
              src={`${BASE_PATH}/couple-together.jpg`}
              alt={isJa ? "カフェで出会うカップル" : "설레는 카페 첫 만남 커플"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pt-8 pb-3 text-white">
              <div className="text-left">
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10.5px] font-extrabold text-white shadow-xs">
                  <Heart className="h-3 w-3" fill="currentColor" />
                  {isJa ? "36.5° マッチング成立" : "36.5° 커플 매칭 성사"}
                </span>
                <p className="mt-1 text-[12.5px] font-bold text-white sm:text-[13.5px]">
                  {isJa
                    ? "会話が弾んだらカカオを交換してカフェで初対面 ✨"
                    : "대화가 통하면 카톡 교환 후 설레는 첫 만남 ✨"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive 3-Step Temperature Selector Bar */}
        <div
          className="mt-3 grid grid-cols-3 gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {stages.map((item) => {
            const active = stage === item.stage;
            return (
              <button
                key={item.stage}
                type="button"
                onClick={() => selectStage(item.stage)}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-xl border py-2 text-[11.5px] font-extrabold transition-all duration-200 sm:text-[12px]",
                  active
                    ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                    : "border-white/80 bg-white/80 text-zinc-700 hover:bg-white"
                )}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

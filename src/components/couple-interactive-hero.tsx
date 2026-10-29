"use client";

import React, { useEffect, useState } from "react";
import { Flame, Heart, MessageCircle, Sparkles } from "lucide-react";
import { Button, cn } from "@/components/ondo-ui";
import { useInViewOnce, usePrefersReducedMotion } from "@/components/reveal";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

type CoupleStage = 0 | 1 | 2;

const STAGES_KO: {
  stage: CoupleStage;
  temp: string;
  shortLabel: string;
  leftBubble: string;
  rightBubble: string;
}[] = [
  {
    stage: 0,
    temp: "35.0°",
    shortLabel: "💌 밤 9시 도착",
    leftBubble: "🇰🇷 연세대 · #따뜻한인상 ☕",
    rightBubble: "이화여대 · #전시회산책 🌿",
  },
  {
    stage: 1,
    temp: "36.0°",
    shortLabel: "💬 블라인드 대화",
    leftBubble: "“주말에 연남동 카페 갈래요? ☕”",
    rightBubble: "“좋아요! 커피 마시며 얘기해요 😊”",
  },
  {
    stage: 2,
    temp: "36.5°",
    shortLabel: "❤️ 설레는 만남",
    leftBubble: "🎉 대화 5회 달성 · 카톡 공개!",
    rightBubble: "설레는 카페 첫 만남 성사 ✨",
  },
];

const STAGES_JA: {
  stage: CoupleStage;
  temp: string;
  shortLabel: string;
  leftBubble: string;
  rightBubble: string;
}[] = [
  {
    stage: 0,
    temp: "35.0°",
    shortLabel: "💌 21時到着",
    leftBubble: "🇰🇷 延世大 · #温かい印象 ☕",
    rightBubble: "🇯🇵 梨花女子大 · #カフェ巡り 🌿",
  },
  {
    stage: 1,
    temp: "36.0°",
    shortLabel: "💬 ブラインド会話",
    leftBubble: "「週末、延南洞のカフェに行きませんか？☕」",
    rightBubble: "「いいですね！ぜひお話ししましょう 😊」",
  },
  {
    stage: 2,
    temp: "36.5°",
    shortLabel: "❤️ 初対面",
    leftBubble: "🎉 会話5往復達成・カカオ公開！",
    rightBubble: "トキメキのカフェ初対面 ✨",
  },
];

export function CoupleInteractiveHero({
  isJa = false,
  quickLoading = false,
  onKakaoLogin,
}: {
  isJa?: boolean;
  quickLoading?: boolean;
  onKakaoLogin: () => void;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const [containerRef, seen] = useInViewOnce<HTMLDivElement>(0.15);
  const [stage, setStage] = useState<CoupleStage>(1);
  const [userInteracted, setUserInteracted] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [heartBurst, setHeartBurst] = useState<number>(0);

  const stages = isJa ? STAGES_JA : STAGES_KO;
  const current = stages[stage];

  // Auto-cycle smoothly 0 -> 1 -> 2 until the user taps
  useEffect(() => {
    if (!seen || userInteracted || reduceMotion) return;
    const id = window.setInterval(() => {
      setStage((prev) => ((prev + 1) % 3) as CoupleStage);
    }, 3400);
    return () => window.clearInterval(id);
  }, [seen, userInteracted, reduceMotion]);

  const handleStageClick = (next: CoupleStage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUserInteracted(true);
    setStage(next);
    if (next === 2) {
      setHeartBurst((n) => n + 1);
    }
  };

  const handleBackdropTap = () => {
    const next = ((stage + 1) % 3) as CoupleStage;
    setUserInteracted(true);
    setStage(next);
    setHeartBurst((n) => n + 1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: nx * 14, y: ny * 10 });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleBackdropTap}
      className="relative overflow-hidden rounded-[32px] border border-stone-200/80 bg-[#FAF9F6] shadow-[0_16px_44px_rgba(24,24,27,0.06)] select-none"
    >
      {/* Background Layer: Couple Illustration with Interactive Parallax & Warmth Filter */}
      <div className=" relative h-[440px] w-full overflow-hidden sm:h-[500px]">
        <img
          src={`${BASE_PATH}/couple-together.jpg`}
          alt={isJa ? "キャンパスカップル" : "캠퍼스 소개팅 커플"}
          style={{
            transform: `scale(1.06) translate3d(${(-offset.x).toFixed(
              1
            )}px, ${(-offset.y).toFixed(1)}px, 0)`,
          }}
          className={cn(
            "h-full w-full object-cover object-[center_18%] transition-[transform,filter] duration-500 ease-out will-change-transform",
            stage === 0
              ? "brightness-[0.97] saturate-[0.92]"
              : stage === 1
              ? "brightness-100 saturate-100"
              : "brightness-[1.03] saturate-[1.08]"
          )}
        />

        {/* Soft Top & Bottom Editorial Gradient Veil so both Couple Faces and Headline are vivid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent via-42% to-[#FAF9F6]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6]/92 via-55% to-transparent"
        />

        {/* Top Bar Inside Hero: Target Badge + Interactive Temperature Pill */}
        <div className="absolute inset-x-0 top-3.5 z-20 flex items-center justify-between px-4 sm:top-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-zinc-800 shadow-sm backdrop-blur-md sm:text-[12px]">
            {isJa
              ? "🇰🇷 韓国の大学生 ＆ 🇯🇵 日本人留学生・語学堂生"
              : "🇰🇷 한국 대학생 & 🇯🇵 일본인 유학생·어학당생"}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBackdropTap();
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-black tabular-nums text-white shadow-md backdrop-blur-md transition-all duration-300 active:scale-95",
              stage === 2
                ? "bg-rose-600 ring-2 ring-white/80"
                : stage === 1
                ? "bg-rose-500/95"
                : "bg-zinc-900/85"
            )}
          >
            <Flame className="h-3.5 w-3.5" fill="currentColor" />
            <span>{current.temp}</span>
          </button>
        </div>

        {/* Interactive Floating Couple Bubbles (Positioned near the Guy & Girl in the upper half) */}
        <div
          style={{
            transform: `translate3d(${(offset.x * 0.6).toFixed(1)}px, ${(
              offset.y * 0.6
            ).toFixed(1)}px, 0)`,
          }}
          className="pointer-events-none absolute inset-x-3 top-[128px] z-20 flex items-start justify-between gap-2 transition-transform duration-300 ease-out sm:inset-x-7 sm:top-[150px]"
        >
          {/* Left Bubble (Male Student) */}
          <div
            key={`l-${stage}`}
            className="ondo-pop max-w-[48%] rounded-2xl rounded-bl-xs border border-white/80 bg-white/92 px-3 py-1.5 text-left text-[11px] font-extrabold text-zinc-800 shadow-lg backdrop-blur-md sm:text-[12px]"
          >
            {current.leftBubble}
          </div>

          {/* Center Floating Heart / Connection Spark */}
          <div className="mt-1 flex shrink-0 flex-col items-center">
            <div
              key={`c-${stage}-${heartBurst}`}
              className={cn(
                "ondo-pop flex h-8 w-8 items-center justify-center rounded-full border border-white/90 shadow-md backdrop-blur-md transition-colors duration-300 sm:h-9 sm:w-9",
                stage === 2
                  ? "bg-rose-600 text-white"
                  : stage === 1
                  ? "bg-rose-500 text-white"
                  : "bg-white/90 text-rose-500"
              )}
            >
              {stage === 2 ? (
                <Heart className="h-4 w-4" fill="currentColor" />
              ) : stage === 1 ? (
                <MessageCircle className="h-4 w-4" fill="currentColor" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
          </div>

          {/* Right Bubble (Female Student) */}
          <div
            key={`r-${stage}`}
            className={cn(
              "ondo-pop max-w-[48%] rounded-2xl rounded-br-xs px-3 py-1.5 text-left text-[11px] font-extrabold shadow-lg backdrop-blur-md sm:text-[12px]",
              stage === 0
                ? "border border-white/80 bg-white/92 text-zinc-800"
                : "border border-rose-400/40 bg-rose-600/92 text-white"
            )}
          >
            {current.rightBubble}
          </div>
        </div>

        {/* Foreground Title & Interactive Stage Switcher Overlaid Naturally on the Lower Half */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-4 pb-5 text-center sm:px-6 sm:pb-6">
          {/* Interactive 3-Stage Mini Pill Switcher */}
          <div
            className="mb-3 inline-flex items-center gap-1 rounded-full border border-stone-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {stages.map((item) => {
              const active = stage === item.stage;
              return (
                <button
                  key={item.stage}
                  type="button"
                  onClick={(e) => handleStageClick(item.stage, e)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-extrabold transition-all duration-200 sm:px-3 sm:text-[11.5px]",
                    active
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  {item.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Main Hero Headline Sitting Naturally Over the Couple Backdrop */}
          <h1 className="text-[26px] font-black leading-[1.24] tracking-tight text-zinc-900 drop-shadow-[0_1px_8px_rgba(255,255,255,0.9)] sm:text-[38px]">
            {isJa ? (
              <>
                友達の紹介みたいに、
                <br />
                <span className="ondo-underline-draw text-rose-600">
                  ちょうどいい人とつながる
                </span>
              </>
            ) : (
              <>
                친구가 주선해 주듯,
                <br />
                <span className="ondo-underline-draw text-rose-600">
                  결 맞는 사람과 소개팅
                </span>
              </>
            )}
          </h1>

          <p className="mt-2 text-[13.5px] font-medium text-zinc-600 sm:text-[15px]">
            {isJa
              ? "毎晩21時、希望条件に合う他大学の学生を1対1でご紹介します。"
              : "매일 밤 9시, 조건이 맞는 다른 학교 학생을 1:1로 소개해 드려요."}
          </p>
        </div>
      </div>

      {/* CTA Button Area Seamlessly Connected Below the Title */}
      <div
        className="relative z-20 mx-auto max-w-md px-4 pb-5 sm:px-6 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="lg"
          fullWidth
          loading={quickLoading}
          variant="kakao"
          onClick={onKakaoLogin}
        >
          {isJa ? "💬 カカオで3秒で始める" : "💬 카카오로 3초 만에 시작하기"}
        </Button>

        <p className="mt-2 text-center text-[11.5px] text-zinc-500 sm:text-[12px]">
          {isJa
            ? "🔒 お互い5往復会話するまでカカオIDは公開されません"
            : "🔒 서로 5마디 이상 대화하기 전까지 카톡 ID는 공개되지 않아요"}
        </p>
      </div>
    </div>
  );
}

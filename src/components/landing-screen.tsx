"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
} from "lucide-react";
import {
  KAKAO_OPENCHAT_URL,
  DEMO_PARTNERS,
  ROUTES,
} from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import {
  fetchMyMemberSecure,
  getAuthUserId,
  isCompletedMember,
  isStaleAutoCreatedMember,
  persistMemberSession,
  purgeStaleMemberRow,
  signInWithKakao,
} from "@/lib/supabase";
import { Button, LanguageToggle, MatchCard } from "@/components/ondo-ui";
import { Reveal, useInViewOnce } from "@/components/reveal";
import { UniversityCircularCarousel } from "@/components/univ-circular-carousel";
import { CoupleInteractiveHero } from "@/components/couple-interactive-hero";

export default function LandingPage() {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";

  const [quickLoading, setQuickLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [stepsRef, stepsSeen] = useInViewOnce<HTMLOListElement>();

  // 첫 화면의 가입 버튼이 위로 지나가면 휴대폰 화면 아래에 가입 버튼을 띄움
  const heroCtaRef = useRef<HTMLDivElement | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      setShowStickyCta(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const handleKakaoLogin = async () => {
    setQuickLoading(true);
    try {
      const authUid = await getAuthUserId();
      if (authUid) {
        let member = await fetchMyMemberSecure();
        if (member && isStaleAutoCreatedMember(member)) {
          await purgeStaleMemberRow(member);
          member = null;
        }
        if (isCompletedMember(member)) {
          persistMemberSession(member);
          router.push(ROUTES.HOME);
          return;
        }
        if (await getAuthUserId()) {
          router.push(`${ROUTES.JOIN}?from=login`);
          return;
        }
      }
      await signInWithKakao();
    } catch {
      setQuickLoading(false);
    }
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref")?.trim();
      if (refCode && refCode.length >= 4) {
        window.localStorage.setItem(
          "ondo_invited_by_code",
          refCode.toUpperCase()
        );
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FAF9F6] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-4xl items-center justify-between gap-1.5 px-3 sm:h-15 sm:gap-2 sm:px-5">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-rose-400 sm:h-8 sm:w-8">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" />
            </div>
            <span className="whitespace-nowrap text-[14px] font-black tracking-tight text-zinc-900 sm:text-[17px]">
              ONDO <span className="text-rose-600">36.5°</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-2">
            <LanguageToggle />
            <Link
              href={ROUTES.LOGIN}
              className="inline-block rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11.5px] font-bold text-zinc-800 transition-colors hover:bg-stone-50 sm:px-3.5 sm:py-2 sm:text-[13px]"
            >
              {isJa ? "ログイン" : "로그인"}
            </Link>
            <Link
              href={ROUTES.JOIN}
              className="rounded-full bg-zinc-900 px-3 py-1 text-[11.5px] font-bold text-white transition-colors hover:bg-zinc-800 sm:px-3.5 sm:py-2 sm:text-[13px]"
            >
              {isJa ? "新規登録" : "회원가입"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-28 sm:px-5 sm:py-10">
        {/* Hero */}
        <section className="mx-auto max-w-xl text-center">
          <div className="ondo-rise inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1 text-[11.5px] font-bold text-zinc-700 shadow-2xs sm:text-[12px]" style={{ "--ondo-rise-delay": "0ms" } as React.CSSProperties}>
            <span>
              {isJa
                ? "🇰🇷 韓国の大学生 ＆ 🇯🇵 日本人留学生・語学堂生"
                : "🇰🇷 한국 대학생 & 🇯🇵 일본인 유학생·어학당생"}
            </span>
          </div>

          <h1 className="ondo-rise mt-3.5 text-[27px] font-black leading-[1.25] tracking-tight text-zinc-900 sm:mt-5 sm:text-[40px]" style={{ "--ondo-rise-delay": "90ms" } as React.CSSProperties}>
            {isJa ? (
              <>
                友達の紹介みたいに、
                <br />
                <span className="ondo-underline-draw text-rose-600">ちょうどいい人とつながる</span>
              </>
            ) : (
              <>
                친구가 주선해 주듯,
                <br />
                <span className="ondo-underline-draw text-rose-600">결 맞는 사람과 소개팅</span>
              </>
            )}
          </h1>
          <p className="ondo-rise mt-2.5 text-[14px] text-zinc-500 sm:mt-3.5 sm:text-[15px]" style={{ "--ondo-rise-delay": "180ms" } as React.CSSProperties}>
            {isJa
              ? "毎晩21時、希望条件に合う他大学の学生を1対1でご紹介します。"
              : "매일 밤 9시, 조건이 맞는 다른 학교 학생을 1:1로 소개해 드려요."}
          </p>

          {/* Interactive Male & Female Couple Hero Visual */}
          <CoupleInteractiveHero isJa={isJa} />

          {/* Clean Hero CTA */}
          <div
            ref={heroCtaRef}
            className="ondo-rise mx-auto mt-5 max-w-md sm:mt-6"
            style={{ "--ondo-rise-delay": "270ms" } as React.CSSProperties}
          >
            <Button
              size="lg"
              fullWidth
              loading={quickLoading}
              variant="kakao"
              onClick={handleKakaoLogin}
            >
              {isJa
                ? "💬 カカオで3秒で始める"
                : "💬 카카오로 3초 만에 시작하기"}
            </Button>

            <p className="mt-2.5 text-center text-[12px] text-zinc-500">
              {isJa
                ? "🔒 お互い5往復会話するまでカカオIDは公開されません"
                : "🔒 서로 5마디 이상 대화하기 전까지 카톡 ID는 공개되지 않아요"}
            </p>
          </div>
        </section>

        {/* University Eligibility & 3D Circular Carousel */}
        <section className="mt-7 overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-4 text-center shadow-2xs sm:mt-9 sm:p-6">
          <h3 className="text-[15px] font-black tracking-tight text-zinc-900 sm:text-[18px]">
            {isJa
              ? "🎓 ソウル・京畿・仁川の全大学＆語学堂が参加中"
              : "🎓 서울 · 경기 · 인천 전 대학 & 어학당 참여 중"}
          </h3>
          <p className="mt-1 text-[12px] text-zinc-500 sm:text-[13px]">
            {isJa
              ? "在学生・休学生・語学堂生・留学生なら誰でも登録できます"
              : "재학생 · 휴학생 · 어학당생 · 유학생 누구나 가입할 수 있어요"}
          </p>

          <div className="-mx-2 mt-3 sm:mx-0 sm:mt-4">
            <UniversityCircularCarousel isJa={isJa} />
          </div>
        </section>

        {/* 소개팅 진행 순서 — 짧고 직관적인 4단계 */}
        <section className="mt-8 sm:mt-10">
          <h2 className="text-center text-[18px] font-black tracking-tight text-zinc-900 sm:text-[22px]">
            {isJa ? "紹介の流れ" : "소개팅 진행 순서"}
          </h2>
          <ol
            ref={stepsRef}
            className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3 lg:grid-cols-4"
          >
            {(isJa
              ? [
                  { emoji: "🪪", title: "学生認証＆プロフィール", desc: "学校メールまたは学生証で認証" },
                  { emoji: "💌", title: "毎晩21時に紹介到着", desc: "条件の合うお相手を1:1で紹介" },
                  { emoji: "💬", title: "アプリ内でまず会話", desc: "お互いOKならブラインド会話" },
                  { emoji: "☕", title: "カカオ交換＆出会い", desc: "5往復話したらカカオID公開" },
                ]
              : [
                  { emoji: "🪪", title: "학생 인증 & 프로필", desc: "웹메일·학생증 인증 후 프로필 작성" },
                  { emoji: "💌", title: "매일 밤 9시 도착", desc: "조건 맞는 상대를 1:1로 소개" },
                  { emoji: "💬", title: "앱 안에서 먼저 대화", desc: "둘 다 수락하면 블라인드 대화" },
                  { emoji: "☕", title: "카톡 교환 후 만남", desc: "5마디 이상 통하면 카톡 ID 공개" },
                ]
            ).map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <li
                  key={step.title}
                  className={stepsSeen ? "ondo-reveal is-visible" : "ondo-reveal"}
                  style={{ "--ondo-reveal-delay": `${idx * 90}ms` } as React.CSSProperties}
                >
                <div
                  onClick={() => setActiveStep(idx)}
                  onMouseEnter={() => setActiveStep(idx)}
                  className={
                    isActive
                      ? "h-full cursor-pointer rounded-2xl border-2 border-rose-500 bg-rose-50/40 p-3.5 shadow-[0_10px_24px_rgba(225,29,72,0.12)] transition-all duration-300 -translate-y-1 sm:rounded-3xl sm:p-5"
                      : "h-full cursor-pointer rounded-2xl border border-stone-200/90 bg-white p-3.5 transition-all duration-300 hover:border-rose-200 sm:rounded-3xl sm:p-5"
                  }
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={
                        isActive
                          ? "ondo-step-emoji-bounce text-[18px] sm:text-[22px]"
                          : "text-[18px] sm:text-[22px]"
                      }
                      aria-hidden
                    >
                      {step.emoji}
                    </span>
                    <span
                      className={
                        isActive
                          ? "rounded-full bg-rose-600 px-2 py-0.5 text-[10.5px] font-extrabold text-white transition-colors sm:text-[11px]"
                          : "text-[11px] font-extrabold text-rose-600 transition-colors sm:text-[12px]"
                      }
                    >
                      STEP {idx + 1}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-[13.5px] font-extrabold text-zinc-900 sm:mt-2 sm:text-[15px]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500 sm:text-[13px]">
                    {step.desc}
                  </p>
                </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Interactive Live Preview + Core Trust Pills */}
        <section className="mx-auto mt-10 max-w-2xl sm:mt-12">
          <Reveal>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[14px] font-extrabold text-zinc-900 sm:text-[16px]">
                {isJa
                  ? "こんなプロフィールが届きます（例）"
                  : "이런 소개팅 프로필이 도착해요 (예시)"}
              </span>
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-600">
                {isJa ? "サンプル" : "SAMPLE"}
              </span>
            </div>
            <MatchCard partner={DEMO_PARTNERS[0]} />

            {/* 3가지 핵심 안심 배지 한 줄 요약 */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {(isJa
                ? [
                    "✨ 外見より価値観・人柄から始まる紹介",
                    "🔒 会話が弾んでからカカオID公開",
                    "🎫 24時間未応答ならチケット100%返還",
                  ]
                : [
                    "✨ 외모 품평 없는 가치관 매칭",
                    "🔒 서로 대화 후 카톡 ID 공개",
                    "🎫 24시간 미응답 시 티켓 100% 환급",
                  ]
              ).map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-stone-200/90 bg-white px-3.5 py-1.5 text-[11.5px] font-bold text-zinc-700 shadow-2xs sm:text-[12px]"
                >
                  {badge}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        <footer className="mt-10 border-t border-stone-200/80 pt-6 text-center text-[12px] text-zinc-400">
          <p className="font-bold text-zinc-600">
            {isJa
              ? "ONDO 36.5° · 日韓大学生のための 1:1 ブラインド紹介"
              : "ONDO 36.5° · 대학생 1:1 블라인드 소개팅"}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <Link href={ROUTES.FAQ} className="font-semibold text-zinc-600 hover:underline">
              {isJa ? "よくある質問 (FAQ)" : "자주 묻는 질문 (FAQ)"}
            </Link>
            <a
              href={KAKAO_OPENCHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-rose-600 hover:underline"
            >
              {isJa ? "💬 1:1 カカオ相談室" : "💬 1:1 카카오톡 고객센터"}
            </a>
            <Link href={ROUTES.TERMS} className="hover:underline">
              {isJa ? "利用規約" : "이용약관"}
            </Link>
            <Link href={ROUTES.PRIVACY} className="hover:underline">
              {isJa ? "プライバシーポリシー" : "개인정보 처리방침"}
            </Link>
            <Link href={ROUTES.SAFETY} className="hover:underline">
              {isJa ? "安心・安全ガイド" : "안전 가이드"}
            </Link>
          </div>
        </footer>
      </main>

      {/* 휴대폰 하단 고정 가입 버튼 — 첫 화면의 가입 버튼이 위로 지나가면 나타남 */}
      <div
        className="ondo-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-[#FAF9F6]/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden"
        data-shown={showStickyCta ? "true" : "false"}
        aria-hidden={!showStickyCta}
      >
        <Button
          size="lg"
          fullWidth
          className="bg-rose-600 hover:bg-rose-700"
          onClick={() => router.push(ROUTES.JOIN)}
          tabIndex={showStickyCta ? 0 : -1}
        >
          {isJa
            ? "プロフィールを登録して紹介を受ける 💌"
            : "프로필 등록하고 소개팅 받기 💌"}
        </Button>
      </div>
    </div>
  );
}

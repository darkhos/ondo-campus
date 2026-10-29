"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Flame,
  Globe2,
  Zap,
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

export default function LandingPage() {
  const router = useRouter();
  const [locale, setLocale] = useAppLocale();
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
          <div className="flex shrink-0 items-center gap-1 whitespace-nowrap sm:gap-2">
            <LanguageToggle />
            <a
              href={KAKAO_OPENCHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isJa ? "1:1相談" : "카톡문의"}
              className="inline-flex items-center gap-1 rounded-full bg-[#FEE500] px-2 py-1 text-[11px] font-extrabold text-zinc-900 shadow-2xs transition-transform hover:brightness-95 sm:px-3 sm:py-2 sm:text-[12px]"
            >
              <span>💬</span>
              <span className="hidden sm:inline">
                {isJa ? "1:1相談" : "카톡문의"}
              </span>
            </a>
            <Link
              href={ROUTES.LOGIN}
              className="inline-block rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-bold text-zinc-800 transition-colors hover:bg-stone-50 sm:px-3.5 sm:py-2 sm:text-[13px]"
            >
              {isJa ? "ログイン" : "로그인"}
            </Link>
            <Link
              href={ROUTES.JOIN}
              className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-zinc-800 sm:px-3.5 sm:py-2 sm:text-[13px]"
            >
              {isJa ? "新規登録" : "회원가입"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-5 pb-28 sm:px-5 sm:py-10">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <div className="ondo-rise inline-flex max-w-full items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 py-1 text-[11px] font-bold leading-snug text-zinc-700 shadow-2xs sm:px-3.5 sm:py-1.5 sm:text-[12px]" style={{ "--ondo-rise-delay": "0ms" } as React.CSSProperties}>
            <span>
              {isJa
                ? "🇰🇷 韓国の大学生 ＆ 🇯🇵 日本人の語学堂生・留学生 1:1 ブラインド紹介"
                : "🇰🇷 한국 대학생 & 🇯🇵 일본인 어학당생·유학생 1:1 블라인드 소개팅"}
            </span>
          </div>

          <h1 className="ondo-rise mt-3 text-[26px] font-black leading-[1.25] tracking-tight text-zinc-900 sm:mt-5 sm:text-[40px]" style={{ "--ondo-rise-delay": "90ms" } as React.CSSProperties}>
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
          <p className="ondo-rise mt-2.5 text-[13.5px] leading-relaxed text-zinc-500 sm:mt-4 sm:text-[15px]" style={{ "--ondo-rise-delay": "180ms" } as React.CSSProperties}>
            {isJa ? (
              <>
                ONDOが希望条件に合う他大学の学生を紹介します。
                <br className="hidden sm:inline" />{" "}
                お互いOKしたらまず会話から。話が弾んだらカカオトークを交換して会いましょう。
              </>
            ) : (
              <>
                ONDO가 선호 조건이 맞는 다른 학교 학생을 소개해 드려요.
                <br className="hidden sm:inline" />{" "}
                서로 수락하면 대화부터, 말이 통하면 카톡을 주고받고 만나 보세요.
              </>
            )}
          </p>

          {/* Unified Hero CTA Card */}
          <div
            ref={heroCtaRef}
            className="ondo-rise mx-auto mt-4 max-w-xl rounded-3xl border border-stone-200/90 bg-white p-4 text-left shadow-2xs sm:mt-6 sm:p-5"
            style={{ "--ondo-rise-delay": "270ms" } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-zinc-800 sm:text-[12px]">
                <Zap className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                {isJa
                  ? "既存会員はすぐに入場・未登録の場合は新規登録へ自動移動"
                  : "기존 회원은 바로 입장 · 미가입 시 회원가입으로 자동 연결"}
              </span>
              {!isJa && (
                <button
                  type="button"
                  onClick={() => setLocale("ja")}
                  className="text-[11px] font-bold text-rose-600 underline hover:text-rose-700 sm:text-[11.5px]"
                >
                  🇯🇵 일본어 화면 전환 →
                </button>
              )}
            </div>

            <div className="mt-2.5">
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
            </div>

            <p className="mt-2 text-center text-[11.5px] leading-relaxed text-zinc-500 sm:text-[12px]">
              {isJa
                ? "・カカオで本人確認のみ行い、会話条件を満たすまでカカオIDはお相手に公開されません。"
                : "· 카카오로 본인 확인만 진행하며, 서로 대화 조건을 채우기 전까지 카톡 ID는 공개되지 않아요."}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  router.push("/join?track=KLI_JP");
                }}
                className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50/50 p-2.5 text-left transition-colors hover:bg-rose-100/60 sm:items-center sm:gap-2.5 sm:px-3.5 sm:py-2.5"
              >
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 sm:mt-0" />
                <div className="min-w-0">
                  <p className="text-[11.5px] font-extrabold leading-tight text-zinc-900 sm:text-[12px]">
                    {isJa
                      ? "🇯🇵 日本人 語学堂生"
                      : "🇯🇵 일본인 어학당생 가입"}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-zinc-500 sm:text-[11px]">
                    {isJa
                      ? "首都圏 62校の語学堂"
                      : "서울·경기·인천 62개 어학당"}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push("/join?track=INTL_JP");
                }}
                className="flex items-start gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-2.5 text-left transition-colors hover:bg-indigo-100/60 sm:items-center sm:gap-2.5 sm:px-3.5 sm:py-2.5"
              >
                <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 sm:mt-0" />
                <div className="min-w-0">
                  <p className="text-[11.5px] font-extrabold leading-tight text-zinc-900 sm:text-[12px]">
                    {isJa
                      ? "🇯🇵 日本人 大学留学生"
                      : "🇯🇵 일본인 대학 유학생 가입"}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-zinc-500 sm:text-[11px]">
                    {isJa
                      ? "正規学部・交換・大学院"
                      : "학부 정규·교환·대학원"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* University Eligibility & 3D Circular Carousel */}
        <section className="mt-5 overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-4 text-center shadow-2xs sm:mt-8 sm:p-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-extrabold text-rose-600 sm:text-[12px]">
            🎓 {isJa ? "首都圏キャンパス全域対応" : "서울 · 경기 · 인천 전 캠퍼스 오픈"}
          </span>
          <h3 className="mt-2 text-[15px] font-black leading-snug tracking-tight text-zinc-900 sm:text-[19px]">
            {isJa
              ? "ソウル・京畿・仁川エリアの大学・語学堂に通う学生なら誰でも登録できます！"
              : "서울 · 경기 · 인천 지역 학교에 다니고 있는 학생이라면 누구나 가입 가능해요!"}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 sm:text-[13px]">
            {isJa
              ? "下記の大学だけでなく、ソウル・京畿・仁川エリアのすべての大学（78キャンパス）および大学付属語学堂（62校）の在学生・休学生・留学生がご利用いただけます。"
              : "아래 예시 학교뿐만 아니라 서울·경기·인천 지역 전체 대학교(78개 캠퍼스) 및 대학 부설 어학당(62개교)에 다니는 재학생·휴학생·유학생 모두 가입할 수 있습니다."}
          </p>

          <div className="-mx-2 mt-3 sm:mx-0 sm:mt-4">
            <UniversityCircularCarousel isJa={isJa} />
          </div>

          <div className="mt-3 flex justify-center sm:mt-3.5">
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-[11.5px] font-extrabold text-rose-600 sm:px-4 sm:text-[12px]">
              {isJa
                ? "+ ソウル・京畿・仁川の全大学・語学堂 登録可能"
                : "+ 서울·경기·인천 전 대학 및 어학당 누구나 가입 가능"}
            </span>
          </div>
        </section>

        {/* 소개팅 진행 순서 — 모바일에서도 한눈에 들어오도록 2x2 그리드 배치 */}
        <section className="mt-8 sm:mt-10">
          <h2 className="text-center text-[18px] font-black tracking-tight text-zinc-900 sm:text-[24px]">
            {isJa ? "紹介はこんなふうに進みます" : "소개팅은 이렇게 진행돼요"}
          </h2>
          <ol
            ref={stepsRef}
            className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3 lg:grid-cols-4"
          >
            {(isJa
              ? [
                  { emoji: "🪪", title: "学生認証とプロフィール", desc: "学校メールまたは学生証で認証し、好みや価値観を書きます。" },
                  { emoji: "💌", title: "紹介が届きます", desc: "希望条件に合う他大学の学生のプロフィールが届きます。24時間以内にOKかパスを選びます。" },
                  { emoji: "💬", title: "お互いOKなら会話", desc: "連絡先は隠したまま、アプリ内でまず話してみます。" },
                  { emoji: "☕", title: "カカオ交換して会う", desc: "会話が弾んだらカカオトークIDが公開されます。あとは二人で会う日を決めるだけ。" },
                ]
              : [
                  { emoji: "🪪", title: "학생 인증 & 프로필", desc: "학교 메일이나 학생증으로 인증하고, 나의 취향과 연애 가치관을 적어요." },
                  { emoji: "💌", title: "소개팅 상대 도착", desc: "선호 조건이 맞는 다른 학교 학생의 프로필이 도착해요. 24시간 안에 수락 또는 패스를 골라요." },
                  { emoji: "💬", title: "둘 다 수락하면 대화", desc: "연락처는 가린 채로 앱 안에서 먼저 이야기를 나눠 봐요." },
                  { emoji: "☕", title: "카톡 교환 후 만남", desc: "대화가 무르익으면 카카오톡 ID가 공개돼요. 이제 만날 날만 정하면 돼요." },
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

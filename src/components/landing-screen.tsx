"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Flame,
  Globe2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
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

// 가나다순 정렬
const PARTICIPATING_UNIVS_KO = [
  "건국대",
  "경희대",
  "고려대",
  "광운대",
  "서강대",
  "서울대",
  "성균관대",
  "연세대",
  "이화여대",
  "중앙대",
  "한국외대",
  "한양대",
  "홍익대",
];

const PARTICIPATING_UNIVS_JA = [
  "建国大学",
  "慶熙大学",
  "高麗大学",
  "光云大学",
  "西江大学",
  "ソウル大学",
  "成均館大学",
  "延世大学",
  "梨花女子大学",
  "中央大学",
  "韓国外国語大学",
  "漢陽大学",
  "弘益大学",
];

const REVIEWS_KO = [
  {
    meta: "광운대 22세 · 경영학과",
    body: "친구한테 소개팅 부탁하기는 눈치 보이고, 사진 앱은 부담스러웠어요. 여기선 서로 수락한 다음에 대화부터 해 보고, 말이 잘 통하면 그때 카톡을 주고받으니까 첫 만남이 훨씬 덜 어색했어요.",
  },
  {
    meta: "이화여대 언어교육원 21세 · 🇯🇵 일본인 어학당생",
    body: "한국 대학생과 소개팅을 해 보고 싶었지만 어디서 만나야 할지 몰랐어요. 학생 인증을 한 사람끼리만 연결되고, 대화를 충분히 나눈 뒤에 연락처가 열려서 안심하고 만날 수 있었어요.",
  },
];

const REVIEWS_JA = [
  {
    meta: "梨花女子大学 言語教育院 21歳 · 🇯🇵 日本人語学堂生",
    body: "韓国の大学生と合コンや紹介で出会う機会がなかなか無かったのですが、ここでは学生認証済みの人とだけつながり、お互いOKしてから会話を始められるので安心してお見合いのような出会いを楽しめました。",
  },
  {
    meta: "光云大学 22歳 · 🇯🇵 日本人正規留学生",
    body: "写真で選ばれるアプリは苦手でしたが、ここはプロフィールと会話で相手を知ってから連絡先を交換するので、友達に紹介してもらう感覚に近いです。日本語表示にも対応していて使いやすいです。",
  },
];

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

  const univs = isJa ? PARTICIPATING_UNIVS_JA : PARTICIPATING_UNIVS_KO;
  const univRow1 = univs.slice(0, 7);
  const univRow2 = [
    ...univs.slice(7),
    isJa ? "🇯🇵 日本語学堂・留学生" : "🇯🇵 일본어학당·유학생",
  ];
  const reviews = isJa ? REVIEWS_JA : REVIEWS_KO;

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
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 py-1 text-[11px] font-bold leading-snug text-zinc-700 shadow-2xs sm:px-3.5 sm:py-1.5 sm:text-[12px]">
            <span>
              {isJa
                ? "🇰🇷 韓国の大学生 ＆ 🇯🇵 日本人の語学堂生・留学生 1:1 ブラインド紹介"
                : "🇰🇷 한국 대학생 & 🇯🇵 일본인 어학당생·유학생 1:1 블라인드 소개팅"}
            </span>
          </div>

          <h1 className="mt-3 text-[26px] font-black leading-[1.25] tracking-tight text-zinc-900 sm:mt-5 sm:text-[40px]">
            {isJa ? (
              <>
                友達の紹介みたいに、
                <br />
                <span className="text-rose-600">ちょうどいい人とつながる</span>
              </>
            ) : (
              <>
                친구가 주선해 주듯,
                <br />
                <span className="text-rose-600">결 맞는 사람과 소개팅</span>
              </>
            )}
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-zinc-500 sm:mt-4 sm:text-[15px]">
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

          <div ref={heroCtaRef} className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:mt-6">
            <Button
              size="lg"
              fullWidth
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => router.push(ROUTES.JOIN)}
            >
              {isJa
                ? "プロフィールを登録して紹介を受ける 💌"
                : "프로필 등록하고 소개팅 받기 💌"}
            </Button>
          </div>

          {/* Existing member login (Kakao identity check) */}
          <div className="mx-auto mt-3 max-w-xl rounded-3xl border border-stone-200/90 bg-white p-3.5 text-left shadow-2xs sm:mt-4 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11.5px] font-extrabold text-zinc-800 sm:text-[12px]">
                <Zap className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                {isJa
                  ? "既存会員はすぐに入場・未登録の場合は新規登録へ移動"
                  : "기존 회원은 바로 입장 · 미가입 시 회원가입으로 자동 연결"}
              </span>
            </div>
            <div className="mt-2">
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
            {/* 카카오 로그인 안내 — 모바일에서는 한눈에 들어오도록 핵심 요약 + 상세 펼치기 */}
            <ul className="mt-2.5 space-y-1 text-[11.5px] leading-relaxed text-zinc-500 sm:mt-3 sm:text-[12px]">
              <li>
                {isJa
                  ? "・カカオで本人確認のみ行い、友だちリストやトーク内容は一切受け取りません。"
                  : "· 카카오로 본인 확인만 진행하며, 친구 목록이나 대화 내용은 일절 받지 않아요."}
              </li>
              <li>
                {isJa
                  ? "・カカオトークIDは会話条件を満たすまでお相手に公開されません。"
                  : "· 카카오톡 ID는 서로 대화 조건을 채우기 전까지 상대에게 절대 공개되지 않아요."}
              </li>
            </ul>
          </div>

          {/* Dedicated Japanese Tracks Quick Entry Card */}
          <div className="mx-auto mt-3 max-w-xl rounded-3xl border border-rose-200/80 bg-white p-3.5 text-left shadow-2xs sm:mt-5 sm:p-4">
            {!isJa && (
              <div className="mb-2 flex justify-end sm:mb-3">
                <button
                  type="button"
                  onClick={() => setLocale("ja")}
                  className="text-[11.5px] font-bold text-rose-600 underline hover:text-rose-700 sm:text-[12px]"
                >
                  🇯🇵 일본어 화면으로 전환하기 →
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
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

        {/* University Eligibility & Flowing Marquee Pills */}
        <Reveal as="section" className="mt-5 overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-4 text-center shadow-2xs sm:mt-8 sm:p-6">
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

          <div className="ondo-marquee-wrap mt-3.5 space-y-2 overflow-hidden py-1 sm:mt-4 sm:space-y-2.5">
            {/* Row 1: Flows Left */}
            <div className="ondo-marquee-track-left">
              {[...univRow1, ...univRow1].map((u, idx) => (
                <span
                  key={`r1-${idx}-${u}`}
                  className="mx-1 shrink-0 rounded-full border border-stone-200/90 bg-[#FAF9F6] px-3.5 py-1.5 text-[11.5px] font-bold text-zinc-700 transition-colors hover:border-rose-400 hover:bg-rose-50/60 hover:text-rose-600 sm:mx-1.5 sm:px-4 sm:text-[12px]"
                >
                  🎓 {u}
                </span>
              ))}
            </div>

            {/* Row 2: Flows Right */}
            <div className="ondo-marquee-track-right">
              {[...univRow2, ...univRow2].map((u, idx) => {
                const isJpTag = u.startsWith("🇯🇵");
                return (
                  <span
                    key={`r2-${idx}-${u}`}
                    className={
                      isJpTag
                        ? "mx-1 shrink-0 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-[11.5px] font-extrabold text-rose-600 sm:mx-1.5 sm:px-4 sm:text-[12px]"
                        : "mx-1 shrink-0 rounded-full border border-stone-200/90 bg-[#FAF9F6] px-3.5 py-1.5 text-[11.5px] font-bold text-zinc-700 transition-colors hover:border-rose-400 hover:bg-rose-50/60 hover:text-rose-600 sm:mx-1.5 sm:px-4 sm:text-[12px]"
                    }
                  >
                    {isJpTag ? u : `🌸 ${u}`}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex justify-center sm:mt-3.5">
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-[11.5px] font-extrabold text-rose-600 sm:px-4 sm:text-[12px]">
              {isJa
                ? "+ ソウル・京畿・仁川の全大学・語学堂 登録可能"
                : "+ 서울·경기·인천 전 대학 및 어학당 누구나 가입 가능"}
            </span>
          </div>
        </Reveal>

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

        {/* Interactive Live Preview + Features Grid */}
        <section className="mt-10 grid grid-cols-1 items-start gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-12">
          <Reveal className="min-w-0 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-extrabold text-zinc-900">
                {isJa
                  ? "こんなプロフィールが届きます（例）"
                  : "이런 소개팅 프로필이 도착해요 (예시)"}
              </span>
              <span className="text-[12px] font-bold text-rose-600">
                {isJa ? "サンプル" : "SAMPLE"}
              </span>
            </div>
            <MatchCard partner={DEMO_PARTNERS[0]} />
          </Reveal>

          <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-5">
            {(isJa
              ? [
                  {
                    icon: Sparkles,
                    title: "写真より先に、人柄を知る",
                    desc: "一行紹介と関心事、ライフスタイルを見てから会うかどうか決められます。",
                  },
                  {
                    icon: MessageSquare,
                    title: "会話が弾んでから連絡先交換",
                    desc: "最初からカカオトークIDは公開しません。お互いに何度か話したあとで自動的に公開されます。",
                  },
                  {
                    icon: ShieldCheck,
                    title: "認証済みの学生だけ ＆ チケット返還",
                    desc: "韓国の学生も日本人学生も、学校ウェブメールまたは学生証（図書館モバイル利用証など身分証明なら何でもOK）で認証します。相手が応答しない場合、チケットは返還されます。",
                  },
                ]
              : [
                  {
                    icon: Sparkles,
                    title: "사진보다 사람을 먼저",
                    desc: "한 줄 소개, 관심사, 라이프스타일을 보고 만날지 말지 정해요. 외모 품평 없는 소개팅이에요.",
                  },
                  {
                    icon: MessageSquare,
                    title: "말이 통하면 그때 카톡 교환",
                    desc: "처음부터 카카오톡 ID를 공개하지 않아요. 서로 몇 마디씩 대화를 나눈 뒤에 자동으로 열려요.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "인증된 학생만 & 티켓 환불",
                    desc: "한국 대학생·어학당생·일본 유학생 모두 학교 웹메일 또는 학생증(도서관 모바일 이용증 등 신분 입증 자료)으로 인증해요. 상대가 응답하지 않으면 티켓은 돌려드려요.",
                  },
                ]
            ).map((item, idx) => (
              <Reveal
                key={idx}
                delay={idx * 110}
                className="rounded-3xl border border-stone-200/90 bg-white p-5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-zinc-900">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                  {item.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Reviews — 실제 이용 후기가 아니므로 예시임을 표시 */}
        <p className="mt-12 text-[12px] font-bold text-zinc-400">
          {isJa
            ? "※ 以下は想定利用シーンの例であり、実際の利用者のレビューではありません。"
            : "※ 아래는 이용 장면을 보여 주는 예시이며, 실제 이용자 후기가 아니에요."}
        </p>
        <section className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reviews.map((r, i) => (
            <Reveal
              key={i}
              delay={i * 120}
              className="rounded-3xl border border-stone-200/90 bg-white p-6"
            >
              <span className="text-[12px] font-bold text-rose-600">
                {r.meta}
              </span>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-700">
                &ldquo;{r.body}&rdquo;
              </p>
            </Reveal>
          ))}
        </section>

        {/* Official KakaoTalk 1:1 Customer Center Banner */}
        <Reveal as="section" className="mt-10 rounded-3xl border border-amber-200/90 bg-white p-5 shadow-2xs sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 w-full flex-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE500] px-2.5 py-0.5 text-[12px] font-extrabold text-zinc-900">
                💬 OFFICIAL SUPPORT
              </span>
              <h3 className="mt-2 text-[16px] font-black text-zinc-900 sm:text-[17px]">
                {isJa
                  ? "ONDO 36.5° 公式カカオトーク 1:1 顧客センター"
                  : "ONDO 36.5° 캠퍼스 공식 카카오톡 1:1 고객센터"}
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 sm:text-[13px]">
                {isJa
                  ? "学生認証・紹介の流れ・チケット返還など、気になる点はいつでも公式オープンチャットでお問い合わせください。"
                  : "학생 인증, 소개팅 진행 방식, 티켓 환불 등 궁금한 점은 언제든 공식 카카오톡 1:1 오픈채팅으로 편하게 문의해 주세요."}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              <a
                href={KAKAO_OPENCHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#FEE500] px-5 py-3 text-[13px] font-extrabold text-zinc-900 shadow-2xs transition-transform hover:brightness-95"
              >
                <span>
                  {isJa
                    ? "💬 カカオ1:1相談室を開く"
                    : "💬 카카오톡 1:1 오픈채팅 문의하기"}
                </span>
              </a>
              <Link
                href={ROUTES.FAQ}
                className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-[#FAF9F6] px-4 py-3 text-[13px] font-bold text-zinc-700 hover:bg-stone-100"
              >
                {isJa ? "よくある質問 (FAQ)" : "자주 묻는 질문 (FAQ)"}
              </Link>
            </div>
          </div>
        </Reveal>

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

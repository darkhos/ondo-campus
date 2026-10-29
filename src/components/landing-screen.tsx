"use client";

import React, { useEffect, useState } from "react";
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

const PARTICIPATING_UNIVS_KO = [
  "연세대",
  "고려대",
  "서울대",
  "성균관대",
  "한양대",
  "서강대",
  "이화여대",
  "중앙대",
  "경희대",
  "한국외대",
  "건국대",
  "홍익대",
];

const PARTICIPATING_UNIVS_JA = [
  "延世大学",
  "高麗大学",
  "ソウル大学",
  "成均館大学",
  "漢陽大学",
  "西江大学",
  "梨花女子大学",
  "中央大学",
  "慶熙大学",
  "韓国外国語大学",
  "建国大学",
  "弘益大学",
];

const REVIEWS_KO = [
  {
    meta: "연세대 22세 · 경영학과",
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
    meta: "延世大学 22歳 · 🇯🇵 日本人正規留学生",
    body: "写真で選ばれるアプリは苦手でしたが、ここはプロフィールと会話で相手を知ってから連絡先を交換するので、友達に紹介してもらう感覚に近いです。日本語表示にも対応していて使いやすいです。",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [locale, setLocale] = useAppLocale();
  const isJa = locale === "ja";

  const [quickLoading, setQuickLoading] = useState(false);

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
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-4xl items-center justify-between gap-2 px-3.5 sm:px-5">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-rose-400">
              <Flame className="h-4 w-4" fill="currentColor" />
            </div>
            <span className="whitespace-nowrap text-[16px] font-black tracking-tight text-zinc-900 sm:text-[17px]">
              ONDO <span className="text-rose-600">36.5°</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
            <LanguageToggle />
            <a
              href={KAKAO_OPENCHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-[#FEE500] px-2.5 py-1.5 text-[12px] font-extrabold text-zinc-900 shadow-2xs transition-transform hover:brightness-95 sm:px-3 sm:py-2"
            >
              <span>💬</span>
              <span className="hidden sm:inline">
                {isJa ? "1:1相談" : "카톡문의"}
              </span>
            </a>
            <Link
              href={ROUTES.LOGIN}
              className="inline-block rounded-full border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] font-bold text-zinc-800 transition-colors hover:bg-stone-50 sm:px-3.5 sm:py-2 sm:text-[13px]"
            >
              {isJa ? "ログイン" : "로그인"}
            </Link>
            <Link
              href={ROUTES.JOIN}
              className="rounded-full bg-zinc-900 px-2.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-zinc-800 sm:px-3.5 sm:py-2 sm:text-[13px]"
            >
              {isJa ? "新規登録" : "회원가입"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12">
        {/* Hero */}
        <section className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3.5 py-1.5 text-[12px] font-bold leading-snug text-zinc-700 shadow-2xs">
            <span>
              {isJa
                ? "🇰🇷 韓国の大学生 ＆ 🇯🇵 日本人の語学堂生・留学生　学生認証済みの人だけの 1:1 ブラインド紹介"
                : "🇰🇷 한국 대학생 & 🇯🇵 일본인 어학당생·유학생, 학생 인증한 사람끼리만 하는 1:1 블라인드 소개팅"}
            </span>
          </div>

          <h1 className="mt-5 text-[32px] font-black leading-[1.25] tracking-tight text-zinc-900 sm:text-[40px]">
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
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">
            {isJa ? (
              <>
                ONDOが希望条件に合う他大学の学生を紹介します。
                <br />
                お互いOKしたらまず会話から。話が弾んだらカカオトークを交換して会いましょう。
              </>
            ) : (
              <>
                ONDO가 선호 조건이 맞는 다른 학교 학생을 소개해 드려요.
                <br />
                서로 수락하면 대화부터, 말이 통하면 카톡을 주고받고 만나 보세요.
              </>
            )}
          </p>

          <div className="mx-auto mt-7 flex max-w-md flex-col gap-2.5">
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
          <div className="mx-auto mt-4 max-w-xl rounded-3xl border border-stone-200/90 bg-white p-4 text-left shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-zinc-800">
                <Zap className="h-3.5 w-3.5 text-rose-600" />
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
                {isJa ? "カカオでログイン" : "카카오로 로그인하기"}
              </Button>
            </div>
            {/* 카카오 로그인 안내 — Supabase 카카오 로그인 기본 범위(닉네임·프로필 사진·이메일) 기준 */}
            <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-zinc-500">
              <li>
                {isJa
                  ? "・カカオアカウントで本人確認をするためのログインです。別途パスワードを作る必要はありません。"
                  : "· 카카오 계정으로 본인 확인을 하는 로그인이에요. 따로 비밀번호를 만들 필요가 없어요."}
              </li>
              <li>
                {isJa
                  ? "・カカオから受け取るのはニックネーム・プロフィール写真・メールだけで、友だちリストやトーク内容は受け取りません。"
                  : "· 카카오에서는 닉네임·프로필 사진·이메일만 받고, 친구 목록이나 대화 내용은 받지 않아요."}
              </li>
              <li>
                {isJa
                  ? "・お相手に公開されるカカオトークIDは登録時にご自身で入力するもので、会話の条件を満たすまで公開されません。"
                  : "· 상대에게 공개되는 카카오톡 ID는 가입할 때 직접 입력하는 것이고, 대화 조건을 채우기 전에는 공개되지 않아요."}
              </li>
              <li>
                {isJa
                  ? "・初めての方はログイン後、そのまま新規登録画面に移動します。"
                  : "· 처음이라면 로그인 후 바로 회원가입 화면으로 이어져요."}
              </li>
            </ul>
          </div>

          {/* Dedicated Japanese Tracks Quick Entry Card */}
          <div className="mx-auto mt-6 max-w-xl rounded-3xl border border-rose-200/80 bg-white p-4 text-left shadow-2xs">
            {!isJa && (
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLocale("ja")}
                  className="text-[12px] font-bold text-rose-600 underline hover:text-rose-700"
                >
                  🇯🇵 일본어 화면으로 전환하기 →
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  router.push("/join?track=KLI_JP");
                }}
                className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/50 px-3.5 py-2.5 text-left transition-colors hover:bg-rose-100/60"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="text-[12px] font-extrabold text-zinc-900">
                    {isJa
                      ? "🇯🇵 日本人 語学堂生として登録"
                      : "🇯🇵 일본인 어학당생으로 가입하기"}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {isJa
                      ? "ソウル・京畿・仁川 62校の語学堂・言語教育院"
                      : "서울·경기·인천 62개교 어학당·언어교육원"}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push("/join?track=INTL_JP");
                }}
                className="flex items-center gap-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/50 px-3.5 py-2.5 text-left transition-colors hover:bg-indigo-100/60"
              >
                <Globe2 className="h-4 w-4 shrink-0 text-indigo-600" />
                <div>
                  <p className="text-[12px] font-extrabold text-zinc-900">
                    {isJa
                      ? "🇯🇵 日本人 大学留学生として登録"
                      : "🇯🇵 일본인 대학 유학생으로 가입하기"}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {isJa
                      ? "韓国の大学の正規学部・交換・大学院留学生"
                      : "한국 대학교 학부 정규·교환·대학원 유학생"}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* 소개팅 진행 순서 — 실제 서버 매칭 흐름과 같게 유지 */}
        <section className="mt-12">
          <h2 className="text-center text-[20px] font-black tracking-tight text-zinc-900 sm:text-[24px]">
            {isJa ? "紹介はこんなふうに進みます" : "소개팅은 이렇게 진행돼요"}
          </h2>
          <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            ).map((step, idx) => (
              <li
                key={step.title}
                className="rounded-3xl border border-stone-200/90 bg-white p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[22px]" aria-hidden>
                    {step.emoji}
                  </span>
                  <span className="text-[12px] font-extrabold text-rose-600">
                    STEP {idx + 1}
                  </span>
                </div>
                <h3 className="mt-2 text-[15px] font-extrabold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* University Text Pills */}
        <section className="mt-10 flex flex-wrap justify-center gap-2">
          {univs.map((u) => (
            <span
              key={u}
              className="rounded-full border border-stone-200/80 bg-white px-3.5 py-1 text-[12px] font-semibold text-zinc-600"
            >
              {u}
            </span>
          ))}
        </section>

        {/* Interactive Live Preview + Features Grid */}
        <section className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
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
          </div>

          <div className="space-y-4 lg:col-span-5">
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
                    desc: "韓国の学生は学校メール、日本人学生は運営者が学生証を確認します。相手が応答しない場合、チケットは返還されます。",
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
                    desc: "한국 학생은 학교 메일, 일본인 학생은 운영자가 학생증을 직접 확인해요. 상대가 응답하지 않으면 티켓은 돌려드려요.",
                  },
                ]
            ).map((item, idx) => (
              <div
                key={idx}
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
              </div>
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
            <div
              key={i}
              className="rounded-3xl border border-stone-200/90 bg-white p-6"
            >
              <span className="text-[12px] font-bold text-rose-600">
                {r.meta}
              </span>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-700">
                &ldquo;{r.body}&rdquo;
              </p>
            </div>
          ))}
        </section>

        {/* Official KakaoTalk 1:1 Customer Center Banner */}
        <section className="mt-10 rounded-3xl border border-amber-200/90 bg-white p-6 shadow-2xs">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE500] px-2.5 py-0.5 text-[12px] font-extrabold text-zinc-900">
                💬 OFFICIAL SUPPORT
              </span>
              <h3 className="mt-2 text-[17px] font-black text-zinc-900">
                {isJa
                  ? "ONDO 36.5° 公式カカオトーク 1:1 顧客センター"
                  : "ONDO 36.5° 캠퍼스 공식 카카오톡 1:1 고객센터"}
              </h3>
              <p className="mt-1 text-[13px] text-zinc-500">
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
    </div>
  );
}

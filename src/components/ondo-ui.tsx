"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInViewOnce, usePrefersReducedMotion } from "@/components/reveal";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Compass,
  Copy,
  Flame,
  Languages,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
  User,
} from "lucide-react";
import {
  BUILD_TYPES,
  CAMPUS_BALANCE_QUESTIONS,
  ChatMessage,
  INITIAL_BLIND_CHAT_MESSAGES,
  PartnerProfile,
  RELIGIONS,
  ROUTES,
  FIELD_SELECT,
  SMOKING_STATUSES,
} from "@/lib/ondo-constants";
import {
  BUILD_LABEL_JA,
  HOBBY_LABEL_JA,
  RELIGION_LABEL_JA,
  SMOKING_LABEL_JA,
  VIBE_STYLE_LABEL_JA,
  departmentLabelJa,
  locationLabelJa,
  needsTranslation,
  schoolLabelJa,
  translateKoJa,
  useAppLocale,
} from "@/lib/i18n";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("animate-spin", className)}
      strokeWidth={2.4}
      aria-hidden="true"
    />
  );
}

// Warm Editorial Button
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "kakao";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black shadow-2xs",
      secondary:
        "bg-[#F3F1ED] text-zinc-800 hover:bg-stone-200/80 active:bg-stone-300 border border-stone-200/80",
      ghost:
        "bg-transparent text-zinc-600 hover:bg-stone-100 active:bg-stone-200",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
      kakao:
        "ondo-shimmer-btn bg-[#FEE500] text-zinc-900 font-extrabold hover:bg-[#FADA0A] hover:scale-[1.01] active:bg-[#F2CF00] active:scale-[0.99] shadow-xs",
    };
    const sizes = {
      sm: "h-9 px-3.5 text-[13px]",
      md: "h-11 px-4 text-[14px]",
      lg: "h-12 px-5 text-[14px]",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-45",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="h-4 w-4" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function LanguageToggle({ className }: { className?: string }) {
  const [locale, setLocale] = useAppLocale();
  const isJa = locale === "ja";
  return (
    <div
      className={cn(
        "relative inline-grid shrink-0 grid-cols-2 items-center whitespace-nowrap rounded-full border border-stone-200/90 bg-white p-0.5 text-[12px] font-bold shadow-2xs select-none",
        className
      )}
    >
      {/* Smooth Sliding Pill Indicator */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full shadow-xs transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isJa
            ? "translate-x-full bg-rose-600"
            : "translate-x-0 bg-zinc-900"
        )}
      />
      <button
        type="button"
        onClick={() => setLocale("ko")}
        className={cn(
          "relative z-10 rounded-full px-2 py-1 text-center text-[11px] transition-colors duration-300 sm:px-2.5 sm:py-1.5 sm:text-[12px]",
          !isJa ? "text-white" : "text-zinc-500 hover:text-zinc-800"
        )}
      >
        <span className="sm:hidden">KR</span>
        <span className="hidden sm:inline">🇰🇷 한국어</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("ja")}
        className={cn(
          "relative z-10 rounded-full px-2 py-1 text-center text-[11px] transition-colors duration-300 sm:px-2.5 sm:py-1.5 sm:text-[12px]",
          isJa ? "text-white" : "text-zinc-500 hover:text-zinc-800"
        )}
      >
        <span className="sm:hidden">JP</span>
        <span className="hidden sm:inline">🇯🇵 日本語</span>
      </button>
    </div>
  );
}

// Editorial PageHeader
export function PageHeader({
  title,
  back = false,
  onBack,
  right,
  className,
}: {
  title: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [locale] = useAppLocale();
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b border-stone-200/70 bg-[#FAF9F6]/90 px-4 backdrop-blur-md sm:px-5",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {back && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : router.back())}
            aria-label={locale === "ja" ? "戻る" : "뒤로 가기"}
            className="-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-stone-200/60"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <h1 className="truncate text-[15px] font-bold tracking-tight text-zinc-900 sm:text-[16px]">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <LanguageToggle />
        {right}
      </div>
    </header>
  );
}

// Editorial Modal
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-fade-in fixed inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="animate-sheet-up relative w-full max-w-md rounded-t-3xl border border-stone-200 bg-[#FAF9F6] px-6 pt-6 pb-8 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-stone-300 sm:hidden" />
        {children}
      </div>
    </div>
  );
}

export function SelectField({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string | number;
  onChange: (val: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        className={FIELD_SELECT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
}

// ============================================================================
// ONDO 36.5° Value & Vibe Profile Card
// ============================================================================
const buildLabelMap = Object.fromEntries(
  BUILD_TYPES.map((b) => [b.value, b.label])
);
const smokingLabelMap = Object.fromEntries(
  SMOKING_STATUSES.map((s) => [s.value, s.label])
);
const religionLabelMap = Object.fromEntries(
  RELIGIONS.map((r) => [r.value, r.label])
);

export function MatchCard({
  partner,
}: {
  partner: PartnerProfile;
  unblurLevel?: number;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";

  const isDemoPartner = partner.uid === "partner-01";
  const displayNickname =
    isJa && isDemoPartner ? "安岩洞ジェジェイヤ" : partner.nickname;
  const displaySchool = isJa
    ? isDemoPartner
      ? "高麗大学"
      : schoolLabelJa(partner.school)
    : partner.school;
  const displayDept = isJa
    ? isDemoPartner
      ? "コンピュータ学科"
      : departmentLabelJa(partner.department)
    : partner.department;
  const displayLoc = isJa
    ? isDemoPartner
      ? "ソウル特別市 城北区"
      : locationLabelJa(partner.locationLabel || "")
    : partner.locationLabel || "";
  const displayVoiceIntro =
    isJa && isDemoPartner
      ? "こんにちは！高麗大でコンピュータを専攻しています。休日は延南洞のカフェや展示会巡りが好きです。楽しくお話ししましょう！"
      : partner.voiceIntroText;
  const displayBio =
    isJa && isDemoPartner
      ? "平日は研究室とワークアウト、週末は美味しいお店巡りやカメラを持って散歩するのが好きです。価値観が合って、穏やかに会話できる方と出会いたいです。"
      : partner.bio;

  const [showTranslated, setShowTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedIntro, setTranslatedIntro] = useState<string | null>(null);
  const [translatedBio, setTranslatedBio] = useState<string | null>(null);
  const [demoChatStep, setDemoChatStep] = useState<0 | 3 | 5>(0);
  // 체험 화면: 대화 수를 0→3→5로 한 칸씩 올리며 보여 줌 (동작 줄이기를 켠 경우 바로 표시)
  const reduceMotion = usePrefersReducedMotion();
  const [demoCount, setDemoCount] = useState(0);
  const shownCount = reduceMotion ? demoChatStep : demoCount;
  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setDemoCount((c) => {
        if (c === demoChatStep) {
          window.clearInterval(id);
          return c;
        }
        return c + (demoChatStep > c ? 1 : -1);
      });
    }, 160);
    return () => window.clearInterval(id);
  }, [demoChatStep, reduceMotion]);
  // 화면에 처음 보이면 한 번 자동으로 0 → 3 → 5 시연 (사용자가 먼저 누르면 멈춤)
  const [demoRef, demoSeen] = useInViewOnce<HTMLDivElement>(0.6);
  const demoTouchedRef = useRef(false);
  useEffect(() => {
    if (!demoSeen || reduceMotion || !isDemoPartner) return;
    const t1 = window.setTimeout(() => {
      if (!demoTouchedRef.current) setDemoChatStep(3);
    }, 900);
    const t2 = window.setTimeout(() => {
      if (!demoTouchedRef.current) setDemoChatStep(5);
    }, 2600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [demoSeen, reduceMotion, isDemoPartner]);
  const pickDemoStep = (step: 0 | 3 | 5) => {
    demoTouchedRef.current = true;
    setDemoChatStep(step);
  };
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = (x / rect.width - 0.5) * 10;
    const rotateX = (0.5 - y / rect.height) * 10;
    setTiltStyle({
      transform: `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.01)`,
    });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
    });
  };

  const canTranslateCard =
    needsTranslation(displayVoiceIntro, locale) ||
    needsTranslation(displayBio, locale);

  const handleToggleCardTranslate = async () => {
    if (showTranslated) {
      setShowTranslated(false);
      return;
    }
    setTranslating(true);
    try {
      const [nextIntro, nextBio] = await Promise.all([
        displayVoiceIntro && needsTranslation(displayVoiceIntro, locale)
          ? translateKoJa(displayVoiceIntro, locale)
          : Promise.resolve(null),
        displayBio && needsTranslation(displayBio, locale)
          ? translateKoJa(displayBio, locale)
          : Promise.resolve(null),
      ]);
      setTranslatedIntro(nextIntro);
      setTranslatedBio(nextBio);
      setShowTranslated(true);
    } finally {
      setTranslating(false);
    }
  };

  const buildLabel = partner.build
    ? isJa
      ? BUILD_LABEL_JA[partner.build] || buildLabelMap[partner.build]
      : buildLabelMap[partner.build]
    : null;
  const smokingLabel = partner.smokingStatus
    ? isJa
      ? SMOKING_LABEL_JA[partner.smokingStatus] ||
        smokingLabelMap[partner.smokingStatus]
      : smokingLabelMap[partner.smokingStatus]
    : null;
  const religionLabel = partner.religion
    ? isJa
      ? RELIGION_LABEL_JA[partner.religion] ||
        religionLabelMap[partner.religion]
      : religionLabelMap[partner.religion]
    : null;
  const styleTags = (partner.vibeKeywords ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (isJa ? VIBE_STYLE_LABEL_JA[s] || s : s));

  const auraGradient =
    partner.silhouetteTheme === "indigo"
      ? "from-amber-100 via-rose-100 to-stone-200"
      : partner.silhouetteTheme === "emerald"
      ? "from-teal-100 via-emerald-50 to-stone-200"
      : "from-rose-100 via-orange-50 to-stone-200";

  return (
    <article
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      style={tiltStyle}
      className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_8px_28px_rgba(24,24,27,0.05)] transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:shadow-[0_14px_36px_rgba(225,29,72,0.10)]"
    >
      {/* Top Aura Header Banner */}
      <div className={cn("bg-gradient-to-r px-4 pt-4 pb-3.5 sm:px-6 sm:pt-5 sm:pb-4", auraGradient)}>
        {partner.relaxedConditionNote && (
          <div className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-700 backdrop-blur-xs sm:text-[12px]">
            <Sparkles className="h-3 w-3 shrink-0 text-rose-500" />
            <span className="truncate">
              {isJa
                ? `スマート条件緩和: ${partner.relaxedConditionNote}`
                : `스마트 반경 확장: ${partner.relaxedConditionNote}`}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white uppercase">
                {partner.school.includes("어학당") ||
                partner.department.includes("🇯🇵")
                  ? isJa
                    ? "🇯🇵 学生証確認済み"
                    : "🇯🇵 학생증 확인"
                  : isJa
                  ? "🇰🇷 キャンパス在学認証"
                  : "🇰🇷 캠퍼스 재학 인증"}
              </span>
              <span className="text-[12px] font-semibold text-zinc-600">
                {displaySchool} · {displayDept}
              </span>
            </div>
            <h3 className="mt-2 text-[20px] font-extrabold tracking-tight text-zinc-900 sm:text-[22px]">
              {displayNickname}
            </h3>
            <p className="mt-0.5 text-[12.5px] font-medium text-zinc-600 sm:text-[13px]">
              {isJa ? `${partner.age}歳` : `${partner.age}세`}
              {partner.height > 0 ? ` · ${partner.height}cm` : ""}
              {displayLoc ? ` · ${displayLoc}` : ""}
            </p>
          </div>

          {/* 실제 매칭이 반영하는 조건만 표시 */}
          <div className="self-start shrink-0 rounded-2xl bg-white/90 px-3 py-1.5 text-left shadow-2xs backdrop-blur-xs sm:px-3.5 sm:py-2 sm:text-right">
            <div className="flex items-center gap-1 text-[12px] font-extrabold text-rose-600 sm:justify-end sm:text-[13px]">
              <Flame className="h-3.5 w-3.5 shrink-0" fill="currentColor" />
              <span>{isJa ? "希望条件クリア" : "선호 조건 충족"}</span>
            </div>
            <p className="text-[10.5px] font-semibold text-zinc-500 sm:text-[11px]">
              {isJa ? "学校・年齢・喫煙・宗教の条件を反映" : "학교·나이·흡연·종교 조건 반영"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        {canTranslateCard && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={translating}
              onClick={handleToggleCardTranslate}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50/70 px-3 py-1 text-[11px] font-extrabold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>
                {translating
                  ? isJa
                    ? "翻訳中..."
                    : "번역 중..."
                  : showTranslated
                  ? isJa
                    ? "原文のみ表示"
                    : "원문만 보기"
                  : isJa
                  ? "🇰🇷→🇯🇵 日本語に翻訳して見る・Google翻訳"
                  : "🇯🇵→🇰🇷 한국어로 번역 보기 · 구글 번역"}
              </span>
            </button>
          </div>
        )}

        {/* Value & First-Impression One-Line Note */}
        {displayVoiceIntro && (
          <div className="rounded-2xl border border-rose-100/90 bg-rose-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-rose-600">
                <Sparkles className="h-3.5 w-3.5" />
                {isJa
                  ? "第一印象 ＆ 恋愛価値観 一行ノート"
                  : "첫인상 & 연애 가치관 한 줄 노트"}
              </span>
            </div>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-zinc-800">
              &ldquo;{displayVoiceIntro}&rdquo;
            </p>
            {showTranslated && translatedIntro && (
              <p className="mt-2 border-t border-rose-100 pt-2 text-[13px] font-medium leading-relaxed text-rose-700">
                <span className="mr-1.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600 ring-1 ring-rose-200">
                  {isJa ? "日本語訳" : "한국어 번역"}
                </span>
                &ldquo;{translatedIntro}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Story / Bio */}
        {displayBio && (
          <div>
            <p className="text-[12px] font-bold tracking-wider text-zinc-400 uppercase">
              Story Note
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-zinc-700">
              {displayBio}
            </p>
            {showTranslated && translatedBio && (
              <div className="mt-2 rounded-2xl border border-rose-100 bg-rose-50/30 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-800">
                <span className="mr-1.5 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600 ring-1 ring-rose-200">
                  <Languages className="h-2.5 w-2.5" />
                  {isJa ? "自己紹介の日本語訳" : "자기소개 한국어 번역"}
                </span>
                <span className="whitespace-pre-wrap">{translatedBio}</span>
              </div>
            )}
          </div>
        )}

        {/* 본인이 입력한 성향 정보만 표시 (없으면 숨김) */}
        {(partner.mbti || smokingLabel) && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F3F1ED]/70 p-3.5">
            {partner.mbti && (
              <div>
                <span className="text-[11px] font-semibold text-zinc-400">MBTI</span>
                <p className="mt-0.5 text-[12px] font-bold text-zinc-800">
                  {partner.mbti}
                </p>
              </div>
            )}
            {smokingLabel && (
              <div>
                <span className="text-[11px] font-semibold text-zinc-400">
                  {isJa ? "喫煙" : "흡연"}
                </span>
                <p className="mt-0.5 text-[12px] font-bold text-zinc-800">
                  {smokingLabel}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mood Keywords & Interests */}
        <div className="flex flex-wrap gap-1.5">
          {styleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-rose-50 px-3 py-1 text-[12px] font-semibold text-rose-700"
            >
              #{tag}
            </span>
          ))}
          {buildLabel && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-zinc-700">
              {buildLabel}
            </span>
          )}
          {religionLabel && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-zinc-700">
              {religionLabel}
            </span>
          )}
          {partner.hobbies.map((hobby) => (
            <span
              key={hobby}
              className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[12px] text-zinc-600"
            >
              {isJa ? HOBBY_LABEL_JA[hobby] || hobby : hobby}
            </span>
          ))}
        </div>

        {/* 첫 페이지 예시 카드 전용: 3단계 블러 해제 & 카카오톡 공개 인터랙티브 체험 */}
        {isDemoPartner && (
          <div
            ref={demoRef}
            className="mt-2 rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 p-3.5 sm:p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11.5px] font-extrabold text-rose-600 sm:text-[12px]">
                  {demoChatStep === 0
                    ? isJa
                      ? "🔒 会話5回達成までブラインド保護中"
                      : "🔒 대화 5회 전 블라인드 보호 중"
                    : demoChatStep === 3
                    ? isJa
                      ? "💬 お互いに会話中…あと少しで公開！"
                      : "💬 서로 대화 중... 조금만 더 얘기해 보세요!"
                    : isJa
                    ? "🎉 会話5回達成！カカオトークIDが公開されました"
                    : "🎉 대화 5회 달성! 카카오톡 ID가 열렸어요"}
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-[13.5px] font-black tracking-tight text-zinc-900 transition-all duration-500 select-none sm:text-[14px]",
                    shownCount <= 1
                      ? "blur-[5px]"
                      : shownCount < 5
                      ? "blur-[2px]"
                      : "blur-none text-rose-600"
                  )}
                >
                  <span key={shownCount === 5 ? "open" : "closed"} className={shownCount === 5 ? "ondo-pop" : undefined}>
                    kakao_id: anam_jwe24
                  </span>
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-white transition-colors",
                  shownCount === 5 ? "bg-emerald-600" : "bg-rose-600"
                )}
              >
                {isJa ? `会話 ${shownCount}/5` : `대화 ${shownCount}/5`}
                {shownCount === 5 ? (isJa ? " 完了" : " 완료") : ""}
              </span>
            </div>

            {/* 대화가 쌓이는 모습: 점 5개 + 진행 막대 */}
            <div className="mt-2.5 flex items-center gap-2" aria-hidden>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-300",
                      i < shownCount
                        ? shownCount === 5
                          ? "scale-110 bg-emerald-500"
                          : "scale-110 bg-rose-500"
                        : "bg-stone-200"
                    )}
                  />
                ))}
              </div>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200/80">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    shownCount === 5 ? "bg-emerald-500" : "bg-rose-500"
                  )}
                  style={{ width: `${(shownCount / 5) * 100}%` }}
                />
              </div>
            </div>

            <p className="mt-2.5 text-[11px] font-semibold text-zinc-500">
              {isJa
                ? "👇 下のボタンを押して、会話が進むとカカオIDのぼかしが解除される様子を体験してみてください！"
                : "👇 아래 단계 버튼을 눌러 대화가 쌓이면서 카카오톡 ID 블러가 풀리는 과정을 직접 체험해 보세요!"}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => pickDemoStep(0)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-[11px] font-extrabold transition-all sm:text-[11.5px]",
                  demoChatStep === 0
                    ? "border-rose-600 bg-rose-600 text-white shadow-2xs"
                    : "border-stone-200 bg-white text-zinc-700 hover:border-rose-300"
                )}
              >
                {isJa ? "1段階: 直後" : "1단계: 매칭 직후"}
              </button>
              <button
                type="button"
                onClick={() => pickDemoStep(3)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-[11px] font-extrabold transition-all sm:text-[11.5px]",
                  demoChatStep === 3
                    ? "border-rose-600 bg-rose-600 text-white shadow-2xs"
                    : "border-stone-200 bg-white text-zinc-700 hover:border-rose-300"
                )}
              >
                {isJa ? "2段階: 会話3回" : "2단계: 대화 3회"}
              </button>
              <button
                type="button"
                onClick={() => pickDemoStep(5)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-[11px] font-extrabold transition-all sm:text-[11.5px]",
                  demoChatStep === 5
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                    : "border-stone-200 bg-white text-zinc-700 hover:border-rose-300"
                )}
              >
                {isJa ? "3段階: カカオ公開!" : "3단계: 카톡 공개!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// ============================================================================
// ONDO 24h Blind Coffee Chat Room
// ============================================================================
const ICEBREAKERS_KO = [
  "가치관 노트 글귀가 정말 따뜻해서 반가웠어요!",
  "주말에 주로 어느 동네 카페나 전시 보러 가시나요?",
  "이번 학기 끝나면 제일 가고 싶은 여행지 있으세요?",
];

const ICEBREAKERS_JA = [
  "価値観ノートの言葉がとても温かくて嬉しかったです！",
  "週末は主にどのエリアのカフェや展示会に行かれますか？",
  "今学期が終わったら一番行きたい旅行先はありますか？",
];

export function InAppBlindChatCard({
  partner,
  escrowStatus,
  preview = false,
}: {
  partner: PartnerProfile;
  escrowStatus: "HELD" | "CONFIRMED" | "REFUNDED";
  /** true = 실제 매칭 전 체험 화면 (자동 답장 예시), false = 실제 매칭 상대 */
  preview?: boolean;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [messages, setMessages] = useState<ChatMessage[]>(
    INITIAL_BLIND_CHAT_MESSAGES
  );
  const [input, setInput] = useState("");
  const [contactRevealed, setContactRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const chatTurnCount = messages.filter((m) => m.sender !== "system").length;
  const requiredTurns = 5;
  // 실제 매칭에서는 서버가 연락처를 내려준 경우(운영자 확정)에만 공개 영역을 보여 줌
  const canRevealContact = preview
    ? chatTurnCount >= requiredTurns || contactRevealed
    : !!partner.kakaoId;
  const icebreakers = isJa ? ICEBREAKERS_JA : ICEBREAKERS_KO;

  const sendMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;
    const myMsg: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      sender: "me",
      text: trimmed,
      time: isJa ? "たった今" : "방금",
    };
    setMessages((prev) => [...prev, myMsg]);
    setInput("");

    // 자동 답장은 체험 미리보기에서만 (실제 상대에게 가짜 답장을 보여 주지 않음)
    if (!preview) return;
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-reply-${crypto.randomUUID()}`,
        sender: "partner",
        text: isJa
          ? "ありがとうございます！会話の波長が合ってとても嬉しいです😊 5往復達成したので、カカオトークIDを交換してゆっくりお話ししませんか？"
          : "맞아요! 대화 결이 잘 맞아서 정말 편하네요 😊 5마디가 채워졌는데 이제 안심 카카오톡 ID 교환하고 편하게 연락할까요?",
        time: isJa ? "たった今" : "방금",
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 550);
  };

  const handleCopyKakao = async () => {
    try {
      if (!partner.kakaoId) return;
      await navigator.clipboard.writeText(partner.kakaoId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_4px_20px_rgba(24,24,27,0.03)]">
      {/* Escrow Coffee Ticket Status */}
      <div className="flex items-center justify-between border-b border-stone-200/70 bg-[#FAF9F6] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Coffee className="h-4 w-4 text-rose-600" />
          <span className="text-[12px] font-bold text-zinc-800">
            {escrowStatus === "REFUNDED"
              ? isJa
                ? "24時間未返信 · コーヒーチケット1枚 自動返還完了"
                : "24시간 미응답 · 커피티켓 1장 자동 반환 완료"
              : isJa
              ? "エスクロー保護中（最初の返信を確認済み）"
              : "에스크로 커피티켓 보호 중 (첫 답장 확인됨)"}
          </span>
        </div>
        {preview && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-700">
            {isJa ? "体験プレビュー" : "체험 미리보기"}
          </span>
        )}
      </div>

      {!preview && (
        <div className="border-b border-stone-100 bg-sky-50/60 px-5 py-3 text-[12px] leading-relaxed text-sky-800">
          {isJa
            ? "リアルタイムチャットは準備中です。運営チームがマッチングを確定すると、下にお相手の連絡先が表示されます。"
            : "실시간 채팅은 준비 중이에요. 운영팀이 매칭을 확정하면 아래에 상대방 연락처가 공개돼요."}
        </div>
      )}

      {/* 5-Turn Conversation Thermometer */}
      <div className="border-b border-stone-100 px-5 py-3">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-zinc-600">
            {isJa
              ? `会話温度上昇中 (${Math.min(chatTurnCount, requiredTurns)}/${requiredTurns}ターン)`
              : `대화 온도 상승 중 (${Math.min(chatTurnCount, requiredTurns)}/${requiredTurns}턴)`}
          </span>
          <span className="font-bold text-rose-600">
            {canRevealContact
              ? isJa
                ? "36.5°C 到達 · カカオID交換可能 ✓"
                : "36.5°C 도달 · 카카오톡 ID 교환 가능 ✓"
              : isJa
              ? `あと${requiredTurns - chatTurnCount}回の会話でカカオIDが開きます`
              : `${requiredTurns - chatTurnCount}마디 더 나누면 카카오톡 ID가 열려요`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-rose-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, (chatTurnCount / requiredTurns) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-76 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((m) => {
          if (m.sender === "system") {
            return (
              <div
                key={m.id}
                className="rounded-2xl bg-[#F3F1ED] px-4 py-2.5 text-center text-[12px] leading-relaxed text-zinc-600"
              >
                {isJa && m.id === "sys-1"
                  ? "お互いの好感が繋がり、24時間ブラインドチャットルームが開きました。5回以上会話を交わすと安心カカオトークIDを交換できます。"
                  : m.text}
              </div>
            );
          }
          const isMe = m.sender === "me";
          return (
            <div
              key={m.id}
              className={cn(
                "flex flex-col",
                isMe ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                  isMe
                    ? "rounded-br-xs bg-zinc-900 text-white"
                    : "rounded-bl-xs bg-[#F3F1ED] text-zinc-800"
                )}
              >
                {m.text}
              </div>
              <span className="mt-1 px-1 text-[11px] text-zinc-400">
                {m.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Safe Contact Exchange Box */}
      {canRevealContact && (
        <div className="mx-5 mb-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
          {!partner.kakaoId ? (
            <p className="text-[12px] leading-relaxed text-zinc-700">
              {isJa
                ? "連絡先は、運営チームがマッチングを確認・確定した後に公開されます。"
                : "연락처는 운영팀이 매칭을 확인·확정한 뒤에 공개돼요."}
            </p>
          ) : !contactRevealed ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold text-zinc-900">
                  {isJa
                    ? "会話の温度が十分に上がりました！"
                    : "대화 온도가 충분히 올라왔어요!"}
                </p>
                <p className="text-[12px] text-zinc-600">
                  {isJa
                    ? "事前検索確認済みのカカオトークIDを確認しましょう"
                    : "사전 검색 검증이 완료된 안심 카카오톡 ID를 열람하세요"}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setContactRevealed(true)}
                className="shrink-0 bg-rose-600 hover:bg-rose-700"
              >
                {isJa ? "カカオIDを開く" : "카톡 ID 열기"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[12px] font-bold text-rose-600">
                  {isJa
                    ? "事前確認済みのお相手のカカオトークID"
                    : "사전 검증된 상대방 카카오톡 ID"}
                </span>
                <p className="font-mono text-[16px] font-extrabold text-zinc-900">
                  {partner.kakaoId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyKakao}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-zinc-800 shadow-2xs ring-1 ring-stone-200"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-rose-600" />
                    {isJa ? "コピー済み" : "복사됨"}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {isJa ? "コピーする" : "복사하기"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-stone-100 px-5 py-2.5 [scrollbar-width:none]">
        {icebreakers.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            className="shrink-0 rounded-full bg-[#F3F1ED] px-3 py-1 text-[12px] font-medium text-zinc-700 transition-colors hover:bg-stone-200"
          >
            ✨ {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-stone-100 px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isJa
              ? "メッセージを入力（あと1回の会話でカカオID公開！）"
              : "대화를 남겨보세요 (1마디만 더 나누면 카톡 ID 오픈!)"
          }
          className="h-10 flex-1 rounded-full bg-[#F3F1ED] px-4 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
        <button
          type="submit"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform active:scale-95"
          aria-label={isJa ? "送信" : "보내기"}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// ONDO Campus Balance Poll
// ============================================================================
const BALANCE_JA: Record<
  string,
  { category: string; question: string; optionA: string; optionB: string }
> = {
  "bal-1": {
    category: "連絡の頻度",
    question: "普段の連絡スタイルでより好むのは？",
    optionA: "日常をシェアしながらこまめにメッセージ",
    optionB: "用事を終えてから夜にゆっくり電話",
  },
  "bal-2": {
    category: "キャンパスの人間関係",
    question: "恋人が異性の同期と2人きりで学食を食べるのは？",
    optionA: "学食ならご飯を食べるだけだから平気",
    optionB: "わざわざ2人きりで食べるのは少し気になる",
  },
  "bal-3": {
    category: "テスト期間のデート",
    question: "中間・期末テスト期間のデート方法は？",
    optionA: "図書館やカフェで隣に座って一緒に勉強",
    optionB: "テストが終わる日まで各自集中して終わったら遊ぶ",
  },
};

export function CampusBalanceLoungeCard({
  onRewardPoints,
}: {
  onRewardPoints?: (pts: number) => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [votes, setVotes] = useState<Record<string, "A" | "B">>({});

  const handleVote = (qId: string, choice: "A" | "B") => {
    if (votes[qId]) return;
    setVotes((prev) => ({ ...prev, [qId]: choice }));
    onRewardPoints?.(200);
  };

  return (
    <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-[0_4px_20px_rgba(24,24,27,0.03)]">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[12px] font-bold tracking-wider text-rose-600 uppercase">
            Campus Balance Poll
          </span>
          <h3 className="mt-0.5 text-[18px] font-extrabold text-zinc-900">
            {isJa ? "日韓キャンパス恋愛バランス投票" : "우리 캠퍼스 연애 온도차 투표"}
          </h3>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-[12px] font-bold text-rose-600">
          {isJa ? "気軽に参加" : "가볍게 참여"}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-zinc-500">
        {isJa
          ? "気軽に楽しむ恋愛バランスゲームです。選んだ答えはマッチングには使われず、保存もされません。"
          : "재미로 해 보는 연애 밸런스 게임이에요. 고른 답은 매칭에 쓰이지 않고 저장되지도 않아요."}
      </p>

      <div className="mt-5 space-y-3.5">
        {CAMPUS_BALANCE_QUESTIONS.map((q) => {
          const myChoice = votes[q.id];
          const jaItem = BALANCE_JA[q.id];
          const category = isJa && jaItem ? jaItem.category : q.category;
          const question = isJa && jaItem ? jaItem.question : q.question;
          const optionA = isJa && jaItem ? jaItem.optionA : q.optionA;
          const optionB = isJa && jaItem ? jaItem.optionB : q.optionB;
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-stone-200/70 bg-[#FAF9F6] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-zinc-400">
                  {category}
                </span>
                {myChoice && (
                  <span className="text-[12px] font-bold text-rose-600">
                    {isJa ? "✓ 回答済み" : "✓ 선택 완료"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[14px] font-bold text-zinc-900">
                Q. {question}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["A", "B"] as const).map((opt) => {
                  const label = opt === "A" ? optionA : optionB;
                  const selected = myChoice === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleVote(q.id, opt)}
                      className={cn(
                        "rounded-xl border px-3.5 py-3 text-left text-[12px] transition-all",
                        selected
                          ? "border-zinc-900 bg-zinc-900 font-semibold text-white"
                          : "border-stone-200 bg-white text-zinc-700 hover:bg-stone-50"
                      )}
                    >
                      <span className="block leading-snug">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// ONDO 플로팅 필 내비게이션 바
// ============================================================================
export type HomeTabId = "lounge" | "archive" | "filter" | "note" | "settings";

const TAB_ITEMS: {
  id: HomeTabId;
  label: string;
  labelJa: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "lounge", label: "라운지", labelJa: "ラウンジ", Icon: Compass },
  { id: "archive", label: "대화 기록", labelJa: "トーク履歴", Icon: MessageSquare },
  { id: "filter", label: "주파수 조건", labelJa: "希望条件", Icon: Sliders },
  { id: "note", label: "가치관 노트", labelJa: "価値観ノート", Icon: Sparkles },
  { id: "settings", label: "내 계정", labelJa: "アカウント", Icon: User },
];

export function PillNav({
  active,
  onChange,
}: {
  active: HomeTabId;
  onChange: (id: HomeTabId) => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  return (
    <nav
      aria-label="하단 플로팅 내비게이션"
      className="fixed inset-x-0 bottom-4 z-30 mx-auto max-w-md px-4"
    >
      <div className="grid h-14 grid-cols-5 items-center rounded-full border border-stone-200/90 bg-zinc-900/95 px-2 text-white shadow-xl backdrop-blur-md">
        {TAB_ITEMS.map(({ id, label, labelJa, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-full py-1.5 text-[11px] transition-all",
                isActive
                  ? "bg-white font-bold text-zinc-900"
                  : "font-medium text-zinc-400 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2.3 : 1.8} />
              <span className="leading-none">{isJa ? labelJa : label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MatchingToggleCard({
  matchingStatus,
  loading,
  onToggle,
  locked = false,
}: {
  matchingStatus: string | null;
  loading?: boolean;
  onToggle: () => void;
  locked?: boolean;
  variant?: "card" | "row";
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const isPaused = matchingStatus === "PAUSED";
  const isOn = !isPaused;
  const isDisabled = loading || locked || matchingStatus === null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white px-5 py-4">
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-zinc-900">
          {isJa ? "毎晩21時 マッチング稼働中" : "밤 9시 주파수 매칭 활성화"}
        </p>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          {isOn
            ? isJa
              ? "希望条件に合う他大学の学生を毎晩21時に紹介します"
              : "선호 조건이 맞는 다른 학교 학생을 매일 밤 9시에 소개해요"
            : isJa
            ? "現在ラウンジ休憩モードです"
            : "현재 라운지 휴식 모드입니다"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={isJa ? "マッチングを受け取る" : "주파수 매칭 활성화"}
        disabled={isDisabled}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          isOn ? "bg-rose-600" : "bg-stone-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white transition-transform",
            isOn ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function ProfileCompletionCard({
  percent,
  onOpen,
}: {
  percent: number;
  onOpen: () => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white px-5 py-3.5 text-left transition-colors hover:bg-stone-50"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-zinc-900">
          {isJa ? "価値観ノート完成度 " : "가치관 노트 완성도 "}
          <span className="text-rose-600">{percent}%</span>
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-rose-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
    </button>
  );
}

export function ContactUnlockCard({
  pointCost = 2900,
  userPoints,
  onUnlock,
}: {
  pointCost?: number;
  userPoints: number;
  onUnlock: () => void;
}) {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const lacking = Math.max(0, pointCost - userPoints);

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          {isJa ? "100% エスクローチケット保証" : "100% 에스크로 티켓 보증"}
        </span>
        <span className="text-[12px] font-semibold text-zinc-400">
          {isJa
            ? `保有チケット ${Math.floor(userPoints / 2900)}枚`
            : `보유 티켓 ${Math.floor(userPoints / 2900)}장`}
        </span>
      </div>
      <h4 className="mt-3 text-[17px] font-extrabold text-zinc-900">
        {isJa
          ? "エスクロー・コーヒーチケット1枚(☕)でブラインドルームを開く"
          : "에스크로 커피티켓 1장(☕)으로 블라인드 룸 열기"}
      </h4>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
        {isJa
          ? "お相手が最初の返信を送った時だけチケットが使用確定となり、24時間以内に返信がない場合は100%自動返還されます。"
          : "상대방이 첫 답장을 보낼 때만 티켓이 확정 사용되며, 24시간 내 응답이 없으면 100% 자동 반환됩니다."}
      </p>
      <div className="mt-4">
        {lacking > 0 ? (
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push(ROUTES.POINTS)}
          >
            {isJa
              ? "コーヒーチケットをチャージしに行く"
              : "커피티켓 충전하러 가기"}
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={onUnlock}>
            {isJa
              ? "エスクロー保証で会話を始める"
              : "에스크로 보증으로 대화 시작하기"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1: Zero-Burden One-Line Value & Vibe Note Studio (Replaces Voice Recorder)
// ============================================================================
const VALUE_NOTE_PRESETS_KO = [
  "안녕하세요! 웃음이 많고 맛집·카페 탐방 좋아하는 학생입니다. 편하게 대화 나눠요!",
  "연락 템포가 꾸준하고 사소한 일상도 다정하게 공유하는 연애를 추구해요.",
  "주말엔 조용한 전시회나 산책을 즐겨요. 결이 비슷한 분과 대화하고 싶어요!",
];

const VALUE_NOTE_PRESETS_JA = [
  "こんにちは！カフェ巡りや美味しいお店探しが好きな留学生です。気軽にお話ししましょう！",
  "連絡のテンポが安定していて、日常の小さなことも温かくシェアする恋愛が好きです。",
  "週末は静かな展示会や散歩を楽しんでいます。雰囲気が合う方とお話ししたいです！",
];

export function VoiceRecorderCard({
  voiceIntroText,
  onSaveText,
}: {
  audioDataUrl?: string | null;
  voiceIntroText?: string;
  onSaveAudio?: (dataUrl: string | null, durationSec: number) => void;
  onSaveText?: (text: string) => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const presets = isJa ? VALUE_NOTE_PRESETS_JA : VALUE_NOTE_PRESETS_KO;
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState(
    voiceIntroText || presets[0]
  );

  return (
    <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-[0_4px_20px_rgba(24,24,27,0.03)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[15px] font-extrabold text-zinc-900">
              {isJa
                ? "第一印象 ＆ 恋愛価値観 一行ノート"
                : "첫인상 & 연애 가치관 한 줄 노트"}
            </h3>
            <p className="text-[12px] text-zinc-500">
              {isJa
                ? "負担になる顔写真や音声録音の代わりに、自分を表現する一行を書いてみましょう"
                : "부담스러운 사진·음성 녹음 없이, 나를 표현하는 한 줄 문장을 적어주세요"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-600">
          {isJa ? "簡単テキスト" : "간편 텍스트"}
        </span>
      </div>

      {/* 1-Click Preset Templates */}
      <div className="mt-3.5 space-y-1.5">
        <p className="text-[12px] font-bold text-zinc-400">
          {isJa
            ? "1秒おすすめフレーズ選択（クリックで自動入力）"
            : "1초 추천 문구 선택 (클릭 시 자동 입력)"}
        </p>
        <div className="flex flex-col gap-1.5">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setScriptText(preset);
                onSaveText?.(preset);
                setStatusMsg(
                  isJa
                    ? "選択した価値観一行ノートが適用されました！"
                    : "선택한 가치관 한 줄 노트가 즉시 적용되었습니다!"
                );
              }}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-[12px] transition-all",
                scriptText === preset
                  ? "border-rose-500 bg-rose-50/50 font-semibold text-rose-900"
                  : "border-stone-200 bg-[#FAF9F6] text-zinc-600 hover:bg-stone-100"
              )}
            >
              &ldquo;{preset}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="mt-3.5">
        <label className="text-[12px] font-bold text-zinc-400">
          {isJa
            ? "自分だけの一行ノートを直接編集する"
            : "직접 나만의 한 줄 노트 수정하기"}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={scriptText}
            onChange={(e) => {
              setScriptText(e.target.value);
              onSaveText?.(e.target.value);
            }}
            className="h-10 flex-1 rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 text-[13px] text-zinc-800 focus:border-zinc-900 focus:bg-white focus:outline-none"
          />
          <Button
            size="md"
            className="bg-zinc-900 hover:bg-zinc-800"
            onClick={() => {
              onSaveText?.(scriptText);
              setStatusMsg(
                isJa
                  ? "価値観一行ノートを保存しました！"
                  : "내 가치관 한 줄 노트가 저장되었습니다!"
              );
            }}
          >
            {isJa ? "保存" : "저장"}
          </Button>
        </div>
      </div>

      {statusMsg && (
        <p className="mt-2.5 text-[12px] font-semibold text-rose-600">
          {statusMsg}
        </p>
      )}
    </div>
  );
}

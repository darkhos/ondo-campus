"use client";

import React, { useState } from "react";
import { DbMatchPartner, deleteMyAccount, logoutEverywhere } from "@/lib/supabase";
import { RealMatchPanel } from "@/components/real-match-panel";
import { useInViewOnce } from "@/components/reveal";
import { useRouter } from "next/navigation";
import {
  CalendarHeart,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  BETA_UNLIMITED_TICKETS,
  AGE_MAX,
  AGE_MIN,
  BUILD_TYPES,
  VIBE_KEYWORD_LABEL,
  VIBE_KEYWORD_MAX,
  KAKAO_OPENCHAT_URL,
  IMPRESSION_TYPES,
  IMPRESSION_EMOJI,
  HEIGHT_MAX,
  HEIGHT_MIN,
  PREFERRED_HEIGHT_RANGES,
  HOBBIES,
  FIELD_INPUT,
  FIELD_LABEL,
  MBTI_BEST_MATCH,
  MBTI_TYPES,
  MatchHistoryItem,
  RELIGION_PREFS,
  SMOKING_PREFS,
  RELIGIONS,
  RELIGION_AGREE_DETAIL,
  RELIGION_AGREE_LABEL,
  ROUTES,
  SIDO_LIST,
  DISTRICTS_BY_SIDO,
  SMOKING_STATUSES,
  FIELD_TEXTAREA,
  UserProfile,
  VIBE_STYLE_KEYWORDS,
  buildLocationValue,
  formatShortLocation,
  generateWittyNickname,
  parseHeightPreferences,
  toggleHeightPreference,
} from "@/lib/ondo-constants";
import {
  BUILD_LABEL_JA,
  IMPRESSION_LABEL_JA,
  HEIGHT_LABEL_JA,
  HOBBY_LABEL_JA,
  RELIGION_LABEL_JA,
  SIDO_LABEL_JA,
  SIGUNGU_LABEL_JA,
  SMOKING_LABEL_JA,
  VIBE_STYLE_LABEL_JA,
  departmentLabelJa,
  locationLabelJa,
  schoolLabelJa,
  useAppLocale,
} from "@/lib/i18n";
import {
  Button,
  InAppBlindChatCard,
  MatchCard,
  MatchingToggleCard,
  Modal,
  PageHeader,
  RangeSlider,
  SelectField,
  VoiceRecorderCard,
  cn,
} from "@/components/ondo-ui";

// 취미·관심사는 최대 5개까지 고를 수 있음
const HOBBY_MAX = 5;

function SectionHeader({
  title,
  onEdit,
  editLabel = "편집",
}: {
  title: string;
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between px-0.5">
      <h2 className="text-[12px] font-bold tracking-tight text-gray-500">
        {title}
      </h2>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-[12px] font-semibold text-gray-900 hover:underline"
        >
          {editLabel}
        </button>
      )}
    </div>
  );
}

function CardBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white px-4 py-1",
        className
      )}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3 text-[14px]">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value ?? "-"}</span>
    </div>
  );
}

function OptionTileClass(selected: boolean) {
  return cn(
    "rounded-xl border py-2.5 text-[12px] font-semibold transition-all",
    selected
      ? "border-gray-900 bg-gray-900 text-white"
      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
  );
}

// ============================================================================
// 1. IdealTypeTab (Frequency Filter & Preference Settings)
// ============================================================================
export function IdealTypeTab({
  user,
  onUserUpdate,
}: {
  user: UserProfile;
  onUserUpdate: (patch: Partial<UserProfile>) => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  // 예전에 저장된 범위가 만 18~30세를 벗어나면 그 안으로 맞춰서 보여 줌
  const clampAge = (v: number, fallback: number) =>
    Number.isFinite(v) && v > 0 ? Math.min(AGE_MAX, Math.max(AGE_MIN, v)) : fallback;
  const [minAge, setMinAge] = useState(() => String(clampAge(user.preferredAgeMin, AGE_MIN)));
  const [maxAge, setMaxAge] = useState(() => String(clampAge(user.preferredAgeMax, AGE_MAX)));
  const [heightPrefs, setHeightPrefs] = useState<string[]>(() =>
    parseHeightPreferences(user.preferredHeight)
  );
  const [avoidSameSchool, setAvoidSameSchool] = useState(user.avoidSameSchool);
  const [smartRelax, setSmartRelax] = useState(user.smartRelaxFilter ?? true);
  const [includeJapaneseGlobal, setIncludeJapaneseGlobal] = useState(
    user.includeJapaneseGlobal ?? true
  );

  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [prefMbti, setPrefMbti] = useState<string[]>(user.preferredMbti);
  const [prefSmoking, setPrefSmoking] = useState(user.preferredSmoking || "any");
  const [prefImpressions, setPrefImpressions] = useState<string[]>(user.preferredImpressions);
  const [prefBuilds, setPrefBuilds] = useState<string[]>(user.preferredBuilds);
  const [prefReligion, setPrefReligion] = useState(
    user.preferredReligion || "any"
  );

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [recRef, recSeen] = useInViewOnce<HTMLDivElement>(0.3);
  // MBTI "상관없어요" = 16개 유형을 모두 고른 것으로 저장 (서버는 목록에 들어 있으면 맞는 것으로 봄)
  const mbtiAny = MBTI_TYPES.every((m) => prefMbti.includes(m));
  const myMbti = (user.mbti ?? "").toUpperCase();
  const recommendedMbti = MBTI_BEST_MATCH[myMbti] ?? [];
  const missingDetail = [
    prefMbti.length === 0 && "MBTI",
    prefImpressions.length === 0 && (isJa ? "第一印象" : "첫인상"),
    prefBuilds.length === 0 && (isJa ? "体格" : "체격"),
  ].filter(Boolean) as string[];


  const toggleItem = (list: string[], val: string) =>
    list.includes(val) ? list.filter((x) => x !== val) : [...list, val];

  const handleSaveAll = () => {
    const min = Number(minAge);
    const max = Number(maxAge);
    if (!min || !max || min > max) {
      setError(
        isJa
          ? "希望する年齢範囲を正しく選択してください。"
          : "선호 나이 범위를 올바르게 선택해 주세요."
      );
      return;
    }
    if (min < AGE_MIN || max > AGE_MAX) {
      setError(
        isJa
          ? `希望する年齢は満${AGE_MIN}〜${AGE_MAX}歳の間で選択してください。`
          : `선호 나이는 만 ${AGE_MIN}~${AGE_MAX}세 사이로 골라 주세요.`
      );
      return;
    }
    if (missingDetail.length > 0) {
      setAdvancedOpen(true);
      setError(
        isJa
          ? `性格・スタイルの詳細設定で「${missingDetail.join("・")}」を1つ以上選択してください。`
          : `성향·스타일 세부 선호도에서 ${missingDetail.join(", ")} 항목을 하나 이상 골라 주세요.`
      );
      return;
    }
    setError("");
    onUserUpdate({
      preferredAgeMin: min,
      preferredAgeMax: max,
      preferredHeight: heightPrefs.join(","),
      avoidSameSchool,
      smartRelaxFilter: smartRelax,
      includeJapaneseGlobal,
      preferredMbti: prefMbti,
      preferredSmoking: prefSmoking,
      preferredImpressions: prefImpressions,
      preferredBuilds: prefBuilds,
      preferredReligion: prefReligion,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAF9F6]">
      <PageHeader
        title={isJa ? "希望条件" : "이상형 조건"}
        back={false}
      />
      <div className="animate-fade-in flex-1 space-y-5 px-5 py-5">
        {/* 조건 유연하게 받기 (서버 매칭에서 나이 ±2세 · 흡연 조건 완화) */}
        <div className="rounded-2xl border border-rose-200/80 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-rose-600" />
                <p className="text-[14px] font-bold text-gray-900">
                  {isJa ? "条件を柔軟にする" : "조건 유연하게 받기"}
                </p>
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
                {isJa
                  ? "オンにすると、条件にぴったり合う相手がいないとき、希望年齢を前後2歳まで広げ、身長・喫煙の条件も柔軟に考慮します。"
                  : "켜 두면 딱 맞는 상대가 없을 때 선호 나이를 앞뒤 2살까지 넓히고, 키·흡연 조건도 유연하게 봐요."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smartRelax}
              onClick={() => setSmartRelax((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                smartRelax ? "bg-gray-900" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white transition-transform",
                  smartRelax ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* Core 3 Essentials */}
        <section className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4">
          <h2 className="text-[14px] font-bold text-gray-900">
            {isJa ? "基本条件" : "핵심 조건"}
          </h2>

          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "希望する年齢（満年齢）" : "선호 나이 (만 나이)"}
            </label>
            <RangeSlider
              min={AGE_MIN}
              max={AGE_MAX}
              low={Number(minAge) || AGE_MIN}
              high={Number(maxAge) || AGE_MAX}
              onChange={(lo, hi) => {
                setMinAge(String(lo));
                setMaxAge(String(hi));
              }}
              format={(v) => (isJa ? `${v}歳` : `${v}세`)}
              labelLow={isJa ? "希望年齢の下限" : "선호 나이 최소"}
              labelHigh={isJa ? "希望年齢の上限" : "선호 나이 최대"}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-bold text-gray-800">
                {isJa
                  ? "希望する身長区間（複数選択可）"
                  : "선호 키 구간 (중복 선택 가능)"}
              </label>
              <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-bold text-white">
                {heightPrefs.includes("any")
                  ? isJa
                    ? "すべて選択"
                    : "전체 구간"
                  : isJa
                  ? `${heightPrefs.length}区間を選択中`
                  : `${heightPrefs.length}개 구간 선택됨`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PREFERRED_HEIGHT_RANGES.map(({ value, label }) => {
                const isSelected = heightPrefs.includes(value);
                const dispLabel = isJa
                  ? HEIGHT_LABEL_JA[value] || label
                  : label;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setHeightPrefs((prev) =>
                        toggleHeightPreference(prev, value)
                      )
                    }
                    className={cn(
                      OptionTileClass(isSelected),
                      value === "any" && "col-span-2 text-center"
                    )}
                  >
                    {dispLabel}
                    {isSelected && " ✓"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                {isJa ? "同じ大学・語学堂の学生を除外" : "같은 학교 학생 제외"}
              </p>
              <p className="text-[12px] text-gray-500">
                {isJa
                  ? "知り合いと遭遇しないよう完全にブロックします"
                  : "아는 학우와 마주치지 않도록 완벽히 차단해요"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={avoidSameSchool}
              onClick={() => setAvoidSameSchool((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                avoidSameSchool ? "bg-gray-900" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white transition-transform",
                  avoidSameSchool ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-semibold text-gray-900">
                  {isJa
                    ? "🇯🇵 日本人語学堂生・大学留学生とのマッチングを含む"
                    : "🇯🇵 일본인 어학당생·대학 유학생 글로벌 매칭 포함"}
                </p>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                  {isJa ? "学生認証" : "학생 인증"}
                </span>
              </div>
              <p className="text-[12px] text-gray-500">
                {isJa
                  ? "学生認証を済ませた韓国の大学生・日本人語学堂生・日本人正規/交換留学生と繋がります"
                  : "학생 인증을 마친 일본인 어학당생 및 일본인 대학 유학생과도 연결해요"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={includeJapaneseGlobal}
              onClick={() => setIncludeJapaneseGlobal((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                includeJapaneseGlobal ? "bg-rose-600" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white transition-transform",
                  includeJapaneseGlobal ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </section>

        {/* Collapsible Secondary Preferences (Decluttered UI) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div>
              <h2 className="text-[14px] font-bold text-gray-900">
                {isJa
                  ? "性格・スタイルの詳細設定"
                  : "성향·스타일 세부 선호도"}
                <span className="ml-1.5 rounded-full bg-rose-50 px-1.5 py-0.5 align-middle text-[10.5px] font-bold text-rose-600">
                  {isJa ? "必須" : "필수"}
                </span>
              </h2>
              <p className="mt-0.5 text-[12px] text-gray-500">
                {isJa
                  ? `MBTI ${mbtiAny ? "こだわらない" : `${prefMbti.length}つ`} · 喫煙 · 第一印象 · 体格 · 宗教`
                  : `MBTI ${mbtiAny ? "상관없음" : `${prefMbti.length}개`} · 흡연 · 첫인상 · 체격 · 종교`}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                advancedOpen && "rotate-180"
              )}
            />
          </button>

          {advancedOpen && (
            <div className="space-y-5 border-t border-gray-100 p-4">
              <div ref={recRef}>
                <label className={FIELD_LABEL}>
                  {isJa ? "希望するMBTI（複数選択）" : "선호 MBTI (복수 선택)"}
                </label>
                {recommendedMbti.length > 0 && (
                  <div
                    className={cn(
                      "mb-2 flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2.5 shadow-sm",
                      recSeen ? "ondo-popup-in" : "ondo-popup-wait"
                    )}
                  >
                    <p className="min-w-0 text-[12px] leading-relaxed text-rose-700">
                      💡{" "}
                      {isJa
                        ? `私のMBTI（${myMbti}）と相性が良いと言われるのは `
                        : `내 MBTI(${myMbti})와 잘 맞는다고 알려진 유형은 `}
                      <b className="font-black">{recommendedMbti.join(" · ")}</b>
                      {isJa ? " です" : "예요"}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setPrefMbti((prev) =>
                          MBTI_TYPES.every((m) => prev.includes(m))
                            ? [...recommendedMbti]
                            : [
                                ...prev,
                                ...recommendedMbti.filter((m) => !prev.includes(m)),
                              ]
                        )
                      }
                      className="shrink-0 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white"
                    >
                      {isJa ? "おすすめを選ぶ" : "추천 고르기"}
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPrefMbti(mbtiAny ? [] : [...MBTI_TYPES])}
                    className={cn(OptionTileClass(mbtiAny), "col-span-4")}
                  >
                    {isJa ? "こだわらない" : "상관없어요"}
                    {mbtiAny && " ✓"}
                  </button>
                  {MBTI_TYPES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setPrefMbti((prev) =>
                          MBTI_TYPES.every((x) => prev.includes(x))
                            ? [m]
                            : toggleItem(prev, m)
                        )
                      }
                      className={cn(
                        OptionTileClass(!mbtiAny && prefMbti.includes(m)),
                        "relative"
                      )}
                    >
                      {m}
                      {recommendedMbti.includes(m) && (
                        <span
                          className={cn(
                            "absolute -right-1 -top-1.5 rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-[14px] text-white",
                            recSeen ? "ondo-popup-in" : "ondo-popup-wait"
                          )}
                          style={{ "--ondo-popup-delay": `${450 + recommendedMbti.indexOf(m) * 150}ms` } as React.CSSProperties}
                        >
                          {isJa ? "おすすめ" : "추천"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {recommendedMbti.length === 0 && (
                  <p className="mt-1.5 text-[11.5px] text-gray-400">
                    {isJa
                      ? "プロフィールにMBTIを入れると、相性の良いタイプをおすすめします。"
                      : "프로필에 내 MBTI를 넣으면 잘 맞는 유형을 추천해 드려요."}
                  </p>
                )}
              </div>

              <div>
                <label className={FIELD_LABEL}>
                  {isJa ? "喫煙の有無" : "흡연 여부"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SMOKING_PREFS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPrefSmoking(value)}
                      className={OptionTileClass(prefSmoking === value)}
                    >
                      {isJa ? SMOKING_LABEL_JA[value] || label : label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={FIELD_LABEL}>
                  {isJa
                    ? "希望する第一印象（複数選択）"
                    : "선호 첫인상 (복수 선택)"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {IMPRESSION_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setPrefImpressions((prev) => toggleItem(prev, value))
                      }
                      className={OptionTileClass(prefImpressions.includes(value))}
                    >
                      {isJa ? IMPRESSION_LABEL_JA[value] || label : label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={FIELD_LABEL}>
                  {isJa ? "希望する体格（複数選択）" : "선호 체격 (복수 선택)"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {BUILD_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setPrefBuilds((prev) => toggleItem(prev, value))
                      }
                      className={OptionTileClass(prefBuilds.includes(value))}
                    >
                      {isJa ? BUILD_LABEL_JA[value] || label : label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={FIELD_LABEL}>
                  {isJa ? "宗教" : "종교"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {RELIGION_PREFS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPrefReligion(value)}
                      className={OptionTileClass(prefReligion === value)}
                    >
                      {isJa ? RELIGION_LABEL_JA[value] || label : label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <p key={error} className="ondo-shake text-[13px] font-medium text-red-500">
            {error}
          </p>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleSaveAll}
          className={cn(
            "transition-colors duration-300",
            saved && "bg-emerald-600 hover:bg-emerald-600"
          )}
        >
          {saved ? (
            <span key="saved" className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="ondo-check-pop h-4 w-4" />
              {isJa ? "理想の条件を保存しました" : "이상형 설정이 저장되었어요"}
            </span>
          ) : isJa ? (
            "条件を保存する"
          ) : (
            "조건 저장하기"
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ProfileTab (Value Note & Profile Card)
// ============================================================================
const buildLabelMap = Object.fromEntries(
  BUILD_TYPES.map((b) => [b.value, b.label])
);
const impressionLabelMap = Object.fromEntries(
  IMPRESSION_TYPES.map((f) => [f.value, f.label])
);
const smokingLabelMap = Object.fromEntries(
  SMOKING_STATUSES.map((s) => [s.value, s.label])
);
const religionLabelMap = Object.fromEntries(
  RELIGIONS.map((r) => [r.value, r.label])
);

export function ProfileTab({
  user,
  onUserUpdate,
  initialSetup = false,
  onCompleteSetup,
}: {
  user: UserProfile;
  onUserUpdate: (patch: Partial<UserProfile>) => void;
  initialSetup?: boolean;
  onCompleteSetup?: () => void;
}) {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const needsOnboarding = initialSetup || !user.height || !user.location;
  const [editOpen, setEditOpen] = useState(needsOnboarding);

  const editLabel = isJa ? "編集" : "편집";
  const unsetLabel = isJa ? "未設定" : "미설정";
  const dispSchool = isJa ? schoolLabelJa(user.school) : user.school;
  const dispLocation = isJa
    ? user.location
      ? locationLabelJa(`${user.location.sido} ${user.location.sigungu}`)
      : unsetLabel
    : user.location
    ? formatShortLocation(user.location)
    : unsetLabel;

  if (editOpen || needsOnboarding) {
    return (
      <PartnerVisibleProfileEditor
        user={user}
        isInitialSetup={needsOnboarding}
        onCancel={
          needsOnboarding
            ? undefined
            : () => {
                setEditOpen(false);
              }
        }
        onSaved={(patch) => {
          onUserUpdate(patch);
          setEditOpen(false);
          if (initialSetup && onCompleteSetup) {
            onCompleteSetup();
          }
        }}
      />
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#FAF9F6]">
      <PageHeader
        title={isJa ? "プロフィール" : "내 프로필"}
        back={false}
        right={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            {isJa ? "編集" : "프로필 수정"}
          </button>
        }
      />

      <div className="animate-fade-in flex-1 space-y-5 px-5 py-5">
        {/* Clean Summary Card */}
        <section className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-[24px]">
            {(user.impression && IMPRESSION_EMOJI[user.impression]) || "🙂"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-[16px] font-bold text-gray-900">
                {user.nickname}
              </p>
              {user.verificationStatus === "verified" ? (
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[12px] font-bold text-rose-600">
                  {isJa ? "学校認証済み" : "학교 인증됨"}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.JOIN)}
                  className="rounded-md bg-amber-50 px-2 py-0.5 text-[12px] font-bold text-amber-700 underline hover:bg-amber-100"
                >
                  {user.verificationStatus === "pending_review"
                    ? isJa
                      ? "学生証確認中"
                      : "학생증 확인 중"
                    : isJa
                    ? "学生認証する →"
                    : "학생 인증하러 가기 →"}
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push(ROUTES.JOIN)}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
              >
                {isJa ? "基本情報・学校再認証" : "기본정보·학교 재인증"}
              </button>
            </div>
            <p className="mt-0.5 text-[13px] text-gray-600">
              {dispSchool} ·{" "}
              {isJa ? departmentLabelJa(user.department) : user.department}
            </p>
            <p className="text-[12px] text-gray-400">
              {[
                isJa ? `${user.age}歳` : `${user.age}세`,
                user.height > 0 ? `${user.height}cm` : null,
                user.location ? dispLocation : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </section>

        {/* Zero-Burden One-Line Value & Vibe Note Studio */}
        <section>
          <SectionHeader
            title={isJa ? "一行紹介" : "한 줄 소개"}
            editLabel={editLabel}
            onEdit={() => setEditOpen(true)}
          />
          <VoiceRecorderCard
            audioDataUrl={user.voiceAudioDataUrl}
            voiceIntroText={user.voiceIntroText}
            onSaveAudio={(dataUrl) => {
              onUserUpdate({ voiceAudioDataUrl: dataUrl });
            }}
            onSaveText={(txt) => {
              onUserUpdate({ voiceIntroText: txt });
            }}
          />
        </section>

        {/* Bio */}
        <section>
          <SectionHeader
            title={isJa ? "自己紹介" : "자기소개"}
            editLabel={editLabel}
            onEdit={() => setEditOpen(true)}
          />
          <p className="mb-2 text-[12px] font-semibold text-rose-600">
            {isJa
              ? "💡 自己紹介を詳しく書くほど、相手からの好感度が高まります。"
              : "💡 자기소개를 자세히 적을수록 상대가 나에 대한 호감이 높아져요."}
          </p>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-gray-700">
              {user.bio || unsetLabel}
            </p>
          </div>
        </section>

        {/* Vibe Keywords & Hobbies */}
        <section>
          <SectionHeader
            title={
              isJa
                ? "雰囲気キーワード＆趣味・関心"
                : "분위기 키워드 & 취미·관심사"
            }
            editLabel={editLabel}
            onEdit={() => setEditOpen(true)}
          />
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-stone-200/80 bg-white p-4">
            {user.vibeKeywords.filter(Boolean).map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-600"
              >
                #{isJa ? VIBE_STYLE_LABEL_JA[tag] || tag : tag}
              </span>
            ))}
            {user.hobbies.map((h) => (
              <span
                key={h}
                className="rounded-lg bg-gray-100 px-2.5 py-1 text-[12px] font-medium text-gray-700"
              >
                {isJa ? HOBBY_LABEL_JA[h] || h : h}
              </span>
            ))}
            {user.vibeKeywords.filter(Boolean).length === 0 &&
              user.hobbies.length === 0 && (
                <span className="text-[13px] text-gray-400">{unsetLabel}</span>
              )}
          </div>
        </section>

        {/* Traits */}
        <section>
          <SectionHeader
            title={isJa ? "詳細プロフィール" : "상세 프로필"}
            editLabel={editLabel}
            onEdit={() => setEditOpen(true)}
          />
          <CardBox>
            <InfoRow
              label={isJa ? "身長" : "키"}
              value={user.height > 0 ? `${user.height}cm` : unsetLabel}
            />
            <InfoRow
              label={isJa ? "居住・生活エリア" : "거주·생활 지역"}
              value={dispLocation}
            />
            <InfoRow label="MBTI" value={user.mbti ?? unsetLabel} />
            <InfoRow
              label={isJa ? "第一印象" : "첫인상"}
              value={
                user.impression
                  ? isJa
                    ? IMPRESSION_LABEL_JA[user.impression] ||
                      impressionLabelMap[user.impression]
                    : impressionLabelMap[user.impression]
                  : unsetLabel
              }
            />
            <InfoRow
              label={isJa ? "体格" : "체격"}
              value={
                user.build
                  ? isJa
                    ? BUILD_LABEL_JA[user.build] ||
                      buildLabelMap[user.build]
                    : buildLabelMap[user.build]
                  : unsetLabel
              }
            />
            <InfoRow
              label={isJa ? "喫煙の有無" : "흡연 여부"}
              value={
                user.smokingStatus
                  ? isJa
                    ? SMOKING_LABEL_JA[user.smokingStatus] ||
                      smokingLabelMap[user.smokingStatus]
                    : smokingLabelMap[user.smokingStatus]
                  : unsetLabel
              }
            />
            <InfoRow
              label={isJa ? "宗教" : "종교"}
              value={
                user.religion
                  ? isJa
                    ? RELIGION_LABEL_JA[user.religion] ||
                      religionLabelMap[user.religion]
                    : religionLabelMap[user.religion]
                  : unsetLabel
              }
            />
          </CardBox>
        </section>
      </div>
    </div>
  );
}

function PartnerVisibleProfileEditor({
  user,
  isInitialSetup,
  onCancel,
  onSaved,
}: {
  user: UserProfile;
  isInitialSetup?: boolean;
  onCancel?: () => void;
  onSaved: (patch: Partial<UserProfile>) => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";

  const [nickname, setNickname] = useState(user.nickname);
  const [department] = useState(user.department);
  const [height, setHeight] = useState(user.height > 0 ? String(user.height) : "");
  const [sido, setSido] = useState(user.location?.sido ?? "서울특별시");
  const [sigungu, setSigungu] = useState(
    user.location?.sigungu ?? (DISTRICTS_BY_SIDO["서울특별시"]?.[0] || "서대문구")
  );
  const [mbti, setMbti] = useState<string>(user.mbti ?? "");
  const [impression, setImpression] = useState<string>(user.impression ?? "");
  const [build, setBuild] = useState<string>(user.build ?? "");
  const [smokingStatus, setSmokingStatus] = useState<string>(
    user.smokingStatus ?? "NON_SMOKER"
  );
  const [religion, setReligion] = useState<string>(user.religion ?? "NONE");
  const [religionConsent, setReligionConsent] = useState(
    user.religion !== null ? true : true
  );
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    user.vibeKeywords.filter(Boolean)
  );
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(
    user.hobbies ?? []
  );
  const [voiceIntroText, setVoiceIntroText] = useState(
    user.voiceIntroText ?? ""
  );
  const [bio, setBio] = useState(user.bio ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  // 고를 수 있는 개수를 넘기면 말없이 빼지 않고, 칸을 흔들며 안내함
  const [limitHint, setLimitHint] = useState<{ group: "vibe" | "hobby"; n: number } | null>(null);
  const showLimitHint = (group: "vibe" | "hobby") => {
    setLimitHint((prev) => ({ group, n: (prev?.n ?? 0) + 1 }));
    window.setTimeout(() => {
      setLimitHint((cur) => (cur && cur.group === group ? null : cur));
    }, 2400);
  };

  const toggleVibe = (kw: string) => {
    if (selectedVibes.includes(kw)) {
      setSelectedVibes(selectedVibes.filter((x) => x !== kw));
    } else if (selectedVibes.length >= VIBE_KEYWORD_MAX) {
      showLimitHint("vibe");
    } else {
      setSelectedVibes([...selectedVibes, kw]);
    }
  };

  const toggleHobby = (hb: string) => {
    if (selectedHobbies.includes(hb)) {
      setSelectedHobbies(selectedHobbies.filter((x) => x !== hb));
    } else if (selectedHobbies.length >= HOBBY_MAX) {
      showLimitHint("hobby");
    } else {
      setSelectedHobbies([...selectedHobbies, hb]);
    }
  };

  const handleSave = () => {
    setFormError(null);
    const parsedHeight = Number(height.trim());
    if (
      !height.trim() ||
      !Number.isFinite(parsedHeight) ||
      parsedHeight < HEIGHT_MIN ||
      parsedHeight > HEIGHT_MAX
    ) {
      setFormError(
        isJa
          ? `身長（${HEIGHT_MIN}〜${HEIGHT_MAX}cm）を入力してください。`
          : `내 키(${HEIGHT_MIN}~${HEIGHT_MAX}cm)를 직접 입력해 주세요.`
      );
      return;
    }

    const loc = buildLocationValue(sido, sigungu);
    if (!loc) {
      setFormError(
        isJa ? "居住・生活エリアを選択してください。" : "거주·생활 지역을 선택해 주세요."
      );
      return;
    }

    if (!mbti) {
      setFormError(isJa ? "MBTIを選択してください。" : "내 MBTI를 선택해 주세요.");
      return;
    }

    if (!impression) {
      setFormError(
        isJa ? "第一印象を選択してください。" : "내 첫인상을 선택해 주세요."
      );
      return;
    }

    if (!build) {
      setFormError(
        isJa ? "体格を選択してください。" : "내 체격을 선택해 주세요."
      );
      return;
    }

    onSaved({
      nickname: nickname.trim() || user.nickname,
      department: department.trim() || user.department,
      height: parsedHeight,
      location: loc,
      mbti,
      impression,
      build,
      smokingStatus: smokingStatus || "NON_SMOKER",
      religion: religionConsent ? religion || "NONE" : null,
      vibeKeywords: selectedVibes,
      hobbies: selectedHobbies,
      voiceIntroText: voiceIntroText.trim(),
      bio: bio.trim(),
    });
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAF9F6]">
      <PageHeader
        title={
          isInitialSetup
            ? isJa
              ? "STEP 2 · マイプロフィール入力"
              : "STEP 2 · 내 상세 프로필 입력"
            : isJa
            ? "マイプロフィール編集"
            : "내 프로필 편집"
        }
        back={false}
      />

      <div className="animate-fade-in flex-1 space-y-5 px-5 py-6">
        <div className="rounded-3xl border border-rose-200 bg-white p-4 shadow-2xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[12px] font-bold text-rose-600">
            <Sparkles className="h-3.5 w-3.5" />
            {isInitialSetup
              ? isJa
                ? "会員登録完了！お相手に表示されるプロフィールを完成させましょう"
                : "회원가입 및 학교 인증 완료! 상대방에게 보이는 내 정보를 입력해 주세요"
              : isJa
              ? "お相手のマッチングカードに表示される情報"
              : "매칭 상대방의 프로필 카드에 표시되는 내 정보"}
          </span>
          <h2 className="mt-2 text-[19px] font-black tracking-tight text-zinc-900">
            {isJa
              ? "お相手に見える私のプロフィール情報"
              : "상대방에게 보이는 나의 정보 입력"}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
            {isJa
              ? "身長・居住エリア・MBTI・第一印象・体格・趣味・自己紹介など、マッチング相手に表示されるあなたのプロフィールを入力してください。"
              : "키, 거주지역, MBTI, 첫인상, 체격, 취미, 자기소개 등 매칭 상대방에게 보여줄 나의 정보를 모두 입력해 주세요."}
          </p>
        </div>

        {/* 1. 기본 신체 정보 및 거주지역 (필수) */}
        <section className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-4">
          <h3 className="text-[14px] font-extrabold text-zinc-900">
            {isJa ? "1. 身長・居住エリア（必須）" : "1. 내 키 및 거주·생활 지역 (필수)"}
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={FIELD_LABEL}>
                {isJa ? "身長 (cm)" : "내 키 (cm · 필수)"}
              </label>
              <input
                type="number"
                min={HEIGHT_MIN}
                max={HEIGHT_MAX}
                className={FIELD_INPUT}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={isJa ? "例: 175" : "예: 175"}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-medium text-gray-600">
                  {isJa ? "ニックネーム" : "닉네임"}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNickname((prev) => generateWittyNickname(isJa, prev));
                  }}
                  className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
                >
                  {isJa ? "🎲 おすすめ" : "🎲 자동 추천"}
                </button>
              </div>
              <input
                className={FIELD_INPUT}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL}>
              {isJa
                ? "主な居住・生活エリア（ソウル・仁川・京畿）"
                : "내 거주 · 주요 생활 지역 (서울·인천·경기)"}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <SelectField
                value={sido}
                onChange={(v) => {
                  setSido(v);
                  setSigungu(DISTRICTS_BY_SIDO[v]?.[0] ?? "");
                }}
              >
                {SIDO_LIST.map((s) => (
                  <option key={s} value={s}>
                    {isJa ? SIDO_LABEL_JA[s] || s : s}
                  </option>
                ))}
              </SelectField>
              <SelectField value={sigungu} onChange={(v) => setSigungu(v)}>
                {(DISTRICTS_BY_SIDO[sido] ?? []).map((sg) => (
                  <option key={sg} value={sg}>
                    {isJa ? SIGUNGU_LABEL_JA[sg] || sg : sg}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
        </section>

        {/* 2. MBTI · 첫인상 · 체격 · 흡연 · 종교 */}
        <section className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-4">
          <h3 className="text-[14px] font-extrabold text-zinc-900">
            {isJa
              ? "2. MBTI・第一印象・体格・ライフスタイル"
              : "2. MBTI · 첫인상 · 체격 · 라이프스타일"}
          </h3>

          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "私のMBTI（選択）" : "내 MBTI (선택)"}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {MBTI_TYPES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMbti(m)}
                  className={OptionTileClass(mbti === m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "私の第一印象（選択）" : "내 첫인상 (선택)"}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {IMPRESSION_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setImpression(value)}
                  className={OptionTileClass(impression === value)}
                >
                  {IMPRESSION_EMOJI[value]}{" "}
                  {isJa ? IMPRESSION_LABEL_JA[value] || label : label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "私の体格（選択）" : "내 체격 (선택)"}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {BUILD_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBuild(value)}
                  className={OptionTileClass(build === value)}
                >
                  {isJa ? BUILD_LABEL_JA[value] || label : label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "喫煙の有無" : "내 흡연 여부"}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SMOKING_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSmokingStatus(value)}
                  className={OptionTileClass(smokingStatus === value)}
                >
                  {isJa ? SMOKING_LABEL_JA[value] || label : label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "宗教" : "내 종교"}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {RELIGIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReligion(value)}
                  className={OptionTileClass(religion === value)}
                >
                  {isJa ? RELIGION_LABEL_JA[value] || label : label}
                </button>
              ))}
            </div>
            <div className="mt-2 rounded-xl bg-gray-50 p-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={religionConsent}
                  onChange={(e) => setReligionConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-gray-900"
                />
                <span className="text-[12px] text-gray-600">
                  {isJa
                    ? "宗教情報のプロフィール表示に同意します"
                    : RELIGION_AGREE_LABEL}
                  <span className="mt-0.5 block text-[11px] text-gray-400">
                    {isJa
                      ? "同意しない場合、宗教情報はプロフィール表示から除外されます。"
                      : RELIGION_AGREE_DETAIL}
                  </span>
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* 3. 분위기 키워드 & 취미·관심사 */}
        <section className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-4">
          <h3 className="text-[14px] font-extrabold text-zinc-900">
            {isJa
              ? "3. 雰囲気キーワード＆趣味・関心事"
              : "3. 분위기 키워드 & 취미·관심사"}
          </h3>

          <div>
            <label className={cn(FIELD_LABEL, "flex items-center justify-between")}>
              <span>
                {isJa
                  ? `私の雰囲気＆スタイルキーワード（最大${VIBE_KEYWORD_MAX}つ選択）`
                  : `${VIBE_KEYWORD_LABEL} (최대 ${VIBE_KEYWORD_MAX}개 선택)`}
              </span>
              <span className="tabular-nums text-rose-600">
                {selectedVibes.length}/{VIBE_KEYWORD_MAX}
              </span>
            </label>
            <div
              key={limitHint?.group === "vibe" ? `shake-${limitHint.n}` : "vibe"}
              className={cn("flex flex-wrap gap-1.5", limitHint?.group === "vibe" && "ondo-shake")}
            >
              {VIBE_STYLE_KEYWORDS.map((kw) => {
                const active = selectedVibes.includes(kw);
                return (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => toggleVibe(kw)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700"
                    )}
                  >
                    #{isJa ? VIBE_STYLE_LABEL_JA[kw] || kw : kw}
                  </button>
                );
              })}
            </div>
            {limitHint?.group === "vibe" && (
              <p role="status" className="animate-fade-in-up mt-1.5 text-[12px] font-semibold text-rose-600">
                {isJa
                  ? `最大${VIBE_KEYWORD_MAX}つまで選べます。先に1つ外してください。`
                  : `최대 ${VIBE_KEYWORD_MAX}개까지 고를 수 있어요. 하나를 먼저 빼 주세요.`}
              </p>
            )}
          </div>

          <div>
            <label className={cn(FIELD_LABEL, "flex items-center justify-between")}>
              <span>
                {isJa
                  ? `趣味・関心事（最大${HOBBY_MAX}つ選択）`
                  : `취미 · 관심사 (최대 ${HOBBY_MAX}개 선택)`}
              </span>
              <span className="tabular-nums text-rose-600">
                {selectedHobbies.length}/{HOBBY_MAX}
              </span>
            </label>
            <div
              key={limitHint?.group === "hobby" ? `shake-${limitHint.n}` : "hobby"}
              className={cn("flex flex-wrap gap-1.5", limitHint?.group === "hobby" && "ondo-shake")}
            >
              {HOBBIES.map((hb) => {
                const active = selectedHobbies.includes(hb);
                return (
                  <button
                    key={hb}
                    type="button"
                    onClick={() => toggleHobby(hb)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700"
                    )}
                  >
                    {isJa ? HOBBY_LABEL_JA[hb] || hb : hb}
                  </button>
                );
              })}
            </div>
            {limitHint?.group === "hobby" && (
              <p role="status" className="animate-fade-in-up mt-1.5 text-[12px] font-semibold text-rose-600">
                {isJa
                  ? `最大${HOBBY_MAX}つまで選べます。先に1つ外してください。`
                  : `최대 ${HOBBY_MAX}개까지 고를 수 있어요. 하나를 먼저 빼 주세요.`}
              </p>
            )}
          </div>
        </section>

        {/* 4. 첫인상 한 줄 노트 & 자기소개 */}
        <section className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-4">
          <h3 className="text-[14px] font-extrabold text-zinc-900">
            {isJa
              ? "4. 第一印象の一行ノート＆自己紹介"
              : "4. 첫인상 한 줄 노트 & 자기소개"}
          </h3>

          <div>
            <label className={FIELD_LABEL}>
              {isJa
                ? "第一印象＆恋愛価値観の一行メッセージ"
                : "첫인상 & 연애 가치관 한 줄 인사말"}
            </label>
            <input
              className={FIELD_INPUT}
              value={voiceIntroText}
              onChange={(e) => setVoiceIntroText(e.target.value)}
              placeholder={
                isJa
                  ? "例: 休日はカフェ巡りや展示会に行くのが好きです！楽しくお話ししましょう😊"
                  : "예: 주말엔 맛집 탐방하고 전시 보러 가는 걸 좋아해요! 편하게 대화 나눠요 😊"
              }
            />
          </div>

          <div>
            <label className={FIELD_LABEL}>
              {isJa ? "自己紹介" : "자기소개"}
            </label>
            <p className="mb-1.5 text-[12px] font-semibold text-rose-600">
              {isJa
                ? "💡 自己紹介を詳しく書くほど、相手からの好感度が高まります。"
                : "💡 자기소개를 자세히 적을수록 상대가 나에 대한 호감이 높아져요."}
            </p>
            <textarea
              className={cn(FIELD_TEXTAREA, "h-28")}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                isJa
                  ? "自己紹介を詳しく書くほど、相手からの好感度が高まります！普段の過ごし方や会話のスタイル、どんな方と出会いたいかを自由に書いてください。"
                  : "자기소개를 자세히 적을수록 상대가 나에 대한 호감이 높아져요! 평소 일상이나 취미, 대화 스타일, 어떤 분과 만나고 싶은지 자유롭게 적어 주세요."
              }
            />
          </div>
        </section>

        {formError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[12px] font-semibold text-rose-600">
            {formError}
          </div>
        )}

        <div className="flex gap-2 pt-1 pb-4">
          {onCancel && (
            <Button variant="secondary" fullWidth size="lg" onClick={onCancel}>
              {isJa ? "キャンセル" : "취소"}
            </Button>
          )}
          <Button
            fullWidth
            size="lg"
            className="bg-rose-600 hover:bg-rose-700"
            onClick={handleSave}
          >
            {isInitialSetup
              ? isJa
                ? "プロフィールを保存してラウンジを始める ✨"
                : "내 프로필 저장하고 라운지 시작하기 ✨"
              : isJa
              ? "プロフィールを保存する"
              : "프로필 저장하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. HistoryTab (Conversation Archive & Blind Chat)
// ============================================================================
export function HistoryTab({
  history,
  serverMatches = [],
  isMale = false,
  onServerChanged,
  userPoints,
  onUpdateHistory,
  onOpenHomeTab,
}: {
  history: MatchHistoryItem[];
  serverMatches?: DbMatchPartner[];
  isMale?: boolean;
  onServerChanged?: () => void;
  userPoints: number;
  onUpdateHistory: (items: MatchHistoryItem[]) => void;
  onDeductPoints: (pts: number) => void;
  onOpenHomeTab: () => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [feedbackMatchId, setFeedbackMatchId] = useState<string | null>(null);

  const selectedItem =
    history.find((m) => m.matchId === selectedMatchId) ?? null;
  const selectedServerMatch =
    serverMatches.find((m) => m.match_id === selectedMatchId) ?? null;
  const feedbackItem =
    history.find((m) => m.matchId === feedbackMatchId) ?? null;

  const getBadgeInfo = (item: MatchHistoryItem) => {
    if (item.resultStatus === "SUCCESS") {
      return item.contactUnlocked
        ? {
            label: isJa ? "連絡先公開済み" : "연락처 공개됨",
            cls: "bg-rose-50 text-rose-700",
          }
        : {
            label: isJa ? "ブラインドチャット進行中" : "블라인드 대화 진행 중",
            cls: "bg-stone-100 text-zinc-800",
          };
    }
    if (item.resultStatus === "PENDING") {
      return {
        label: isJa ? "承認待ち" : "수락 대기 중",
        cls: "bg-amber-50 text-amber-700",
      };
    }
    if (item.resultStatus === "EXPIRED" || item.escrowStatus === "REFUNDED") {
      return {
        label: isJa
          ? "応答・会話がなく自動終了"
          : "응답·대화가 없어 자동 종료",
        cls: "bg-emerald-50 text-emerald-700",
      };
    }
    return {
      label: isJa ? "パスしたマッチング" : "넘긴 매칭",
      cls: "bg-gray-100 text-gray-500",
    };
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAF9F6]">
      <PageHeader
        title={isJa ? "トーク" : "대화방"}
        back={false}
      />

      {history.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <CalendarHeart className="h-10 w-10 text-gray-300" />
          <p className="mt-4 text-[16px] font-bold text-gray-900">
            {isJa ? "まだトーク履歴がありません" : "아직 대화 기록이 없어요"}
          </p>
          <Button className="mt-5" onClick={onOpenHomeTab}>
            {isJa ? "ラウンジで今日の紹介を見る" : "라운지에서 오늘의 소개 보기"}
          </Button>
        </div>
      ) : (
        <div className="animate-fade-in flex-1 space-y-3 px-5 py-5">
          {history.map((item) => {
            const badge = getBadgeInfo(item);
            const faceEmoji =
              (item.partner.impression &&
                IMPRESSION_EMOJI[item.partner.impression]) ||
              "🙂";

            return (
              <div
                key={item.matchId}
                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setSelectedMatchId(item.matchId)}
                  className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-[20px]">
                    {faceEmoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-bold text-gray-900">
                        {item.partner.nickname}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                          badge.cls
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-gray-500">
                      {isJa ? schoolLabelJa(item.partner.school) : item.partner.school} ·{" "}
                      {isJa ? departmentLabelJa(item.partner.department) : item.partner.department} (
                      {item.matchDate.replace(/-/g, ".")})
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>

                {!item.feedbackSubmitted && (
                  <div className="border-t border-stone-100 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackMatchId(item.matchId)}
                      className="flex w-full items-center justify-between text-[12px] font-semibold text-rose-600"
                    >
                      <span>
                        {isJa
                          ? "マッチング満足度フィードバックを残す"
                          : "추천 만족도 피드백 남기기"}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Blind Chat Modal */}
      {selectedItem && (
        <Modal open onClose={() => setSelectedMatchId(null)}>
          <div
            className="flex flex-col"
            style={{ maxHeight: "calc(82vh - 2rem)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-gray-400">
                {selectedItem.matchDate.replace(/-/g, ".")}{" "}
                {isJa ? "マッチング" : "매칭"}
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[12px] font-semibold",
                  getBadgeInfo(selectedItem).cls
                )}
              >
                {getBadgeInfo(selectedItem).label}
              </span>
            </div>
            <div className="flex-1 space-y-3.5 overflow-y-auto pr-0.5">
              {selectedServerMatch &&
              ["PENDING", "CHATTING", "CONFIRMED"].includes(
                selectedServerMatch.ticket_status
              ) ? (
                <RealMatchPanel
                  matches={[selectedServerMatch]}
                  isMale={isMale}
                  ticketCount={Math.max(0, Math.floor(userPoints / 2900))}
                  onChanged={() => onServerChanged?.()}
                />
              ) : selectedItem.resultStatus === "SUCCESS" ? (
                <InAppBlindChatCard
                  partner={selectedItem.partner}
                  escrowStatus="CONFIRMED"
                />
              ) : (
                <MatchCard partner={selectedItem.partner} />
              )}
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => setSelectedMatchId(null)}
              >
                {isJa ? "閉じる" : "닫기"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Feedback Modal */}
      {feedbackItem && (
        <Modal open onClose={() => setFeedbackMatchId(null)}>
          <h3 className="text-[17px] font-bold text-gray-900">
            {isJa
              ? "今回のマッチング推薦はいかがでしたか？"
              : `${feedbackItem.partner.nickname}님 추천은 어떠셨나요?`}
          </h3>
          <p className="mt-1 text-[12px] text-gray-500">
            {isJa
              ? "選んだ感想はこの端末のトーク履歴に保存され、あとで振り返ることができます。"
              : "남겨 주신 만족도는 이 기기의 대화 기록에 저장돼서 나중에 다시 볼 수 있어요."}
          </p>
          <div className="mt-4 space-y-1.5">
            {(
              [
                {
                  code: "GOOD_VIBE",
                  ko: "😊 대화 온도와 가치관이 잘 맞았어요",
                  ja: "😊 会話の温度や価値観がよく合いました",
                  rating: 5,
                },
                {
                  code: "POLITE",
                  ko: "☕ 매너 있고 다정하게 대화했어요",
                  ja: "☕ 丁寧で優しく会話できました",
                  rating: 5,
                },
                {
                  code: "DIFF_STYLE",
                  ko: "🙂 성향이나 관심사가 조금 달랐어요",
                  ja: "🙂 性格や関心事が少し異なりました",
                  rating: 3,
                },
                {
                  code: "SLOW_REPLY",
                  ko: "⏳ 답장 템포가 다소 느렸어요",
                  ja: "⏳ 返信のテンポが少し遅めでした",
                  rating: 2,
                },
              ] as const
            ).map((r) => (
              <button
                key={r.code}
                type="button"
                onClick={() => {
                  onUpdateHistory(
                    history.map((m) =>
                      m.matchId === feedbackItem.matchId
                        ? {
                            ...m,
                            feedbackSubmitted: true,
                            feedbackRating: r.rating,
                          }
                        : m
                    )
                  );
                  setFeedbackMatchId(null);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <span>{isJa ? r.ja : r.ko}</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// 4. MyPageTab (Account & Contact Settings)
// ============================================================================
export function MyPageTab({
  user,
  kakaoId,
  onUserUpdate,
  onKakaoIdUpdate,
}: {
  user: UserProfile;
  kakaoId: string;
  onUserUpdate: (patch: Partial<UserProfile>) => void;
  onKakaoIdUpdate: (id: string) => void;
}) {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [kakaoModalOpen, setKakaoModalOpen] = useState(false);
  const [kakaoInput, setKakaoInput] = useState(kakaoId);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const editLabel = isJa ? "編集" : "편집";
  const dispSchool = isJa ? schoolLabelJa(user.school) : user.school;

  return (
    <div className="flex min-h-full flex-col bg-[#FAF9F6]">
      <PageHeader title={isJa ? "マイページ" : "내 정보"} back={false} />
      <div className="animate-fade-in flex-1 space-y-6 px-5 py-5">
        {/* Account & Pre-verified Contact (KakaoTalk ID Only) */}
        <section>
          <SectionHeader
            title={
              isJa
                ? "アカウント＆本人確認連絡先（カカオトークID）"
                : "내 계정 및 본인 확인 연락처 (카카오톡 ID)"
            }
            editLabel={editLabel}
            onEdit={() => {
              setKakaoInput(kakaoId);
              setKakaoModalOpen(true);
            }}
          />
          <CardBox>
            <InfoRow
              label={isJa ? "キャンパス所属認証" : "캠퍼스 소속 인증"}
              value={
                user.verificationStatus === "verified"
                  ? isJa
                    ? `${dispSchool} 認証完了`
                    : `${user.school} 인증 완료`
                  : user.verificationStatus === "pending_review"
                  ? isJa
                    ? `${dispSchool} 学生証確認中`
                    : `${user.school} 학생증 확인 중`
                  : user.verificationStatus === "rejected"
                  ? isJa
                    ? `${dispSchool} 学生証が却下されました`
                    : `${user.school} 학생증 반려됨`
                  : isJa
                  ? `${dispSchool} 学生認証前`
                  : `${user.school} 학생 인증 전`
              }
            />
            <div className="flex items-center justify-between py-3 text-[14px]">
              <span className="text-gray-500">
                {isJa
                  ? "安心連絡先（カカオトークID・マッチング確定後に公開）"
                  : "안심 연락처 (카카오톡 ID · 매칭 확정 후 공개)"}
              </span>
              <span className="font-medium text-gray-900">{kakaoId}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-[13px]">
              <span className="text-gray-500">
                {isJa
                  ? "ニックネーム・所属大学・学生認証の再設定"
                  : "닉네임 · 소속 대학교 · 학교 인증 다시 하기"}
              </span>
              <button
                type="button"
                onClick={() => router.push(ROUTES.JOIN)}
                className="rounded-lg bg-rose-50 px-3 py-1.5 text-[12px] font-bold text-rose-600 hover:bg-rose-100"
              >
                {isJa ? "直接入力・再認証 →" : "직접 입력 · 학교 인증 →"}
              </button>
            </div>
          </CardBox>
        </section>

        {/* Matching & Notification Switch */}
        <section>
          <SectionHeader
            title={isJa ? "マッチング＆通知設定" : "매칭 및 알림"}
          />
          <div className="space-y-2.5">
            <MatchingToggleCard
              matchingStatus={user.matchingStatus}
              onToggle={() =>
                onUserUpdate({
                  matchingStatus:
                    user.matchingStatus === "PAUSED" ? "ACTIVE" : "PAUSED",
                })
              }
            />
            <button
              type="button"
              onClick={() => router.push(ROUTES.NOTIFICATIONS)}
              className="flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
            >
              <div>
                <p className="text-[14px] font-semibold text-gray-900">
                  {isJa
                    ? "ブラインドチャット＆夜21時の通知ボックス"
                    : "블라인드 채팅 및 밤 9시 알림함"}
                </p>
                <p className="text-[12px] text-gray-500">
                  {isJa
                    ? "マッチング到着・チャット・学生認証結果のお知らせを確認します"
                    : "매칭 도착, 대화방 오픈, 학생 인증 결과 알림을 확인해요"}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-bold text-rose-600">
                {isJa ? "通知を見る →" : "알림함 보기 →"}
              </span>
            </button>
          </div>
        </section>

        {/* Rewards & Points (Moved from cluttered Home screen to Settings) */}
        <section>
          <SectionHeader
            title={isJa ? "コーヒーチケット＆友達招待" : "커피티켓 및 친구 초대"}
          />
          <CardBox>
            <button
              type="button"
              onClick={() => router.push(ROUTES.POINTS)}
              className="flex w-full items-center justify-between py-3 text-left text-[14px]"
            >
              <span className="font-medium text-gray-800">
                {BETA_UNLIMITED_TICKETS
                  ? isJa
                    ? "コーヒーチケット 無制限（ベータ）"
                    : "커피티켓 무제한 (베타)"
                  : isJa
                  ? `保有コーヒーチケット ${Math.floor(user.points / 2900)}枚`
                  : `보유 커피티켓 ${Math.floor(user.points / 2900)}장`}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.INVITE)}
              className="flex w-full items-center justify-between py-3 text-left text-[14px]"
            >
              <span className="font-medium text-gray-800">
                {isJa
                  ? "友達を招待してコーヒーチケット1枚をもらう"
                  : "친구 초대하고 커피티켓 1장(2,900원) 받기"}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </CardBox>
        </section>

        {/* Support & Policy */}
        <section>
          <SectionHeader
            title={isJa ? "サポート＆利用規約" : "고객지원 및 약관"}
          />
          <CardBox>
            <button
              type="button"
              onClick={() => router.push(ROUTES.FAQ)}
              className="flex w-full items-center justify-between py-3 text-left text-[14px] text-gray-700"
            >
              <span>
                {isJa ? "よくある質問 (FAQ)" : "자주 묻는 질문 (FAQ)"}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            <a
              href={KAKAO_OPENCHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-3 text-[14px] text-gray-700"
            >
              <span>
                {isJa
                  ? "1:1 カカオトーク顧客センター"
                  : "1:1 카카오톡 고객센터 문의"}
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
            <button
              type="button"
              onClick={() => router.push(ROUTES.SAFETY)}
              className="flex w-full items-center justify-between py-3 text-left text-[14px] text-gray-700"
            >
              <span>{isJa ? "安全ガイド" : "안전 가이드"}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.TERMS)}
              className="flex w-full items-center justify-between py-3 text-left text-[14px] text-gray-700"
            >
              <span>{isJa ? "利用規約" : "이용약관"}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.PRIVACY)}
              className="flex w-full items-center justify-between py-3 text-left text-[14px] text-gray-700"
            >
              <span>{isJa ? "プライバシーポリシー" : "개인정보 처리방침"}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </CardBox>
        </section>

        <div className="flex justify-center gap-4 pt-2 text-[12px] text-gray-400">
          <button
            type="button"
            onClick={async () => {
              await logoutEverywhere();
              router.replace("/");
            }}
            className="font-semibold text-gray-600 hover:text-gray-900"
          >
            {isJa ? "ログアウト" : "로그아웃"}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="hover:text-gray-600"
          >
            {isJa ? "退会する" : "회원 탈퇴"}
          </button>
        </div>
      </div>

      {/* Kakao ID Contact Modal */}
      <Modal open={kakaoModalOpen} onClose={() => setKakaoModalOpen(false)}>
        <h3 className="text-[17px] font-bold text-gray-900">
          {isJa
            ? "安心連絡先（カカオトークID）の変更"
            : "안심 연락처 (카카오톡 ID) 변경"}
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
          {isJa
            ? "運営チームがマッチングを確定した相手にのみ公開されます。相手が検索できるよう、カカオトークの［設定 → プロフィール管理 → ID検索を許可］をオンにしてください。"
            : "운영팀이 확정한 매칭 상대에게만 공개돼요. 상대가 검색할 수 있도록 카카오톡 [설정 → 프로필 관리 → ID 검색 허용]을 꼭 켜 주세요."}
        </p>

        <div className="mt-4 flex gap-2">
          <input
            className={FIELD_INPUT}
            value={kakaoInput}
            onChange={(e) => setKakaoInput(e.target.value)}
            placeholder={
              isJa ? "カカオトークIDを入力" : "카카오톡 ID 입력"
            }
          />
        </div>


        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => setKakaoModalOpen(false)}
          >
            {isJa ? "キャンセル" : "취소"}
          </Button>
          <Button
            fullWidth
            size="lg"
            disabled={kakaoInput.trim().length < 2}
            onClick={() => {
              onKakaoIdUpdate(kakaoInput.trim());
              setKakaoModalOpen(false);
            }}
          >
            {isJa ? "保存する" : "저장하기"}
          </Button>
        </div>
      </Modal>

      {/* ONDO Account & Data Deletion Modal */}
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)}>
        <h3 className="text-[17px] font-bold text-zinc-900">
          {isJa
            ? "ONDO 36.5° アカウントおよび個人情報削除の案内"
            : "ONDO 36.5° 계정 및 개인정보 즉시 파기 안내"}
        </h3>
        <div className="mt-3 space-y-2 rounded-2xl border border-stone-200 bg-white p-4 text-[12px] leading-relaxed text-zinc-600">
          <p className="font-bold text-zinc-900">
            {isJa
              ? "退会時に即時削除される項目："
              : "탈퇴 즉시 복구 불가능하게 파기되는 항목:"}
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              {isJa
                ? "学生証写真・大学メール認証記録およびカカオ連携情報"
                : "학교 웹메일·학생증 인증 기록 및 카카오 로그인 연동 정보"}
            </li>
            <li>
              {isJa
                ? "価値観ノート・ブラインドチャット履歴・マッチング記録"
                : "작성한 가치관 노트, 24h 블라인드 대화 내역 및 매칭 기록"}
            </li>
            <li>
              {isJa
                ? `現在保有中のエスクロー・コーヒーチケット (${Math.floor(user.points / 2900)}枚)`
                : `현재 보유 중인 에스크로 커피티켓 (${Math.floor(user.points / 2900)}장)`}
            </li>
          </ul>
        </div>
        <div className="mt-5 flex gap-2">
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => setWithdrawOpen(false)}
          >
            {isJa ? "キャンセル" : "취소"}
          </Button>
          <Button
            variant="destructive"
            fullWidth
            size="lg"
            loading={deleting}
            onClick={async () => {
              const ok = window.confirm(
                isJa
                  ? "本当にアカウントを削除しますか？すべてのデータが直ちに破棄されます。"
                  : "정말 계정을 삭제할까요? 모든 인증 정보와 보유 티켓이 즉시 파기됩니다."
              );
              if (!ok) return;
              setDeleting(true);
              const done = await deleteMyAccount();
              setDeleting(false);
              if (!done) {
                window.alert(
                  isJa
                    ? "退会処理に失敗しました。カカオ1:1相談室へご連絡ください。"
                    : "탈퇴 처리에 실패했어요. 카톡 고객센터로 문의해 주세요."
                );
                return;
              }
              setWithdrawOpen(false);
              router.replace("/");
            }}
          >
            {isJa ? "アカウントを完全に削除する" : "계정 및 정보 영구 삭제"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

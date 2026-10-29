"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Coffee,
  Copy,
  Languages,
  Lock,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import {
  BETA_UNLIMITED_TICKETS,
  BUILD_TYPES,
  IMPRESSION_TYPES,
  RELIGIONS,
  ROUTES,
  SMOKING_STATUSES,
} from "@/lib/ondo-constants";
import {
  BUILD_LABEL_JA,
  departmentLabelJa,
  HOBBY_LABEL_JA,
  IMPRESSION_LABEL_JA,
  locationLabelJa,
  needsTranslation,
  RELIGION_LABEL_JA,
  schoolLabelJa,
  SMOKING_LABEL_JA,
  translateKoJa,
  useAppLocale,
  VIBE_STYLE_LABEL_JA,
} from "@/lib/i18n";
import {
  DbMatchMessage,
  DbMatchPartner,
  listMatchMessages,
  respondMatch,
  sendMatchMessage,
} from "@/lib/supabase";
import { Button, Modal, cn } from "@/components/ondo-ui";
import { ConfettiBurst, HeartBurst, useCelebrateOnce } from "@/components/celebrate";

const ACTIVE_STATUSES = ["PENDING", "CHATTING", "CONFIRMED"];
const POLL_MS = 4000;

const buildLabelMap = Object.fromEntries(
  BUILD_TYPES.map((b) => [b.value, b.label])
);
const impressionLabelMap = Object.fromEntries(
  IMPRESSION_TYPES.map((i) => [i.value, i.label])
);
const smokingLabelMap = Object.fromEntries(
  SMOKING_STATUSES.map((s) => [s.value, s.label])
);
const religionLabelMap = Object.fromEntries(
  RELIGIONS.map((r) => [r.value, r.label])
);

export function isActiveMatch(m: DbMatchPartner) {
  if (m.ticket_status === "PENDING" || m.ticket_status === "CHATTING") {
    return true;
  }
  if (m.ticket_status === "CONFIRMED") {
    // 연락처 공개(CONFIRMED)된 매칭은 36시간 동안 홈 화면에도 표시하고, 이후에는 대화방 탭에서 언제든 열람
    const createdMs = m.created_at ? Date.parse(m.created_at) : NaN;
    if (Number.isNaN(createdMs)) return true;
    return Date.now() - createdMs < 36 * 60 * 60 * 1000;
  }
  return false;
}

/**
 * 실제 매칭 진행 화면: 수락/패스 → (둘 다 수락) 서버 저장 채팅 → 대화 조건 충족 시 연락처 공개
 */
export function RealMatchPanel({
  matches,
  isMale,
  ticketCount,
  onChanged,
}: {
  matches: DbMatchPartner[];
  isMale: boolean;
  ticketCount: number;
  /** 수락·패스·메시지 후 매칭 목록과 티켓 수를 다시 불러옴 */
  onChanged: () => void;
}) {
  const active = matches.filter(isActiveMatch);
  const hasPending = active.some((m) => m.ticket_status === "PENDING");

  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(() => {
      onChanged();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [hasPending, onChanged]);

  if (active.length === 0) return null;
  return (
    <div className="space-y-4">
      {active.map((m) => (
        <MatchCardReal
          key={m.match_id}
          match={m}
          isMale={isMale}
          ticketCount={ticketCount}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}

function MatchCardReal({
  match,
  isMale,
  ticketCount,
  onChanged,
}: {
  match: DbMatchPartner;
  isMale: boolean;
  ticketCount: number;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showTranslatedProfile, setShowTranslatedProfile] = useState(false);
  const [translatingProfile, setTranslatingProfile] = useState(false);
  const [translatedVoiceIntro, setTranslatedVoiceIntro] = useState<string | null>(
    null
  );
  const [translatedBio, setTranslatedBio] = useState<string | null>(null);
  // 넘기기 확인은 인터넷 창 기본 확인 상자 대신 화면 아래에서 올라오는 선택 창으로
  const [passSheetOpen, setPassSheetOpen] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  // [1] 새 매칭이 처음 보일 때 한 번만 카드가 뒤집히며 등장
  const seenKey = `ondo_seen_match_${match.match_id}`;
  const [flipIn] = useState(() => {
    if (match.ticket_status !== "PENDING") return false;
    try {
      return window.localStorage.getItem(seenKey) !== "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!flipIn) return;
    try {
      window.localStorage.setItem(seenKey, "1");
    } catch {
      // ignore
    }
  }, [flipIn, seenKey]);
  // [3] 서로 수락해서 대화방이 열린 순간 한 번만 축하
  const celebrateChat = useCelebrateOnce(
    `ondo_celebrated_chat_${match.match_id}`,
    match.ticket_status === "CHATTING" && !match.contact
  );

  const respond = async (accept: boolean) => {
    setPassSheetOpen(false);
    setBusy(true);
    setMsg(null);
    const r = await respondMatch(match.match_id, accept);
    setBusy(false);
    if (!r.ok) {
      setMsg(
        r.error === "no_tickets"
          ? isJa
            ? "コーヒーチケットが足りません。チャージしてからもう一度お試しください。"
            : "커피티켓이 부족해요. 충전한 뒤 다시 수락해 주세요."
          : r.error === "closed"
          ? isJa
            ? "このマッチングはすでに終了しました。"
            : "이미 끝난 매칭이에요."
          : isJa
          ? "処理に失敗しました。もう一度お試しください。"
          : "처리에 실패했어요. 다시 시도해 주세요."
      );
      return;
    }
    if (accept) {
      // 하트가 떠오르는 모습을 잠깐 보여 준 뒤 다음 화면(대기·대화방)으로 넘어감
      setHeartBurst(true);
      window.setTimeout(() => {
        setHeartBurst(false);
        onChanged();
      }, 900);
      return;
    }
    onChanged();
  };

  const extra = match.profile_extra ?? undefined;
  const voiceIntroText = extra?.voiceIntroText?.trim() || "";
  const bioText = match.bio?.trim() || "";
  const canTranslateProfile =
    needsTranslation(voiceIntroText, locale) ||
    needsTranslation(bioText, locale);

  const handleToggleProfileTranslate = async () => {
    if (showTranslatedProfile) {
      setShowTranslatedProfile(false);
      return;
    }
    setTranslatingProfile(true);
    try {
      const [nextIntro, nextBio] = await Promise.all([
        needsTranslation(voiceIntroText, locale)
          ? translateKoJa(voiceIntroText, locale)
          : Promise.resolve(null),
        needsTranslation(bioText, locale)
          ? translateKoJa(bioText, locale)
          : Promise.resolve(null),
      ]);
      setTranslatedVoiceIntro(nextIntro);
      setTranslatedBio(nextBio);
      setShowTranslatedProfile(true);
    } finally {
      setTranslatingProfile(false);
    }
  };
  const vibeKeywords = Array.isArray(extra?.vibeKeywords)
    ? extra.vibeKeywords
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (isJa ? VIBE_STYLE_LABEL_JA[s] || s : s))
    : [];
  const impressionLabel = extra?.impression
    ? isJa
      ? IMPRESSION_LABEL_JA[extra.impression] ||
        impressionLabelMap[extra.impression]
      : impressionLabelMap[extra.impression]
    : null;
  const buildLabel = extra?.build
    ? isJa
      ? BUILD_LABEL_JA[extra.build] || buildLabelMap[extra.build]
      : buildLabelMap[extra.build]
    : null;
  const smokingLabel = extra?.smokingStatus
    ? isJa
      ? SMOKING_LABEL_JA[extra.smokingStatus] ||
        smokingLabelMap[extra.smokingStatus]
      : smokingLabelMap[extra.smokingStatus]
    : null;
  const religionLabel = extra?.religion
    ? isJa
      ? RELIGION_LABEL_JA[extra.religion] || religionLabelMap[extra.religion]
      : religionLabelMap[extra.religion]
    : null;

  const partnerMeta = [
    isJa ? schoolLabelJa(match.univ) : match.univ,
    match.major && isJa ? departmentLabelJa(match.major) : match.major,
    match.age ? `${match.age}${isJa ? "歳" : "세"}` : null,
    match.height ? `${match.height}cm` : null,
    match.mbti,
    impressionLabel,
    buildLabel,
    smokingLabel,
    religionLabel,
    match.location_label && isJa
      ? locationLabelJa(match.location_label)
      : match.location_label,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xs",
        flipIn && "ondo-card-flip"
      )}
    >
      {celebrateChat && (
        <ConfettiBurst
          title={isJa ? "お互いにOKしました！🎉" : "서로 수락했어요! 🎉"}
          subtitle={isJa ? "チャットルームが開きました。まずは挨拶から。" : "대화방이 열렸어요. 가볍게 인사부터 해 보세요."}
        />
      )}
      <div className="border-b border-stone-100 bg-rose-50/50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[12px] font-bold text-white">
            {match.ticket_status === "PENDING"
              ? isJa
                ? "新しいマッチング"
                : "새 매칭 도착"
              : match.ticket_status === "CHATTING"
              ? isJa
                ? "ブラインドチャット中"
                : "블라인드 대화 중"
              : isJa
              ? "連絡先公開済み"
              : "연락처 공개됨"}
          </span>

          {canTranslateProfile && (
            <button
              type="button"
              disabled={translatingProfile}
              onClick={handleToggleProfileTranslate}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-rose-600 shadow-2xs transition-colors hover:bg-rose-50 disabled:opacity-60"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>
                {translatingProfile
                  ? isJa
                    ? "翻訳中..."
                    : "번역 중..."
                  : showTranslatedProfile
                  ? isJa
                    ? "原文のみ見る"
                    : "원문만 보기"
                  : isJa
                  ? "🇰🇷→🇯🇵 日本語に翻訳して見る・Google翻訳"
                  : "🇯🇵→🇰🇷 한국어로 번역 보기 · 구글 번역"}
              </span>
            </button>
          )}
        </div>
        <h3 className="mt-2 text-[18px] font-extrabold text-zinc-900">
          {match.nickname}
        </h3>
        <p className="mt-0.5 text-[13px] text-zinc-600">{partnerMeta}</p>
        {voiceIntroText && (
          <div className="mt-3 rounded-2xl border border-rose-100 bg-white/90 px-3.5 py-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
              <Sparkles className="h-3 w-3" />
              {isJa ? "第一印象・価値観の一行ノート" : "첫인상 · 연애 가치관 한 줄 노트"}
            </span>
            <p className="mt-1 text-[13px] font-semibold leading-relaxed text-zinc-800">
              &ldquo;{voiceIntroText}&rdquo;
            </p>
            {showTranslatedProfile && translatedVoiceIntro && (
              <p className="mt-1.5 border-t border-rose-100 pt-1.5 text-[13px] font-medium leading-relaxed text-rose-700">
                <span className="mr-1.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600">
                  {isJa ? "日本語訳" : "한국어 번역"}
                </span>
                &ldquo;{translatedVoiceIntro}&rdquo;
              </p>
            )}
          </div>
        )}
        {bioText && (
          <div className="mt-2">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
              {bioText}
            </p>
            {showTranslatedProfile && translatedBio && (
              <div className="mt-1.5 rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 text-[13px] leading-relaxed text-zinc-800">
                <span className="mr-1.5 inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600">
                  <Languages className="h-2.5 w-2.5" />
                  {isJa ? "自己紹介の日本語訳" : "자기소개 한국어 번역"}
                </span>
                <span className="whitespace-pre-wrap">{translatedBio}</span>
              </div>
            )}
          </div>
        )}
        {vibeKeywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {vibeKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-rose-100/70 px-2.5 py-0.5 text-[11px] font-bold text-rose-700"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}
        {match.hobbies && match.hobbies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {match.hobbies.slice(0, 6).map((h) => (
              <span
                key={h}
                className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-zinc-700 ring-1 ring-stone-200"
              >
                {isJa ? HOBBY_LABEL_JA[h] || h : h}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 px-5 py-4">
        {match.ticket_status === "PENDING" && match.my_response === "PENDING" && (
          <>
            <p className="text-[13px] leading-relaxed text-zinc-600">
              {isMale && BETA_UNLIMITED_TICKETS
                ? isJa
                  ? "ベータ期間中はコーヒーチケットなしで無料で承認できます。"
                  : "베타 기간에는 커피티켓 없이 무료로 수락할 수 있어요."
                : isMale
                ? isJa
                  ? `承認するとコーヒーチケット1枚が使用されます（保有 ${ticketCount}枚）。相手が24時間以内に応答しない場合は自動で返還されます。`
                  : `수락하면 커피티켓 1장이 사용돼요 (보유 ${ticketCount}장). 상대가 24시간 안에 응답하지 않으면 자동으로 돌려받아요.`
                : isJa
                ? "女性会員は無料で承認できます。"
                : "여성 회원은 무료로 수락할 수 있어요."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" fullWidth disabled={busy} onClick={() => setPassSheetOpen(true)}>
                {isJa ? "パス" : "넘기기"}
              </Button>
              {isMale && !BETA_UNLIMITED_TICKETS && ticketCount < 1 ? (
                <Button variant="destructive" size="lg" fullWidth onClick={() => router.push(ROUTES.POINTS)}>
                  <Coffee className="h-4 w-4" />
                  {isJa ? "チケットをチャージ" : "티켓 충전하기"}
                </Button>
              ) : (
                <div className="relative">
                  {heartBurst && <HeartBurst />}
                  <Button variant="destructive" size="lg" fullWidth loading={busy} onClick={() => respond(true)}>
                    {isMale
                      ? isJa
                        ? "承認する（1枚）"
                        : "수락하기 (1장)"
                      : isJa
                      ? "承認する"
                      : "수락하기"}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {match.ticket_status === "PENDING" && match.my_response === "ACCEPT" && (
          <p className="animate-fade-in-up rounded-2xl bg-stone-50 px-4 py-3 text-[13px] text-zinc-600">
            {isJa
              ? "承認しました！お相手の返事を待っています。お相手も承認するとチャットが開きます。"
              : "수락했어요! 상대방의 응답을 기다리는 중이에요. 상대도 수락하면 대화방이 열려요."}
          </p>
        )}

        {(match.ticket_status === "CHATTING" || match.ticket_status === "CONFIRMED") && (
          <MatchChat match={match} onChanged={onChanged} />
        )}

        {msg && <p className="text-[12px] font-semibold text-rose-600">{msg}</p>}
      </div>

      <Modal open={passSheetOpen} onClose={() => setPassSheetOpen(false)}>
        <h3 className="text-[17px] font-black text-zinc-900">
          {isJa
            ? `${match.nickname}さんとのマッチングをパスしますか？`
            : `${match.nickname}님과의 매칭을 넘길까요?`}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
          {isJa
            ? "パスすると元に戻せません。次の紹介は毎晩21時に届きます。"
            : "넘기면 되돌릴 수 없어요. 다음 소개는 매일 밤 9시에 도착해요."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="lg" fullWidth onClick={() => setPassSheetOpen(false)}>
            {isJa ? "戻る" : "돌아가기"}
          </Button>
          <Button variant="destructive" size="lg" fullWidth loading={busy} onClick={() => respond(false)}>
            {isJa ? "パスする" : "넘기기"}
          </Button>
        </div>
      </Modal>
    </section>
  );
}

function MatchChat({
  match,
  onChanged,
}: {
  match: DbMatchPartner;
  onChanged: () => void;
}) {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const [messages, setMessages] = useState<DbMatchMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // 처음 불러온 이후에 새로 도착한 메시지만 살짝 튀어나오게 표시
  const [freshIds, setFreshIds] = useState<Set<number>>(() => new Set());
  const firstLoadDoneRef = useRef(false);
  // [5] 카톡 아이디가 공개된 순간 한 번만 축하
  const celebrateContact = useCelebrateOnce(
    `ondo_celebrated_contact_${match.match_id}`,
    !!match.contact
  );
  // 대화 번역은 기본으로 꺼 둠 — 켜면 상대 메시지가 외부 번역 서비스(구글 번역)로 전송되므로 본인이 직접 켜야 함
  const [autoTranslateChat, setAutoTranslateChat] = useState(false);
  const autoTranslateRef = useRef(false);
  // 한 번 번역을 시도한 메시지는 실패해도 다시 보내지 않음 (외부 요청이 반복되지 않게)
  const translateTriedRef = useRef<Set<number>>(new Set());
  const [translatedMsgMap, setTranslatedMsgMap] = useState<Record<number, string>>(
    {}
  );
  const [translatingMsgIds, setTranslatingMsgIds] = useState<Record<number, boolean>>(
    {}
  );
  const lastIdRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const contactShownRef = useRef(!!match.contact);

  // 번역이 켜져 있을 때만, 아직 시도하지 않은 상대 메시지를 번역
  const translateMessages = useCallback(
    (list: DbMatchMessage[]) => {
      for (const m of list) {
        if (m.mine || !needsTranslation(m.body, locale)) continue;
        if (translateTriedRef.current.has(m.id)) continue;
        translateTriedRef.current.add(m.id);
        setTranslatingMsgIds((prev) => ({ ...prev, [m.id]: true }));
        translateKoJa(m.body, locale)
          .then((res) => {
            if (res && res !== m.body.trim()) {
              setTranslatedMsgMap((prev) => ({ ...prev, [m.id]: res }));
            }
          })
          .catch(() => {})
          .finally(() => {
            setTranslatingMsgIds((prev) => ({ ...prev, [m.id]: false }));
          });
      }
    },
    [locale]
  );

  const toggleAutoTranslate = () => {
    const next = !autoTranslateChat;
    autoTranslateRef.current = next;
    setAutoTranslateChat(next);
    if (next) translateMessages(messages);
  };

  const load = useCallback(async () => {
    const fresh = await listMatchMessages(match.match_id, lastIdRef.current);
    if (fresh.length === 0) {
      // 첫 불러오기가 비어 있어도 "처음 불러옴"으로 기록해서, 그 뒤 도착한 메시지는 튀어나오게 함
      firstLoadDoneRef.current = true;
      return;
    }
    lastIdRef.current = fresh[fresh.length - 1].id;
    setMessages((prev) => [...prev, ...fresh]);
    if (firstLoadDoneRef.current) {
      setFreshIds((prev) => {
        const next = new Set(prev);
        fresh.forEach((m) => next.add(m.id));
        return next;
      });
    }
    firstLoadDoneRef.current = true;
    if (autoTranslateRef.current) translateMessages(fresh);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }, [match.match_id, translateMessages]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      load();
      // 상대 메시지로 대화 조건이 채워졌는지 확인하려고 매칭 정보도 가끔 새로 불러옴
      if (!contactShownRef.current) onChanged();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [load, onChanged]);

  useEffect(() => {
    contactShownRef.current = !!match.contact;
  }, [match.contact]);

  const mineCount = messages.filter((m) => m.mine).length;
  const theirCount = messages.length - mineCount;
  // [4] 카톡 공개 조건: 각자 2번 이상, 합쳐서 5번 이상
  const progressRows = [
    { label: isJa ? "自分" : "나", value: Math.min(mineCount, 2), max: 2 },
    { label: isJa ? "お相手" : "상대", value: Math.min(theirCount, 2), max: 2 },
    { label: isJa ? "合計" : "합계", value: Math.min(messages.length, 5), max: 5 },
  ];

  const send = async () => {
    const body = input.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const r = await sendMatchMessage(match.match_id, body);
    setSending(false);
    if (!r.ok) {
      setError(
        r.error === "too_many"
          ? isJa
            ? "送信が速すぎます。少し待ってから送ってください。"
            : "너무 빠르게 보내고 있어요. 잠시 후 보내 주세요."
          : r.error === "closed"
          ? isJa
            ? "このチャットは終了しました。"
            : "끝난 대화방이에요."
          : isJa
          ? "送信に失敗しました。"
          : "전송에 실패했어요."
      );
      return;
    }
    setInput("");
    await load();
    onChanged();
  };

  const copyContact = async () => {
    if (!match.contact) return;
    try {
      await navigator.clipboard.writeText(match.contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      {celebrateContact && (
        <ConfettiBurst
          title={isJa ? "カカオトークIDが公開されました！🎉" : "카톡 아이디가 공개됐어요! 🎉"}
          subtitle={isJa ? "コピーしてカカオトークで連絡してみましょう。" : "복사해서 카톡으로 먼저 연락해 보세요."}
        />
      )}
      {match.contact ? (
        <div className="ondo-pop-box flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-rose-600">
              {isJa ? "お相手のカカオトークID" : "상대방 카카오톡 ID"}
            </p>
            <p className="truncate font-mono text-[16px] font-extrabold text-zinc-900">
              {match.contact}
            </p>
          </div>
          <button
            type="button"
            onClick={copyContact}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-[12px] font-bold text-zinc-800 ring-1 ring-stone-200 transition-transform active:scale-95",
              !copied && "ondo-attention-ring"
            )}
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? (isJa ? "コピー済み" : "복사됨") : isJa ? "コピー" : "복사"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-stone-50 px-4 py-3">
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-zinc-600">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {isJa
              ? "お互いに2回以上・合計5回以上会話すると、カカオトークIDが公開されます。"
              : "서로 2번 이상, 합쳐서 5번 이상 대화하면 카카오톡 ID가 공개돼요."}
          </p>
          {mineCount === 0 && (
            <p className="mt-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-[11.5px] font-bold text-amber-800">
              {isJa
                ? "⏱️ チャットが開いてから24時間以内に最初のメッセージを送らない場合、次回3回分のマッチングが制限されます。"
                : "⏱️ 대화방이 열린 뒤 24시간 내 첫 답장을 보내지 않으면 다음 3번의 매칭이 제한돼요."}
            </p>
          )}
          <div className="mt-2.5 space-y-1.5">
            {progressRows.map((row) => {
              const done = row.value >= row.max;
              return (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="w-9 shrink-0 text-[11px] font-bold text-zinc-500">{row.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200/80">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500 ease-out",
                        done ? "bg-emerald-500" : "bg-rose-500"
                      )}
                      style={{ width: `${(row.value / row.max) * 100}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-9 shrink-0 text-right text-[11px] font-extrabold tabular-nums",
                      done ? "text-emerald-600" : "text-zinc-500"
                    )}
                  >
                    {row.value}/{row.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-zinc-400">
          {isJa
            ? "🇰🇷↔🇯🇵 韓国語メッセージの翻訳サポート"
            : "🇯🇵↔🇰🇷 일본어 메시지 실시간 번역 지원"}
        </span>
        <button
          type="button"
          onClick={toggleAutoTranslate}
          aria-pressed={autoTranslateChat}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
            autoTranslateChat
              ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
              : "bg-stone-100 text-zinc-500"
          )}
        >
          <Languages className="h-3 w-3" />
          <span>
            {autoTranslateChat
              ? isJa
                ? "自動翻訳 ON"
                : "자동 번역 켜짐"
              : isJa
              ? "自動翻訳 OFF"
              : "자동 번역 꺼짐"}
          </span>
        </button>
      </div>
      <p className="px-1 text-[10.5px] leading-snug text-zinc-400">
        {isJa
          ? "翻訳をオンにすると、お相手のメッセージが翻訳のためGoogle翻訳（米国）に送信されます。"
          : "번역을 켜면 상대 메시지가 번역을 위해 구글 번역(미국)으로 전송돼요."}
      </p>

      <div
        ref={listRef}
        className="max-h-80 min-h-32 space-y-2 overflow-y-auto rounded-2xl bg-[#FAF9F6] p-3"
      >
        {messages.length === 0 ? (
          <p className="flex items-center justify-center gap-1.5 py-8 text-[13px] text-zinc-400">
            <MessageCircle className="h-4 w-4" />
            {isJa ? "最初のメッセージを送ってみましょう" : "첫 메시지를 보내 보세요"}
          </p>
        ) : (
          messages.map((m) => {
            const msgNeedsTrans = !m.mine && needsTranslation(m.body, locale);
            const translatedText = translatedMsgMap[m.id];
            const isTranslating = !!translatingMsgIds[m.id];
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col",
                  m.mine ? "items-end" : "items-start",
                  freshIds.has(m.id) && "animate-fade-in-up"
                )}
              >
                <div
                  className={cn(
                    "max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed",
                    m.mine
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-900 ring-1 ring-stone-200"
                  )}
                >
                  <p>{m.body}</p>
                  {!m.mine && translatedText && (
                    <p className="mt-1.5 border-t border-stone-100 pt-1.5 text-[13px] font-medium text-rose-700">
                      <span className="mr-1 rounded bg-rose-50 px-1 py-0.5 text-[10px] font-extrabold text-rose-600">
                        {isJa ? "翻訳" : "번역"}
                      </span>
                      {translatedText}
                    </p>
                  )}
                </div>
                {msgNeedsTrans && !translatedText && (
                  <button
                    type="button"
                    disabled={isTranslating}
                    onClick={() => {
                      // 직접 누른 경우에는 예전에 실패한 메시지도 다시 시도
                      translateTriedRef.current.delete(m.id);
                      translateMessages([m]);
                    }}
                    className="mt-1 inline-flex items-center gap-1 px-1.5 text-[11px] font-bold text-rose-600 hover:underline disabled:opacity-50"
                  >
                    <Languages className="h-3 w-3" />
                    <span>
                      {isTranslating
                        ? isJa
                          ? "翻訳中..."
                          : "번역 중..."
                        : isJa
                        ? "日本語に翻訳"
                        : "한국어로 번역 보기"}
                    </span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="h-12 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-4 text-[14px] outline-none focus:border-rose-400"
          value={input}
          maxLength={500}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={isJa ? "メッセージを入力" : "메시지 입력"}
        />
        <Button size="lg" variant="destructive" className="shrink-0" loading={sending} onClick={send}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-[12px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

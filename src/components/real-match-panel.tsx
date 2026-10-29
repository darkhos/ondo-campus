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
import { Button, cn } from "@/components/ondo-ui";

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
  return ACTIVE_STATUSES.includes(m.ticket_status);
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

  const respond = async (accept: boolean) => {
    if (!accept && !window.confirm(isJa ? "このマッチングをパスしますか？" : "이 매칭을 넘길까요? 되돌릴 수 없어요.")) return;
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
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xs">
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
                  ? "🇰🇷→🇯🇵 日本語に翻訳して見る"
                  : "🇯🇵→🇰🇷 한국어로 번역 보기"}
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
              {isMale
                ? isJa
                  ? `承認するとコーヒーチケット1枚が使用されます（保有 ${ticketCount}枚）。相手が24時間以内に応答しない場合は自動で返還されます。`
                  : `수락하면 커피티켓 1장이 사용돼요 (보유 ${ticketCount}장). 상대가 24시간 안에 응답하지 않으면 자동으로 돌려받아요.`
                : isJa
                ? "女性会員は無料で承認できます。"
                : "여성 회원은 무료로 수락할 수 있어요."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" fullWidth disabled={busy} onClick={() => respond(false)}>
                {isJa ? "パス" : "넘기기"}
              </Button>
              {isMale && ticketCount < 1 ? (
                <Button variant="destructive" size="lg" fullWidth onClick={() => router.push(ROUTES.POINTS)}>
                  <Coffee className="h-4 w-4" />
                  {isJa ? "チケットをチャージ" : "티켓 충전하기"}
                </Button>
              ) : (
                <Button variant="destructive" size="lg" fullWidth loading={busy} onClick={() => respond(true)}>
                  {isMale
                    ? isJa
                      ? "承認する（1枚）"
                      : "수락하기 (1장)"
                    : isJa
                    ? "承認する"
                    : "수락하기"}
                </Button>
              )}
            </div>
          </>
        )}

        {match.ticket_status === "PENDING" && match.my_response === "ACCEPT" && (
          <p className="rounded-2xl bg-stone-50 px-4 py-3 text-[13px] text-zinc-600">
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
  const [autoTranslateChat, setAutoTranslateChat] = useState(true);
  const [translatedMsgMap, setTranslatedMsgMap] = useState<Record<number, string>>(
    {}
  );
  const [translatingMsgIds, setTranslatingMsgIds] = useState<Record<number, boolean>>(
    {}
  );
  const lastIdRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const contactShownRef = useRef(!!match.contact);

  const translateSingleMessage = useCallback(
    async (msgItem: DbMatchMessage) => {
      if (translatedMsgMap[msgItem.id] || translatingMsgIds[msgItem.id]) return;
      setTranslatingMsgIds((prev) => ({ ...prev, [msgItem.id]: true }));
      try {
        const res = await translateKoJa(msgItem.body, locale);
        if (res && res !== msgItem.body.trim()) {
          setTranslatedMsgMap((prev) => ({ ...prev, [msgItem.id]: res }));
        }
      } finally {
        setTranslatingMsgIds((prev) => ({ ...prev, [msgItem.id]: false }));
      }
    },
    [locale, translatedMsgMap, translatingMsgIds]
  );

  useEffect(() => {
    if (!autoTranslateChat) return;
    for (const m of messages) {
      if (!m.mine && needsTranslation(m.body, locale) && !translatedMsgMap[m.id]) {
        translateSingleMessage(m);
      }
    }
  }, [autoTranslateChat, messages, locale, translatedMsgMap, translateSingleMessage]);

  const load = useCallback(async () => {
    const fresh = await listMatchMessages(match.match_id, lastIdRef.current);
    if (fresh.length === 0) return;
    lastIdRef.current = fresh[fresh.length - 1].id;
    setMessages((prev) => [...prev, ...fresh]);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }, [match.match_id]);

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
      {match.contact ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3">
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
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-[12px] font-bold text-zinc-800 ring-1 ring-stone-200"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? (isJa ? "コピー済み" : "복사됨") : isJa ? "コピー" : "복사"}
          </button>
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-2xl bg-stone-50 px-4 py-3 text-[12px] leading-relaxed text-zinc-600">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {isJa
            ? `お互いに2回以上・合計5回以上会話すると、カカオトークIDが公開されます。（自分 ${mineCount} · 相手 ${theirCount}）`
            : `서로 2번 이상, 합쳐서 5번 이상 대화하면 카카오톡 ID가 공개돼요. (나 ${mineCount} · 상대 ${theirCount})`}
        </p>
      )}

      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-zinc-400">
          {isJa
            ? "🇰🇷↔🇯🇵 韓国語メッセージの翻訳サポート"
            : "🇯🇵↔🇰🇷 일본어 메시지 실시간 번역 지원"}
        </span>
        <button
          type="button"
          onClick={() => setAutoTranslateChat((v) => !v)}
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
                  m.mine ? "items-end" : "items-start"
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
                    onClick={() => translateSingleMessage(m)}
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

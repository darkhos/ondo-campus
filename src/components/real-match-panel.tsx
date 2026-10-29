"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Copy, Lock, MessageCircle, Send } from "lucide-react";
import { ROUTES } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
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

  const partnerMeta = [
    match.univ,
    match.major,
    match.age ? `${match.age}${isJa ? "歳" : "세"}` : null,
    match.height ? `${match.height}cm` : null,
    match.mbti,
    match.location_label,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xs">
      <div className="border-b border-stone-100 bg-rose-50/50 px-5 py-4">
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
        <h3 className="mt-2 text-[18px] font-extrabold text-zinc-900">
          {match.nickname}
        </h3>
        <p className="mt-0.5 text-[13px] text-zinc-600">{partnerMeta}</p>
        {match.bio && (
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700">
            {match.bio}
          </p>
        )}
        {match.hobbies && match.hobbies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {match.hobbies.slice(0, 6).map((h) => (
              <span
                key={h}
                className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-zinc-700 ring-1 ring-stone-200"
              >
                {h}
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
  const lastIdRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const contactShownRef = useRef(!!match.contact);

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
          messages.map((m) => (
            <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <span
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed",
                  m.mine ? "bg-zinc-900 text-white" : "bg-white text-zinc-900 ring-1 ring-stone-200"
                )}
              >
                {m.body}
              </span>
            </div>
          ))
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

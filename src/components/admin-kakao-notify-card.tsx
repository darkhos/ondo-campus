"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const KAKAO_NOTIFY_FUNCTION_URL =
  "https://ofnechamnjafsjmuydpl.supabase.co/functions/v1/ondo-kakao-notify";

// 운영자 카톡 알림("나에게 보내기") 연결 상태 · 연결 · 시험 발송
export function AdminKakaoNotifyCard() {
  // undefined = 확인 중, null = 연결 안 됨
  const [connectedAt, setConnectedAt] = useState<string | null | undefined>(
    undefined
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const result = new URLSearchParams(window.location.search).get("kakao");
    if (result === "connected") return "✅ 카톡 알림 연결됨";
    if (result === "failed") return "⚠️ 카톡 연결 실패 — 다시 시도해 주세요.";
    return null;
  });

  useEffect(() => {
    supabase.rpc("ondo_admin_kakao_notify_status").then(({ data, error }) => {
      setConnectedAt(error ? null : ((data as string | null) ?? null));
    });
  }, []);

  const connect = async () => {
    setBusy(true);
    const { data: state, error } = await supabase.rpc(
      "ondo_admin_kakao_connect_start"
    );
    if (error || !state) {
      setBusy(false);
      setMessage("⚠️ 연결 시작 실패 — 다시 시도해 주세요.");
      return;
    }
    // 카카오 연결은 외부(Supabase Edge Function) 주소로 이동
    const connectUrl = new URL(KAKAO_NOTIFY_FUNCTION_URL);
    connectUrl.searchParams.set("start", "1");
    connectUrl.searchParams.set("state", String(state));
    window.location.assign(connectUrl.toString());
  };

  const sendTest = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("ondo_admin_kakao_notify_test");
    setBusy(false);
    setMessage(
      error
        ? "⚠️ 발송 실패"
        : "📨 '나와의 채팅'으로 테스트 발송됨"
    );
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-extrabold text-zinc-900">
            💬 운영자 카톡 알림
          </span>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-zinc-600 ring-1 ring-amber-200/80">
            {connectedAt === undefined
              ? "확인 중"
              : connectedAt
                ? "연결됨"
                : "미연결 (메일만 발송)"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={connect}
            className="rounded-full bg-[#FEE500] px-3 py-1.5 text-[11.5px] font-extrabold text-zinc-900 hover:brightness-95 disabled:opacity-50"
          >
            {connectedAt ? "재연결" : "카톡 연결"}
          </button>
          {connectedAt && (
            <button
              type="button"
              disabled={busy}
              onClick={sendTest}
              className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-bold text-zinc-700 ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-50"
            >
              테스트
            </button>
          )}
        </div>
      </div>
      {message && (
        <p className="mt-1.5 text-[11.5px] font-semibold text-zinc-700">{message}</p>
      )}
    </div>
  );
}

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
    if (result === "connected") return "✅ 카톡 알림이 연결됐어요. [시험 메시지]로 확인해 보세요.";
    if (result === "failed") return "⚠️ 카톡 연결에 실패했어요. 다시 시도해 주세요.";
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
      setMessage("⚠️ 연결을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    window.location.href = `${KAKAO_NOTIFY_FUNCTION_URL}?start=1&state=${encodeURIComponent(
      state as string
    )}`;
  };

  const sendTest = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("ondo_admin_kakao_notify_test");
    setBusy(false);
    setMessage(
      error
        ? "⚠️ 시험 메시지를 보내지 못했어요."
        : "📨 시험 메시지를 보냈어요. 카톡 '나와의 채팅'을 확인해 주세요."
    );
  };

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-extrabold text-zinc-900">
            💬 카톡 알림 (나와의 채팅)
          </p>
          <p className="text-[12px] text-zinc-600">
            {connectedAt === undefined
              ? "연결 상태 확인 중..."
              : connectedAt
                ? `연결됨 · ${new Date(connectedAt).toLocaleString("ko-KR")}`
                : "아직 연결 안 됨 — 새 접수가 오면 메일로만 알려 드려요."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={connect}
            className="rounded-full bg-[#FEE500] px-3.5 py-2 text-[12px] font-extrabold text-zinc-900 hover:brightness-95 disabled:opacity-50"
          >
            {connectedAt ? "다시 연결" : "카톡 알림 연결하기"}
          </button>
          {connectedAt && (
            <button
              type="button"
              disabled={busy}
              onClick={sendTest}
              className="rounded-full bg-white px-3.5 py-2 text-[12px] font-bold text-zinc-700 ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-50"
            >
              시험 메시지
            </button>
          )}
        </div>
      </div>
      {message && (
        <p className="mt-2 text-[12px] font-semibold text-zinc-700">{message}</p>
      )}
    </div>
  );
}

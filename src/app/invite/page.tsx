"use client";

import React, { useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { FIELD_INPUT } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import {
  parseJsonObject,
  useInitialSearch,
  useLocalStorageItem,
} from "@/lib/use-browser-storage";
import { submitSupportTicket } from "@/lib/supabase";
import { Button, PageHeader } from "@/components/ondo-ui";

const STORAGE_KEY = "ondo_campus_auth_v3";

export default function InvitePage() {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const storedUid = (
    parseJsonObject(useLocalStorageItem(STORAGE_KEY))?.user as
      | { uid?: unknown }
      | undefined
  )?.uid;
  const myCode = storedUid
    ? `ONDO-${String(storedUid).replace(/^u-/, "").slice(0, 8).toUpperCase()}`
    : "ONDO365";
  const urlRef = new URLSearchParams(useInitialSearch()).get("ref")?.trim() ?? "";
  const savedRef = useLocalStorageItem("ondo_invited_by_code") ?? "";
  const suggestedFriendCode = (
    urlRef.length >= 4 ? urlRef : savedRef.length >= 4 ? savedRef : ""
  ).toUpperCase();
  const [copied, setCopied] = useState(false);
  // 직접 입력하기 전에는 초대 링크(?ref=)나 저장된 코드를 보여 줌
  const [typedFriendCode, setFriendCode] = useState<string | null>(null);
  const friendCode = typedFriendCode ?? suggestedFriendCode;
  const [redeemed, setRedeemed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const inviteUrl = `https://darkhos.github.io/ondo-campus/?ref=${myCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // 휴대폰 기본 공유 창을 열어 카카오톡 등으로 바로 보냄 (공유 창이 없는 기기에서는 링크 복사로 대신함)
  const handleShare = async () => {
    const text = isJa
      ? `ONDO 36.5°で一緒に紹介を受けてみませんか？私の招待コード: ${myCode}`
      : `온도(ONDO 36.5°)에서 같이 소개팅 받아 볼래? 내 초대 코드: ${myCode}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "ONDO 36.5°", text, url: inviteUrl });
        return;
      } catch (e) {
        // 사용자가 공유 창을 닫은 경우는 아무것도 하지 않음
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    await handleCopy();
    setToast(
      isJa
        ? "招待リンクをコピーしました。カカオトークに貼り付けて送ってください。"
        : "초대 링크를 복사했어요. 카카오톡 대화방에 붙여 넣어 보내 주세요."
    );
    setTimeout(() => setToast(null), 2600);
  };

  const handleRedeem = async () => {
    if (friendCode.trim().length < 4) {
      setToast(
        isJa
          ? "友達招待コードを4文字以上入力してください。"
          : "친구 초대 코드를 4자 이상 입력해 주세요."
      );
      setTimeout(() => setToast(null), 2400);
      return;
    }
    const result = await submitSupportTicket({
      kind: "INVITE",
      reason: friendCode.trim(),
      message: `친구 초대코드 등록: ${friendCode.trim()}`,
    });
    if (!result.ok) {
      setToast(
        result.error === "login_required"
          ? isJa
            ? "招待コードの登録はカカオログイン後にご利用いただけます。"
            : "초대코드 등록은 카카오 로그인 후에 할 수 있어요."
          : result.error === "rate_limited"
          ? isJa
            ? "短時間に送信が多すぎます。しばらくしてから再度お試しください。"
            : "짧은 시간에 너무 많이 등록했어요. 잠시 후 다시 시도해 주세요."
          : isJa
          ? "登録に失敗しました。カカオトーク1:1相談室へご連絡ください。"
          : "등록에 실패했어요. 카카오톡 1:1 고객센터로 문의해 주세요."
      );
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setRedeemed(true);
    setToast(
      isJa
        ? "招待コードが登録されました！お友達の学校認証完了時にコーヒーチケット1枚が付与されます。"
        : "초대 코드가 등록되었습니다! 친구의 재학 인증 완료 시 커피티켓 1장이 지급됩니다."
    );
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={isJa ? "キャンパスの友達を招待" : "캠퍼스 친구 초대"}
        back
      />

      <div className="flex-1 space-y-6 px-5 py-6">
        <section className="rounded-3xl border border-rose-100 bg-rose-50/70 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-rose-600 shadow-xs">
            <Gift className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2 className="mt-4 text-[21px] font-black tracking-tight text-zinc-900">
            {isJa ? (
              <>
                お友達を招待すると
                <br />
                <span className="text-rose-600">
                  お互いにコーヒーチケット1枚プレゼント
                </span>
              </>
            ) : (
              <>
                학우를 초대하면
                <br />
                <span className="text-rose-600">
                  친구도 나도 커피티켓 1장
                </span>
              </>
            )}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
            {isJa ? (
              <>
                友達があなたの招待コードで登録し、学生証認証を完了すると
                <br />
                お二人ともにエスクロー・コーヒーチケット1枚(☕)を差し上げます。
              </>
            ) : (
              <>
                친구가 내 초대 코드로 가입하고 캠퍼스 인증을 완료하면
                <br />두 분 모두에게 에스크로 커피티켓 1장(☕)을 드려요.
              </>
            )}
          </p>
        </section>

        {/* 내 초대 코드 */}
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-[12px] font-bold text-zinc-400">
            {isJa ? "私の招待コード" : "내 초대 코드"}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-[#FAF9F6] px-4 py-3.5 ring-1 ring-stone-200">
            <span className="font-mono text-[18px] font-black tracking-wider text-zinc-900">
              {myCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={
                copied
                  ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors"
                  : "inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-rose-700"
              }
            >
              {copied ? (
                <>
                  <Check className="ondo-check-pop h-3.5 w-3.5" />
                  {isJa ? "コピー済み" : "복사됨"}
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  {isJa ? "招待リンクをコピー" : "초대 링크 복사"}
                </>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] text-[14px] font-extrabold text-zinc-900 shadow-xs transition-colors hover:bg-[#FADA0A]"
          >
            <Share2 className="h-4 w-4" />
            {isJa ? "カカオトークなどで招待を送る" : "카카오톡 등으로 초대 보내기"}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-zinc-400">
            {isJa
              ? "スマホの共有画面からカカオトークを選ぶと、すぐに送れます。"
              : "휴대폰 공유 창에서 카카오톡을 고르면 바로 보낼 수 있어요."}
          </p>
        </section>

        {/* 초대 코드 입력 */}
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <p className="text-[14px] font-bold text-zinc-900">
            {isJa
              ? "友達から受け取った招待コードはありますか？"
              : "친구에게 받은 초대 코드가 있나요?"}
          </p>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            {isJa
              ? "招待コードを登録すると、確認後にコーヒーチケット1枚(☕)が付与されます。"
              : "초대 코드를 등록하면 운영자 확인 후 커피티켓 1장(☕)이 지급됩니다."}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              className={FIELD_INPUT}
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              placeholder={
                isJa
                  ? "招待コードを入力 (例: ONDO-01)"
                  : "초대 코드 입력 (예: ONDO-01)"
              }
              disabled={redeemed}
            />
            <Button
              size="lg"
              variant="destructive"
              className="shrink-0"
              disabled={redeemed}
              onClick={handleRedeem}
            >
              {redeemed
                ? isJa
                  ? "登録完了"
                  : "등록 완료"
                : isJa
                ? "コード登録"
                : "코드 등록"}
            </Button>
          </div>
        </section>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-8 z-50 mx-auto max-w-sm px-5">
          <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-center text-[13px] font-bold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

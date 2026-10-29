"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { FIELD_LABEL, ROUTES, FIELD_TEXTAREA } from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import { submitSupportTicket } from "@/lib/supabase";
import { Button, PageHeader, cn } from "@/components/ondo-ui";


const REPORT_REASONS_KO = [
  "카카오톡 ID가 검색되지 않거나 존재하지 않아요",
  "상대방이 24시간 이상 응답하지 않아요",
  "불쾌하거나 무례한 언행을 사용했어요",
  "프로필 정보가 실제와 달라요 (허위 정보)",
  "기타 사유",
];

const REPORT_REASONS_JA = [
  "相手のカカオトークIDが検索できない・存在しません",
  "相手から24時間以上返信がありません",
  "不快または無礼な言動がありました",
  "プロフィール情報が実際と異なります（虚偽情報）",
  "その他の理由",
];

export default function ReportPage() {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const reasons = isJa ? REPORT_REASONS_JA : REPORT_REASONS_KO;

  const [reasonIdx, setReasonIdx] = useState(0);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitReport = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    const chosenReason = REPORT_REASONS_KO[reasonIdx] || REPORT_REASONS_KO[0];
    const result = await submitSupportTicket({
      kind: "REPORT",
      reason: chosenReason,
      message: detail.trim() || "상세 내용 없음",
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      return;
    }
    setErrorMsg(
      result.error === "login_required"
        ? isJa
          ? "通報はカカオログイン後にご利用いただけます。"
          : "신고는 카카오 로그인 후에 할 수 있어요."
        : result.error === "rate_limited"
        ? isJa
          ? "短時間に送信が多すぎます。しばらくしてから再度お試しください。"
          : "짧은 시간에 너무 많이 접수했어요. 잠시 후 다시 시도해 주세요."
        : isJa
        ? "送信に失敗しました。カカオトーク1:1相談室へご連絡ください。"
        : "접수에 실패했어요. 카카오톡 1:1 고객센터로 문의해 주세요."
    );
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader title={isJa ? "運営チームへ通報・申請" : "신고하기"} back />
      <div className="flex-1 space-y-6 px-5 py-6">
        {submitted ? (
          <div className="ondo-pop-box rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-2xs">
            <div className="ondo-check-pop mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2.2} />
            </div>
            <p className="text-[18px] font-bold text-zinc-900">
              {isJa
                ? "通報・返金申請が受付されました"
                : "신고가 정상적으로 접수되었어요"}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
              {isJa
                ? "運営チームが24時間以内に内容を確認し、お相手側の事由（カカオトークID検索不可・無応答など）と確認された場合、使用したコーヒーチケットを100%返還いたします。"
                : "운영팀이 24시간 내에 관리자 콘솔에서 내용을 확인하며, 상대방 귀책 사유(카카오톡 ID 미검색·무응답 등)로 확인될 경우 사용한 커피티켓을 100% 환불해 드립니다."}
            </p>
            <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-2.5 text-[12px] font-semibold text-zinc-600">
              {isJa ? "受付した理由：" : "접수한 사유: "}
              {reasons[reasonIdx] ?? reasons[0]}
            </p>
            {/* 앞으로 어떻게 처리되는지 단계로 보여 줌 */}
            <ol className="mt-4 grid grid-cols-3 gap-1.5 text-[11px] font-bold">
              {(isJa
                ? ["受付完了", "24時間以内に確認", "結果をお知らせ"]
                : ["접수 완료", "24시간 안에 확인", "결과 안내"]
              ).map((label, i) => (
                <li
                  key={label}
                  className={
                    i === 0
                      ? "animate-fade-in-up rounded-xl bg-emerald-50 px-2 py-2 text-emerald-700"
                      : "animate-fade-in-up rounded-xl bg-stone-50 px-2 py-2 text-zinc-500"
                  }
                  style={{ animationDelay: `${200 + i * 120}ms` }}
                >
                  {i + 1}. {label}
                </li>
              ))}
            </ol>
            <Button
              size="lg"
              fullWidth
              variant="destructive"
              className="mt-6"
              onClick={() => router.push(ROUTES.HOME)}
            >
              {isJa ? "ホームへ戻る" : "홈으로 돌아가기"}
            </Button>
          </div>
        ) : (
          <>
            <div>
              <label className={FIELD_LABEL}>
                {isJa ? "通報・申請の理由を選択" : "신고 사유 선택"}
              </label>
              <div className="space-y-2">
                {reasons.map((r, idx) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReasonIdx(idx)}
                    className={cn(
                      "flex w-full items-center rounded-2xl border-[1.5px] px-4 py-3.5 text-left text-[14px] font-medium transition-all",
                      reasonIdx === idx
                        ? "border-rose-600 bg-rose-50 text-rose-700 font-bold"
                        : "border-stone-200 bg-white text-zinc-700"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={FIELD_LABEL}>
                {isJa ? "詳細内容（相手のニックネーム等）" : "상세 내용 (상대방 닉네임 및 상황)"}
              </label>
              <textarea
                className={cn(FIELD_TEXTAREA, "h-32")}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder={
                  isJa
                    ? "状況を詳しくご記入いただくと、迅速な確認およびチケット返還処理に役立ちます。"
                    : "상황을 자세히 적어주시면 운영팀의 빠른 확인과 커피티켓 100% 환불 처리에 도움이 됩니다."
                }
              />
            </div>

            {errorMsg && (
              <p key={errorMsg} className="ondo-shake text-[12px] font-semibold text-rose-600">
                {errorMsg}
              </p>
            )}

            <Button
              size="lg"
              fullWidth
              loading={submitting}
              variant="destructive"
              onClick={handleSubmitReport}
            >
              {isJa ? "通報・返金申請を送信する" : "신고 접수하기"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

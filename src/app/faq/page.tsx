"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Send } from "lucide-react";
import {
  KAKAO_OPENCHAT_URL,
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_TEXTAREA,
} from "@/lib/ondo-constants";
import { useAppLocale } from "@/lib/i18n";
import { submitSupportTicket } from "@/lib/supabase";
import { Button, PageHeader, cn } from "@/components/ondo-ui";

const STORAGE_KEY = "ondo_campus_auth_v3";

const FAQ_ITEMS_KO = [
  {
    q: "Q1. 학생 인증은 어떻게 하나요? 학생증 사진은 저장되나요?",
    a: "한국 대학생·일본인 어학당생·일본인 대학 유학생 모두 '학교 공식 웹메일 인증(6자리 인증번호)' 또는 '학생증 인증' 중 편한 방식을 선택할 수 있어요. 학생증은 실물 학생증이나 도서관 모바일 이용증 등 자기 신분을 입증할 수 있는 거면 무엇이든 가능하며, 사진은 운영자만 볼 수 있는 비공개 보관함에 저장되었다가 승인·반려 즉시 삭제됩니다.",
  },
  {
    q: "Q2. 내 카카오톡 ID는 상대방에게 언제 공개되나요?",
    a: "매칭 직후에는 절대 공개되지 않습니다! 매일 밤 9시 매칭이 도착한 뒤, 양측이 호감을 수락하고 24시간 블라인드 룸에서 최소 5턴(5마디) 이상 대화를 나눈 경우에만 서로의 카카오톡 ID가 안전하게 공개됩니다.",
  },
  {
    q: "Q3. 같은 학교(또는 같은 어학당) 사람을 마주치면 어떡하죠?",
    a: "[주파수 조건] 탭에서 '같은 학교 학생 제외' 스위치가 기본으로 켜져 있습니다. 우리 학교 학우에게는 내 프로필이 노출되지 않으며 타 대학 학우들과만 안심하고 매칭됩니다.",
  },
  {
    q: "Q4. 상대방이 대화를 안 하거나 카카오톡 ID가 검색되지 않으면 티켓은 어떻게 되나요?",
    a: "ONDO 36.5°는 100% 에스크로 커피티켓 보증제를 운영합니다. 상대방이 24시간 내에 첫 답장을 보내지 않거나 카카오톡 ID가 유효하지 않은 경우, 사용된 커피티켓은 100% 자동 반환됩니다.",
  },
  {
    q: "Q5. 일본인 유학생·어학당생과도 매칭될 수 있나요?",
    a: "네! 서울·경기·인천권 대학에 재학 중인 일본인 정규·교환 유학생 및 대학교 부설 어학당 일본인 학생들도 운영자의 학생증 확인을 거쳐 함께 참여할 수 있고, 한국어·일본어 화면 전환을 지원합니다.",
  },
];

const FAQ_ITEMS_JA = [
  {
    q: "Q1. 学生認証はどのように行いますか？学生証の写真は保存されますか？",
    a: "韓国の大学生・日本人語学堂生・日本人大学留学生すべて「学校公式ウェブメール認証（6桁コード）」または「学生証認証」のどちらかを選べます。学生証は実物の学生証や図書館モバイル利用証などご自身の身分を証明できるものなら何でも可能で、写真は運営チームのみ閲覧できる非公開保管庫に保存され、承認・却下の直後に削除されます。",
  },
  {
    q: "Q2. 私のカカオトークIDはいつ相手に公開されますか？",
    a: "マッチング直後には公開されません。毎晩21時のマッチング後、双方が好感を承認し24時間ブラインド・チャットルームで5往復以上の会話を交わした後にのみ安全に公開されます。",
  },
  {
    q: "Q3. 同じ大学や同じ語学堂の知り合いに表示されませんか？",
    a: "［希望条件］タブにて「同じ大学・語学堂の学生を除外」スイッチをONにすると、同じ所属の学生にはプロフィールが一切露出されません。",
  },
  {
    q: "Q4. 相手から24時間返信がない場合、コーヒーチケットはどうなりますか？",
    a: "100%エスクロー保証により、相手が24時間以内に最初の返信を送らない場合やカカオトークIDが検索できない場合は、コーヒーチケットが100%自動返還されます。",
  },
  {
    q: "Q5. 女性会員の利用料金はかかりますか？",
    a: "キャンパス男女比バランス優待により、女性会員様は定時マッチング・ブラインドチャット・連絡先交換まで100%無料でご利用いただけます。",
  },
];

export default function FaqPage() {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const faqs = isJa ? FAQ_ITEMS_JA : FAQ_ITEMS_KO;

  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryText, setInquiryText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendInquiry = async () => {
    if (!inquiryText.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    let savedKakao = "";
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (typeof parsed?.kakaoId === "string") savedKakao = parsed.kakaoId;
    } catch {
      // ignore
    }
    const result = await submitSupportTicket({
      kind: "INQUIRY",
      message: inquiryText.trim(),
      replyContact: inquiryName.trim() || savedKakao,
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      return;
    }
    setErrorMsg(
      result.error === "rate_limited"
        ? isJa
          ? "短時間に送信が多すぎます。しばらくしてから再度お試しください。"
          : "짧은 시간에 너무 많이 접수했어요. 잠시 후 다시 시도해 주세요."
        : isJa
        ? "送信に失敗しました。上のカカオトーク1:1相談室へご連絡ください。"
        : "접수에 실패했어요. 위의 카카오톡 1:1 고객센터로 문의해 주세요."
    );
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={
          isJa
            ? "よくある質問 (FAQ) ＆ カスタマーサポート"
            : "자주 묻는 질문 (FAQ) & 고객센터"
        }
        back
      />

      <div className="flex-1 space-y-6 px-5 py-6">
        {/* Official KakaoTalk 1:1 Open Chat Banner */}
        <section className="rounded-3xl border border-rose-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FEE500] text-zinc-900 shadow-2xs">
              <MessageCircle className="h-5 w-5" fill="currentColor" />
            </div>
            <div>
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-600">
                OFFICIAL SUPPORT
              </span>
              <h2 className="mt-0.5 text-[16px] font-black text-zinc-900">
                {isJa
                  ? "ONDO 36.5° 公式カカオ1:1相談室"
                  : "ONDO 36.5° 캠퍼스 공식 카카오톡 고객센터"}
              </h2>
            </div>
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-zinc-600">
            {isJa
              ? "学生認証、紹介の流れ、チケット返還など、気になる点があれば公式カカオトーク1:1オープンチャットでリアルタイムにご相談いただけます。"
              : "학생 인증, 소개팅 진행 방식, 티켓 환불 등 궁금한 점이 있다면 공식 카카오톡 1:1 고객센터로 언제든 편하게 문의해 주세요."}
          </p>
          <a
            href={KAKAO_OPENCHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3.5 text-[13px] font-extrabold text-zinc-900 shadow-2xs transition-transform active:scale-[0.99]"
          >
            <MessageCircle className="h-4 w-4" fill="currentColor" />
            <span>
              {isJa
                ? "カカオトーク1:1相談室を開く →"
                : "카카오톡 1:1 오픈채팅 고객센터 바로가기 →"}
            </span>
          </a>
        </section>

        {/* Accordion FAQ List */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 px-1">
            <HelpCircle className="h-4 w-4 text-rose-600" />
            <h3 className="text-[14px] font-extrabold text-zinc-900">
              {isJa ? "よくある質問 TOP 5" : "자주 묻는 질문 TOP 5"}
            </h3>
          </div>

          {faqs.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : idx)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-[13px] font-bold text-zinc-900">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
                      open && "rotate-180 text-rose-600"
                    )}
                  />
                </button>
                {open && (
                  <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-3.5 text-[12px] leading-relaxed text-zinc-600">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Direct Web Inquiry to Admin Console */}
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <h3 className="text-[14px] font-extrabold text-zinc-900">
            {isJa
              ? "運営チームへ直接メッセージを残す"
              : "홈페이지에서 바로 문의 남기기 (운영자 직통)"}
          </h3>
          <p className="mt-1 text-[12px] text-zinc-500">
            {isJa
              ? "ここに記入して送信すると、運営チームの管理画面(/admin)へ即座に届きます。"
              : "아래에 문의 내용을 남겨주시면 운영팀 관리자 콘솔로 즉시 접수됩니다."}
          </p>

          {submitted ? (
            <div className="mt-3 rounded-2xl bg-rose-50 p-4 text-center">
              <p className="text-[14px] font-bold text-rose-700">
                {isJa
                  ? "✅ お問い合わせが運営チームに送信されました！"
                  : "✅ 문의 내용이 운영팀에 정상 접수되었습니다!"}
              </p>
              <p className="mt-1 text-[12px] text-zinc-600">
                {isJa
                  ? "確認後、ご登録のカカオトークIDへ迅速にご案内いたします。"
                  : "운영팀이 확인 후 입력하신 카카오톡 ID로 빠르게 안내해 드립니다."}
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <label className={FIELD_LABEL}>
                  {isJa
                    ? "返信を受け取るカカオトークID（またはニックネーム）"
                    : "답변 받으실 카카오톡 ID (또는 닉네임)"}
                </label>
                <input
                  className={FIELD_INPUT}
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder={
                    isJa ? "例: ondo_haruka22" : "예: ondo_yonsei22"
                  }
                />
              </div>
              <div>
                <label className={FIELD_LABEL}>
                  {isJa ? "お問い合わせ内容" : "문의 내용"}
                </label>
                <textarea
                  className={cn(FIELD_TEXTAREA, "h-24")}
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder={
                    isJa
                      ? "ご質問やご要望を自由にご記入ください。"
                      : "궁금한 점이나 건의사항을 편하게 적어주세요."
                  }
                />
              </div>
              {errorMsg && (
                <p className="text-[12px] font-semibold text-rose-600">
                  {errorMsg}
                </p>
              )}
              <Button
                fullWidth
                size="lg"
                loading={submitting}
                onClick={handleSendInquiry}
              >
                <Send className="h-4 w-4" />
                {isJa ? "運営チームへ送信する" : "운영팀에 문의 접수하기"}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

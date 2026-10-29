"use client";

import React from "react";
import { useAppLocale } from "@/lib/i18n";
import { PageHeader } from "@/components/ondo-ui";

export default function TermsPage() {
  const [locale] = useAppLocale();
  const isJa = locale === "ja";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#FAF9F6] shadow-sm">
      <PageHeader
        title={isJa ? "サービス利用規約" : "서비스 이용약관"}
        back
      />
      <div className="flex-1 space-y-4 px-5 py-6 text-[13px] leading-relaxed text-zinc-600">
        <h2 className="text-[16px] font-bold text-zinc-900">
          {isJa
            ? "第1条（目的およびサービス概要）"
            : "제1조 (목적 및 서비스 개요)"}
        </h2>
        <p>
          {isJa
            ? "本規約は、ONDO 36.5°（以下「本サービス」）が提供する学生証認証ベースの価値観＆会話温度ブラインド・マッチングラウンジサービスの利用条件および手続きを定めることを目的とします。"
            : '본 약관은 온도(ONDO 36.5°, 이하 "서비스")가 제공하는 대학생·유학생 인증 기반 가치관 & 대화 온도 블라인드 매칭 라운지 서비스의 이용 조건과 절차를 규정함을 목적으로 합니다.'}
        </p>
        <h2 className="pt-2 text-[16px] font-bold text-zinc-900">
          {isJa
            ? "第2条（会員資格およびキャンパス認証）"
            : "제2조 (회원 자격 및 캠퍼스 인증)"}
        </h2>
        <p>
          {isJa
            ? "会員は、韓国の大学・大学院の在学生、大学付属語学堂の日本人留学生、および韓国の大学の日本人正規・交換留学生のうち在学証明手続きを完了した方に限りマッチングサービスを利用でき、同じ大学・語学堂の学生との相互露出をブロックできます。"
            : "회원은 한국 대학교·대학원 재학생, 대학교 부설 어학당 일본인 유학생, 한국 대학교 일본인 정규·교환 유학생 중 재학 증명 절차를 완료한 학우에 한하여 매칭 서비스를 이용할 수 있으며, 같은 학교 학우와는 상호 노출을 차단할 수 있습니다."}
        </p>
        <h2 className="pt-2 text-[16px] font-bold text-zinc-900">
          {isJa
            ? "第3条（エスクロー・コーヒーチケットおよび100%返還ポリシー）"
            : "제3조 (에스크로 커피티켓 사용 및 100% 반환 정책)"}
        </h2>
        <p>
          {isJa
            ? "双方がマッチングを承認し24時間ブラインド・チャットルームが開設された際に保管されたコーヒーチケットは、相手が24時間以内に最初の返信を送らない場合、または安心連絡先（カカオトークID）が無効な場合は100%自動返還されます。"
            : "쌍방 호감 수락 및 24시간 블라인드 룸 개설 시 보관된 커피티켓은 상대방이 24시간 내 첫 답장을 하지 않거나 안심 연락처(카카오톡 ID)가 유효하지 않을 경우 100% 자동 반환됩니다."}
        </p>
      </div>
    </div>
  );
}

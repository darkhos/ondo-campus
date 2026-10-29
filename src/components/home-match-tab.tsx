"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  Coffee,
  Flame,
  Pause,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  calculateProfileCompletion,
  KAKAO_OPENCHAT_URL,
  DEMO_PARTNERS,
  MatchHistoryItem,
  PartnerProfile,
  ROUTES,
  UserProfile,
} from "@/lib/ondo-constants";
import {
  Button,
  CampusBalanceLoungeCard,
  cn,
  ContactUnlockCard,
  HomeTabId,
  InAppBlindChatCard,
  LanguageToggle,
  MatchCard,
  MatchingToggleCard,
  Modal,
  ProfileCompletionCard,
} from "@/components/ondo-ui";
import { useAppLocale } from "@/lib/i18n";
import { useLocalStorageItem } from "@/lib/use-browser-storage";
import { DbMatchPartner, logoutEverywhere } from "@/lib/supabase";
import { RealMatchPanel, isActiveMatch } from "@/components/real-match-panel";

export type MatchViewState =
  | "recommendation"
  | "blind_chat"
  | "waiting"
  | "waiting_response"
  | "failed"
  | "paused"
  | "cancelled_after_success";

function useNextMatchCountdown(): string {
  const [countdown, setCountdown] = useState<string>("04:12:30");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(21, 0, 0, 0);
      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }
      const diffSec = Math.max(
        0,
        Math.floor((target.getTime() - now.getTime()) / 1000)
      );
      const h = String(Math.floor(diffSec / 3600)).padStart(2, "0");
      const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
      const s = String(diffSec % 60).padStart(2, "0");
      setCountdown(`${h}:${m}:${s}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return countdown;
}

const noop = () => {};

export function HomeMatchTab({
  user,
  history = [],
  onUpdateUser,
  onNavigateTab,
  unreadNotificationCount,
  serverMatches = [],
  onServerChanged,
}: {
  user: UserProfile;
  /** 서버의 실제 매칭 목록 (있으면 체험 화면 대신 실제 매칭 화면을 보여 줌) */
  serverMatches?: DbMatchPartner[];
  onServerChanged?: () => void;
  history?: MatchHistoryItem[];
  onUpdateUser: (patch: Partial<UserProfile>) => void;
  onNavigateTab: (tab: HomeTabId) => void;
  onAddHistory?: (item: MatchHistoryItem) => void;
  unreadNotificationCount?: number;
}) {
  const router = useRouter();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const countdown = useNextMatchCountdown();

  const [matchState, setMatchState] =
    useState<MatchViewState>("recommendation");
  const [candidateIdx, setCandidateIdx] = useState<number>(0);
  const [confirmModal, setConfirmModal] = useState<"ACCEPT" | "PASS" | null>(
    null
  );
  const [escrowState, setEscrowState] = useState<
    "LOCKED" | "HELD" | "CONFIRMED" | "REFUNDED"
  >("CONFIRMED");
  const [toast, setToast] = useState<string | null>(null);
  const readNotifRaw = useLocalStorageItem("ondo_read_notifications_v1");
  const readNotifIds = (() => {
    try {
      return new Set<string>(readNotifRaw ? JSON.parse(readNotifRaw) : []);
    } catch {
      return new Set<string>();
    }
  })();

  const computedUnreadCount = (() => {
    if (typeof unreadNotificationCount === "number") {
      return unreadNotificationCount;
    }
    const ids: string[] = ["welcome-tickets"];
    if (user.verificationStatus && user.verificationStatus !== "verified") {
      ids.push(`verify-${user.verificationStatus}`);
    }
    for (const m of serverMatches) {
      if (m.ticket_status === "PENDING" && m.my_response === "PENDING") {
        ids.push(`match-new-${m.match_id}`);
      } else if (m.ticket_status === "CHATTING") {
        ids.push(`match-chat-${m.match_id}`);
      } else if (m.ticket_status === "CONFIRMED") {
        ids.push(`match-contact-${m.match_id}`);
      }
    }
    return ids.filter((id) => !readNotifIds.has(id)).length;
  })();

  const completionPct = calculateProfileCompletion(user);
  const activeHistory = history.filter(
    (h) => h.resultStatus === "PENDING" || h.resultStatus === "SUCCESS"
  );
  const realPartners: PartnerProfile[] = activeHistory.map((h) => h.partner);
  const hasRealMatch = realPartners.length > 0;
  const currentPartner: PartnerProfile =
    realPartners[candidateIdx] ?? realPartners[0] ?? DEMO_PARTNERS[0];
  const ticketCount = Math.max(0, Math.floor(user.points / 2900));
  const hasActiveServerMatch = serverMatches.some(isActiveMatch);

  const handleLogout = async () => {
    await logoutEverywhere();
    router.replace("/");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleToggleMatching = () => {
    const nextPaused = user.matchingStatus !== "PAUSED";
    onUpdateUser({
      matchingStatus: nextPaused ? "PAUSED" : "ACTIVE",
    });
    setMatchState(nextPaused ? "paused" : "recommendation");
  };

  const handleConfirmAction = () => {
    if (confirmModal === "ACCEPT") {
      setConfirmModal(null);
      setEscrowState("CONFIRMED");
      setMatchState("blind_chat");
      showToast(
        isJa
          ? "価値観が繋がり、24時間ブラインド・コーヒーチャットが開きました！"
          : "주파수가 연결되어 24시간 블라인드 커피챗이 열렸어요!"
      );
    } else if (confirmModal === "PASS") {
      setConfirmModal(null);
      if (candidateIdx < realPartners.length - 1) {
        setCandidateIdx((i) => i + 1);
        showToast(
          isJa
            ? "次の価値観ノートを読み込みました。"
            : "다음 순차 주파수 노트를 불러왔어요."
        );
      } else {
        setMatchState("waiting");
      }
    }
  };

  // 티켓 차감·환급은 서버(운영자 정산)에서만 처리 — 화면에서 임의로 늘리거나 줄이지 않음
  const handleUnlockEscrow = () => {
    setEscrowState("CONFIRMED");
  };

  return (
    <div className="flex min-h-full flex-col bg-[#FAF9F6]">
      {/* ONDO Editorial Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-4xl items-center justify-between gap-2 px-4 sm:px-5">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-rose-400">
              <Flame className="h-4 w-4" fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-black tracking-tight text-zinc-900">
                  ONDO
                </span>
                <span className="text-[12px] font-bold text-rose-600">
                  36.5°
                </span>
              </div>
              <p className="hidden text-[11px] font-medium text-zinc-400 sm:block">
                CAMPUS VALUE & VIBE LOUNGE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
            <LanguageToggle />

            <button
              type="button"
              onClick={() => onNavigateTab("note")}
              className="hidden h-8 items-center gap-1 rounded-full bg-rose-50 px-2.5 text-[12px] font-bold text-rose-600 transition-colors hover:bg-rose-100 sm:inline-flex"
            >
              <span>{isJa ? "✍️ 価値観ノート" : "✍️ 내 가치관 노트"}</span>
            </button>

            <Link
              href={ROUTES.POINTS}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-[12px] font-bold text-zinc-800 shadow-2xs transition-colors hover:bg-stone-50"
            >
              <Coffee className="h-3.5 w-3.5 text-rose-600" />
              <span>
                {isJa ? `チケット ${ticketCount}枚` : `티켓 ${ticketCount}장`}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8 items-center rounded-full border border-stone-200 bg-white px-2.5 text-[11px] font-bold text-zinc-500 transition-colors hover:bg-stone-100 hover:text-zinc-900 sm:h-9 sm:text-[12px]"
            >
              {isJa ? "ログアウト" : "로그아웃"}
            </button>

            <Link
              href={ROUTES.NOTIFICATIONS}
              aria-label={isJa ? "お知らせ" : "알림"}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-zinc-700 transition-colors hover:bg-stone-50"
            >
              <Bell className="h-4 w-4" strokeWidth={2} />
              {computedUnreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-600" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Studio Mode Switcher (실제 매칭이 진행 중이면 체험용 탭은 숨김) */}
      <div className={cn("border-b border-stone-200/60 bg-white/60", hasActiveServerMatch && "hidden")}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-5 py-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                {
                  id: "recommendation",
                  labelKo: "01 오늘의 가치관 노트",
                  labelJa: "01 今日の価値観ノート",
                },
                {
                  id: "blind_chat",
                  labelKo: "02 24h 블라인드 커피챗",
                  labelJa: "02 24h ブラインドチャット",
                },
                {
                  id: "waiting",
                  labelKo: "03 캠퍼스 온도차 투표",
                  labelJa: "03 日韓キャンパス投票",
                },
                {
                  id: "cancelled_after_success",
                  labelKo: "04 에스크로 보증 안내",
                  labelJa: "04 エスクロー保証案内",
                },
              ] as const
            ).map((tab) => {
              const active = matchState === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMatchState(tab.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all",
                    active
                      ? "bg-zinc-900 text-white shadow-2xs"
                      : "bg-[#F3F1ED] text-zinc-600 hover:bg-stone-200"
                  )}
                >
                  {isJa ? tab.labelJa : tab.labelKo}
                </button>
              );
            })}
          </div>

          <div className="hidden items-center gap-1.5 text-[12px] font-medium text-zinc-400 sm:flex">
            <span>
              {isJa ? "今夜21時のマッチングまで" : "다음 밤 9시 주파수까지"}
            </span>
            <span className="font-mono font-bold text-rose-600">
              {countdown}
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive 2-Column Dashboard Content */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-6 pb-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left / Primary Column (7 cols on Desktop) */}
          <div className="space-y-4 lg:col-span-7">
            {hasActiveServerMatch && (
              <RealMatchPanel
                matches={serverMatches}
                isMale={user.gender === "MALE"}
                ticketCount={ticketCount}
                onChanged={onServerChanged ?? noop}
              />
            )}
            {completionPct < 100 && (
              <ProfileCompletionCard
                percent={completionPct}
                onOpen={() => onNavigateTab("note")}
              />
            )}

            {!hasActiveServerMatch && matchState === "recommendation" && (
              <div className="animate-fade-in space-y-4">
                {hasRealMatch ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[19px] font-extrabold tracking-tight text-zinc-900">
                          {isJa
                            ? "今日届いた価値観ノート"
                            : "오늘 도착한 주파수 노트"}
                        </h2>
                        <p className="text-[12px] text-zinc-500">
                          {isJa
                            ? "恋愛価値観の一行ノートと3大ライフスタイル指標を先に確認しましょう"
                            : "연애 가치관 한 줄 노트와 3대 라이프 지표를 먼저 확인해보세요"}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {realPartners.map((p, idx) => (
                          <button
                            key={p.uid}
                            type="button"
                            onClick={() => setCandidateIdx(idx)}
                            className={cn(
                              "rounded-full px-3 py-1 text-[12px] font-bold transition-all",
                              candidateIdx === idx
                                ? "bg-rose-600 text-white"
                                : "bg-white text-zinc-600 ring-1 ring-stone-200"
                            )}
                          >
                            #{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    <MatchCard partner={currentPartner} />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onClick={() => setConfirmModal("PASS")}
                      >
                        {isJa ? "次の候補を見る" : "다음 주파수 넘기기"}
                      </Button>
                      <Button
                        size="lg"
                        fullWidth
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={() => setConfirmModal("ACCEPT")}
                      >
                        {isJa
                          ? "ブラインド・コーヒーチャットを開く"
                          : "블라인드 커피챗 열기"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl border border-stone-200 bg-white p-7 text-center shadow-2xs">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                      <Clock className="h-7 w-7" />
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-extrabold text-rose-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      {isJa
                        ? "今夜 21:00 定刻マッチング待機中"
                        : "오늘 밤 9:00 정각 주파수 매칭 대기 중"}
                    </span>
                    <h2 className="mt-3 text-[20px] font-black tracking-tight text-zinc-900">
                      {isJa
                        ? "今夜21時のマッチングまで "
                        : "다음 밤 9시 매칭까지 "}
                      <span className="font-mono text-rose-600">
                        {countdown}
                      </span>
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                      {isJa ? (
                        <>
                          ダミーやサクラは一切なし。<strong>100%学生証認証済みの韓国の大学生・🇯🇵日本人語学堂生・🇯🇵日本人大学留学生</strong>とのみマッチングされます。
                          <br />
                          お待ちの間に自己紹介や関心事を埋めておくと、お相手があなたのことをよりよく知ることができます。
                        </>
                      ) : (
                        <>
                          가짜 샘플 프로필 없이 <strong>100% 실제 인증된 타 대학 학우, 🇯🇵 일본인 어학당생, 🇯🇵 일본인 대학 유학생</strong>과만 매칭됩니다.
                          <br />
                          기다리는 동안 자기소개와 관심사를 채워 두면 상대가 나를 더 잘 알 수 있어요.
                        </>
                      )}
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="md"
                        fullWidth
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={() => onNavigateTab("note")}
                      >
                        {isJa
                          ? "✍️ 私の第一印象・価値観ノートを書く"
                          : "✍️ 내 첫인상·가치관 노트 작성하기"}
                      </Button>
                      <Button
                        size="md"
                        variant="secondary"
                        fullWidth
                        onClick={() => router.push(ROUTES.INVITE)}
                      >
                        {isJa
                          ? "🎁 友達招待でチケット+1枚もらう"
                          : "🎁 학우 초대하고 티켓 +1장 받기"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasActiveServerMatch && matchState === "blind_chat" && (
              <div className="animate-fade-in space-y-4">
                {!hasRealMatch && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-[12px] font-medium text-amber-800">
                    {isJa
                      ? "💡 現在は21:00本マッチング前の「ブラインド・ルーム体験プレビュー」モードです。実際のマッチング成立時、お相手との専用トークルームがここに開きます。"
                      : "💡 현재는 밤 9시 실제 매칭 전 '블라인드 룸 체험 미리보기' 화면입니다. 실제 매칭이 성사되면 이곳에 상대방과의 전용 대화방이 열립니다."}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[19px] font-extrabold tracking-tight text-zinc-900">
                      {isJa
                        ? "24時間ブラインド・コーヒーチャット"
                        : "24시간 블라인드 커피챗"}
                    </h2>
                    <p className="text-[12px] text-zinc-500">
                      {isJa
                        ? "5往復以上の会話が続くと安心連絡先（カカオトークID）が公開されます"
                        : "5마디 이상 대화가 이어지면 안심 연락처(카카오톡 ID)가 열립니다"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEscrowState((s) =>
                        s === "LOCKED" ? "CONFIRMED" : "LOCKED"
                      )
                    }
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-zinc-600 ring-1 ring-stone-200"
                  >
                    {escrowState === "LOCKED"
                      ? isJa
                        ? "トークルームを見る"
                        : "대화방 바로 보기"
                      : isJa
                      ? "エスクロー案内を見る"
                      : "에스크로 안내 보기"}
                  </button>
                </div>

                {escrowState === "LOCKED" ? (
                  <ContactUnlockCard
                    pointCost={2900}
                    userPoints={user.points}
                    onUnlock={handleUnlockEscrow}
                  />
                ) : (
                  <InAppBlindChatCard
                    partner={currentPartner}
                    escrowStatus={
                      escrowState === "REFUNDED" ? "REFUNDED" : "CONFIRMED"
                    }
                    preview={!hasRealMatch}
                  />
                )}
              </div>
            )}

            {!hasActiveServerMatch && matchState === "waiting" && (
              <div className="animate-fade-in space-y-4">
                <CampusBalanceLoungeCard
                  onRewardPoints={() => {
                    // 크레딧은 서버에 저장되지 않으므로 화면에서만 늘리지 않음
                    showToast(
                      isJa
                        ? "投票へのご参加ありがとうございます！"
                        : "온도차 투표에 참여해 주셔서 고마워요!"
                    );
                  }}
                />
              </div>
            )}

            {!hasActiveServerMatch && matchState === "cancelled_after_success" && (
              <div className="animate-fade-in rounded-3xl border border-stone-200 bg-white p-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-[18px] font-extrabold text-zinc-900">
                  {isJa
                    ? "100% エスクロー・コーヒーチケット保護システム"
                    : "100% 에스크로 커피티켓 보호 시스템"}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                  {isJa
                    ? "ONDOはマッチング直後に連絡先（カカオトークID）を露出したり、一方的にチケットを消滅させたりしません。相手がトークルームで最初の返信を送った時のみチケットが使用され、24時間未返信の場合は100%自動返還されます。"
                    : "ONDO는 매칭 직후 연락처(카카오톡 ID)를 바로 노출하거나 일방적으로 티켓을 소멸시키지 않습니다. 상대방이 인앱 대화방에서 첫 답장을 보낼 때만 티켓이 사용되며, 24시간 미응답 시 100% 자동 반환됩니다."}
                </p>
                <Button
                  size="md"
                  className="mt-5"
                  onClick={() => setMatchState("blind_chat")}
                >
                  {isJa
                    ? "ブラインド・コーヒーチャットを体験する"
                    : "블라인드 커피챗 체험하기"}
                </Button>
              </div>
            )}

            {!hasActiveServerMatch && matchState === "paused" && (
              <div className="animate-fade-in rounded-3xl border border-stone-200 bg-white p-8 text-center">
                <Pause className="mx-auto h-8 w-8 text-zinc-400" />
                <h2 className="mt-3 text-[17px] font-bold text-zinc-900">
                  {isJa
                    ? "ラウンジお休みモード中です"
                    : "라운지 휴식 모드입니다"}
                </h2>
                <Button
                  size="md"
                  className="mt-4"
                  onClick={handleToggleMatching}
                >
                  {isJa ? "マッチングを再開する" : "주파수 다시 켜기"}
                </Button>
              </div>
            )}
          </div>

          {/* Right / Secondary Column (5 cols on Desktop — Live Balance Poll & Studio Status) */}
          <div className="space-y-4 lg:col-span-5">
            <MatchingToggleCard
              matchingStatus={user.matchingStatus}
              onToggle={handleToggleMatching}
            />

            {matchState !== "waiting" && (
              <CampusBalanceLoungeCard
                onRewardPoints={() => {
                  showToast(
                    isJa
                      ? "投票へのご参加ありがとうございます！"
                      : "온도차 투표에 참여해 주셔서 고마워요!"
                  );
                }}
              />
            )}

            {/* Official KakaoTalk 1:1 Support Quick Card inside Lounge */}
            <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="rounded-full bg-[#FEE500] px-2 py-0.5 text-[11px] font-extrabold text-zinc-900">
                    OFFICIAL SUPPORT
                  </span>
                  <p className="mt-1 text-[13px] font-extrabold text-zinc-900">
                    {isJa
                      ? "ONDO 36.5° 公式カカオ1:1顧客センター"
                      : "ONDO 36.5° 공식 카카오톡 1:1 고객센터"}
                  </p>
                  <p className="text-[12px] text-zinc-500">
                    {isJa
                      ? "マッチング・認証・チケット返還のお問い合わせ"
                      : "매칭·학생증 인증·티켓 환불 실시간 상담"}
                  </p>
                </div>
                <a
                  href={KAKAO_OPENCHAT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-2xl bg-[#FEE500] px-3.5 py-2.5 text-[12px] font-extrabold text-zinc-900 shadow-2xs hover:brightness-95"
                >
                  {isJa ? "💬 カカオ相談" : "💬 카톡 문의"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmModal && (
        <Modal open onClose={() => setConfirmModal(null)}>
          <h3 className="text-[18px] font-extrabold text-zinc-900">
            {confirmModal === "ACCEPT"
              ? isJa
                ? `24時間ブラインド・チャットルームを開きますか？`
                : `${currentPartner.nickname}님과 24시간 블라인드 룸을 열까요?`
              : isJa
              ? "次の価値観ノートを確認しますか？"
              : "다음 순차 가치관 노트를 확인하시겠어요?"}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
            {confirmModal === "ACCEPT"
              ? isJa
                ? "個人連絡先（カカオトークID）はすぐには公開されず、5往復以上の会話が続いた時のみ安全に交換できます。"
                : "개인 연락처(카카오톡 ID)가 바로 노출되지 않으며, 5턴 이상 대화가 이어졌을 때만 안전하게 연락처를 교환할 수 있습니다."
              : isJa
              ? "強制脱落することなく、次の候補の価値観ノートへスムーズに移動します。"
              : "강제 탈락 없이 다음 후보의 가치관 노트로 부드럽게 이동합니다."}
          </p>
          <div className="mt-5 flex gap-2.5">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => setConfirmModal(null)}
            >
              {isJa ? "キャンセル" : "취소"}
            </Button>
            <Button
              size="lg"
              fullWidth
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleConfirmAction}
            >
              {confirmModal === "ACCEPT"
                ? isJa
                  ? "ブラインド・ルームを開く"
                  : "블라인드 룸 열기"
                : isJa
                ? "次のノートを見る"
                : "다음 노트 보기"}
            </Button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-sm px-5">
          <div className="rounded-full bg-zinc-900 px-4 py-2.5 text-center text-[12px] font-semibold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

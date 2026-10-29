"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EMPTY_USER_PROFILE,
  MatchHistoryItem,
  ROUTES,
  UserProfile,
  isSampleUid,
  normalizeBuild,
  normalizeHobbies,
  normalizeImpression,
  normalizeStoredProfile,
} from "@/lib/ondo-constants";
import {
  DbMatchPartner,
  fetchMyMatchPartners,
  isStaleAutoCreatedMember,
  mergeProfileExtra,
  fetchMyMemberSecure,
  purgeStaleMemberRow,
  setMatchingPaused,
  syncUserProfileToSupabase,
  toVerificationStatus,
} from "@/lib/supabase";
import { PillNav, HomeTabId, Spinner } from "@/components/ondo-ui";
import { useAppLocale } from "@/lib/i18n";
import { HomeMatchTab } from "@/components/home-match-tab";
import {
  HistoryTab,
  IdealTypeTab,
  MyPageTab,
  ProfileTab,
} from "@/components/home-tabs-secondary";
import LandingPage from "@/components/landing-screen";

const SECTION_KEYS: HomeTabId[] = [
  "lounge",
  "archive",
  "filter",
  "note",
  "settings",
];

function resolveSection(val: string | null): HomeTabId {
  if (val && SECTION_KEYS.includes(val as HomeTabId)) {
    return val as HomeTabId;
  }
  return "lounge";
}

const STORAGE_KEY = "ondo_campus_auth_v3";

// 예전 체험용 샘플 매칭 기록 ID (기기에 남아 있으면 걸러냄)
const SAMPLE_MATCH_IDS = new Set([
  "match-2026-10-25",
  "match-2026-10-23",
  "match-2026-10-20",
  "escrow-101",
  "escrow-102",
]);

type StoredHomeSession =
  | {
      kind: "valid";
      user: Partial<UserProfile>;
      history: MatchHistoryItem[];
      kakaoId: string;
    }
  | { kind: "invalid" } // 저장값은 있지만 직접 가입한 회원 세션이 아님
  | { kind: "none" }
  | { kind: "broken" };

/**
 * 기기에 저장된 로그인 세션을 읽음.
 * 홈 화면은 루트 페이지가 브라우저에서 로그인 여부를 확인한 뒤에만 그려지므로
 * 첫 상태값으로 바로 읽어도 정적 빌드 결과와 어긋나지 않음.
 */
function readStoredHomeSession(): StoredHomeSession {
  if (typeof window === "undefined") return { kind: "none" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { kind: "none" };
    const parsed = JSON.parse(raw);
    const isValid =
      parsed?.isLoggedIn === true &&
      !!parsed?.user?.uid &&
      !isSampleUid(parsed.user.uid) &&
      parsed.user.uid !== "guest-preview" &&
      parsed.user.selfRegisteredV2 === true;
    if (!isValid) return { kind: "invalid" };
    return {
      kind: "valid",
      user: normalizeStoredProfile(parsed.user),
      history: Array.isArray(parsed.history)
        ? parsed.history.filter(
            (item: MatchHistoryItem) => !SAMPLE_MATCH_IDS.has(item.matchId)
          )
        : [],
      kakaoId: typeof parsed.kakaoId === "string" ? parsed.kakaoId : "",
    };
  } catch {
    return { kind: "broken" };
  }
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale] = useAppLocale();
  const isJa = locale === "ja";
  const queryView = searchParams.get("view");
  const initialTab: HomeTabId = resolveSection(queryView);

  const [stored] = useState(readStoredHomeSession);
  const [isAuthenticated, setIsAuthenticated] = useState(
    stored.kind === "valid"
  );
  const [activeTab, setActiveTab] = useState<HomeTabId>(initialTab);
  const [user, setUser] = useState<UserProfile>(() =>
    stored.kind === "valid"
      ? { ...EMPTY_USER_PROFILE, ...stored.user }
      : EMPTY_USER_PROFILE
  );
  const [history, setHistory] = useState<MatchHistoryItem[]>(() =>
    stored.kind === "valid" ? stored.history : []
  );
  const [kakaoId, setKakaoId] = useState<string>(() =>
    stored.kind === "valid" ? stored.kakaoId : ""
  );
  // 서버 기준 학생 인증 상태 (null = 아직 모름 / 게스트)
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [serverMatches, setServerMatches] = useState<DbMatchPartner[]>([]);

  // 서버의 내 회원 정보(티켓·인증·저장된 프로필)와 매칭 목록을 다시 불러옴
  const refreshServerState = useCallback(() => {
    fetchMyMemberSecure().then(async (data) => {
      if (!data) {
        // Account was deleted from DB or was a purged sample -> log out cleanly
        try {
          window.localStorage.removeItem(STORAGE_KEY);
          window.dispatchEvent(new Event("ondo-auth-change"));
        } catch {
          // ignore
        }
        setIsAuthenticated(false);
        router.replace("/");
        return;
      }
      // 본인이 직접 작성·학교인증하지 않은 구버전 자동 생성 행은 즉시 초기화 후 회원가입 화면으로 이동
      if (isStaleAutoCreatedMember(data)) {
        await purgeStaleMemberRow(data);
        setIsAuthenticated(false);
        router.replace(ROUTES.JOIN);
        return;
      }
      setVerifyStatus(toVerificationStatus(data));
      if (data.contact) {
        setKakaoId(data.contact);
      }
      // 서버 값을 기준으로 프로필을 다시 만듦 (예전 샘플 기본값이 남아 있지 않도록)
      setUser((prev) => ({
        ...mergeProfileExtra(EMPTY_USER_PROFILE, data.profile_extra),
        uid: data.id,
        nickname: data.nickname,
        gender: data.gender === "M" || data.gender === "MALE" ? "MALE" : "FEMALE",
        age: data.age,
        school: data.univ,
        department: data.major,
        mbti: data.mbti || null,
        bio: data.bio || "",
        voiceAudioDataUrl: prev.voiceAudioDataUrl,
        verificationStatus: toVerificationStatus(data),
        selfRegisteredV2: true,
        matchingStatus: data.matching_paused
          ? "PAUSED"
          : prev.matchingStatus === "PAUSED"
          ? "ACTIVE"
          : prev.matchingStatus,
        points: (data.tickets ?? 0) * 2900,
        ...(data.voice_audio_url ? { voiceAudioDataUrl: data.voice_audio_url } : {}),
      }));
    });

    // 매칭 상대 정보는 실제 회원 정보만 사용 (연락처는 공개 조건을 채운 매칭에서만 서버가 내려줌)
    fetchMyMatchPartners().then((rows) => {
      setServerMatches(rows);
      setHistory(
        rows.map((m) => ({
          matchId: m.match_id,
          matchDate: (m.created_at || new Date().toISOString()).slice(0, 10),
          partnerUid: m.partner_id,
          partner: {
            uid: m.partner_id,
            nickname: m.nickname,
            age: m.age,
            school: m.univ,
            department: m.major,
            height: m.height ?? 0,
            mbti: m.mbti,
            build: normalizeBuild(m.profile_extra?.build),
            impression: normalizeImpression(m.profile_extra?.impression),
            smokingStatus: m.profile_extra?.smokingStatus ?? null,
            religion: m.profile_extra?.religion ?? null,
            locationLabel: m.location_label,
            hobbies: normalizeHobbies(m.hobbies),
            vibeKeywords: Array.isArray(m.profile_extra?.vibeKeywords)
              ? m.profile_extra.vibeKeywords
              : [],
            voiceIntroText: m.profile_extra?.voiceIntroText ?? undefined,
            bio: m.bio ?? "",
            kakaoId: m.contact ?? undefined,
          },
          resultStatus:
            m.ticket_status === "CHATTING" || m.ticket_status === "CONFIRMED"
              ? "SUCCESS"
              : m.ticket_status === "PENDING"
              ? "PENDING"
              : m.ticket_status === "EXPIRED"
              ? "EXPIRED"
              : "FAILED",
          currentStatus: "ACTIVE",
          myResponse: m.my_response === "PASS" ? "REJECT" : m.my_response,
          partnerResponse: m.partner_response === "PASS" ? "REJECT" : m.partner_response,
          contactUnlocked: !!m.contact,
          pointCost: 2900,
          escrowStatus:
            m.ticket_status === "CONFIRMED"
              ? "CONFIRMED"
              : m.ticket_status === "EXPIRED" || m.ticket_status === "REFUNDED"
              ? "REFUNDED"
              : "HELD",
        }))
      );
    });
  }, [router]);

  useEffect(() => {
    try {
      // 예전 버전의 체험용 저장값은 항상 정리
      window.localStorage.removeItem("ondo_campus_state_v1");
      window.localStorage.removeItem("ondo_campus_state_v2");
    } catch {
      // ignore
    }

    if (stored.kind === "valid") {
      // 자동 매칭/환급 배치는 서버 pg_cron이 실행 (클라이언트 실행 권한 없음)
      refreshServerState();
      return;
    }
    if (stored.kind === "broken") {
      router.replace("/");
      return;
    }
    if (stored.kind === "invalid") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    // 예전 자동 생성 세션이 남아 있던 경우 서버의 레거시 행도 함께 정리한 뒤 회원가입 화면으로 안내
    fetchMyMemberSecure().then(async (data) => {
      if (data && isStaleAutoCreatedMember(data)) {
        await purgeStaleMemberRow(data);
        if (stored.kind === "invalid") router.replace(ROUTES.JOIN);
      }
    });
  }, [stored, router, refreshServerState]);

  const persistState = useCallback(
    (
      nextUser: UserProfile,
      nextHistory: MatchHistoryItem[],
      nextKakao: string
    ) => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isLoggedIn: true,
            user: nextUser,
            history: nextHistory,
            kakaoId: nextKakao,
          })
        );
      } catch {
        // ignore
      }
    },
    []
  );

  const handleUpdateUser = useCallback(
    (patch: Partial<UserProfile>) => {
      setUser((prev) => {
        const updated = { ...prev, ...patch };
        persistState(updated, history, kakaoId);
        syncUserProfileToSupabase(updated, kakaoId);
        if (patch.matchingStatus === "PAUSED" || patch.matchingStatus === "ACTIVE") {
          setMatchingPaused(patch.matchingStatus === "PAUSED");
        }
        return updated;
      });
    },
    [history, kakaoId, persistState]
  );

  const handleUpdateHistory = useCallback(
    (nextHistory: MatchHistoryItem[]) => {
      setHistory(nextHistory);
      persistState(user, nextHistory, kakaoId);
    },
    [user, kakaoId, persistState]
  );

  const handleUpdateKakaoId = useCallback(
    (nextKakao: string) => {
      setKakaoId(nextKakao);
      persistState(user, history, nextKakao);
      syncUserProfileToSupabase(user, nextKakao);
    },
    [user, history, persistState]
  );

  const navigateToTab = useCallback((targetTab: HomeTabId) => {
    setActiveTab(targetTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("setup");
      if (targetTab === "lounge") {
        url.searchParams.delete("view");
      } else {
        url.searchParams.set("view", targetTab);
      }
      window.history.replaceState(window.history.state, "", url.toString());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-[#FAF9F6]">
      {verifyStatus && verifyStatus !== "verified" && (
        <div className="mx-auto mt-3 w-full max-w-2xl px-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-800">
            {verifyStatus === "pending_review" ? (
              isJa ? (
                <>
                  🪪 <b>学生証を確認中です。</b>{" "}
                  通常24時間以内に確認し、結果はカカオアカウントのメールでお知らせします。その間にサイトを見て回ったり、{" "}
                  <button
                    type="button"
                    className="font-bold underline"
                    onClick={() => navigateToTab("note")}
                  >
                    プロフィールを準備
                  </button>
                  しておくと、承認後すぐに紹介が届きます。
                </>
              ) : (
                <>
                  🪪 <b>학생증 확인 중이에요.</b> 보통 24시간 안에 확인하고, 결과는
                  카카오 계정 이메일로 알려 드려요. 그동안 둘러보면서{" "}
                  <button
                    type="button"
                    className="font-bold underline"
                    onClick={() => navigateToTab("note")}
                  >
                    프로필을 미리 채워 두면
                  </button>{" "}
                  승인되자마자 소개팅을 받을 수 있어요.
                </>
              )
            ) : verifyStatus === "rejected" ? (
              isJa ? (
                <>
                  🪪 <b>学生証の確認が却下されました。</b>{" "}
                  カカオ1:1相談室にお問い合わせいただくか、{" "}
                  <button
                    type="button"
                    className="font-bold underline"
                    onClick={() => router.push(ROUTES.JOIN)}
                  >
                    再認証する
                  </button>
                </>
              ) : (
                <>
                  🪪 <b>학생증 확인이 반려됐어요.</b> 카톡 고객센터로 문의하거나{" "}
                  <button
                    type="button"
                    className="font-bold underline"
                    onClick={() => router.push(ROUTES.JOIN)}
                  >
                    다시 인증하기
                  </button>
                </>
              )
            ) : isJa ? (
              <>
                🪪 <b>まだ学生認証が完了していません。</b>{" "}
                認証を完了するとマッチングに参加できます。{" "}
                <button
                  type="button"
                  className="font-bold underline"
                  onClick={() => router.push(ROUTES.JOIN)}
                >
                  学生認証する
                </button>
              </>
            ) : (
              <>
                🪪 <b>아직 학생 인증 전이에요.</b> 인증을 마쳐야 매칭에 참여할
                수 있어요.{" "}
                <button
                  type="button"
                  className="font-bold underline"
                  onClick={() => router.push(ROUTES.JOIN)}
                >
                  학생 인증하기
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* 탭을 바꾸면 내용이 살짝 올라오며 부드럽게 넘어옴 */}
      <div key={activeTab} className="ondo-tab-in flex-1 pb-24">
        {activeTab === "lounge" && (
          <HomeMatchTab
            user={user}
            history={history}
            serverMatches={serverMatches}
            onServerChanged={refreshServerState}
            onUpdateUser={handleUpdateUser}
            onNavigateTab={navigateToTab}
            onAddHistory={(item) => handleUpdateHistory([item, ...history])}
          />
        )}
        {activeTab !== "lounge" && (
          <div className="mx-auto max-w-2xl">
            {activeTab === "filter" && (
              <IdealTypeTab user={user} onUserUpdate={handleUpdateUser} />
            )}
            {activeTab === "note" && (
              <ProfileTab
                user={user}
                onUserUpdate={handleUpdateUser}
                initialSetup={searchParams.get("setup") === "1"}
                onCompleteSetup={() => navigateToTab("lounge")}
              />
            )}
            {activeTab === "archive" && (
              <HistoryTab
                history={history}
                serverMatches={serverMatches}
                isMale={user.gender === "MALE"}
                onServerChanged={refreshServerState}
                userPoints={user.points}
                onUpdateHistory={handleUpdateHistory}
                onDeductPoints={(pts) =>
                  handleUpdateUser({ points: Math.max(0, user.points - pts) })
                }
                onOpenHomeTab={() => navigateToTab("lounge")}
              />
            )}
            {activeTab === "settings" && (
              <MyPageTab
                user={user}
                kakaoId={kakaoId}
                onUserUpdate={handleUpdateUser}
                onKakaoIdUpdate={handleUpdateKakaoId}
              />
            )}
          </div>
        )}
      </div>

      <PillNav active={activeTab} onChange={navigateToTab} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
          <Spinner className="h-6 w-6 text-zinc-900" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

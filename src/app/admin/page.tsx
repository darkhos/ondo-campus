"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminKakaoNotifyCard } from "@/components/admin-kakao-notify-card";
import {
  Check,
  CheckCircle2,
  Coffee,
  Copy,
  Database,
  Flame,
  Inbox,
  Link2,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import {
  ROUTES,
} from "@/lib/ondo-constants";
import {
  DbOndoMember,
  DbSupportTicket,
  checkIsAdmin,
  getAuthUserId,
  signInWithKakao,
  supabase,
} from "@/lib/supabase";
import { Button, cn } from "@/components/ondo-ui";

export const SUPABASE_SETUP_SQL = `-- Server-side isolated in supabase/security_rls_and_rpc.sql`;

interface AdminMember {
  uid: string;
  nickname: string;
  gender: "FEMALE" | "MALE";
  age: number;
  school: string;
  department: string;
  email: string;
  emailVerified: boolean;
  voiceRecorded: boolean;
  voiceAudioDataUrl?: string | null;
  tickets: number;
  mannerTemp: number;
  responseRate: number;
  locationLabel: string;
  kakaoId?: string | null;
  memoNote?: string | null;
  verifyStatus?: string;
  verifyMethod?: string | null;
  schoolEmail?: string | null;
  studentIdImagePath?: string | null;
}

const INITIAL_ADMIN_MEMBERS: AdminMember[] = [];

interface EscrowPair {
  id: string;
  femaleName: string;
  maleName: string;
  schoolPair: string;
  turnsCount: number;
  escrowStatus: "HELD" | "CONFIRMED" | "REFUNDED";
  createdAt: string;
}

const TICKET_KIND_LABEL: Record<DbSupportTicket["kind"], string> = {
  INQUIRY: "💬 문의",
  REPORT: "🚨 신고",
  TOPUP: "☕ 충전 신청",
  INVITE: "🎁 초대코드",
  PROMO: "📣 홍보 인증",
  VERIFY: "🪪 학생증 확인",
};

// 충전 신청 사유(서버가 기록한 "pkg-2 · 커피티켓 2장 · 3,900원")에서 지급할 장수 계산
function topupTickets(reason: string | null): number {
  const pkg = reason?.split(" ")[0];
  return pkg === "pkg-1" ? 1 : pkg === "pkg-2" ? 2 : pkg === "pkg-3" ? 4 : 0;
}

type AdminData =
  | { ok: false }
  | {
      ok: true;
      members: AdminMember[];
      escrowPairs: EscrowPair[];
      tickets: DbSupportTicket[];
    };

/** 운영자 전용 서버 함수로 회원·매칭·문의 목록을 한 번에 불러옴 */
async function loadAdminData(): Promise<AdminData> {
  try {
    const { data: rpcMembers, error: rpcErr } = await supabase.rpc(
      "ondo_admin_list_members"
    );
    if (rpcErr || !Array.isArray(rpcMembers)) return { ok: false };
    const memberRows = rpcMembers as DbOndoMember[];

    const { data: rpcMatches, error: matchRpcErr } = await supabase.rpc(
      "ondo_admin_list_matches"
    );
    const matchRows =
      !matchRpcErr && Array.isArray(rpcMatches) ? rpcMatches : [];

    const { data: rpcTickets, error: ticketRpcErr } = await supabase.rpc(
      "ondo_admin_list_support_tickets"
    );

    return {
      ok: true,
      members: memberRows.map((r: DbOndoMember) => ({
            uid: r.id,
            nickname: r.nickname,
            gender: r.gender === "M" || r.gender === "MALE" ? "MALE" : "FEMALE",
            age: r.age,
            school: r.univ,
            department: r.major,
            email: r.contact.includes("@")
              ? r.contact
              : `${r.id.slice(0, 6)}@univ.ac.kr`,
            emailVerified: r.verified,
            voiceRecorded: r.voice_recorded,
            voiceAudioDataUrl: r.voice_audio_url,
            tickets: r.tickets,
            mannerTemp: Number(r.temp),
            responseRate: 98,
            locationLabel: "서울 신촌·성북",
            kakaoId: r.contact,
            memoNote: r.bio,
            verifyStatus: r.student_id_status,
            verifyMethod: r.verify_method,
            schoolEmail: r.school_email,
            studentIdImagePath: r.student_id_image_path,
          })),
      escrowPairs: matchRows.map((m) => ({
          id: m.id,
          femaleName: m.female_name,
          maleName: m.male_name,
          schoolPair: `가치관 일치 ${m.score ?? 92}%`,
          turnsCount: 3,
          escrowStatus:
            m.ticket_status === "CONFIRMED" || m.ticket_status === "settled"
              ? "CONFIRMED"
              : m.ticket_status === "REFUNDED" || m.ticket_status === "refunded"
              ? "REFUNDED"
              : "HELD",
          createdAt: m.created_at,
        })),
      tickets:
        !ticketRpcErr && Array.isArray(rpcTickets)
          ? (rpcTickets as DbSupportTicket[])
          : [],
    };
  } catch {
    return { ok: false };
  }
}

export default function AdminDashboardPage() {
  // 운영자 확인: 카카오 로그인 + 서버의 운영자 명찰(ondo_admins) 확인
  const [adminState, setAdminState] = useState<
    "checking" | "login" | "denied" | "ok"
  >("checking");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "members" | "matching" | "escrow" | "tickets"
  >("members");
  const [tickets, setTickets] = useState<DbSupportTicket[]>([]);
  const [members, setMembers] = useState<AdminMember[]>(INITIAL_ADMIN_MEMBERS);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  // 첫 불러오기 동안에도 새로고침 아이콘이 돌도록 true 로 시작
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    getAuthUserId().then(async (id) => {
      setAuthUserId(id);
      if (!id) {
        setAdminState("login");
        return;
      }
      setAdminState((await checkIsAdmin()) ? "ok" : "denied");
    });
  }, []);

  const [selectedFemaleUid, setSelectedFemaleUid] = useState<string>("");
  const [selectedMaleUid, setSelectedMaleUid] = useState<string>("");
  const [escrowPairs, setEscrowPairs] = useState<EscrowPair[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const applyAdminData = useCallback((result: AdminData) => {
    setDbConnected(result.ok);
    if (result.ok) {
      setMembers(result.members);
      setEscrowPairs(result.escrowPairs);
      setTickets(result.tickets);
    }
    setSyncing(false);
  }, []);

  const fetchFromSupabase = useCallback(async () => {
    applyAdminData(await loadAdminData());
  }, [applyAdminData]);

  const refreshFromSupabase = () => {
    setSyncing(true);
    void fetchFromSupabase();
  };

  useEffect(() => {
    if (adminState !== "ok") return;
    let cancelled = false;
    loadAdminData().then((result) => {
      if (!cancelled) applyAdminData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [adminState, applyAdminData]);

  const handleGrantTicket = async (uid: string, delta: number) => {
    const { data: nextTickets, error } = await supabase.rpc(
      "ondo_admin_grant_ticket",
      { p_uid: uid, p_delta: delta }
    );
    if (error || nextTickets == null) {
      showToast("티켓 변경에 실패했습니다. 운영자 로그인 상태를 확인해 주세요.");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, tickets: Number(nextTickets) } : m))
    );
    showToast(
      delta > 0
        ? `커피티켓 +${delta}장 지급 완료 (보유 ${nextTickets}장)`
        : `커피티켓 ${-delta}장 차감 완료 (보유 ${nextTickets}장)`
    );
  };

  // 운영자 수동 승인 (학교 메일·학생증 경로로 처리하기 어려운 예외 상황용)
  const handleApproveEmail = async (uid: string) => {
    if (!window.confirm("이 회원을 운영자 수동 확인으로 학생 인증 승인할까요?")) return;
    const { data: removedPath, error } = await supabase.rpc(
      "ondo_admin_review_student",
      { p_member_id: uid, p_approve: true }
    );
    if (error) {
      showToast("승인에 실패했습니다.");
      return;
    }
    if (typeof removedPath === "string" && removedPath) {
      await supabase.storage.from("student-ids").remove([removedPath]);
    }
    setMembers((prev) =>
      prev.map((m) =>
        m.uid === uid
          ? { ...m, emailVerified: true, verifyStatus: "verified", studentIdImagePath: null }
          : m
      )
    );
    showToast("학생 인증을 수동 승인했습니다.");
  };

  const handleCreateManualMatch = async () => {
    const female = members.find((m) => m.uid === selectedFemaleUid);
    const male = members.find((m) => m.uid === selectedMaleUid);
    if (!female || !male) return;

    const { data: created, error } = await supabase.rpc("ondo_admin_create_match", {
      p_match_id: `admin-${Date.now()}`,
      p_female_id: female.uid,
      p_male_id: male.uid,
    });
    if (error || !created) {
      showToast("매칭 생성에 실패했습니다. 운영자 로그인 상태를 확인해 주세요.");
      return;
    }
    await fetchFromSupabase();
    showToast(`${female.nickname}님과 ${male.nickname}님을 매칭했습니다.`);
  };

  const handleRunNightBatchMatching = async () => {
    const { data: batchRes, error: rpcErr } = await supabase.rpc(
      "ondo_admin_run_autonomous_batch"
    );
    if (rpcErr || !batchRes) {
      showToast("자동 매칭 실행에 실패했습니다. 운영자 로그인 상태를 확인해 주세요.");
      return;
    }
    await fetchFromSupabase();
    showToast(
      `자동 매칭 실행 완료 (신규 매칭 ${batchRes.matched_count ?? 0}건 · 24시간 미응답 처리 ${
        batchRes.refunded_count ?? 0
      }건)`
    );
  };

  const femaleCount = members.filter((m) => m.gender === "FEMALE").length;
  const maleCount = members.filter((m) => m.gender === "MALE").length;
  const pendingVerifyCount = members.filter((m) => !m.emailVerified).length;

  if (adminState !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 px-5 text-white">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-7 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white">
              <Flame className="h-4 w-4" fill="currentColor" />
            </div>
            <div>
              <p className="text-[15px] font-black tracking-tight">
                ONDO 36.5° ADMIN LOCK
              </p>
              <p className="text-[12px] text-zinc-400">
                운영자 전용 보안 접속 (일반 학우 접근 제한)
              </p>
            </div>
          </div>

          {adminState === "checking" && (
            <p className="mt-5 text-[13px] text-zinc-400">운영자 계정 확인 중…</p>
          )}

          {adminState === "login" && (
            <>
              <p className="mt-5 text-[13px] leading-relaxed text-zinc-300">
                운영자로 등록된 카카오 계정으로 로그인해 주세요.
              </p>
              <Button
                fullWidth
                size="lg"
                variant="kakao"
                className="mt-4"
                onClick={() => signInWithKakao("/admin")}
              >
                카카오로 운영자 로그인
              </Button>
            </>
          )}

          {adminState === "denied" && (
            <>
              <p className="mt-5 text-[13px] leading-relaxed text-zinc-300">
                이 카카오 계정은 운영자로 등록되어 있지 않습니다.
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
                Supabase SQL Editor에서 아래 SQL을 실행하면 즉시 운영자로 등록됩니다.
              </p>
              <p className="mt-2 break-all rounded-xl bg-zinc-900 px-3 py-2 font-mono text-[12px] text-zinc-300">
                {`insert into public.ondo_admins (auth_user_id) values ('${authUserId}');`}
              </p>
              <Button
                fullWidth
                size="md"
                className="mt-3 bg-rose-600 hover:bg-rose-700"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `insert into public.ondo_admins (auth_user_id) values ('${authUserId}');`
                    );
                    showToast("운영자 등록 SQL이 클립보드에 복사되었습니다!");
                  } catch {
                    // ignore
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                운영자 등록 SQL 1클릭 복사
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900">
      {/* Top Operator Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-zinc-900 text-white">
        <div className="mx-auto flex h-15 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white">
              <Flame className="h-4 w-4" fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-black tracking-tight">
                  ONDO 36.5° ADMIN
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    dbConnected
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  )}
                >
                  <Database className="h-3 w-3" />
                  {dbConnected
                    ? "Supabase 실시간 DB 연결됨"
                    : "Supabase 테이블 초기 생성 필요"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                DB 엔드포인트: ofnechamnjafsjmuydpl.supabase.co
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshFromSupabase}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-zinc-800 px-3 text-[12px] font-bold text-zinc-200 hover:bg-zinc-700"
            >
              <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
              DB 새로고침
            </button>
            <Link
              href={ROUTES.HOME}
              className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-zinc-900 transition-colors hover:bg-stone-200"
            >
              학생 메인 라운지(/) →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        {/* If Supabase table isn't created yet, show 1-click SQL setup box */}
        {dbConnected === false && (
          <section className="rounded-3xl border-2 border-rose-200 bg-rose-50/70 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  최초 1회 설정 (30초 완료)
                </span>
                <h2 className="mt-2 text-[17px] font-black text-zinc-900">
                  Supabase에 회원·매칭 표(Table)를 생성해 주세요!
                </h2>
                <p className="mt-1 text-[13px] text-zinc-600">
                  우측 버튼을 눌러 SQL을 복사한 뒤, Supabase 좌측 메뉴{" "}
                  <strong>[SQL Editor] → [New query]</strong>에 붙여넣고{" "}
                  <strong>[Run]</strong>을 누르면 즉시 실시간 DB가 작동합니다.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="md"
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={async () => {
                    await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                    setSqlCopied(true);
                    setTimeout(() => setSqlCopied(false), 2500);
                  }}
                >
                  {sqlCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      SQL 복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      테이블 생성 SQL 복사
                    </>
                  )}
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={refreshFromSupabase}
                >
                  Run 완료 후 연결 확인
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* KPI Summary Cards */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <span className="text-[12px] font-bold text-zinc-400">
              가입 대학생 및 성비
            </span>
            <p className="mt-1 text-[24px] font-black text-zinc-900">
              {members.length}명
            </p>
            <p className="mt-1 text-[12px] font-semibold text-rose-600">
              여 {femaleCount} : 남 {maleCount} (황금 성비)
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <span className="text-[12px] font-bold text-zinc-400">
              학생증·재학 인증 대기
            </span>
            <p className="mt-1 text-[24px] font-black text-zinc-900">
              {pendingVerifyCount}건
            </p>
            <p className="mt-1 text-[12px] font-medium text-zinc-500">
              승인 완료 {members.length - pendingVerifyCount}명
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <span className="text-[12px] font-bold text-zinc-400">
              활성 블라인드 커피챗 룸
            </span>
            <p className="mt-1 text-[24px] font-black text-zinc-900">
              {escrowPairs.length}개
            </p>
            <p className="mt-1 text-[12px] font-semibold text-emerald-600">
              에스크로 보호 작동 중
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <span className="text-[12px] font-bold text-zinc-400">
              첫 답장 응답률
            </span>
            <p className="mt-1 text-[24px] font-black text-zinc-900">97.4%</p>
            <p className="mt-1 text-[12px] font-medium text-zinc-500">
              미응답 티켓 자동 반환 보장
            </p>
          </div>
        </section>

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
          {(
            [
              {
                id: "members",
                label: "01 회원 & 커피티켓 지급 관리",
                icon: Users,
              },
              {
                id: "matching",
                label: "02 수동·자동 매칭 컨트롤러",
                icon: Link2,
              },
              {
                id: "escrow",
                label: "03 에스크로 정산 & 환불 관리",
                icon: ShieldCheck,
              },
              {
                id: "tickets",
                label: `04 문의·신고함 (${
                  tickets.filter((t) => t.status === "OPEN").length
                })`,
                icon: Inbox,
              },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-all",
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white text-zinc-600 ring-1 ring-stone-200 hover:bg-stone-100"
                )}
              >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Members & Ticket Granting */}
        {activeTab === "members" && (
          <section className="space-y-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-[18px] font-extrabold text-zinc-900">
                  가입 대학생 목록 및 커피티켓 수동 충전
                </h2>
                <p className="text-[12px] text-zinc-500">
                  다른 사람이 /join 에서 가입하거나 가치관 노트를 작성하면 이 목록에 실시간으로 추가됩니다.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
              <div className="divide-y divide-stone-100">
                {members.map((m) => {
                  const isDemo = INITIAL_ADMIN_MEMBERS.some(
                    (d) => d.uid === m.uid
                  );
                  return (
                  <div
                    key={m.uid}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-bold",
                            isDemo
                              ? "bg-stone-100 text-zinc-500"
                              : "bg-emerald-600 text-white"
                          )}
                        >
                          {isDemo ? "샘플 예시" : "실제 가입자"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            m.gender === "FEMALE"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-stone-100 text-zinc-700"
                          )}
                        >
                          {m.gender === "FEMALE" ? "여성" : "남성"} · {m.age}세
                        </span>
                        <span className="text-[15px] font-extrabold text-zinc-900">
                          {m.nickname}
                        </span>
                        {m.emailVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {m.verifyMethod === "SCHOOL_EMAIL"
                              ? `학교 메일 인증 (${m.schoolEmail ?? "-"})`
                              : m.verifyMethod === "ADMIN_REVIEW"
                              ? "운영자 확인 인증"
                              : "인증됨 (이전 방식)"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            {m.verifyStatus === "pending_review"
                              ? "학생증 확인 대기"
                              : m.verifyStatus === "rejected"
                              ? "학생증 반려됨"
                              : "학생 인증 전"}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-zinc-500">
                        {m.school} {m.department} · {m.locationLabel} · 카톡ID:{" "}
                        <span className="font-mono font-semibold text-zinc-700">
                          {m.kakaoId || "미등록"}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF9F6] px-3 py-1.5 text-[12px] font-bold text-zinc-800 ring-1 ring-stone-200">
                        <Coffee className="h-3.5 w-3.5 text-rose-600" />
                        보유 티켓 {m.tickets}장
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleGrantTicket(m.uid, 1)}
                        className="bg-rose-600 hover:bg-rose-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        티켓 +1 지급
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGrantTicket(m.uid, -1)}
                      >
                        -1 차감
                      </Button>

                      {m.studentIdImagePath && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            if (!m.studentIdImagePath) return;
                            const { data, error } = await supabase.storage
                              .from("student-ids")
                              .createSignedUrl(m.studentIdImagePath, 300);
                            if (error || !data?.signedUrl) {
                              showToast("학생증 사진을 불러오지 못했습니다.");
                              return;
                            }
                            window.open(
                              data.signedUrl,
                              "_blank",
                              "noopener,noreferrer"
                            );
                          }}
                        >
                          🪪 학생증 보기
                        </Button>
                      )}

                      {!m.emailVerified && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleApproveEmail(m.uid)}
                        >
                          수동 인증 승인
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `${m.nickname} 회원과 매칭 기록을 영구 삭제할까요? 되돌릴 수 없습니다.`
                            )
                          )
                            return;
                          const { data: deleted, error } = await supabase.rpc(
                            "ondo_admin_delete_members",
                            { p_uids: [m.uid] }
                          );
                          if (error || deleted !== true) {
                            showToast("회원 삭제에 실패했습니다.");
                            return;
                          }
                          setMembers((prev) =>
                            prev.filter((item) => item.uid !== m.uid)
                          );
                          showToast(`${m.nickname} 회원을 삭제했습니다.`);
                        }}
                        className="rounded-xl px-2.5 py-1.5 text-[12px] font-bold text-zinc-400 hover:bg-stone-100 hover:text-rose-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Manual & Automated Batch Matching Controller */}
        {activeTab === "matching" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Manual Matchmaker */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <span className="text-[12px] font-bold text-rose-600 uppercase">
                Manual Matchmaker
              </span>
              <h3 className="mt-1 text-[18px] font-extrabold text-zinc-900">
                운영자 수동 커플 매칭 연결
              </h3>
              <p className="mt-1 text-[13px] text-zinc-500">
                초기 런칭 단계에서 운영자가 가치관 노트와 선호 조건을 검토해 최적의 남녀 회원을 직접 연결해 줄 수 있습니다.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-zinc-600">
                    여성 회원 선택
                  </label>
                  <select
                    value={selectedFemaleUid}
                    onChange={(e) => setSelectedFemaleUid(e.target.value)}
                    className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 text-[14px] font-semibold"
                  >
                    {members
                      .filter((m) => m.gender === "FEMALE")
                      .map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.nickname} ({m.school} · {m.age}세)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-zinc-600">
                    남성 회원 선택
                  </label>
                  <select
                    value={selectedMaleUid}
                    onChange={(e) => setSelectedMaleUid(e.target.value)}
                    className="h-11 w-full rounded-xl border border-stone-200 bg-[#FAF9F6] px-3 text-[14px] font-semibold"
                  >
                    {members
                      .filter((m) => m.gender === "MALE")
                      .map((m) => (
                        <option key={m.uid} value={m.uid}>
                          {m.nickname} ({m.school} · {m.age}세)
                        </option>
                      ))}
                  </select>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={handleCreateManualMatch}
                >
                  <Link2 className="h-4 w-4" />
                  선택한 두 회원 즉시 매칭 연결하기
                </Button>
              </div>
            </div>

            {/* Night 10 PM Batch Matching Trigger */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <span className="text-[12px] font-bold text-zinc-400 uppercase">
                Automated Cron Engine
              </span>
              <h3 className="mt-1 text-[18px] font-extrabold text-zinc-900">
                밤 10시 AI 가치관 배치 매칭 실행기
              </h3>
              <p className="mt-1 text-[13px] text-zinc-500">
                매일 밤 10시 정각에 실행되는 자동 매칭 알고리즘(같은 학교 제외 + 생활권 클러스터 + 가치관 투표 일치율 계산)을 지금 즉시 수동 트리거합니다.
              </p>

              <div className="mt-5 rounded-2xl bg-[#FAF9F6] p-4 text-[12px] text-zinc-600">
                <p className="font-bold text-zinc-900">현재 매칭 엔진 규칙:</p>
                <ul className="mt-1.5 list-inside list-disc space-y-1">
                  <li>같은 학교 제외 필터 (100% 하드 블록)</li>
                  <li>캠퍼스 밸런스 투표 3문항 가중치 (40%)</li>
                  <li>생활권 거리 및 선호 나이/키 부합도 (40%)</li>
                  <li>스마트 조건 1단계 자동 완화 활성화 (20%)</li>
                </ul>
              </div>

              <Button
                fullWidth
                size="lg"
                className="mt-5"
                onClick={handleRunNightBatchMatching}
              >
                <Zap className="h-4 w-4 text-amber-400" fill="currentColor" />
                오늘 밤 10시 일괄 매칭 즉시 실행
              </Button>
            </div>
          </section>
        )}

        {/* TAB 3: Escrow Settlement & Refund Management */}
        {activeTab === "escrow" && (
          <section className="space-y-3">
            <div>
              <h2 className="text-[18px] font-extrabold text-zinc-900">
                에스크로 커피티켓 정산 및 자동 반환 관리
              </h2>
              <p className="text-[12px] text-zinc-500">
                블라인드 룸에서 첫 답장이 오가면 [정산 확정] 처리하고, 24시간 미응답 시 [티켓 100% 반환]으로 처리합니다.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
              <div className="divide-y divide-stone-100">
                {escrowPairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-extrabold text-zinc-900">
                          {pair.femaleName} ❤️ {pair.maleName}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[12px] font-bold",
                            pair.escrowStatus === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700"
                              : pair.escrowStatus === "REFUNDED"
                              ? "bg-stone-100 text-zinc-600"
                              : "bg-amber-50 text-amber-700"
                          )}
                        >
                          {pair.escrowStatus === "CONFIRMED"
                            ? "첫 답장 완료 · 티켓 정산 확정"
                            : pair.escrowStatus === "REFUNDED"
                            ? "24h 미응답 · 티켓 100% 반환됨"
                            : "에스크로 보관 중 (답장 대기)"}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-zinc-500">
                        {pair.schoolPair} · 누적 대화 {pair.turnsCount}턴 · 생성:{" "}
                        {pair.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {pair.escrowStatus === "HELD" &&
                        (["CONFIRMED", "REFUNDED"] as const).map((next) => (
                          <Button
                            key={next}
                            size="sm"
                            variant={next === "CONFIRMED" ? "primary" : "secondary"}
                            onClick={async () => {
                              const ok = window.confirm(
                                next === "CONFIRMED"
                                  ? `${pair.femaleName} ↔ ${pair.maleName} 매칭을 확정할까요? 확정하면 두 사람에게 서로의 카카오톡 ID가 공개됩니다.`
                                  : `${pair.femaleName} ↔ ${pair.maleName} 매칭을 미응답 종료로 처리할까요? (티켓은 자동으로 지급되지 않으니, 필요하면 회원 목록에서 직접 지급해 주세요)`
                              );
                              if (!ok) return;
                              const { data: updated, error } = await supabase.rpc(
                                "ondo_admin_update_match_status",
                                { p_match_id: pair.id, p_status: next }
                              );
                              if (error || updated !== true) {
                                showToast("매칭 상태 변경에 실패했습니다.");
                                return;
                              }
                              setEscrowPairs((prev) =>
                                prev.map((p) =>
                                  p.id === pair.id ? { ...p, escrowStatus: next } : p
                                )
                              );
                              showToast(
                                next === "CONFIRMED"
                                  ? "매칭을 확정했습니다. 두 사람에게 연락처가 공개됩니다."
                                  : "매칭을 미응답 종료로 처리했습니다."
                              );
                            }}
                          >
                            {next === "CONFIRMED" ? "확정 · 연락처 공개" : "미응답 종료"}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* TAB 4: Support Inquiries & Reports */}
        {activeTab === "tickets" && (
          <section className="space-y-3">
            <div>
              <h2 className="text-[18px] font-extrabold text-zinc-900">
                고객 문의 및 신고 접수함
              </h2>
              <p className="text-[12px] text-zinc-500">
                FAQ 문의·회원 신고·티켓 충전 신청·초대코드·홍보 인증이 이곳에 쌓이고, 접수 즉시 운영자 메일(연결하면 카톡)로도 알림이 갑니다. 처리한 건은 [처리 완료]로 표시하세요.
              </p>
            </div>

            <AdminKakaoNotifyCard />

            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
              {tickets.length === 0 ? (
                <p className="p-6 text-center text-[13px] text-zinc-500">
                  접수된 문의·신고가 없습니다.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {tickets.map((t) => {
                    const member = t.member_id
                      ? members.find((m) => m.uid === t.member_id)
                      : undefined;
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          "flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start",
                          t.status === "DONE" && "opacity-55"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[12px] font-bold",
                                t.kind === "REPORT"
                                  ? "bg-rose-50 text-rose-700"
                                  : t.kind === "TOPUP"
                                  ? "bg-amber-50 text-amber-800"
                                  : t.kind === "INQUIRY"
                                  ? "bg-sky-50 text-sky-700"
                                  : t.kind === "VERIFY"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-emerald-50 text-emerald-700"
                              )}
                            >
                              {TICKET_KIND_LABEL[t.kind]}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[12px] font-bold",
                                t.status === "OPEN"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-stone-100 text-zinc-600"
                              )}
                            >
                              {t.status === "OPEN" ? "미처리" : "처리 완료"}
                            </span>
                            <span className="text-[12px] text-zinc-400">
                              #{t.id} ·{" "}
                              {new Date(t.created_at).toLocaleString("ko-KR")}
                            </span>
                          </div>
                          {t.reason && (
                            <p className="mt-2 text-[13px] font-bold text-zinc-900">
                              {t.reason}
                            </p>
                          )}
                          <p className="mt-1 whitespace-pre-wrap break-words text-[13px] text-zinc-700">
                            {t.message}
                          </p>
                          <p className="mt-2 text-[12px] text-zinc-500">
                            {member
                              ? `회원: ${member.nickname} (${member.school})`
                              : t.member_id
                              ? `회원 ID: ${t.member_id}`
                              : "비회원"}
                            {t.reply_contact
                              ? ` · 답변 연락처: ${t.reply_contact}`
                              : member?.kakaoId
                              ? ` · 회원 카카오톡: ${member.kakaoId}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                        {t.kind === "VERIFY" && t.status === "OPEN" && t.member_id && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!member?.studentIdImagePath}
                              onClick={async () => {
                                const path = member?.studentIdImagePath;
                                if (!path) return;
                                const { data, error } = await supabase.storage
                                  .from("student-ids")
                                  .createSignedUrl(path, 300);
                                if (error || !data?.signedUrl) {
                                  showToast("학생증 사진을 불러오지 못했습니다.");
                                  return;
                                }
                                window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                              }}
                            >
                              🪪 학생증 사진 보기
                            </Button>
                            {(["approve", "reject"] as const).map((action) => (
                              <Button
                                key={action}
                                size="sm"
                                variant={action === "approve" ? "destructive" : "ghost"}
                                onClick={async () => {
                                  const ok = window.confirm(
                                    action === "approve"
                                      ? `${member?.nickname ?? t.member_id}님의 학생 인증을 승인할까요? 승인하면 학생증 사진은 바로 삭제됩니다.`
                                      : `${member?.nickname ?? t.member_id}님의 학생 인증을 반려할까요? 반려하면 학생증 사진은 바로 삭제되고, 회원은 다시 올려야 합니다.`
                                  );
                                  if (!ok) return;
                                  const { data: removedPath, error } = await supabase.rpc(
                                    "ondo_admin_review_student",
                                    { p_member_id: t.member_id, p_approve: action === "approve" }
                                  );
                                  if (error) {
                                    showToast("처리에 실패했습니다.");
                                    return;
                                  }
                                  if (typeof removedPath === "string" && removedPath) {
                                    await supabase.storage.from("student-ids").remove([removedPath]);
                                  }
                                  setTickets((prev) =>
                                    prev.map((x) =>
                                      x.id === t.id ? { ...x, status: "DONE" } : x
                                    )
                                  );
                                  setMembers((prev) =>
                                    prev.map((m) =>
                                      m.uid === t.member_id
                                        ? {
                                            ...m,
                                            emailVerified: action === "approve",
                                            verifyStatus: action === "approve" ? "verified" : "rejected",
                                            studentIdImagePath: null,
                                          }
                                        : m
                                    )
                                  );
                                  showToast(
                                    action === "approve"
                                      ? "학생 인증을 승인했고, 학생증 사진을 삭제했습니다."
                                      : "학생 인증을 반려했고, 학생증 사진을 삭제했습니다."
                                  );
                                }}
                              >
                                {action === "approve" ? "✅ 학생 인증 승인" : "반려"}
                              </Button>
                            ))}
                          </>
                        )}
                        {t.kind === "TOPUP" &&
                          t.status === "OPEN" &&
                          t.member_id &&
                          topupTickets(t.reason) > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                const n = topupTickets(t.reason);
                                if (
                                  !window.confirm(
                                    `입금을 확인하셨나요? ${member?.nickname ?? t.member_id}님에게 커피티켓 ${n}장을 지급합니다.`
                                  )
                                )
                                  return;
                                const { data: granted, error: grantErr } =
                                  await supabase.rpc("ondo_admin_grant_ticket", {
                                    p_uid: t.member_id,
                                    p_delta: n,
                                  });
                                if (grantErr || granted == null) {
                                  showToast("티켓 지급에 실패했습니다.");
                                  return;
                                }
                                await supabase.rpc(
                                  "ondo_admin_update_support_ticket",
                                  { p_id: t.id, p_status: "DONE" }
                                );
                                setTickets((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id ? { ...x, status: "DONE" } : x
                                  )
                                );
                                setMembers((prev) =>
                                  prev.map((m) =>
                                    m.uid === t.member_id
                                      ? { ...m, tickets: Number(granted) }
                                      : m
                                  )
                                );
                                showToast(
                                  `커피티켓 ${n}장 지급 완료 (보유 ${granted}장)`
                                );
                              }}
                            >
                              입금 확인 · 티켓 {topupTickets(t.reason)}장 지급
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant={t.status === "OPEN" ? "primary" : "secondary"}
                          onClick={async () => {
                            const nextStatus =
                              t.status === "OPEN" ? "DONE" : "OPEN";
                            const { data, error } = await supabase.rpc(
                              "ondo_admin_update_support_ticket",
                              {
                                p_id: t.id,
                                p_status: nextStatus,
                              }
                            );
                            if (error || data !== true) {
                              showToast("상태 변경에 실패했습니다. PIN과 로그인 상태를 확인해 주세요.");
                              return;
                            }
                            setTickets((prev) =>
                              prev.map((x) =>
                                x.id === t.id ? { ...x, status: nextStatus } : x
                              )
                            );
                          }}
                        >
                          {t.status === "OPEN" ? "처리 완료" : "다시 열기"}
                        </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {toast && (
        <div className="fixed inset-x-0 bottom-8 z-50 mx-auto max-w-md px-5">
          <div className="rounded-full bg-zinc-900 px-5 py-3 text-center text-[13px] font-bold text-white shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

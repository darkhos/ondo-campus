import { createClient } from "@supabase/supabase-js";
import {
  EMPTY_USER_PROFILE,
  UserProfile,
  normalizeStoredProfile,
} from "@/lib/ondo-constants";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ofnechamnjafsjmuydpl.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_64pAlvJvZtArHukfUczzjQ_OgLYqgz6";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

function getBasePath(): string {
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    return process.env.NEXT_PUBLIC_BASE_PATH;
  }
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/ondo-campus")
  ) {
    return "/ondo-campus";
  }
  return "";
}
const AUTH_STORAGE_KEY = "ondo_campus_auth_v3";
const AUTH_NEXT_KEY = "ondo_auth_next_path";
const OAUTH_LOGIN_ATTEMPT_KEY = "ondo_oauth_login_attempt";
// 예전 "기기에 저장된 계정(카카오ID 원터치 입장)" 기능의 저장소 키 — 이제 사용하지 않고 삭제만 함
const LEGACY_SAVED_ACCOUNTS_KEY = "ondo_campus_saved_accounts_v1";

export interface DbOndoMember {
  id: string;
  nickname: string;
  univ: string;
  major: string;
  gender: "F" | "M" | "FEMALE" | "MALE";
  age: number;
  mbti: string;
  temp: number;
  verified: boolean;
  student_id_status: string;
  voice_recorded: boolean;
  voice_duration: string;
  voice_audio_url?: string | null;
  tickets: number;
  joined_at: string;
  contact: string;
  bio?: string | null;
  updated_at?: string;
  verify_method?: "SCHOOL_EMAIL" | "ADMIN_REVIEW" | null;
  school_email?: string | null;
  student_id_image_path?: string | null;
  matching_paused?: boolean;
  profile_extra?: Partial<UserProfile> & { locationLabel?: string };
}

export interface DbOndoMatch {
  id: string;
  female_id: string;
  female_name: string;
  male_id: string;
  male_name: string;
  score: number;
  ticket_status: string;
  created_at: string;
}

export type SupportTicketKind =
  | "INQUIRY"
  | "REPORT"
  | "TOPUP"
  | "INVITE"
  | "PROMO"
  | "VERIFY";

export interface DbSupportTicket {
  id: number;
  kind: SupportTicketKind;
  member_id: string | null;
  reply_contact: string | null;
  reason: string | null;
  message: string;
  status: "OPEN" | "DONE";
  created_at: string;
}

export type SupportTicketResult =
  | { ok: true }
  | { ok: false; error: "login_required" | "rate_limited" | "failed" };

/**
 * [문의·신고함] 전용 상자에 접수 (회원 자기소개·연락처는 건드리지 않음)
 * 문의(INQUIRY)는 비회원도 가능, 나머지(신고·충전신청·초대코드·홍보인증)는 로그인 회원만 가능
 */
export async function submitSupportTicket(params: {
  kind: SupportTicketKind;
  message: string;
  replyContact?: string;
  reason?: string;
}): Promise<SupportTicketResult> {
  try {
    const { data, error } = await supabase.rpc("ondo_submit_support_ticket", {
      p_kind: params.kind,
      p_message: params.message,
      p_reply_contact: params.replyContact ?? null,
      p_reason: params.reason ?? null,
    });
    if (!error && data != null) return { ok: true };
    const msg = error?.message ?? "";
    if (msg.includes("Login required")) return { ok: false, error: "login_required" };
    if (msg.includes("Rate limit")) return { ok: false, error: "rate_limited" };
    return { ok: false, error: "failed" };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/**
 * [신분증 🪪] 카카오 로그인 시작 — 로그인 후 /auth/callback 으로 돌아옵니다.
 * nextPath: 아직 가입 전인 사람을 로그인 후 보낼 경로 (예: 트랙 파라미터가 붙은 가입 페이지)
 */
export async function signInWithKakao(nextPath?: string): Promise<void> {
  try {
    window.sessionStorage.setItem(OAUTH_LOGIN_ATTEMPT_KEY, "1");
    if (nextPath) window.sessionStorage.setItem(AUTH_NEXT_KEY, nextPath);
    else window.sessionStorage.removeItem(AUTH_NEXT_KEY);
  } catch {
    // ignore
  }
  const basePath = getBasePath();
  await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}${basePath}/auth/callback/`,
    },
  });
}

export function consumeOAuthLoginAttempt(): boolean {
  try {
    const val = window.sessionStorage.getItem(OAUTH_LOGIN_ATTEMPT_KEY);
    window.sessionStorage.removeItem(OAUTH_LOGIN_ATTEMPT_KEY);
    return val === "1";
  } catch {
    return false;
  }
}

export function consumeAuthNextPath(): string | null {
  try {
    const next = window.sessionStorage.getItem(AUTH_NEXT_KEY);
    window.sessionStorage.removeItem(AUTH_NEXT_KEY);
    // 같은 사이트 내부 경로만 허용 (오픈 리다이렉트 방지)
    return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  } catch {
    return null;
  }
}

/** 현재 로그인한 카카오 계정이 운영자(ondo_admins)인지 서버에 확인 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("ondo_is_admin");
    return !error && data === true;
  } catch {
    return false;
  }
}

/** 현재 카카오 로그인된 Supabase 계정 id (로그인 안 했으면 null) */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

export async function signOutKakao(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

export function toVerificationStatus(
  member: Pick<
    DbOndoMember,
    "verified" | "student_id_status" | "verify_method"
  >
): "verified" | "pending" | "pending_review" | "rejected" {
  // 실제 학교 웹메일 인증(SCHOOL_EMAIL) 또는 운영팀 학생증 승인(ADMIN_REVIEW)을 거친 경우에만 인증 완료로 인정
  if (
    member.verified &&
    (member.verify_method === "SCHOOL_EMAIL" ||
      member.verify_method === "ADMIN_REVIEW")
  ) {
    return "verified";
  }
  return member.student_id_status === "pending_review" ||
    member.student_id_status === "rejected"
    ? member.student_id_status
    : "pending";
}

/**
 * 사용자가 직접 회원가입(/join) 폼을 작성해 등록한 계정이 아니라
 * 예전 테스트/자동 생성으로 만들어진 레거시 행인지 판별
 */
export function isStaleAutoCreatedMember(
  member: DbOndoMember | null | undefined
): boolean {
  if (!member) return false;
  return member.profile_extra?.selfRegisteredV2 !== true;
}

/**
 * 회원가입(/join)과 학교 인증 절차(웹메일 6자리 인증 완료 또는 학생증 운영팀 심사 접수/승인)까지
 * 모두 마친 정식 기존 회원인지 판별합니다.
 */
export function isCompletedMember(
  member: DbOndoMember | null | undefined
): member is DbOndoMember {
  if (!member) return false;
  if (isStaleAutoCreatedMember(member)) return false;
  if (!member.nickname?.trim() || !member.univ?.trim()) return false;
  const hasValidVerification =
    (member.verified &&
      (member.verify_method === "SCHOOL_EMAIL" ||
        member.verify_method === "ADMIN_REVIEW")) ||
    (member.verify_method === "ADMIN_REVIEW" &&
      member.student_id_status === "pending_review");
  return hasValidVerification;
}

/**
 * 레거시 자동 생성 프로필·자동 학교인증 행을 DB와 로컬 저장소에서 초기화
 * (운영자 권한(ondo_admins)과 카카오 로그인 세션은 최대한 유지)
 */
export async function purgeStaleMemberRow(
  member?: DbOndoMember | null
): Promise<{ sessionKept: boolean }> {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem("ondo_campus_state_v1");
    window.localStorage.removeItem("ondo_campus_state_v2");
    window.localStorage.removeItem(LEGACY_SAVED_ACCOUNTS_KEY);
  } catch {
    // ignore
  }

  try {
    const target = member ?? (await fetchMyMemberSecure());
    if (!target) {
      return { sessionKept: true };
    }

    // 1) 전용 프로필 초기화 RPC 시도 (auth.users 및 ondo_admins 보존)
    await supabase.rpc("ondo_reset_my_profile");

    // 2) 운영자 계정인 경우 이미 배포된 ondo_admin_delete_members 로 본인 회원 행만 즉시 삭제 (auth.users 및 ondo_admins 보존)
    await supabase.rpc("ondo_admin_delete_members", {
      p_uids: [target.id],
    });

    const checkAfter = await fetchMyMemberSecure();
    if (!checkAfter) {
      return { sessionKept: true };
    }

    // 3) 일반 계정이고 아직 ondo_reset_my_profile SQL 적용 전이면 ondo_delete_my_account 로 레거시 회원 행 완전 삭제
    await supabase.rpc("ondo_delete_my_account");
    await signOutKakao();
    return { sessionKept: false };
  } catch {
    return { sessionKept: true };
  }
}

/** 서버에서 받은 내 회원 정보로 기기 로그인 상태를 저장 */
export function persistMemberSession(member: DbOndoMember): void {
  try {
    window.localStorage.removeItem(LEGACY_SAVED_ACCOUNTS_KEY);
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.isLoggedIn = true;
    parsed.user = {
      ...mergeProfileExtra(EMPTY_USER_PROFILE, member.profile_extra),
      uid: member.id,
      nickname: member.nickname,
      gender:
        member.gender === "M" || member.gender === "MALE" ? "MALE" : "FEMALE",
      age: member.age,
      school: member.univ,
      department: member.major,
      mbti: member.mbti || null,
      points: (member.tickets ?? 0) * 2900,
      voiceAudioDataUrl: member.voice_audio_url ?? null,
      bio: member.bio || "",
      verificationStatus: toVerificationStatus(member),
      selfRegisteredV2: member.profile_extra?.selfRegisteredV2 === true,
    };
    parsed.kakaoId = member.contact || "";
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
    window.dispatchEvent(new Event("ondo-auth-change"));
  } catch {
    // ignore
  }
}

/** 서버에 함께 보관할 프로필·이상형 값 (음성 파일처럼 큰 데이터는 제외) */
function buildProfileExtra(user: UserProfile) {
  return {
    selfRegisteredV2: true,
    height: user.height,
    location: user.location,
    locationLabel: user.location?.label ?? null,
    hobbies: user.hobbies,
    build: user.build,
    impression: user.impression,
    smokingStatus: user.smokingStatus,
    religion: user.religion,
    vibeKeywords: user.vibeKeywords,
    voiceIntroText: user.voiceIntroText ?? null,
    preferredAgeMin: user.preferredAgeMin,
    preferredAgeMax: user.preferredAgeMax,
    preferredHeight: user.preferredHeight,
    avoidSameSchool: user.avoidSameSchool,
    preferredMbti: user.preferredMbti,
    preferredSmoking: user.preferredSmoking,
    preferredImpressions: user.preferredImpressions,
    preferredBuilds: user.preferredBuilds,
    preferredReligion: user.preferredReligion,
    smartRelaxFilter: user.smartRelaxFilter ?? null,
  };
}

/** 서버에 보관된 프로필·이상형 값을 화면용 프로필에 합침 */
export function mergeProfileExtra(
  user: UserProfile,
  extra: DbOndoMember["profile_extra"]
): UserProfile {
  if (!extra || typeof extra !== "object") return user;
  const picked: Partial<UserProfile> = {};
  for (const [k, v] of Object.entries(normalizeStoredProfile(extra))) {
    if (k === "locationLabel" || v === null || v === undefined) continue;
    (picked as Record<string, unknown>)[k] = v;
  }
  return { ...user, ...picked };
}

/**
 * [사물함 자물쇠 0] 내 프로필 저장 — 서버가 로그인 토큰으로 본인 행만 수정 (티켓 조작 불가)
 */
export async function syncUserProfileToSupabase(
  user: UserProfile,
  kakaoId: string
): Promise<boolean> {
  const contactVal = kakaoId || "ondo_univ";
  try {
    const { data: rpcRow, error: rpcErr } = await supabase.rpc(
      "ondo_upsert_my_profile",
      {
        p_nickname: user.nickname,
        p_univ: user.school,
        p_major: user.department,
        p_gender: user.gender === "FEMALE" ? "F" : "M",
        p_age: user.age,
        p_mbti: user.mbti || "",
        p_contact: contactVal,
        p_bio: user.bio ?? "",
        p_extra: buildProfileExtra(user),
      }
    );
    return Boolean(!rpcErr && rpcRow);
  } catch {
    return false;
  }
}

/**
 * [사물함 자물쇠 1] 로그인한 본인 회원 정보 1건 조회
 */
export async function fetchMyMemberSecure(): Promise<DbOndoMember | null> {
  try {
    const { data: rpcRows, error: rpcErr } = await supabase.rpc(
      "ondo_get_my_profile"
    );
    if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
      return rpcRows[0] as DbOndoMember;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * [사물함 자물쇠 2] 로그인한 본인 매칭 내역만 조회
 */
export async function fetchMyMatchesSecure(): Promise<DbOndoMatch[]> {
  try {
    const { data: rpcRows, error: rpcErr } = await supabase.rpc(
      "ondo_get_my_matches"
    );
    if (!rpcErr && Array.isArray(rpcRows)) {
      return rpcRows as DbOndoMatch[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * [학생 인증 ①] 한국 대학생: 학교 메일로 6자리 인증번호 발송
 */
export async function requestSchoolEmailCode(
  email: string
): Promise<
  | { ok: true }
  | {
      ok: false;
      error:
        | "invalid_email"
        | "school_not_supported"
        | "email_used"
        | "too_many"
        | "already_verified"
        | "not_configured"
        | "login_required"
        | "failed";
    }
> {
  try {
    const { error } = await supabase.rpc("ondo_request_school_email_code", {
      p_email: email,
    });
    if (!error) return { ok: true };
    const msg = error.message;
    if (msg.includes("Invalid school email")) return { ok: false, error: "invalid_email" };
    if (msg.includes("School not supported")) return { ok: false, error: "school_not_supported" };
    if (msg.includes("Email already used")) return { ok: false, error: "email_used" };
    if (msg.includes("Too many requests")) return { ok: false, error: "too_many" };
    if (msg.includes("Already verified")) return { ok: false, error: "already_verified" };
    if (msg.includes("Mail not configured")) return { ok: false, error: "not_configured" };
    if (msg.includes("Login required")) return { ok: false, error: "login_required" };
    return { ok: false, error: "failed" };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/**
 * [학생 인증 ①] 받은 인증번호 확인 → 서버가 verified=true 설정
 */
export async function verifySchoolEmailCode(
  code: string
): Promise<
  { ok: true } | { ok: false; error: "wrong" | "expired" | "too_many" | "failed" }
> {
  try {
    const { data, error } = await supabase.rpc("ondo_verify_school_email_code", {
      p_code: code,
    });
    if (!error) return data === true ? { ok: true } : { ok: false, error: "wrong" };
    if (error.message.includes("Code expired")) return { ok: false, error: "expired" };
    if (error.message.includes("Too many attempts")) return { ok: false, error: "too_many" };
    return { ok: false, error: "failed" };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/**
 * [학생 인증 ②] 일본인 학생: 학생증 사진을 비공개 보관함에 올리고 운영자 확인 요청
 * (보관함은 운영자만 열람 가능, 승인·반려 즉시 사진 삭제)
 */
export async function submitStudentIdForReview(image: Blob): Promise<boolean> {
  try {
    const authUserId = await getAuthUserId();
    if (!authUserId) return false;
    const path = `${authUserId}/${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("student-ids")
      .upload(path, image, { contentType: "image/jpeg", upsert: false });
    if (uploadErr) return false;
    const { error } = await supabase.rpc("ondo_submit_student_id_review", {
      p_path: path,
    });
    return !error;
  } catch {
    return false;
  }
}

/** 로그아웃: 기기 로그인 상태와 카카오(Supabase) 로그인 세션을 모두 지움 */
export async function logoutEverywhere(): Promise<void> {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem("ondo_campus_state_v1");
    window.localStorage.removeItem(LEGACY_SAVED_ACCOUNTS_KEY);
  } catch {
    // ignore
  }
  await signOutKakao();
  try {
    window.dispatchEvent(new Event("ondo-auth-change"));
  } catch {
    // ignore
  }
}

/** 매칭 쉬어가기 (서버의 자동 매칭 대상에서 제외/포함) */
export async function setMatchingPaused(paused: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("ondo_set_matching_paused", {
      p_paused: paused,
    });
    return !error;
  } catch {
    return false;
  }
}

export interface DbMatchPartner {
  match_id: string;
  /** PENDING · CHATTING · CONFIRMED · PASSED · EXPIRED · REFUNDED */
  ticket_status: string;
  my_response: "PENDING" | "ACCEPT" | "PASS";
  partner_response: "PENDING" | "ACCEPT" | "PASS";
  partner_id: string;
  nickname: string;
  univ: string;
  major: string;
  age: number;
  gender: string;
  mbti: string | null;
  bio: string | null;
  height: number | null;
  location_label: string | null;
  hobbies: string[] | null;
  /** 운영자 확정 또는 대화 조건(각자 2번·합계 5번)을 채운 매칭에서만 값이 있음 */
  contact: string | null;
  created_at: string;
}

/** 내 매칭 상대의 실제 공개 프로필 */
export async function fetchMyMatchPartners(): Promise<DbMatchPartner[]> {
  try {
    const { data, error } = await supabase.rpc("ondo_get_my_match_partners");
    return !error && Array.isArray(data) ? (data as DbMatchPartner[]) : [];
  } catch {
    return [];
  }
}

/** 회원 탈퇴: 학생증 사진 → 계정 데이터 → 로그인 계정 순서로 삭제 */
export async function deleteMyAccount(): Promise<boolean> {
  try {
    const member = await fetchMyMemberSecure();
    if (member?.student_id_image_path) {
      await supabase.storage
        .from("student-ids")
        .remove([member.student_id_image_path]);
    }
    const { data, error } = await supabase.rpc("ondo_delete_my_account");
    if (error || data !== true) return false;
    await logoutEverywhere();
    return true;
  } catch {
    return false;
  }
}

/** 매칭 수락/패스 — 남학생 수락 시 서버가 티켓 1장 차감 */
export async function respondMatch(
  matchId: string,
  accept: boolean
): Promise<
  | { ok: true; status: string }
  | { ok: false; error: "no_tickets" | "closed" | "failed" }
> {
  try {
    const { data, error } = await supabase.rpc("ondo_respond_match", {
      p_match_id: matchId,
      p_accept: accept,
    });
    if (!error && typeof data === "string") return { ok: true, status: data };
    const msg = error?.message ?? "";
    if (msg.includes("Not enough tickets")) return { ok: false, error: "no_tickets" };
    if (msg.includes("Match closed")) return { ok: false, error: "closed" };
    return { ok: false, error: "failed" };
  } catch {
    return { ok: false, error: "failed" };
  }
}

export interface DbMatchMessage {
  id: number;
  mine: boolean;
  body: string;
  created_at: string;
}

export async function listMatchMessages(
  matchId: string,
  afterId = 0
): Promise<DbMatchMessage[]> {
  try {
    const { data, error } = await supabase.rpc("ondo_list_match_messages", {
      p_match_id: matchId,
      p_after_id: afterId,
    });
    return !error && Array.isArray(data) ? (data as DbMatchMessage[]) : [];
  } catch {
    return [];
  }
}

export async function sendMatchMessage(
  matchId: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: "too_many" | "closed" | "failed" }> {
  try {
    const { error } = await supabase.rpc("ondo_send_match_message", {
      p_match_id: matchId,
      p_body: body,
    });
    if (!error) return { ok: true };
    if (error.message.includes("Too many messages")) return { ok: false, error: "too_many" };
    if (error.message.includes("Chat closed")) return { ok: false, error: "closed" };
    return { ok: false, error: "failed" };
  } catch {
    return { ok: false, error: "failed" };
  }
}

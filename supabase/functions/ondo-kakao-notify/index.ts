// ONDO 36.5° 운영자 카톡 알림 — 카카오톡 "나에게 보내기"
// Supabase Edge Function Secrets 필요:
//   KAKAO_REST_API_KEY   카카오 개발자 앱의 REST API 키
//   KAKAO_CLIENT_SECRET  카카오 로그인 Client Secret (사용 중일 때)
//   MAIL_HOOK_SECRET     Vault 의 ondo_mail_hook_secret 과 같은 값 (ondo-send-mail 과 공유)
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 Supabase 가 자동으로 넣어 줌
// 배포 시 "Verify JWT" 는 끔 — 카카오 로그인 리다이렉트(GET)는 JWT 가 없고,
// DB 호출(POST)은 x-ondo-mail-secret 헤더로, 연결 시작은 운영자만 발급하는 1회용 state 로 확인
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const FUNCTION_URL =
  "https://ofnechamnjafsjmuydpl.supabase.co/functions/v1/ondo-kakao-notify";
const ADMIN_URL = "https://darkhos.github.io/ondo-campus/admin/";

const db = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

function kakaoKeys() {
  const params: Record<string, string> = {
    client_id: Deno.env.get("KAKAO_REST_API_KEY") ?? "",
  };
  const secret = Deno.env.get("KAKAO_CLIENT_SECRET");
  if (secret) params.client_secret = secret;
  return params;
}

async function requestToken(params: Record<string, string>) {
  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({ ...kakaoKeys(), ...params }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`token error ${res.status} ${json.error ?? ""}`);
  }
  return json as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
}

async function saveTokens(
  token: { access_token: string; expires_in: number; refresh_token?: string },
  connected: boolean,
) {
  const row: Record<string, unknown> = {
    id: 1,
    access_token: token.access_token,
    access_expires_at: new Date(Date.now() + (token.expires_in - 60) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  // 카카오는 리프레시 토큰 만료가 한 달 이내일 때만 새 토큰을 줌 — 받았을 때만 교체
  if (token.refresh_token) row.refresh_token = token.refresh_token;
  if (connected) row.connected_at = new Date().toISOString();
  const { error } = await db.from("ondo_kakao_notify").upsert(row);
  if (error) throw new Error(`save error ${error.message}`);
}

// 유효한 액세스 토큰 (만료됐거나 force 면 리프레시 토큰으로 새로 받음)
async function accessToken(force = false): Promise<string> {
  const { data } = await db
    .from("ondo_kakao_notify")
    .select("refresh_token, access_token, access_expires_at")
    .eq("id", 1)
    .maybeSingle();
  if (!data?.refresh_token) throw new Error("not connected");
  if (!force && data.access_token && new Date(data.access_expires_at) > new Date()) {
    return data.access_token;
  }
  const token = await requestToken({
    grant_type: "refresh_token",
    refresh_token: data.refresh_token,
  });
  await saveTokens(token, false);
  return token.access_token;
}

async function sendMemo(text: string) {
  const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({
        object_type: "text",
        text: text.slice(0, 200),
        link: { web_url: ADMIN_URL, mobile_web_url: ADMIN_URL },
        button_title: "관리자 페이지 열기",
      }),
    }),
  });
  if (!res.ok) throw new Error(`send error ${res.status} ${await res.text()}`);
}

function redirectToAdmin(result: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: `${ADMIN_URL}?kakao=${result}` },
  });
}

// 1회용 state 확인 후 삭제 (운영자가 관리자 페이지에서 발급한 것만 통과)
async function consumeState(state: string | null): Promise<boolean> {
  if (!state) return false;
  const { data } = await db
    .from("ondo_kakao_connect_states")
    .delete()
    .eq("state", state)
    .gt("expires_at", new Date().toISOString())
    .select("state");
  return !!data && data.length === 1;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    // 1단계: 관리자 페이지 → 카카오 동의 화면으로 보내기
    if (url.searchParams.get("start") === "1") {
      const state = url.searchParams.get("state") ?? "";
      const authorize = new URL("https://kauth.kakao.com/oauth/authorize");
      authorize.search = new URLSearchParams({
        client_id: Deno.env.get("KAKAO_REST_API_KEY") ?? "",
        redirect_uri: FUNCTION_URL,
        response_type: "code",
        scope: "talk_message",
        state,
      }).toString();
      return new Response(null, { status: 302, headers: { Location: authorize.toString() } });
    }

    // 2단계: 카카오 동의 후 돌아옴 → 토큰 받아 보관
    const code = url.searchParams.get("code");
    if (!code || !(await consumeState(url.searchParams.get("state")))) {
      return redirectToAdmin("failed");
    }
    try {
      const token = await requestToken({
        grant_type: "authorization_code",
        redirect_uri: FUNCTION_URL,
        code,
      });
      if (!token.refresh_token) throw new Error("no refresh token");
      await saveTokens(token, true);
      return redirectToAdmin("connected");
    } catch (err) {
      console.error("connect failed", err);
      return redirectToAdmin("failed");
    }
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  const hookSecret = Deno.env.get("MAIL_HOOK_SECRET");
  if (!hookSecret || req.headers.get("x-ondo-mail-secret") !== hookSecret) {
    return new Response("forbidden", { status: 403 });
  }

  const { action, text } = await req.json();
  try {
    if (action === "refresh") {
      await accessToken(true);
    } else if (action === "send" && typeof text === "string") {
      await sendMemo(text);
    } else {
      return new Response("bad request", { status: 400 });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`${action} failed`, err);
    return new Response(JSON.stringify({ ok: false }), { status: 502 });
  }
});

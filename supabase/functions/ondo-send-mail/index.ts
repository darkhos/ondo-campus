// ONDO 36.5° 메일 발송기 — DB 함수(ondo_request_school_email_code)가 pg_net 으로만 호출
// Supabase Edge Function Secrets 필요:
//   GMAIL_USER          보내는 Gmail 주소
//   GMAIL_APP_PASSWORD  Gmail 앱 비밀번호 (16자리)
//   MAIL_HOOK_SECRET    Vault 의 ondo_mail_hook_secret 과 같은 값
// 배포 시 "Verify JWT" 는 끔 — 대신 x-ondo-mail-secret 헤더(무작위 64자리 비밀값)로 호출자를 확인
import nodemailer from "npm:nodemailer@6.9.16";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  const hookSecret = Deno.env.get("MAIL_HOOK_SECRET");
  if (!hookSecret || req.headers.get("x-ondo-mail-secret") !== hookSecret) {
    return new Response("forbidden", { status: 403 });
  }

  const { to, subject, text } = await req.json();
  if (typeof to !== "string" || typeof subject !== "string" || typeof text !== "string") {
    return new Response("bad request", { status: 400 });
  }

  const user = Deno.env.get("GMAIL_USER") ?? "";
  // Supabase Edge Function 은 25·587 포트 SMTP 를 막으므로 465(SSL) 사용
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: Deno.env.get("GMAIL_APP_PASSWORD") ?? "" },
  });

  try {
    await transporter.sendMail({ from: `ONDO 36.5° <${user}>`, to, subject, text });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send failed", err);
    return new Response(JSON.stringify({ ok: false }), { status: 502 });
  }
});

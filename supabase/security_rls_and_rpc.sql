-- ============================================================================
-- ONDO 36.5° 무결점 보안 아키텍처 (Zero-Trust RLS + Server-Isolated RPC)
-- ============================================================================
-- 1) 기존 전체 열람(Open Access) 정책 전체 자동 제거 및 RLS 완전 잠금
alter table public.ondo_members enable row level security;
alter table public.ondo_matches enable row level security;

do $$
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('ondo_members', 'ondo_matches', 'ondo_payment_orders')
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- 결제 주문번호 중복 재전송(Replay Attack) 방지용 원장 테이블 (외부 접근 100% 차단)
create table if not exists public.ondo_payment_orders (
  order_id text primary key,
  uid text not null,
  package_id text not null,
  tickets_added integer not null,
  amount_krw integer not null,
  card_issuer text,
  installment text,
  created_at timestamptz default now()
);
alter table public.ondo_payment_orders enable row level security;

-- 무차별 대입(Brute-Force) 공격 차단용 보안 감사 원장 테이블 (외부 접근 100% 차단)
create table if not exists public.ondo_security_audit_log (
  id bigserial primary key,
  event_type text not null,
  detail text,
  created_at timestamptz default now()
);
alter table public.ondo_security_audit_log enable row level security;

do $$
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('ondo_security_audit_log')
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- 24시간 미응답 자동 환급 계산을 위한 타임스탬프 컬럼 보강
alter table public.ondo_matches
  add column if not exists created_at_ts timestamptz default now();

-- ============================================================================
-- [운영자 명찰] 운영자 = 등록된 카카오 로그인 계정 (예전 PIN 방식 폐지)
-- 운영자 등록은 SQL Editor에서만: insert into public.ondo_admins (auth_user_id) values ('<auth uuid>');
-- ============================================================================
create table if not exists public.ondo_admins (
  auth_user_id uuid primary key,
  created_at timestamptz default now()
);
alter table public.ondo_admins enable row level security;

drop function if exists public.ondo_admin_list_members(text);
drop function if exists public.ondo_admin_list_matches(text);
drop function if exists public.ondo_admin_grant_ticket(text, text, integer);
drop function if exists public.ondo_admin_delete_members(text, text[]);
drop function if exists public.ondo_admin_update_match_status(text, text, text);
drop function if exists public.ondo_admin_create_match(text, text, text, text);
drop function if exists public.ondo_admin_run_autonomous_batch(text);
drop function if exists public.ondo_admin_list_support_tickets(text);
drop function if exists public.ondo_admin_update_support_ticket(text, bigint, text);
drop function if exists public.ondo_verify_admin_pin_with_lockout(text);

create or replace function public.ondo_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (select 1 from public.ondo_admins where auth_user_id = auth.uid());
$$;

-- ============================================================================
-- [신분증 0] Supabase Auth(카카오 로그인) 계정과 회원 행 연결
-- 회원 본인 확인은 클라이언트가 보내는 uid가 아니라, 로그인 토큰의 auth.uid()로만 합니다.
-- ============================================================================
alter table public.ondo_members
  add column if not exists auth_user_id uuid unique;

-- 예전 "uid만 알면 누구나 호출" 방식 함수 제거 (시그니처가 바뀌므로 drop 후 재생성)
drop function if exists public.ondo_upsert_my_profile(text, text, text, text, text, integer, text, text, text);
drop function if exists public.ondo_upsert_my_profile(text, text, text, text, integer, text, text, text);
-- 키·지역·관심사·이상형 조건 등 화면 전용이던 프로필 값을 서버에 함께 보관
alter table public.ondo_members add column if not exists profile_extra jsonb not null default '{}'::jsonb;
drop function if exists public.ondo_get_my_profile(text);
drop function if exists public.ondo_get_my_matches(text);
drop function if exists public.ondo_login_lookup(text, text);
drop function if exists public.ondo_verify_and_charge_tickets(text, text, text, text, text);

-- 현재 로그인한 사람의 회원 id (로그인 안 했거나 미가입이면 null)
create or replace function public.ondo_current_member_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.ondo_members
  where auth.uid() is not null and auth_user_id = auth.uid()
  limit 1;
$$;

-- ============================================================================
-- [비밀 주방 1] 프로필 생성·수정 (로그인한 본인 행만, 티켓은 클라이언트 값으로 절대 변경 불가)
-- ============================================================================
create or replace function public.ondo_upsert_my_profile(
  p_nickname text,
  p_univ text,
  p_major text,
  p_gender text,
  p_age integer,
  p_mbti text,
  p_contact text,
  p_bio text,
  p_extra jsonb default null
)
returns public.ondo_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth uuid := auth.uid();
  v_existing public.ondo_members;
  v_result public.ondo_members;
begin
  if v_auth is null then
    raise exception 'Login required';
  end if;

  if p_age is not null and (p_age < 18 or p_age > 30) then
    raise exception 'Age must be between 18 and 30';
  end if;

  select * into v_existing from public.ondo_members where auth_user_id = v_auth;

  if v_existing.id is not null then
    update public.ondo_members
    set
      nickname = coalesce(nullif(trim(p_nickname), ''), v_existing.nickname),
      -- 정식 학교 인증(SCHOOL_EMAIL / ADMIN_REVIEW)을 마친 뒤에만 학교 변경 잠금
      univ = case when v_existing.verified and v_existing.verify_method in ('SCHOOL_EMAIL', 'ADMIN_REVIEW')
                  then v_existing.univ
                  else coalesce(nullif(trim(p_univ), ''), v_existing.univ) end,
      verified = case when v_existing.verify_method in ('SCHOOL_EMAIL', 'ADMIN_REVIEW')
                      then v_existing.verified else false end,
      student_id_status = case when v_existing.verify_method in ('SCHOOL_EMAIL', 'ADMIN_REVIEW')
                               then v_existing.student_id_status else 'pending' end,
      major = coalesce(nullif(trim(p_major), ''), v_existing.major),
      gender = coalesce(nullif(trim(p_gender), ''), v_existing.gender),
      age = coalesce(p_age, v_existing.age),
      mbti = coalesce(nullif(trim(p_mbti), ''), v_existing.mbti),
      contact = coalesce(nullif(trim(p_contact), ''), v_existing.contact),
      bio = coalesce(p_bio, v_existing.bio),
      profile_extra = coalesce(p_extra, v_existing.profile_extra),
      updated_at = now()
    where id = v_existing.id
    returning * into v_result;
  else
    -- 신규 가입자: 회원 id는 서버가 로그인 계정으로 정함 (u-<auth uuid>), 웰컴 티켓 2장 고정
    -- 학생 인증 전에는 verified=false (학교 메일 인증 또는 운영자 학생증 확인 후에만 true)
    insert into public.ondo_members (
      id, auth_user_id, nickname, univ, major, gender, age, mbti, temp,
      verified, student_id_status, voice_recorded, voice_duration,
      tickets, joined_at, contact, bio, profile_extra, updated_at
    ) values (
      'u-' || v_auth::text, v_auth, trim(p_nickname), trim(p_univ), trim(p_major),
      case when p_gender in ('F', 'FEMALE') then 'F' else 'M' end,
      coalesce(p_age, 22), nullif(trim(coalesce(p_mbti, '')), ''), 38.5,
      false, 'pending', true, '00:10',
      2, '방금 전', trim(p_contact), coalesce(p_bio, ''), coalesce(p_extra, '{}'::jsonb), now()
    )
    returning * into v_result;
  end if;

  return v_result;
end;
$$;

-- ============================================================================
-- [비밀 주방 2] 내 사물함 1개만 열기 (로그인 토큰 기준, 인자 없음)
-- ============================================================================
create or replace function public.ondo_get_my_profile()
returns setof public.ondo_members
language sql
stable
security definer
set search_path = public
as $$
  select * from public.ondo_members
  where auth.uid() is not null and auth_user_id = auth.uid()
  limit 1;
$$;

-- ============================================================================
-- [비밀 주방 3] 내 매칭 내역만 조회 (로그인 토큰 기준, 인자 없음)
-- ============================================================================
create or replace function public.ondo_get_my_matches()
returns setof public.ondo_matches
language sql
stable
security definer
set search_path = public
as $$
  select m.* from public.ondo_matches m
  where public.ondo_current_member_id() is not null
    and (m.female_id = public.ondo_current_member_id()
         or m.male_id = public.ondo_current_member_id());
$$;

-- [비밀 주방 4] 닉네임/카카오ID 조회 로그인(ondo_login_lookup)은 폐지 → 카카오 로그인으로 대체

-- ============================================================================
-- [비밀 주방 5] 카드결제 자동 충전 폐지 — PG 영수증 서버 검증 전까지 클라이언트 충전 불가
-- 충전은 문의함(TOPUP 신청) → 운영자 입금 확인 → ondo_admin_grant_ticket 으로만 지급
-- ============================================================================
drop function if exists public.ondo_verify_and_charge_tickets(text, text, text, text);

-- ============================================================================
-- [비밀 주방 6] 어드민 전용 함수들 (운영자 명찰이 있는 카카오 계정만)
-- ============================================================================
create or replace function public.ondo_admin_list_members()
returns setof public.ondo_members
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    return;
  end if;
  return query
    select *
    from public.ondo_members
    order by updated_at desc;
end;
$$;

create or replace function public.ondo_admin_list_matches()
returns setof public.ondo_matches
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    return;
  end if;
  return query
    select *
    from public.ondo_matches;
end;
$$;

create or replace function public.ondo_admin_grant_ticket(
  p_uid text,
  p_delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tickets integer;
begin
  if not public.ondo_is_admin() then
    return null;
  end if;

  update public.ondo_members
  set
    tickets = greatest(0, coalesce(tickets, 0) + p_delta),
    updated_at = now()
  where id = p_uid
  returning tickets into v_tickets;

  return coalesce(v_tickets, 0);
end;
$$;

create or replace function public.ondo_admin_delete_members(
  p_uids text[]
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    return false;
  end if;
  delete from public.ondo_matches
  where female_id = any(p_uids)
     or male_id = any(p_uids)
     or id = any(p_uids);
  delete from public.ondo_members where id = any(p_uids);
  return true;
end;
$$;

create or replace function public.ondo_admin_update_match_status(
  p_match_id text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_m public.ondo_matches;
begin
  if not public.ondo_is_admin() then
    return false;
  end if;
  select * into v_m from public.ondo_matches where id = p_match_id for update;
  if v_m.id is null then
    return false;
  end if;

  if p_status in ('REFUNDED', 'EXPIRED', 'PASSED') and coalesce(v_m.male_ticket_charged, false) then
    update public.ondo_members
    set tickets = coalesce(tickets, 0) + 1, updated_at = now()
    where id = v_m.male_id;
    update public.ondo_matches
    set ticket_status = p_status, male_ticket_charged = false
    where id = p_match_id;
  else
    update public.ondo_matches
    set ticket_status = p_status
    where id = p_match_id;
  end if;
  return true;
end;
$$;

create or replace function public.ondo_admin_create_match(
  p_match_id text,
  p_female_id text,
  p_male_id text
)
returns public.ondo_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_female public.ondo_members;
  v_male public.ondo_members;
  v_score integer := 91;
  v_result public.ondo_matches;
begin
  if not public.ondo_is_admin() then
    return null;
  end if;

  select * into v_female from public.ondo_members where id = p_female_id;
  select * into v_male from public.ondo_members where id = p_male_id;
  if v_female.id is null or v_male.id is null then
    raise exception 'Member not found';
  end if;

  if exists (
    select 1 from public.ondo_matches om
    where om.female_id = v_female.id
      and om.male_id = v_male.id
      and om.ticket_status in ('PENDING', 'HELD', 'CHATTING')
  ) then
    raise exception 'Active match already exists';
  end if;

  if v_female.univ <> v_male.univ then
    v_score := v_score + 3;
  end if;
  if abs(coalesce(v_female.age, 22) - coalesce(v_male.age, 24)) <= 3 then
    v_score := v_score + 3;
  end if;
  v_score := least(99, greatest(85, v_score));

  insert into public.ondo_matches (
    id, female_id, female_name, male_id, male_name, score, ticket_status, created_at, created_at_ts
  ) values (
    p_match_id,
    v_female.id,
    coalesce(v_female.nickname, '여성 학우'),
    v_male.id,
    coalesce(v_male.nickname, '남성 학우'),
    v_score,
    'PENDING',
    '방금 (운영자 매칭)',
    now()
  )
  returning * into v_result;

  return v_result;
end;
$$;

-- ============================================================================
-- [비밀 주방 7] 24시간 무인 자동화 엔진 (밤 9시 자동 매칭 + 24h 미응답 티켓 자동 환급)
-- 컴퓨터가 꺼져 있어도 클라우드 DB가 스스로 실행합니다.
-- ============================================================================
-- (ondo_run_autonomous_batch 는 아래 [매칭 2.0] 에서 정의)

-- 어드민 화면의 "무인 매칭 수동 실행" 버튼용 (운영자만)
create or replace function public.ondo_admin_run_autonomous_batch()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    return null;
  end if;
  return public.ondo_run_autonomous_batch();
end;
$$;

-- 3) Supabase 클라우드 pg_cron 스케줄러 자동 등록 (매시간 실행: 밤 9시 KST 이후 자동 매칭 + 미응답 환급 체크)
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'ondo-autonomous-hourly-engine',
    '0 * * * *',
    'select public.ondo_run_autonomous_batch();'
  );
exception
  when others then
    -- pg_cron 확장이 꺼져 있는 무료 플랜에서도 유저 접속 시(ondo_run_autonomous_batch RPC) 100% 동일하게 자동 실행됨
    null;
end;
$$;

-- ============================================================================
-- [문의·신고함] 회원 자기소개(bio)에 덧붙이던 방식 대신 전용 상자에 보관
-- 문의(INQUIRY)는 누구나, 신고·충전신청·초대코드·홍보인증은 로그인 회원만 넣을 수 있고
-- 꺼내 보기는 운영자만 가능
-- ============================================================================
create table if not exists public.ondo_support_tickets (
  id bigserial primary key,
  kind text not null,
  member_id text,
  reply_contact text,
  reason text,
  message text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'DONE')),
  client_key text,
  created_at timestamptz default now()
);
alter table public.ondo_support_tickets enable row level security;
alter table public.ondo_support_tickets drop constraint if exists ondo_support_tickets_kind_check;
alter table public.ondo_support_tickets add constraint ondo_support_tickets_kind_check
  check (kind in ('INQUIRY', 'REPORT', 'TOPUP', 'INVITE', 'PROMO', 'VERIFY'));
create index if not exists ondo_support_tickets_client_idx
  on public.ondo_support_tickets (client_key, created_at);

create or replace function public.ondo_submit_support_ticket(
  p_kind text,
  p_message text,
  p_reply_contact text default null,
  p_reason text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member text := public.ondo_current_member_id();
  v_message text := trim(coalesce(p_message, ''));
  v_reason text := left(nullif(trim(coalesce(p_reason, '')), ''), 200);
  v_ip text;
  v_client text;
  v_recent integer;
  v_id bigint;
begin
  if p_kind not in ('INQUIRY', 'REPORT', 'TOPUP', 'INVITE', 'PROMO') then
    raise exception 'Invalid ticket kind';
  end if;
  -- 문의 외에는 회원 본인 확인이 필요
  if p_kind <> 'INQUIRY' and v_member is null then
    raise exception 'Login required';
  end if;
  if length(v_message) < 2 or length(v_message) > 2000 then
    raise exception 'Invalid message length';
  end if;

  -- 충전 신청은 서버가 정한 패키지만 허용 (금액·장수는 클라이언트 값을 믿지 않음)
  if p_kind = 'TOPUP' then
    v_reason := case v_reason
      when 'pkg-1' then 'pkg-1 · 커피티켓 1장 · 2,900원'
      when 'pkg-2' then 'pkg-2 · 커피티켓 2장 · 3,900원'
      when 'pkg-3' then 'pkg-3 · 커피티켓 4장 · 6,500원'
      else null
    end;
    if v_reason is null then
      raise exception 'Invalid package id';
    end if;
  end if;

  -- [도배 방지] 같은 회원 또는 같은 접속지(IP 해시)에서 10분 내 5건 초과 차단
  begin
    v_ip := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
  exception when others then
    v_ip := '';
  end;
  v_client := coalesce(v_member, 'ip:' || md5('ondo-ticket-v1:' || v_ip));

  select count(*) into v_recent
  from public.ondo_support_tickets
  where client_key = v_client
    and created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'Rate limit exceeded for support tickets';
  end if;

  -- [전체 폭주 방지] 1시간에 전체 300건 초과 시 차단
  select count(*) into v_recent
  from public.ondo_support_tickets
  where created_at > now() - interval '1 hour';
  if v_recent >= 300 then
    raise exception 'Rate limit exceeded for support tickets';
  end if;

  insert into public.ondo_support_tickets (kind, member_id, reply_contact, reason, message, client_key)
  values (
    p_kind,
    v_member,
    left(nullif(trim(coalesce(p_reply_contact, '')), ''), 100),
    v_reason,
    v_message,
    v_client
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ============================================================================
-- [📧 운영자 메일 알림] 새 접수 시 Resend로 운영자 메일 발송 (pg_net 비동기 호출)
-- 비밀값은 저장소에 넣지 않고 Supabase Vault에만 보관:
--   select vault.create_secret('<Resend API 키>', 'resend_api_key');
--   select vault.create_secret('<받을 메일 주소>', 'ondo_notify_email');
-- 둘 중 하나라도 없으면 메일 없이 접수만 됨 (접수 자체는 절대 실패하지 않음)
-- ============================================================================
create extension if not exists pg_net with schema extensions;

-- ============================================================================
-- [💬 운영자 카톡 알림] 카카오톡 "나에게 보내기" (Edge Function 'ondo-kakao-notify')
-- 운영자가 관리자 페이지에서 한 번 카카오 로그인으로 허락하면, 받은 토큰을 아래 표에 보관
-- 표는 Edge Function(service_role)만 읽고 쓰며 회원·비회원은 접근 불가
-- ============================================================================
create table if not exists public.ondo_kakao_notify (
  id int primary key default 1 check (id = 1),
  refresh_token text,
  access_token text,
  access_expires_at timestamptz,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.ondo_kakao_notify enable row level security;

create table if not exists public.ondo_kakao_connect_states (
  state text primary key,
  expires_at timestamptz not null
);
alter table public.ondo_kakao_connect_states enable row level security;

-- 회원별 카카오톡 메시지 발송용 토큰 보관함 (카카오 로그인 시 발급받은 provider_token / provider_refresh_token 저장)
create table if not exists public.ondo_member_kakao_tokens (
  auth_user_id uuid primary key,
  access_token text,
  refresh_token text,
  access_expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.ondo_member_kakao_tokens enable row level security;

-- 로그인 직후 본인의 카카오 provider_token / provider_refresh_token 저장
create or replace function public.ondo_save_my_kakao_token(
  p_access_token text,
  p_refresh_token text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth uuid := auth.uid();
begin
  if v_auth is null or coalesce(trim(p_access_token), '') = '' then
    return false;
  end if;

  insert into public.ondo_member_kakao_tokens (
    auth_user_id, access_token, refresh_token, access_expires_at, updated_at
  ) values (
    v_auth,
    trim(p_access_token),
    nullif(trim(coalesce(p_refresh_token, '')), ''),
    now() + interval '5 hours',
    now()
  )
  on conflict (auth_user_id) do update set
    access_token = excluded.access_token,
    refresh_token = coalesce(excluded.refresh_token, public.ondo_member_kakao_tokens.refresh_token),
    access_expires_at = excluded.access_expires_at,
    updated_at = now();

  -- 운영자가 카카오 로그인한 경우 운영자 카톡 알림(ondo_kakao_notify)도 자동으로 함께 갱신
  if public.ondo_is_admin() then
    insert into public.ondo_kakao_notify (
      id, access_token, refresh_token, access_expires_at, connected_at, updated_at
    ) values (
      1,
      trim(p_access_token),
      nullif(trim(coalesce(p_refresh_token, '')), ''),
      now() + interval '5 hours',
      now(),
      now()
    )
    on conflict (id) do update set
      access_token = excluded.access_token,
      refresh_token = coalesce(excluded.refresh_token, public.ondo_kakao_notify.refresh_token),
      access_expires_at = excluded.access_expires_at,
      connected_at = coalesce(public.ondo_kakao_notify.connected_at, now()),
      updated_at = now();
  end if;

  return true;
end;
$$;

-- Edge Function 호출 (비밀 헤더는 Vault 의 ondo_mail_hook_secret 재사용). 내부 전용
create or replace function public.ondo_kakao_notify_call(p_body jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'ondo_mail_hook_secret' limit 1;
  if v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://ofnechamnjafsjmuydpl.supabase.co/functions/v1/ondo-kakao-notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-ondo-mail-secret', v_secret),
    body := p_body,
    timeout_milliseconds := 15000
  );
end;
$$;

-- 운영자: 카톡 연결 시작용 1회용 state 발급 (10분 유효)
create or replace function public.ondo_admin_kakao_connect_start()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if not public.ondo_is_admin() then
    raise exception 'Admin only';
  end if;
  delete from public.ondo_kakao_connect_states where expires_at < now();
  insert into public.ondo_kakao_connect_states (state, expires_at) values (v_state, now() + interval '10 minutes');
  return v_state;
end;
$$;

-- 운영자: 카톡 알림 연결 상태 (연결 시각, 없으면 null)
create or replace function public.ondo_admin_kakao_notify_status()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    raise exception 'Admin only';
  end if;
  return (select connected_at from public.ondo_kakao_notify where id = 1 and refresh_token is not null);
end;
$$;

-- 운영자: 시험 메시지 보내기
create or replace function public.ondo_admin_kakao_notify_test()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    raise exception 'Admin only';
  end if;
  perform public.ondo_kakao_notify_call(jsonb_build_object('action', 'send', 'text', '✅ ONDO 카톡 알림 테스트예요. 이제 새 접수가 오면 여기로 알려 드려요.'));
  return true;
end;
$$;

-- 카카오 연결이 끊기지 않도록 매일 토큰 갱신
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'ondo-kakao-token-refresh',
    '17 3 * * *',
    $cron$select public.ondo_kakao_notify_call('{"action":"refresh"}'::jsonb);$cron$
  );
exception
  when others then
    raise notice 'pg_cron 사용 불가: 카톡 토큰 자동 갱신 생략';
end $$;

create or replace function public.ondo_notify_support_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_to text;
  v_label text;
  v_html text;
begin
  -- 운영자 카카오톡 "나에게 보내기" 알림 (연결 안 됐거나 실패해도 접수는 그대로)
  begin
    perform public.ondo_kakao_notify_call(jsonb_build_object(
      'action', 'send',
      'text', left(
        case new.kind
          when 'INQUIRY' then '💬 새 문의'
          when 'REPORT' then '🚨 새 신고'
          when 'TOPUP' then '☕ 티켓 충전 신청'
          when 'INVITE' then '🎁 초대코드 등록'
          when 'PROMO' then '📣 홍보 인증 신청'
          when 'VERIFY' then '🪪 학생증 확인 요청'
          else '새 접수'
        end || ' #' || new.id || chr(10) || coalesce(new.reason || chr(10), '') || coalesce(new.message, ''),
        190)
    ));
  exception when others then
    null;
  end;

  begin
    select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
    select decrypted_secret into v_to from vault.decrypted_secrets where name = 'ondo_notify_email' limit 1;
    if v_key is null or v_to is null then
      return new;
    end if;

    v_label := case new.kind
      when 'INQUIRY' then '💬 새 문의'
      when 'REPORT' then '🚨 새 신고'
      when 'TOPUP' then '☕ 티켓 충전 신청'
      when 'INVITE' then '🎁 초대코드 등록'
      when 'PROMO' then '📣 홍보 인증 신청'
      when 'VERIFY' then '🪪 학생증 확인 요청'
      else '새 접수'
    end;

    v_html := '<h2>' || v_label || ' #' || new.id || '</h2>'
      || coalesce('<p><b>사유:</b> ' || replace(replace(replace(new.reason, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>', '')
      || '<p style="white-space:pre-wrap">' || replace(replace(replace(new.message, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>'
      || '<p><b>보낸 사람:</b> ' || coalesce(new.member_id, '비회원')
      || coalesce(' · 답변 연락처: ' || replace(replace(replace(new.reply_contact, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '') || '</p>'
      || '<p><a href="https://darkhos.github.io/ondo-campus/admin/">관리자 페이지 → 04 문의·신고함 열기</a></p>';

    perform net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'ONDO 36.5 <onboarding@resend.dev>',
        'to', jsonb_build_array(v_to),
        'subject', '[ONDO] ' || v_label || ' #' || new.id,
        'html', v_html
      )
    );
  exception when others then
    -- 메일 실패가 접수를 막지 않도록 무시
    null;
  end;
  return new;
end;
$$;

drop trigger if exists ondo_support_ticket_notify on public.ondo_support_tickets;
create trigger ondo_support_ticket_notify
  after insert on public.ondo_support_tickets
  for each row execute function public.ondo_notify_support_ticket();

create or replace function public.ondo_admin_list_support_tickets()
returns setof public.ondo_support_tickets
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    return;
  end if;
  return query
    select * from public.ondo_support_tickets
    order by (status = 'OPEN') desc, created_at desc
    limit 500;
end;
$$;

create or replace function public.ondo_admin_update_support_ticket(
  p_id bigint,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ondo_is_admin() then
    return false;
  end if;
  if p_status not in ('OPEN', 'DONE') then
    return false;
  end if;
  update public.ondo_support_tickets set status = p_status where id = p_id;
  return found;
end;
$$;

-- ============================================================================
-- [학생 인증] 한국 대학생 = 학교 메일 인증번호, 일본인 학생 = 학생증 사진 운영자 확인
-- 브라우저 OCR은 1차 걸러내기일 뿐, verified=true 는 아래 두 경로에서만 서버가 설정
-- ============================================================================
alter table public.ondo_members add column if not exists verify_method text;
alter table public.ondo_members add column if not exists school_email text;
alter table public.ondo_members add column if not exists student_id_image_path text;
alter table public.ondo_members add column if not exists verified_at timestamptz;
-- 예전 가입 화면이 채워 넣던 샘플 값 정리 (본인이 입력하지 않은 MBTI 'ENFP'·샘플 자기소개)
-- MBTI는 선택 항목이므로 비워 둘 수 있게 함
alter table public.ondo_members alter column mbti drop not null;
update public.ondo_members
set mbti = null
where mbti = 'ENFP' and coalesce(profile_extra, '{}'::jsonb) = '{}'::jsonb;
update public.ondo_members
set bio = ''
where bio in (
  '주말엔 연남동이나 성수동 소품샵 구경하고 전시 보러 가는 걸 좋아해요! 대화 코드가 잘 맞고 다정한 분과 설레는 인연 만들고 싶어요 😊',
  '한국 대학생 친구들과 따뜻한 캠퍼스 커피챗 나누고 싶어요!',
  '한국 캠퍼스에서 결이 맞는 좋은 인연 만나고 싶어요!'
) or bio like '[🇰🇷 한국 대학생 학생증 OCR 인증 완료%'
  or bio like '[🇯🇵 일본인 어학당 학생증 OCR 인증 완료%'
  or bio like '[🇯🇵 일본인 대학 유학생 학생증 OCR 인증 완료%';

-- 예전에 가입만 하면 자동으로 verified=true 가 되던 계정(인증 방법 기록 없음) 및 자동 생성 테스트 계정은 초기화
delete from public.ondo_members
where coalesce(profile_extra ->> 'selfRegisteredV2', '') <> 'true'
  and (verify_method is null or nickname = '연희동민트초코' or nickname like '%\_학우');

update public.ondo_members
set verified = false, student_id_status = 'pending', updated_at = now()
where verified and verify_method is null;

create unique index if not exists ondo_members_school_email_key
  on public.ondo_members (lower(school_email)) where school_email is not null;

-- 학교별 메일 도메인 (학교 이름이 keyword 로 시작하면 해당 도메인 또는 그 하위 도메인만 허용)
-- 표에 없는 학교는 메일 인증 불가(다른 학교 메일로 학교를 속이는 것 방지) — 운영자가 SQL로 도메인 추가
create table if not exists public.ondo_univ_email_domains (
  univ_keyword text not null,
  domain text not null,
  primary key (univ_keyword, domain)
);
alter table public.ondo_univ_email_domains enable row level security;
insert into public.ondo_univ_email_domains (univ_keyword, domain) values
  ('연세대학교', 'yonsei.ac.kr'), ('고려대학교', 'korea.ac.kr'), ('서울대학교', 'snu.ac.kr'),
  ('서강대학교', 'sogang.ac.kr'), ('성균관대학교', 'skku.edu'), ('성균관대학교', 'skku.ac.kr'),
  ('한양대학교', 'hanyang.ac.kr'), ('중앙대학교', 'cau.ac.kr'), ('경희대학교', 'khu.ac.kr'),
  ('한국외국어대학교', 'hufs.ac.kr'), ('서울시립대학교', 'uos.ac.kr'),
  ('이화여자대학교', 'ewha.ac.kr'), ('이화여자대학교', 'ewhain.net'),
  ('건국대학교', 'konkuk.ac.kr'), ('동국대학교', 'dongguk.edu'), ('동국대학교', 'dgu.ac.kr'),
  ('홍익대학교', 'hongik.ac.kr'), ('숙명여자대학교', 'sookmyung.ac.kr'), ('숙명여자대학교', 'sm.ac.kr'),
  ('국민대학교', 'kookmin.ac.kr'), ('숭실대학교', 'soongsil.ac.kr'), ('숭실대학교', 'ssu.ac.kr'),
  ('세종대학교', 'sejong.ac.kr'), ('세종대학교', 'sju.ac.kr'), ('광운대학교', 'kw.ac.kr'),
  ('명지대학교', 'mju.ac.kr'), ('상명대학교', 'smu.ac.kr'), ('상명대학교', 'sangmyung.kr'),
  ('가톨릭대학교', 'catholic.ac.kr'), ('서울과학기술대학교', 'seoultech.ac.kr'),
  ('성신여자대학교', 'sungshin.ac.kr'), ('동덕여자대학교', 'dongduk.ac.kr'),
  ('덕성여자대학교', 'duksung.ac.kr'), ('서울여자대학교', 'swu.ac.kr'), ('서경대학교', 'skuniv.ac.kr'),
  ('한성대학교', 'hansung.ac.kr'), ('삼육대학교', 'syu.ac.kr'), ('경기대학교', 'kyonggi.ac.kr'),
  ('경기대학교', 'kgu.ac.kr'), ('한국예술종합학교', 'karts.ac.kr'), ('한국체육대학교', 'knsu.ac.kr'),
  ('총신대학교', 'chongshin.ac.kr'), ('가천대학교', 'gachon.ac.kr'), ('단국대학교', 'dankook.ac.kr'),
  ('아주대학교', 'ajou.ac.kr'), ('한국항공대학교', 'kau.ac.kr'), ('한국항공대학교', 'kau.kr'),
  ('인하대학교', 'inha.ac.kr'), ('인하대학교', 'inha.edu'), ('인천대학교', 'inu.ac.kr'),
  -- 추가 27개교 (학교 대표 도메인 기준 — 학생 메일 주소가 다르면 운영자가 행을 추가)
  ('서울교육대학교', 'snue.ac.kr'), ('성공회대학교', 'skhu.ac.kr'), ('추계예술대학교', 'chugye.ac.kr'),
  ('KC대학교', 'kcu.ac.kr'), ('장로회신학대학교', 'puts.ac.kr'), ('감리교신학대학교', 'mtu.ac.kr'),
  ('한국공학대학교', 'tukorea.ac.kr'), ('한국공학대학교', 'kpu.ac.kr'), ('수원대학교', 'suwon.ac.kr'),
  ('용인대학교', 'yongin.ac.kr'), ('강남대학교', 'kangnam.ac.kr'), ('을지대학교', 'eulji.ac.kr'),
  ('차의과학대학교', 'cha.ac.kr'), ('신한대학교', 'shinhan.ac.kr'), ('대진대학교', 'daejin.ac.kr'),
  ('한신대학교', 'hs.ac.kr'), ('성결대학교', 'sungkyul.ac.kr'), ('안양대학교', 'anyang.ac.kr'),
  ('협성대학교', 'uhs.ac.kr'), ('한세대학교', 'hansei.ac.kr'), ('평택대학교', 'ptu.ac.kr'),
  ('서울신학대학교', 'stu.ac.kr'), ('중부대학교', 'joongbu.ac.kr'), ('경동대학교', 'kduniv.ac.kr'),
  ('한국교통대학교', 'ut.ac.kr'), ('경인교육대학교', 'ginue.ac.kr'), ('인천가톨릭대학교', 'iccu.ac.kr'),
  ('청운대학교', 'chungwoon.ac.kr')
on conflict do nothing;

create table if not exists public.ondo_school_email_codes (
  member_id text primary key,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  send_count integer not null default 0,
  window_start timestamptz not null default now(),
  last_sent_at timestamptz not null default now()
);
alter table public.ondo_school_email_codes enable row level security;

-- 학교 메일로 6자리 인증번호 발송 (Gmail 발송용 Edge Function 'ondo-send-mail' 을 pg_net 으로 호출)
-- Vault 필요: ondo_mail_hook_secret (Edge Function 의 MAIL_HOOK_SECRET 과 같은 값)
create or replace function public.ondo_request_school_email_code(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.ondo_members;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_domain text;
  v_has_rule boolean;
  v_row public.ondo_school_email_codes;
  v_code text;
  v_secret text;
begin
  select * into v_member from public.ondo_members
  where auth.uid() is not null and auth_user_id = auth.uid();
  if v_member.id is null then
    raise exception 'Login required';
  end if;
  if v_member.verified then
    raise exception 'Already verified';
  end if;

  if v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' then
    raise exception 'Invalid school email';
  end if;
  v_domain := split_part(v_email, '@', 2);

  select exists (
    select 1 from public.ondo_univ_email_domains d
    where v_member.univ like d.univ_keyword || '%'
  ) into v_has_rule;

  if not v_has_rule then
    raise exception 'School not supported';
  end if;
  if not exists (
    select 1 from public.ondo_univ_email_domains d
    where v_member.univ like d.univ_keyword || '%'
      and (v_domain = d.domain or v_domain like '%.' || d.domain)
  ) then
    raise exception 'Invalid school email';
  end if;

  if exists (
    select 1 from public.ondo_members
    where lower(school_email) = v_email and id <> v_member.id
  ) then
    raise exception 'Email already used';
  end if;

  select * into v_row from public.ondo_school_email_codes where member_id = v_member.id;
  if v_row.member_id is not null then
    if v_row.last_sent_at > now() - interval '60 seconds' then
      raise exception 'Too many requests';
    end if;
    if v_row.window_start > now() - interval '24 hours' and v_row.send_count >= 5 then
      raise exception 'Too many requests';
    end if;
  end if;

  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'ondo_mail_hook_secret' limit 1;
  if v_secret is null then
    raise exception 'Mail not configured';
  end if;

  v_code := lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000)::text, 6, '0');

  insert into public.ondo_school_email_codes (member_id, email, code_hash, expires_at, attempts, send_count, window_start, last_sent_at)
  values (v_member.id, v_email, encode(extensions.digest(v_member.id || ':' || v_code, 'sha256'), 'hex'),
          now() + interval '10 minutes', 0, 1, now(), now())
  on conflict (member_id) do update set
    email = excluded.email,
    code_hash = excluded.code_hash,
    expires_at = excluded.expires_at,
    attempts = 0,
    send_count = case when public.ondo_school_email_codes.window_start > now() - interval '24 hours'
                      then public.ondo_school_email_codes.send_count + 1 else 1 end,
    window_start = case when public.ondo_school_email_codes.window_start > now() - interval '24 hours'
                        then public.ondo_school_email_codes.window_start else now() end,
    last_sent_at = now();

  perform net.http_post(
    url := 'https://ofnechamnjafsjmuydpl.supabase.co/functions/v1/ondo-send-mail',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-ondo-mail-secret', v_secret),
    body := jsonb_build_object(
      'to', v_email,
      'subject', '[ONDO 36.5°] 학교 메일 인증번호 ' || v_code,
      'text', 'ONDO 36.5° 학교 메일 인증번호는 ' || v_code || ' 입니다. 10분 안에 입력해 주세요.' || chr(10)
              || '본인이 요청하지 않았다면 이 메일을 무시해 주세요.'
    )
  );

  return 'sent';
end;
$$;

create or replace function public.ondo_verify_school_email_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id text := public.ondo_current_member_id();
  v_row public.ondo_school_email_codes;
begin
  if v_member_id is null then
    raise exception 'Login required';
  end if;
  select * into v_row from public.ondo_school_email_codes where member_id = v_member_id;
  if v_row.member_id is null or v_row.expires_at < now() then
    raise exception 'Code expired';
  end if;
  if v_row.attempts >= 5 then
    raise exception 'Too many attempts';
  end if;

  if encode(extensions.digest(v_member_id || ':' || trim(coalesce(p_code, '')), 'sha256'), 'hex') <> v_row.code_hash then
    update public.ondo_school_email_codes set attempts = attempts + 1 where member_id = v_member_id;
    return false;
  end if;

  update public.ondo_members
  set verified = true,
      student_id_status = 'verified',
      verify_method = 'SCHOOL_EMAIL',
      school_email = v_row.email,
      verified_at = now(),
      updated_at = now()
  where id = v_member_id;
  delete from public.ondo_school_email_codes where member_id = v_member_id;
  return true;
end;
$$;

-- 학생증 사진 보관함: 비공개. 본인 폴더(<auth uuid>/)에 올리기만 가능, 보기·삭제는 운영자만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-ids', 'student-ids', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "ondo student id upload own folder" on storage.objects;
create policy "ondo student id upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-ids' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "ondo student id admin read" on storage.objects;
create policy "ondo student id admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'student-ids' and public.ondo_is_admin());
drop policy if exists "ondo student id admin delete" on storage.objects;
create policy "ondo student id admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-ids' and public.ondo_is_admin());

-- 학생증 사진을 올린 뒤 운영자 확인 요청 (문의함에 '🪪 학생증 확인 요청'으로 접수 + 메일 알림)
create or replace function public.ondo_submit_student_id_review(p_path text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.ondo_members;
begin
  select * into v_member from public.ondo_members
  where auth.uid() is not null and auth_user_id = auth.uid();
  if v_member.id is null then
    raise exception 'Login required';
  end if;
  if v_member.verified then
    raise exception 'Already verified';
  end if;
  if p_path is null or p_path not like auth.uid()::text || '/%' then
    raise exception 'Invalid path';
  end if;
  if v_member.student_id_status = 'pending_review'
     and exists (select 1 from public.ondo_support_tickets
                 where kind = 'VERIFY' and member_id = v_member.id and status = 'OPEN'
                   and created_at > now() - interval '10 minutes') then
    raise exception 'Too many requests';
  end if;

  update public.ondo_members
  set student_id_status = 'pending_review',
      verify_method = 'ADMIN_REVIEW',
      student_id_image_path = p_path,
      updated_at = now()
  where id = v_member.id;

  update public.ondo_support_tickets set status = 'DONE'
  where kind = 'VERIFY' and member_id = v_member.id and status = 'OPEN';
  insert into public.ondo_support_tickets (kind, member_id, reply_contact, reason, message, client_key)
  values ('VERIFY', v_member.id, v_member.contact, v_member.univ,
          v_member.nickname || ' · ' || v_member.univ || ' · ' || v_member.major || ' 학생증 확인 요청',
          v_member.id);
  return true;
end;
$$;

-- 운영자 승인/반려: 반환값은 지워야 할 사진 경로 (관리자 화면이 보관함에서 삭제)
-- 승인·반려 결과는 회원의 이메일(학교 메일 또는 카카오 계정 이메일) 및 카카오톡 메시지로 즉시 발송
create or replace function public.ondo_admin_review_student(p_member_id text, p_approve boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
  v_auth_user_id uuid;
  v_email text;
  v_secret text;
  v_subject text;
  v_text text;
  v_msg text;
  v_link text;
  v_btn text;
begin
  if not public.ondo_is_admin() then
    raise exception 'Admin only';
  end if;
  select m.student_id_image_path,
         m.auth_user_id,
         coalesce(nullif(trim(m.school_email), ''), u.email)
    into v_path, v_auth_user_id, v_email
  from public.ondo_members m
  left join auth.users u on u.id = m.auth_user_id
  where m.id = p_member_id;

  update public.ondo_members
  set verified = p_approve,
      student_id_status = case when p_approve then 'verified' else 'rejected' end,
      verify_method = 'ADMIN_REVIEW',
      verified_at = case when p_approve then now() else null end,
      student_id_image_path = null,
      updated_at = now()
  where id = p_member_id;

  update public.ondo_support_tickets set status = 'DONE'
  where kind = 'VERIFY' and member_id = p_member_id and status = 'OPEN';

  -- 1) 이메일 알림 발송 (학교 이메일 또는 카카오 계정 이메일)
  begin
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'ondo_mail_hook_secret' limit 1;
    if v_email is not null and v_secret is not null then
      if p_approve then
        v_subject := '[ONDO 36.5°] 학생 인증이 완료됐어요 🎉 (学生認証が完了しました)';
        v_text := '안녕하세요, ONDO 36.5° 입니다.' || chr(10) || chr(10)
          || '보내 주신 학생증 확인이 끝나 학생 인증이 완료됐어요.' || chr(10)
          || '이제 아래 링크에서 소개팅 매칭에 참여할 수 있어요!' || chr(10)
          || 'https://darkhos.github.io/ondo-campus/' || chr(10) || chr(10)
          || '---' || chr(10)
          || 'ONDO 36.5° ご利用ありがとうございます。' || chr(10)
          || '学生証の確認が完了し、学生認証が承認されました。' || chr(10)
          || '下のリンクからマッチングにご参加いただけます！' || chr(10)
          || 'https://darkhos.github.io/ondo-campus/jp/';
      else
        v_subject := '[ONDO 36.5°] 학생증을 다시 올려 주세요 (学生証の再提出のお願い)';
        v_text := '안녕하세요, ONDO 36.5° 입니다.' || chr(10) || chr(10)
          || '보내 주신 학생증 사진을 확인하지 못했어요 (글자가 흐리거나 학교·학번이 보이지 않는 경우).' || chr(10)
          || '번거로우시겠지만 학교 이름과 학번이 잘 보이게 다시 올려 주세요.' || chr(10)
          || 'https://darkhos.github.io/ondo-campus/join/' || chr(10) || chr(10)
          || '---' || chr(10)
          || 'お送りいただいた学生証画像を確認できませんでした。' || chr(10)
          || '学校名・学籍番号がはっきり見えるように再度アップロードしてください。' || chr(10)
          || 'https://darkhos.github.io/ondo-campus/join/';
      end if;

      perform net.http_post(
        url := 'https://ofnechamnjafsjmuydpl.supabase.co/functions/v1/ondo-send-mail',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-ondo-mail-secret', v_secret),
        body := jsonb_build_object('to', v_email, 'subject', v_subject, 'text', v_text),
        timeout_milliseconds := 15000
      );
    end if;
  exception when others then
    null;
  end;

  -- 2) 카카오톡 메시지(나와의 채팅) 보조 발송
  if v_auth_user_id is not null then
    v_msg := case when p_approve
      then '🎉 [ONDO 36.5°] 학생 인증이 완료됐어요!' || chr(10)
           || '이제 소개팅 매칭에 참여할 수 있어요.' || chr(10)
           || '(学生認証が完了しました！これから紹介マッチングに参加できます)'
      else '🪪 [ONDO 36.5°] 보내 주신 학생증(또는 신분 입증 자료)을 확인하지 못했어요.' || chr(10)
           || '학교 이름과 본인 신분이 잘 보이게 다시 올려 주세요.' || chr(10)
           || '(学生証を確認できませんでした。再度アップロードしてください)' end;
    v_link := case when p_approve
      then 'https://darkhos.github.io/ondo-campus/'
      else 'https://darkhos.github.io/ondo-campus/join/' end;
    v_btn := case when p_approve
      then '온도 라운지 열기'
      else '다시 인증하러 가기' end;

    begin
      perform public.ondo_kakao_notify_call(jsonb_build_object(
        'action', 'send_member',
        'auth_user_id', v_auth_user_id::text,
        'text', v_msg,
        'link_url', v_link,
        'button_title', v_btn
      ));
    exception when others then
      null;
    end;
  end if;

  return v_path;
end;
$$;

-- ============================================================================
-- [회원 기능] 매칭 쉬어가기 · 매칭 상대 정보 · 회원 탈퇴
-- ============================================================================
alter table public.ondo_members add column if not exists matching_paused boolean not null default false;

-- 매칭 쉬어가기 (켜면 자동 매칭 대상에서 제외)
create or replace function public.ondo_set_matching_paused(p_paused boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id text := public.ondo_current_member_id();
begin
  if v_member_id is null then
    raise exception 'Login required';
  end if;
  update public.ondo_members
  set matching_paused = coalesce(p_paused, false), updated_at = now()
  where id = v_member_id;
  return true;
end;
$$;


-- 가입 정보 초기화: 카카오 로그인 계정(auth.users)과 운영자 권한(ondo_admins)은 유지한 채 내 회원 프로필·인증 상태만 초기화
create or replace function public.ondo_reset_my_profile()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id text := public.ondo_current_member_id();
begin
  if v_member_id is null then
    return false;
  end if;
  delete from public.ondo_match_messages
  where match_id in (select id from public.ondo_matches where female_id = v_member_id or male_id = v_member_id);
  delete from public.ondo_matches where female_id = v_member_id or male_id = v_member_id;
  delete from public.ondo_school_email_codes where member_id = v_member_id;
  delete from public.ondo_members where id = v_member_id;
  return true;
end;
$$;

-- 회원 탈퇴: 프로필·매칭·인증번호·로그인 계정까지 삭제 (문의·신고 기록은 회원 연결만 끊고 보관)
-- 학생증 사진은 관리자 화면 또는 아래 본인 삭제 권한으로 앱이 먼저 지움
create or replace function public.ondo_delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id text := public.ondo_current_member_id();
  v_auth uuid := auth.uid();
begin
  if v_member_id is null or v_auth is null then
    raise exception 'Login required';
  end if;
  delete from public.ondo_match_messages
  where match_id in (select id from public.ondo_matches where female_id = v_member_id or male_id = v_member_id);
  delete from public.ondo_matches where female_id = v_member_id or male_id = v_member_id;
  delete from public.ondo_school_email_codes where member_id = v_member_id;
  update public.ondo_support_tickets
  set member_id = null, client_key = null, reply_contact = null
  where member_id = v_member_id;
  delete from public.ondo_members where id = v_member_id;
  delete from public.ondo_member_kakao_tokens where auth_user_id = v_auth;
  delete from public.ondo_admins where auth_user_id = v_auth;
  delete from auth.users where id = v_auth;
  return true;
end;
$$;

drop policy if exists "ondo student id delete own folder" on storage.objects;
create policy "ondo student id delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-ids' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- [매칭 2.0] 서로 수락 → 남학생 티켓 1장 서버 차감(여학생 무료) → 실제 채팅
-- → 두 사람이 각각 2번 이상·합계 5번 이상 대화하면 연락처 공개(CONFIRMED)
-- 상태: PENDING(수락 대기, 예전 HELD 포함) · CHATTING · CONFIRMED · PASSED · EXPIRED · REFUNDED(예전)
-- ============================================================================
alter table public.ondo_matches add column if not exists female_response text not null default 'PENDING';
alter table public.ondo_matches add column if not exists male_response text not null default 'PENDING';
alter table public.ondo_matches add column if not exists male_ticket_charged boolean not null default false;
alter table public.ondo_matches add column if not exists chat_opened_at timestamptz;

create table if not exists public.ondo_match_messages (
  id bigserial primary key,
  match_id text not null,
  sender_id text not null,
  body text not null check (length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.ondo_match_messages enable row level security;
create index if not exists ondo_match_messages_match_idx on public.ondo_match_messages (match_id, id);

-- 연락처 공개 조건: 운영자 확정 또는 두 사람 각각 2번 이상·합계 5번 이상 대화
create or replace function public.ondo_match_contact_open(p_match_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ondo_matches m
    where m.id = p_match_id
      and (
        m.ticket_status = 'CONFIRMED'
        or (
          m.ticket_status = 'CHATTING'
          and (select count(*) from public.ondo_match_messages x where x.match_id = m.id and x.sender_id = m.female_id) >= 2
          and (select count(*) from public.ondo_match_messages x where x.match_id = m.id and x.sender_id = m.male_id) >= 2
          and (select count(*) from public.ondo_match_messages x where x.match_id = m.id) >= 5
        )
      )
  );
$$;

drop function if exists public.ondo_get_my_match_partners();
create or replace function public.ondo_get_my_match_partners()
returns table (
  match_id text,
  ticket_status text,
  my_response text,
  partner_response text,
  partner_id text,
  nickname text,
  univ text,
  major text,
  age integer,
  gender text,
  mbti text,
  bio text,
  height integer,
  location_label text,
  hobbies jsonb,
  profile_extra jsonb,
  contact text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select public.ondo_current_member_id() as id)
  select m.id,
         case when m.ticket_status = 'HELD' then 'PENDING' else m.ticket_status end,
         case when m.female_id = me.id then m.female_response else m.male_response end,
         case when m.female_id = me.id then m.male_response else m.female_response end,
         p.id, p.nickname, p.univ, p.major, p.age, p.gender, p.mbti, p.bio,
         nullif(p.profile_extra ->> 'height', '')::integer,
         p.profile_extra ->> 'locationLabel',
         coalesce(p.profile_extra -> 'hobbies', '[]'::jsonb),
         -- 상대 카드에 보이는 항목만 전달 (선호 조건·위치 등 나머지 profile_extra는 보내지 않음)
         jsonb_strip_nulls(jsonb_build_object(
           'build', coalesce(p.profile_extra -> 'build', p.profile_extra -> 'bodyType'),
           'impression', p.profile_extra -> 'impression',
           'smokingStatus', p.profile_extra -> 'smokingStatus',
           'religion', p.profile_extra -> 'religion',
           'vibeKeywords', coalesce(p.profile_extra -> 'vibeKeywords', p.profile_extra -> 'celebrityLookalikes'),
           'voiceIntroText', p.profile_extra -> 'voiceIntroText'
         )),
         case when public.ondo_match_contact_open(m.id) then p.contact else null end,
         coalesce(m.created_at_ts, now())
  from public.ondo_matches m
  cross join me
  join public.ondo_members p
    on p.id = case when m.female_id = me.id then m.male_id else m.female_id end
  where me.id is not null
    and (m.female_id = me.id or m.male_id = me.id)
  order by coalesce(m.created_at_ts, now()) desc;
$$;
-- 다시 만들 때 기본 권한(PUBLIC 실행 허용)이 붙으므로 비로그인 호출은 바로 막음
revoke all on function public.ondo_get_my_match_partners() from public, anon;
grant execute on function public.ondo_get_my_match_partners() to authenticated;


-- 수락/패스: 남학생 수락 시 티켓 1장 차감, 패스·만료 시 차감분 환급
create or replace function public.ondo_respond_match(p_match_id text, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me text := public.ondo_current_member_id();
  v_m public.ondo_matches;
  v_is_male boolean;
  v_other text;
begin
  if v_me is null then
    raise exception 'Login required';
  end if;
  select * into v_m from public.ondo_matches where id = p_match_id for update;
  if v_m.id is null or (v_m.female_id <> v_me and v_m.male_id <> v_me) then
    raise exception 'Not your match';
  end if;
  if v_m.ticket_status not in ('PENDING', 'HELD') then
    raise exception 'Match closed';
  end if;
  v_is_male := v_m.male_id = v_me;

  if not coalesce(p_accept, false) then
    update public.ondo_matches
    set ticket_status = 'PASSED',
        female_response = case when v_is_male then female_response else 'PASS' end,
        male_response = case when v_is_male then 'PASS' else male_response end,
        male_ticket_charged = false
    where id = p_match_id;
    if v_m.male_ticket_charged then
      update public.ondo_members set tickets = coalesce(tickets, 0) + 1, updated_at = now()
      where id = v_m.male_id;
    end if;
    return 'PASSED';
  end if;

  if v_is_male and not v_m.male_ticket_charged then
    update public.ondo_members set tickets = tickets - 1, updated_at = now()
    where id = v_me and coalesce(tickets, 0) >= 1;
    if not found then
      raise exception 'Not enough tickets';
    end if;
  end if;

  update public.ondo_matches
  set female_response = case when v_is_male then female_response else 'ACCEPT' end,
      male_response = case when v_is_male then 'ACCEPT' else male_response end,
      male_ticket_charged = male_ticket_charged or v_is_male
  where id = p_match_id
  returning * into v_m;

  v_other := case when v_is_male then v_m.female_response else v_m.male_response end;
  if v_other = 'ACCEPT' then
    update public.ondo_matches set ticket_status = 'CHATTING', chat_opened_at = now()
    where id = p_match_id;
    return 'CHATTING';
  end if;
  return 'PENDING';
end;
$$;

create or replace function public.ondo_send_match_message(p_match_id text, p_body text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me text := public.ondo_current_member_id();
  v_m public.ondo_matches;
  v_body text := trim(coalesce(p_body, ''));
  v_id bigint;
begin
  if v_me is null then
    raise exception 'Login required';
  end if;
  select * into v_m from public.ondo_matches where id = p_match_id;
  if v_m.id is null or (v_m.female_id <> v_me and v_m.male_id <> v_me) then
    raise exception 'Not your match';
  end if;
  if v_m.ticket_status not in ('CHATTING', 'CONFIRMED') then
    raise exception 'Chat closed';
  end if;
  if length(v_body) < 1 or length(v_body) > 500 then
    raise exception 'Invalid message length';
  end if;
  if (select count(*) from public.ondo_match_messages
      where sender_id = v_me and created_at > now() - interval '1 minute') >= 15 then
    raise exception 'Too many messages';
  end if;

  insert into public.ondo_match_messages (match_id, sender_id, body)
  values (p_match_id, v_me, v_body)
  returning id into v_id;

  -- 대화 조건(각자 2번·합계 5번)을 채우면 연락처 공개 상태로 전환
  if v_m.ticket_status = 'CHATTING' and public.ondo_match_contact_open(p_match_id) then
    update public.ondo_matches set ticket_status = 'CONFIRMED' where id = p_match_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.ondo_list_match_messages(p_match_id text, p_after_id bigint default 0)
returns table (id bigint, mine boolean, body text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select x.id, x.sender_id = public.ondo_current_member_id(), x.body, x.created_at
  from public.ondo_match_messages x
  join public.ondo_matches m on m.id = x.match_id
  where x.match_id = p_match_id
    and public.ondo_current_member_id() in (m.female_id, m.male_id)
    and x.id > coalesce(p_after_id, 0)
  order by x.id
  limit 300;
$$;

-- 자동 매칭 + 24시간 미응답 정리 (pg_cron 매시간 / 운영자 수동 실행)
create or replace function public.ondo_run_autonomous_batch()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refunded_count integer := 0;
  v_matched_count integer := 0;
  v_today_prefix text := 'auto-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-';
  v_kst_hour integer := extract(hour from (now() at time zone 'Asia/Seoul'));
  r_expired record;
  r_female public.ondo_members;
  r_male public.ondo_members;
  v_score integer;
  v_match_id text;
  v_used_males text[] := array[]::text[];
  v_f_min integer;
  v_f_max integer;
begin
  -- 0) 학생 인증은 1년마다 다시 받기 (졸업생 걸러내기)
  update public.ondo_members
  set verified = false, student_id_status = 'pending', updated_at = now()
  where verified and verified_at is not null and verified_at < now() - interval '1 year';

  -- 1) 수락 대기 24시간 초과 → 만료 (남학생이 이미 냈다면 환급)
  --    채팅 시작 후 24시간 동안 여학생 첫 답장이 없으면 → 만료 + 환급
  for r_expired in
    select m.id, m.male_id, m.male_ticket_charged
    from public.ondo_matches m
    where (m.ticket_status in ('PENDING', 'HELD')
           and coalesce(m.created_at_ts, now()) < now() - interval '24 hours')
       or (m.ticket_status = 'CHATTING'
           and m.chat_opened_at < now() - interval '24 hours'
           and not exists (select 1 from public.ondo_match_messages x
                           where x.match_id = m.id and x.sender_id = m.female_id))
  loop
    update public.ondo_matches
    set ticket_status = 'EXPIRED', male_ticket_charged = false
    where id = r_expired.id;
    if r_expired.male_ticket_charged then
      update public.ondo_members set tickets = coalesce(tickets, 0) + 1, updated_at = now()
      where id = r_expired.male_id;
      v_refunded_count := v_refunded_count + 1;
    end if;
  end loop;

  -- 2) 매일 밤 9시(KST) 이후에만 실행 (운영자가 수동으로 실행한 경우는 시간과 관계없이 실행)
  --    같은 날(21시·22시·23시) 이미 자동 매칭을 받은 회원은 중복 매칭하지 않음
  if v_kst_hour >= 21 or public.ondo_is_admin() then
    for r_female in
      select f.* from public.ondo_members f
      where f.gender in ('F', 'FEMALE') and f.verified
        and not coalesce(f.matching_paused, false)
        and not exists (select 1 from public.ondo_matches om
                        where om.female_id = f.id
                          and (om.ticket_status in ('PENDING', 'HELD', 'CHATTING')
                               or (not public.ondo_is_admin() and om.id like v_today_prefix || '%')))
      order by f.updated_at desc
      limit 50
    loop
      v_f_min := coalesce(nullif(r_female.profile_extra ->> 'preferredAgeMin', '')::integer, 19);
      v_f_max := coalesce(nullif(r_female.profile_extra ->> 'preferredAgeMax', '')::integer, 40);

      -- 다른 학교 · 활성 매칭 없음 · 오늘 자동 매칭 이력 없음 · 과거 매칭 이력 없음
      -- 서로의 선호 나이·흡연·종교 조건을 우선 반영하되 (예전 버전에 저장된 선호 값도 같은 뜻으로 인식), 스마트 조건 완화(smartRelaxFilter)가 켜져 있으면 차순위 후보도 허용
      select * into r_male
      from public.ondo_members m
      where m.gender in ('M', 'MALE') and m.verified
        and not coalesce(m.matching_paused, false)
        and (
          m.univ <> r_female.univ
          or (
            coalesce((r_female.profile_extra ->> 'avoidSameSchool')::boolean, true) = false
            and coalesce((m.profile_extra ->> 'avoidSameSchool')::boolean, true) = false
          )
        )
        and not (m.id = any(v_used_males))
        and (
          (
            coalesce(m.age, 24) between v_f_min and v_f_max
            and coalesce(r_female.age, 22) between
                  coalesce(nullif(m.profile_extra ->> 'preferredAgeMin', '')::integer, 19)
              and coalesce(nullif(m.profile_extra ->> 'preferredAgeMax', '')::integer, 40)
          )
          or (
            coalesce((r_female.profile_extra ->> 'smartRelaxFilter')::boolean, true)
            and coalesce((m.profile_extra ->> 'smartRelaxFilter')::boolean, true)
            and coalesce(m.age, 24) between (v_f_min - 2) and (v_f_max + 2)
            and coalesce(r_female.age, 22) between
                  (coalesce(nullif(m.profile_extra ->> 'preferredAgeMin', '')::integer, 19) - 2)
              and (coalesce(nullif(m.profile_extra ->> 'preferredAgeMax', '')::integer, 40) + 2)
          )
        )
        and (
          coalesce(r_female.profile_extra ->> 'preferredSmoking', 'any') not in ('no_smoke', 'non_smoker_only')
          or coalesce(m.profile_extra ->> 'smokingStatus', 'NON_SMOKER') = 'NON_SMOKER'
          or coalesce((r_female.profile_extra ->> 'smartRelaxFilter')::boolean, true)
        )
        and (
          coalesce(m.profile_extra ->> 'preferredSmoking', 'any') not in ('no_smoke', 'non_smoker_only')
          or coalesce(r_female.profile_extra ->> 'smokingStatus', 'NON_SMOKER') = 'NON_SMOKER'
          or coalesce((m.profile_extra ->> 'smartRelaxFilter')::boolean, true)
        )
        and not exists (select 1 from public.ondo_matches om
                        where om.male_id = m.id
                          and (om.ticket_status in ('PENDING', 'HELD', 'CHATTING')
                               or (not public.ondo_is_admin() and om.id like v_today_prefix || '%')))
        and not exists (select 1 from public.ondo_matches om
                        where om.female_id = r_female.id and om.male_id = m.id)
      order by
        -- 1순위: 엄격한 선호 나이 범위 일치 여부
        case when coalesce(m.age, 24) between v_f_min and v_f_max
              and coalesce(r_female.age, 22) between
                    coalesce(nullif(m.profile_extra ->> 'preferredAgeMin', '')::integer, 19)
                and coalesce(nullif(m.profile_extra ->> 'preferredAgeMax', '')::integer, 40)
             then 0 else 1 end asc,
        -- 2순위: 흡연 선호 일치 여부
        case when (coalesce(r_female.profile_extra ->> 'preferredSmoking', 'any') not in ('no_smoke', 'non_smoker_only')
                   or coalesce(m.profile_extra ->> 'smokingStatus', 'NON_SMOKER') = 'NON_SMOKER')
              and (coalesce(m.profile_extra ->> 'preferredSmoking', 'any') not in ('no_smoke', 'non_smoker_only')
                   or coalesce(r_female.profile_extra ->> 'smokingStatus', 'NON_SMOKER') = 'NON_SMOKER')
             then 0 else 1 end asc,
        -- 3순위: 종교 선호 일치 여부
        case when (coalesce(r_female.profile_extra ->> 'preferredReligion', 'any') = 'any'
                   or (r_female.profile_extra ->> 'preferredReligion' in ('none_only', 'nonreligious_preferred') and coalesce(m.profile_extra ->> 'religion', 'NONE') = 'NONE')
                   or (r_female.profile_extra ->> 'preferredReligion' in ('same_only', 'same_as_me') and coalesce(m.profile_extra ->> 'religion', 'NONE') = coalesce(r_female.profile_extra ->> 'religion', 'NONE')))
             then 0 else 1 end asc,
        -- 4순위: 나이 차이 및 최근 활동 순
        abs(coalesce(m.age, 24) - coalesce(r_female.age, 22)) asc,
        m.updated_at desc
      limit 1;

      if r_male.id is not null then
        v_used_males := v_used_males || r_male.id;
        v_score := least(99, greatest(85, 95 - abs(coalesce(r_male.age, 24) - coalesce(r_female.age, 22))));
        v_match_id := v_today_prefix || substr(md5(r_female.id || ':' || r_male.id), 1, 6);
        insert into public.ondo_matches (
          id, female_id, female_name, male_id, male_name, score, ticket_status, created_at, created_at_ts
        ) values (
          v_match_id, r_female.id, r_female.nickname, r_male.id, r_male.nickname, v_score, 'PENDING',
          to_char(now() at time zone 'Asia/Seoul', 'MM/DD') || ' 밤 9시 자동 매칭', now()
        )
        on conflict (id) do nothing;
        if found then
          v_matched_count := v_matched_count + 1;
        end if;
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'refunded_count', v_refunded_count,
    'matched_count', v_matched_count,
    'executed_at_kst', to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS')
  );
end;
$$;

-- ============================================================================
-- [경비 규칙] 모르는 사람(anon)에게는 어떤 사물함도 열어 주지 않기
-- Supabase는 새 함수/테이블에 anon·authenticated 실행 권한을 기본으로 주므로 명시적으로 회수합니다.
-- ============================================================================
-- 앞으로 만드는 함수도 기본적으로 아무에게도 실행 권한을 주지 않음
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- 테이블 직접 접근 차단 (RLS 정책이 없어 이미 막혀 있지만 이중 잠금)
revoke all on table public.ondo_match_messages from anon, authenticated;
revoke all on table public.ondo_members, public.ondo_matches,
  public.ondo_payment_orders, public.ondo_security_audit_log,
  public.ondo_support_tickets, public.ondo_admins,
  public.ondo_univ_email_domains, public.ondo_school_email_codes,
  public.ondo_kakao_notify, public.ondo_kakao_connect_states,
  public.ondo_member_kakao_tokens
  from anon, authenticated;

-- 모든 ondo_ 함수의 실행 권한을 일단 전부 회수
do $$
declare
  r record;
begin
  for r in (
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'ondo\_%'
  ) loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

-- 로그인한 회원(authenticated)만 본인용 함수 실행 가능
grant execute on function public.ondo_current_member_id() to authenticated;
grant execute on function public.ondo_get_my_profile() to authenticated;
grant execute on function public.ondo_get_my_matches() to authenticated;
grant execute on function public.ondo_upsert_my_profile(text, text, text, text, integer, text, text, text, jsonb) to authenticated;
grant execute on function public.ondo_respond_match(text, boolean) to authenticated;
grant execute on function public.ondo_send_match_message(text, text) to authenticated;
grant execute on function public.ondo_list_match_messages(text, bigint) to authenticated;
grant execute on function public.ondo_request_school_email_code(text) to authenticated;
grant execute on function public.ondo_verify_school_email_code(text) to authenticated;
grant execute on function public.ondo_submit_student_id_review(text) to authenticated;
grant execute on function public.ondo_set_matching_paused(boolean) to authenticated;
grant execute on function public.ondo_get_my_match_partners() to authenticated;
grant execute on function public.ondo_reset_my_profile() to authenticated;
grant execute on function public.ondo_delete_my_account() to authenticated;
grant execute on function public.ondo_save_my_kakao_token(text, text) to authenticated;

-- 어드민 함수: 운영자 명찰(ondo_admins)이 있는 카카오 계정만 실제로 동작
grant execute on function public.ondo_is_admin() to authenticated;
grant execute on function public.ondo_admin_list_members() to authenticated;
grant execute on function public.ondo_admin_list_matches() to authenticated;
grant execute on function public.ondo_admin_grant_ticket(text, integer) to authenticated;
grant execute on function public.ondo_admin_delete_members(text[]) to authenticated;
grant execute on function public.ondo_admin_update_match_status(text, text) to authenticated;
grant execute on function public.ondo_admin_create_match(text, text, text) to authenticated;
grant execute on function public.ondo_admin_run_autonomous_batch() to authenticated;
grant execute on function public.ondo_admin_list_support_tickets() to authenticated;
grant execute on function public.ondo_admin_kakao_connect_start() to authenticated;
grant execute on function public.ondo_admin_kakao_notify_status() to authenticated;
grant execute on function public.ondo_admin_kakao_notify_test() to authenticated;
grant execute on function public.ondo_admin_update_support_ticket(bigint, text) to authenticated;
grant execute on function public.ondo_admin_review_student(text, boolean) to authenticated;

-- 문의 접수는 비회원(anon)도 가능 — 넣기만 되고 꺼내 보기는 불가
grant execute on function public.ondo_submit_support_ticket(text, text, text, text) to anon, authenticated;

-- ondo_run_autonomous_batch, ondo_notify_support_ticket 는 외부 실행 불가
-- (자동 매칭/환급은 위 pg_cron 스케줄러만 실행, 메일 알림은 트리거만 실행)

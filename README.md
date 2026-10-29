# 온도 (ONDO 36.5°) — 대학생 1:1 블라인드 소개 (Next.js 16)

학교 인증을 마친 한국 대학생과 일본인 어학당생·유학생을 가치관 노트로 연결하고,
서로 수락하면 블라인드 대화를 거쳐 연락처를 교환하는 서비스입니다.

## 실행

```bash
npm install
env -u NODE_ENV npm run dev      # http://localhost:3000
```

> 셸에 `NODE_ENV=development`가 export되어 있으면 `next build`가 실패하므로 `env -u NODE_ENV`로 실행하세요.

배포는 정적 빌드를 GitHub Pages(`gh-pages` 브랜치)에 올립니다: `npm run deploy`

## 화면

| 영역 | 경로 |
| --- | --- |
| 소개(비회원) · 라운지 홈(회원) | `/` |
| 로그인 · 회원가입(학교 인증) | `/login`, `/join` |
| 카카오 로그인 콜백 | `/auth/callback` |
| 커피티켓 · 친구 초대 · 캠퍼스 홍보 미션 | `/points`, `/invite`, `/mission` |
| 알림 · 신고 · FAQ | `/notifications`, `/report`, `/faq` |
| 일본인 학생 안내 | `/jp` |
| 이용약관 · 개인정보처리방침 · 안전 가이드 | `/terms`, `/privacy`, `/safety` |
| 운영자 대시보드 | `/admin` |

## 구성

- `src/lib/ondo-constants.ts` — 공용 상수 · 타입 · 체험용 샘플 데이터
- `src/lib/supabase.ts` — 회원 · 매칭 · 문의 데이터 (Supabase RPC)
- `src/lib/i18n.ts` — 한국어/일본어 전환
- `supabase/` — 보안 정책 · RPC SQL, Edge Functions (메일 · 카카오 알림)

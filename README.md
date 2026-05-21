# SOUL의 자전거 기록!!

가족(엄마/솔이/아빠) 자전거 운동 기록 및 통계 앱

## 배포

- **URL**: https://soul-bicycle.up.railway.app
- **GitHub**: https://github.com/Terry-Gabia/bicycle
- **Railway**: Dockerfile 기반 배포 (자동 배포 - main push 시)

## 기술 스택

- **프론트엔드**: React 18 + TypeScript + Vite + Tailwind CSS 4
- **백엔드**: Express 5 (Node.js)
- **DB**: Supabase (PostgreSQL) - 골프 프로젝트와 동일한 Supabase 프로젝트 공유
- **인증**: Supabase Auth (이메일/Google/네이버)

## 프로젝트 구조

```
bicycle/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── App.tsx              # 메인 앱 (탭: 기록/통계)
│   │   ├── components/
│   │   │   ├── auth/AuthForm.tsx          # 로그인/회원가입 (벚꽃 배경)
│   │   │   ├── layout/Header.tsx          # 헤더 + 탭 네비
│   │   │   ├── layout/ThemeToggle.tsx     # 다크모드 토글
│   │   │   ├── bicycle/BicycleCalendar.tsx # 달력 + 체크박스
│   │   │   └── stats/StatsTab.tsx         # 통계 (가족별 목표)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts                 # 인증 (이메일/Google/네이버)
│   │   │   ├── useTheme.ts               # 다크모드 (DB/localStorage)
│   │   │   └── useBicycleRecords.ts       # 자전거 기록 CRUD + 낙관적 업데이트
│   │   ├── lib/supabase.ts               # Supabase 클라이언트
│   │   ├── types/index.ts                # 타입 정의 + 가족 목표 상수
│   │   └── utils/
│   │       ├── errorMessages.ts          # Supabase 에러 한국어 번역
│   │       └── holidays.ts              # 한국 공휴일 + 가족 생일 + 놀금
│   ├── public/cherry-blossom.png         # 로그인 배경 (집앞 벚꽃)
│   ├── vite.config.ts
│   ├── package.json
│   └── index.html
├── backend/
│   ├── server.js                # Express 서버 (네이버 OAuth + 정적파일 서빙)
│   └── package.json
├── supabase-schema.sql          # DB 스키마 (bicycle_records, bicycle_user_profiles)
├── Dockerfile                   # Railway 배포용
├── railway.json
├── .env                         # 환경변수 (git 미포함)
├── bike_april.xlsx              # 원본 엑셀 데이터 참고용
└── logo.png                     # 네이버 로그인 로고 (140x140)
```

## DB 스키마 (Supabase)

### bicycle_records
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 자동생성 |
| record_date | DATE (UNIQUE) | 날짜 (하루 1레코드) |
| mama | BOOLEAN | 엄마 탑승 여부 |
| soli | BOOLEAN | 솔이 탑승 여부 |
| papa | BOOLEAN | 아빠 탑승 여부 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

- RLS: 인증된 사용자 누구나 CRUD 가능 (가족 공유 데이터)
- Realtime 활성화됨

### bicycle_user_profiles
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID (PK, FK) | auth.users 참조 |
| display_name | TEXT | 표시 이름 |
| theme | TEXT | 'light' or 'dark' |

## 인증

### 이메일/비밀번호
- Supabase Auth 기본 기능

### Google OAuth
- Supabase Auth → Providers → Google에서 설정
- Google Cloud Console OAuth 클라이언트: `SOUL BICYCLE`
- Authorized redirect URI: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`
- Authorized JavaScript origin: `https://<YOUR_SUPABASE_PROJECT>.supabase.co`

### Naver OAuth
- 네이버 개발자센터 앱: `솔이의자전거기록`
- 백엔드(/api/auth/naver)에서 처리 → magic link로 Supabase 로그인
- 서비스 URL: `https://soul-bicycle.up.railway.app`
- Callback URL: `https://soul-bicycle.up.railway.app/api/auth/naver/callback`
- 개발 상태: "개발 중" (멤버관리에서 테스트 계정 추가 필요)

### Supabase URL Configuration
- Site URL: 골프 프로젝트 URL 유지 (공유 Supabase)
- Redirect URLs에 `https://soul-bicycle.up.railway.app/**` 추가됨

## 환경변수

### .env (로컬 개발용)
```
VITE_SUPABASE_URL=https://<YOUR_SUPABASE_PROJECT>.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_URL=https://<YOUR_SUPABASE_PROJECT>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3001
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Railway Variables
- 위 변수 전부 + `BASE_URL=https://soul-bicycle.up.railway.app`
- **주의**: Railway Dockerfile 배포 시 `SUPABASE_URL`이 런타임에 주입 안 되는 이슈 있음
  → Dockerfile에 ARG/ENV로 모든 변수 명시적 선언
  → 백엔드에서 `VITE_SUPABASE_URL`을 fallback으로 사용

## 주요 기능

### 달력 (기록 탭)
- 이번 달 달력 기본 표시, 월 이동 가능
- 날짜별 엄마/솔이/아빠 체크박스로 자전거 탑승 기록
- 미래 날짜는 비활성화
- 오늘 날짜 파란색 원으로 표시
- 일요일/공휴일 빨간색, 토요일 파란색
- 한국 공휴일 표시 (설날, 추석, 삼일절 등)
- 가족 생일 표시: 엄마(9/1), 솔이(12/12), 연준(10/16), 아빠(음력9/1)
- 아빠 놀금 표시: 매월 2째주, 4째주 금요일 (가비아)
- 낙관적 업데이트 (체크 즉시 반영, 실패 시 롤백)
- Supabase Realtime 구독 (다른 기기에서 변경 시 자동 반영)

### 통계 탭
- 월간 가족별 목표 달성 현황
  - 솔이: 15회 이상 → "용돈 만원 추가!!!"
  - 엄마: 10회 이상 → "건강 100점!!"
  - 아빠: 7회 이상 → "운동 목표 달성!!"
- 목표 미달 시 남은 횟수 + 응원 메시지
- 프로그레스 바로 진행률 시각화
- 주간별 기록 테이블
- 월 경과일/남은일 표시

### 테마
- 라이트/다크 모드 토글
- 로그인 전: localStorage + OS 설정 감지
- 로그인 후: DB(bicycle_user_profiles)에 저장 → 기기간 동기화

## 로컬 개발

```bash
# Node 20 필요 (fnm use 20)
cd frontend && npm install && npm run dev    # http://localhost:5173
cd backend && npm install && npm run dev     # http://localhost:3001
```

- Vite dev 서버가 `/api` 요청을 백엔드(3001)로 프록시

## 배포 메모

- Railway Dockerfile 빌드 시 VITE_ 환경변수가 빌드 시점에 필요 → ARG로 선언
- Railway PORT는 자동 할당 (8080 등), 코드에서 `process.env.PORT` 사용
- Health check: `/api/health`
- Express 5 사용 중 → 와일드카드 라우트는 `{*path}` 문법 필요 (`*` 불가)

## 참고

- 골프 프로젝트: `../golf` (동일 Supabase, 동일 기술스택)
- 원본 엑셀: `bike_april.xlsx` (날짜/요일/엄마/솔이/아빠 컬럼, 1/0 값)

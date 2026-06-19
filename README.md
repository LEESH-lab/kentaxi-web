# 🚕 켄택시 (KENTECH Taxi Sharing Service)

한국에너지공과대학교(KENTECH)와 **나주역**을 오가는 학생·교직원을 위한 **택시 합승(동승) 매칭 웹서비스**입니다.
SRT/KTX 실시간 공공데이터를 기반으로 열차 시간에 맞춰 합승 팟(Pot)을 만들고, 참여하고, 실시간 채팅으로 조율한 뒤 정산까지 한 화면에서 처리할 수 있습니다.

🔗 **라이브 서비스:** https://kentaxi-web.vercel.app

---

## 1. 해결하는 문제 & 타깃 사용자

- **타깃 사용자:** KENTECH 대학생·대학원생·연구원·교직원
- **문제:** 나주역–학교 간 택시비 부담이 크고, 합승 모집이 에브리타임/카카오 오픈채팅에 파편화되어 있어 매칭이 어렵고 열차 시간을 놓치기 쉽다.
- **제공 가치:**
  - **정확성** — SRT/KTX 실시간 공공데이터 연동으로 신뢰도 높은 열차 시간 제공
  - **편의성** — 열차 기준 합승 팟 생성·참여, 한 화면(Single View) 완결형 UX
  - **소통·정산** — 실시간 채팅으로 동승자 조율 + 합승 후 자동 정산/송금 확인

## 2. 핵심 기능

1. **열차 기반 합승 팟 매칭** — 방향(학교행/나주역행)·시간대별로 팟을 만들고 참여
2. **실시간 채팅** — 같은 팟 참여자 간 메시지로 출발 시간·위치 조율
3. **정산(Settlement)** — 합승 비용 분배 및 송금 확인 처리
4. **인증** — Google 로그인 + 이메일 인증 코드 회원가입

---

## 3. 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| Framework | Next.js (App Router) + TypeScript |
| UI | React, Tailwind CSS |
| Auth | NextAuth (Google OAuth + 이메일 인증) |
| DB / ORM | PostgreSQL (Vercel/Neon) + Prisma |
| 외부 API | 공공데이터포털(data.go.kr) SRT/KTX 열차 정보 |
| Email | Nodemailer (인증 코드 발송) |
| 배포 | Vercel |

---

## 4. 로컬 실행 방법

### 사전 요구사항
- Node.js 20+ (배포 환경은 24.x)
- PostgreSQL 데이터베이스 (로컬 또는 Neon 등 클라우드)

### 설치 및 실행
```bash
# 1. 의존성 설치 (postinstall에서 prisma generate 자동 실행)
npm install

# 2. 환경변수 파일 작성 (아래 5번 참고) — .env 직접 생성
#    예: 키 이름만 채운 .env 파일을 만든 뒤 값 입력

# 3. DB 스키마 반영
npx prisma db push

# 4. 개발 서버 실행
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

### 주요 스크립트
| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | `prisma generate` + `prisma db push` + 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |

---

## 5. 환경변수 (`.env`)

> ⚠️ 실제 값은 저장소에 커밋하지 마세요. `.env*` 파일은 `.gitignore`로 제외되어 있습니다.

| 변수명 | 설명 |
|--------|------|
| `DATABASE_URL` / `POSTGRES_PRISMA_URL` | Prisma 연결용 PostgreSQL URL (pooled) |
| `POSTGRES_URL_NON_POOLING` | 직접 연결용 URL (마이그레이션) |
| `AUTH_SECRET` | NextAuth 세션 암호화 시크릿 |
| `NEXTAUTH_URL` | 앱 기본 URL (예: `http://localhost:3000`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth 클라이언트 자격증명 |
| `DATA_GO_KR_API_KEY` | 공공데이터포털 SRT/KTX API 키 |
| `EMAIL_USER` / `EMAIL_PASSWORD` | 인증 코드 발송용 이메일 계정 |
| `ANTHROPIC_API_KEY` | (선택) AI 보조 기능용 Anthropic API 키 |

---

## 6. 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 메인 단일 대시보드 (타임라인 + 팟 현황판)
│   ├── login/ register/      # 인증 페이지
│   ├── create-pot/           # 팟 생성
│   ├── chat/[id]/            # 팟별 실시간 채팅
│   ├── profile/ admin/       # 프로필 / 관리자
│   └── api/                  # 백엔드 API 라우트
│       ├── pots/             # 팟 생성·참여·탈퇴·정산
│       ├── messages/         # 채팅 메시지
│       ├── trains/           # 열차 시간 조회 (공공데이터)
│       └── auth/             # 회원가입·이메일 인증·NextAuth
├── services/trainService.ts  # 열차 데이터 클라이언트
├── lib/                      # prisma, email, kentech, transfer 유틸
└── auth.ts                   # NextAuth 설정
prisma/schema.prisma          # User/Pot/Message/Settlement 등 데이터 모델
```

---

## 7. 데이터 흐름 (예시: 합승 매칭)

```
사용자 → 메인 대시보드에서 방향·열차 선택
      → /api/trains (공공데이터 SRT/KTX 조회)
      → 팟 생성(/api/pots) 또는 참여(/api/pots/[id]/join)
      → /chat/[id] 실시간 채팅으로 조율 (/api/messages)
      → 합승 후 정산(/api/pots/[id]/settlement) → 송금 확인
```

---

## 8. 라이선스 / 출처

- 열차 시간 데이터: [공공데이터포털(data.go.kr)](https://www.data.go.kr) SRT/KTX 운행정보 API
- 교육용 프로젝트 (2026 Spring, Introduction to AI Programming Final Project)

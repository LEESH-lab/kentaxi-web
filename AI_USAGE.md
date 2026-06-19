# AI Usage Report — KenTaxi (KENTECH Taxi Sharing Service)

> 본 문서는 KenTaxi 개발 과정에서 생성형 AI 도구를 어떻게 활용했는지 기록한 보고서입니다.
> Team 9 — Jisu Kim, Seunghyeon Lee, Donggyu Yoo
> 🔗 라이브 서비스: https://kentaxi-web-ten.vercel.app

## AI Tools Used
- **Gemini CLI** — 주요 코딩 에이전트 (아키텍처 설계·코드 생성·디버깅)
- **Claude Code** — 주요 코딩 에이전트 (코드 생성·리팩터링·문서화)

## Tasks Supported by AI
- **코드 생성**: Next.js App Router 아키텍처 설계 및 구현, React 컴포넌트(hooks 기반 상태관리) 작성, 7개로 연결된 Prisma 데이터 모델 최적화, pots/messages/settlements/user 관리용 REST API 라우트 구현
- **UI/UX 개발**: Tailwind CSS 기반 카카오 T 스타일 모바일 대시보드 디자인, 드럼롤 시간 선택기·슬라이드업 바텀시트·알림 토스트 애니메이션 등 복잡한 UI 패턴 구현
- **문서화**: PRD, README, 셋업 가이드 등 Markdown 프로젝트 문서 작성 및 최신화
- **배포 설정**: Vercel 배포 파이프라인 구성 — 환경변수 설정, Prisma 스키마 push 스크립트, 빌드 최적화

## Example Prompts
1. "나주역–KENTECH 택시 합승 매칭 서비스를 Next.js App Router + Prisma로 만들려고 한다. 7개 모델(User/Pot/Message/Settlement 등)의 스키마를 설계해줘."
2. "공공데이터포털 SRT/KTX TrainInfo API를 호출해 방향·날짜별 열차 목록을 반환하고, API 실패 시 mock 데이터로 폴백하는 라우트를 작성해줘."
3. "NextAuth v5 Credentials provider로 @kentech.ac.kr 도메인만 허용하고, 이메일 인증코드(nodemailer/Gmail SMTP)를 함께 구현해줘."
4. "카카오 T 스타일의 드럼롤 시간 선택기가 들어간 슬라이드업 바텀시트를 Tailwind로 만들어줘."

## AI Outputs We Modified
- 생성된 열차 API 응답 파싱 로직에 에러 핸들링과 mock 데이터 폴백 추가 (`src/services/trainService.ts`)
- 정산(Settlement)·결제(Payment) 모델과 관계, 출발 7일 후 계좌번호 자동 마스킹 로직 보완
- 팟 참여/탈퇴 API에 인증·중복 참여·과거 시간 팟 생성 방지 검증 추가
- 채팅을 2초 폴링 기반 동기화로 조정하고 메시지 전송 시 optimistic UI 적용
- UI를 기획서의 "단일 화면(Single View)" 원칙에 맞게 재구성

## Core Files We Can Explain
- `src/app/page.tsx` — 메인 단일 대시보드 (열차 타임라인 + 팟 현황판)
- `src/app/api/pots/route.ts` — 팟 생성·조회 API
- `src/app/api/pots/[id]/settlement/route.ts` — 정산 처리 로직
- `src/services/trainService.ts` — 공공데이터 열차 조회 클라이언트
- `src/auth.ts` — NextAuth 인증 설정 (@kentech.ac.kr 제한)
- `prisma/schema.prisma` — 7개 데이터 모델 정의

## What We Learned
- AI가 생성한 코드는 그대로 쓰기보다 **에러 처리·검증·예외 케이스**(과거 시간 팟 차단, 정원 초과 방지 등)를 직접 보완해야 안정적으로 동작한다.
- 외부 공공데이터 API는 응답 형식이 문서와 다를 수 있어, AI 코드를 실제 응답으로 검증하고 폴백을 설계하는 과정이 필요했다.
- Vercel 서버리스 환경은 WebSocket 상시 연결을 지원하지 않아, 실시간 채팅을 REST 폴링으로 구현하는 등 **배포 환경 제약에 맞춘 설계 판단**이 중요함을 배웠다.
- 프론트엔드(대시보드)–백엔드(API 라우트)–DB(Prisma)가 REST로 연결되는 전체 데이터 흐름을 이해하게 되었다.

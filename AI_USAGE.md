# AI Usage Report — KenTaxi (KENTECH Taxi Sharing Service)

> 본 문서는 KenTaxi 개발 과정에서 생성형 AI 도구를 어떻게 활용했는지 기록한 보고서입니다.
> Team 9 — Jisu Kim, Seunghyeon Lee, Donggyu Yoo
> 🔗 라이브 서비스: https://kentaxi-web-ten.vercel.app

## AI Tools Used
- **Gemini CLI** — 주요 코딩 에이전트 (아키텍처 설계·코드 생성·디버깅)
- **Claude Code** — 주요 코딩 에이전트 (코드 생성·리팩터링·문서화)

## Tasks Supported by AI
- **메인 대시보드 개발**: Next.js App Router 기반 단일 화면(Single View) 대시보드 — 열차 타임라인 + 팟 현황판 UI 및 hooks 기반 상태관리 구현
- **열차 시간표 연동**: 공공데이터포털 SRT/KTX TrainInfo API로 나주–수서/용산/목포 등 방향·날짜별 열차 시간표를 가져오는 기능 구현·보완
- **카카오 T 택시 호출 연동**: `kakaot://` 딥링크로 카카오 T 앱 직접 호출 기능 통합
- **인증/회원 관리**: NextAuth로 `@kentech.ac.kr` 이메일 인증 회원가입 및 세션 관리 구현
- **팟·정산 API**: 팟 생성/참여/탈퇴, 정산(Settlement)·결제 REST API 라우트 구현
- **데이터 모델링**: 7개로 연결된 Prisma 모델(User/Pot/Message/Settlement 등) 설계·최적화
- **배포·형상관리**: git 커밋·푸시 및 Vercel 배포 파이프라인(환경변수, Prisma push, 빌드) 구성
- **문서화**: PRD·README·기술 보고서 작성 및 요약 보조

## Example Prompts
> 아래는 실제 AI 에이전트 세션에서 진행한 작업을 대표하는 프롬프트입니다.
1. "카카오 T 택시 호출(`kakaot://`) 기능을 메인 화면에 연동해줘." *(세션: Integrating Kakao Taxi Calling Feature)*
2. "공공데이터포털 SRT/KTX API로 나주–수서/용산 방향 열차 시간표를 가져오는 기능을 업데이트해줘." *(세션: Updating Seoul Schedule Fetcher)*
3. "NextAuth로 `@kentech.ac.kr` 도메인만 허용하는 이메일 인증 회원가입을 구현해줘."
4. "수정사항 및 모든 것 git에 푸시해줘." *(세션: Pushing Git Changes)*

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

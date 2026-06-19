# AI Usage Report — 켄택시 (KENTECH Taxi Sharing Service)

> 본 문서는 프로젝트 개발 과정에서 생성형 AI 도구를 어떻게 활용했는지 기록한 보고서입니다.
> **⚠️ 팀이 채워야 할 부분:** 아래 `〔채우기〕` 표시가 있는 항목은 실제 사용 내역에 맞게 수정하세요.

## AI Tools Used
- Claude (Claude Code) — 코드 생성·디버깅·리팩터링
- ChatGPT — 〔채우기: 아이디어 브레인스토밍, 문서 작성 등 실제 사용한 용도〕
- 〔채우기: GitHub Copilot, Cursor, Gemini 등 추가로 사용한 도구가 있으면 기재〕

## Tasks Supported by AI
- 서비스 아이디어 브레인스토밍 및 합승 매칭 시나리오 설계
- Next.js(App Router) + Prisma 프로젝트 초기 구조 생성
- 데이터 모델(Prisma schema: User / Pot / Message / Settlement) 설계 보조
- 공공데이터포털(SRT/KTX) 열차 API 연동 코드 작성
- NextAuth 기반 Google 로그인 + 이메일 인증 코드 구현
- 팟 생성·참여·정산 API 라우트 작성 및 디버깅
- 실시간 채팅 기능 구현
- README / 기획서(PRD) 문서 구조 작성 보조

## Example Prompts
1. "나주역–학교 간 택시 합승 매칭 서비스를 Next.js와 Prisma로 만들려고 한다. 데이터 모델을 설계해줘."
2. "공공데이터포털 SRT/KTX 운행정보 API를 호출해서 방향·날짜별 열차 목록을 반환하는 API 라우트를 작성해줘."
3. "NextAuth로 Google OAuth와 이메일 인증 코드 회원가입을 함께 구현하려면 어떻게 설정해야 해?"
4. 〔채우기: 실제로 사용한 대표 프롬프트 1~2개 추가〕

## AI Outputs We Modified
- AI가 생성한 열차 API 응답 파싱 로직에 에러 핸들링·빈 배열 fallback 추가 (`src/services/trainService.ts`)
- 생성된 Prisma 스키마에 정산(Settlement)·결제(Payment) 모델 및 관계 보완
- 팟 참여/탈퇴 API에 인증·중복 참여 검증 로직 추가
- UI를 기획서의 "단일 화면(Single View)" 원칙에 맞게 재구성
- 〔채우기: 팀이 직접 수정·검증한 부분 추가〕

## Core Files We Can Explain
- `src/app/page.tsx` — 메인 단일 대시보드 (열차 타임라인 + 팟 현황판)
- `src/app/api/pots/route.ts` — 팟 생성·조회 API
- `src/app/api/pots/[id]/settlement/route.ts` — 정산 처리 로직
- `src/services/trainService.ts` — 공공데이터 열차 조회 클라이언트
- `src/auth.ts` — NextAuth 인증 설정
- `prisma/schema.prisma` — 데이터 모델 정의

## What We Learned
- AI가 생성한 코드는 그대로 쓰기보다 **에러 처리·검증·예외 케이스**를 직접 보완해야 안정적으로 동작한다는 점을 배웠다.
- 외부 공공데이터 API는 응답 형식이 문서와 다를 수 있어, AI 코드를 실제 응답으로 검증하는 과정이 필요했다.
- 프론트엔드(대시보드)–백엔드(API 라우트)–DB(Prisma)가 REST로 연결되는 전체 데이터 흐름을 이해하게 되었다.
- 〔채우기: 팀이 실제로 느낀 점 추가〕

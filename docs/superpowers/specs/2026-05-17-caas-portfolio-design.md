# CaaS 포트폴리오 강화 설계 스펙

**날짜**: 2026-05-17  
**목적**: 포트폴리오용 AI 연구비 감사 시스템을 클라이언트 평가자 기준으로 차별화  
**스택**: React 19 + TypeScript + Vite + Tailwind + Firebase + Gemini API

---

## 설계 결정 요약

| 항목 | 결정 |
|---|---|
| Agent Trace 레이아웃 | 전체화면 슬라이드업 모달 |
| 패턴 탐지 시각화 | 타임라인 + 알림 카드 |
| 데모 모드 진입 | 로그인 화면 "데모 체험" 버튼 |
| RAG 구현 방식 | 규칙 기반 + 조항 인용 (마크다운 규정집) |
| API 키 처리 | .env 환경변수 + README 보안 주의 명시 |

---

## 디자인 시스템 (모든 신규 컴포넌트 공통 적용)

모든 P1~P8 신규 컴포넌트는 기존 Apple HIG 기반 디자인 토큰을 그대로 사용한다. 새로운 색상·폰트·반경을 임의로 추가하지 않는다.

### 컬러 토큰
| 역할 | 값 | 용도 |
|---|---|---|
| 텍스트 기본 | `#1d1d1f` | 제목, 본문 |
| 텍스트 보조 | `#86868b` | 레이블, 설명 |
| 배경 페이지 | `#f5f5f7` | 뷰 배경 |
| 카드 배경 | `#ffffff` | 카드, 모달 |
| 액션 블루 | `#0066cc` | CTA 버튼, 링크 |
| 블루 호버 | `#0071e3` | 버튼 hover |
| 블루 틴트 | `#e3f2fd` | 배지 bg, 강조 영역 |
| 성공 초록 | `#34c759` | 정상 상태 |
| 경고 주황 | `#ff9f0a` | 검토필요 |
| 위험 빨강 | `#ff3b30` | 위반, destructive |
| 테두리 | `#d2d2d7` | 카드 border |

### 타이포그래피
- **폰트**: Geist Variable (`var(--font-sans)`)
- **본문**: 17px, line-height 1.47, letter-spacing -0.022em
- **섹션 제목**: `text-[24px] font-semibold tracking-tight text-[#1d1d1f]`
- **카드 레이블**: `text-[12px] font-semibold uppercase tracking-wide text-[#86868b]`
- **큰 숫자**: `text-[28px] font-semibold text-[#1d1d1f]`

### 카드 & 레이아웃
- 카드 기본: `bg-white rounded-[24px] border border-[#d2d2d7] shadow-sm p-6`
- 대형 모달: `rounded-[32px]`
- 버튼: `rounded-full` + `active:scale-95` + `transition-all`
- 섹션 패딩: `p-8` 또는 `p-10`
- Sticky 헤더: `backdrop-blur-xl bg-white/80`

### 애니메이션
- Framer Motion 전용 (`motion/react`)
- 페이지 전환: `initial={{ opacity: 0, y: 15 }}` → `animate={{ opacity: 1, y: 0 }}`
- easing: `[0.23, 1, 0.32, 1]`
- 카드 진입: `initial={{ opacity: 0, scale: 0.98 }}`

---

## P6: 데모 모드 (No-Login Guided Tour)

### 목적
포트폴리오 링크를 클릭한 평가자가 Google 로그인 없이 즉시 핵심 기능을 체험하게 한다.

### 구현 방식
- 로그인 화면 하단에 "✨ 데모로 체험하기" 버튼 추가
- 클릭 시 `AuthContext`에 `demoUser` 게스트 세션 주입
- Firestore 대신 `mockData.ts` 시드 데이터로 동작 (읽기 전용)
- 데모 세션 배지 (`DEMO` 태그) 헤더에 표시
- 데모 중 쓰기 작업 시 "데모 모드에서는 저장되지 않습니다" 토스트

### 시드 데이터 구성
- 정상 항목 5건, 검토필요 3건 (분할결제 포함), 소명중 2건
- 역할: `auditor` (모든 항목 조회 가능)

### 완료 기준
- `?demo=true` URL 파라미터 또는 버튼 클릭으로 진입 가능
- 로그인 없이 대시보드 전체 뷰 탐색 가능
- 새로고침 시 데모 세션 유지 (sessionStorage)

---

## P2: 규정 기반 RAG (인용 출처 표시)

### 목적
README의 "120개 규정 벡터 검증" 약속을 실제 코드로 이행. 위반 탐지 시 근거 조항 번호 인용.

### 구현 방식
- `src/data/regulations/` 디렉토리에 규정 마크다운 파일 18개 작성 (6개 카테고리 × 3개)
  - 파일명: `reg-01-meeting-expenses.md`, `reg-02-travel.md` 등
  - 각 파일: 조항 번호, 제목, 내용, 키워드 배열 포함
- `src/services/regulationService.ts`: 키워드 매칭 함수
  - 입력: `{ category, description, amount }`
  - 출력: `{ ruleId, ruleTitle, ruleArticle, excerpt }[]` (상위 3개)
- `aiService.ts`의 `analyzeAuditItem` 함수에 매칭된 규정 컨텍스트 주입
- 감사 결과 UI에 "근거 규정: 제3-2조 회의비 집행 기준" 인용 배지 추가

### 규정 파일 구조
```markdown
---
id: reg-03
article: "제3-2조"
title: "회의비 집행 기준"
keywords: ["회의비", "식대", "회식", "간담회"]
limit_per_person: 30000
---
연구과제 관련 회의 시 1인당 3만원 이내로 집행...
```

### 완료 기준
- 카테고리별 최소 3개 규정 파일 커버 (회의비, 여비, 재료비 등 6개 카테고리)
- 감사 항목 상세 화면에 인용 조항 표시
- 규정 없는 카테고리는 "해당 규정 없음" 표시

---

## P1: Agent Trace 패널 (전체화면 모달)

### 목적
영수증 업로드부터 결재 라우팅까지 AI 판단 과정을 단계별로 시각화. 평가자 시연의 핵심 무기.

### 트리거
- 감사 피드 행의 "AI 분석" 버튼 클릭
- 또는 신규 항목 등록 후 AI 분석 실행 시 자동 오픈

### 모달 구조 (5단계)
```
┌─────────────────────────────────────────────┐
│  AI 감사 실행 중 — [항목명] [금액]     ✕   │
├─────────────────────────────────────────────┤
│  ① OCR 파싱          ✅ 0.8s           │
│     가맹점: ... | 금액: ... | 날짜: ...     │
│                                             │
│  ② 규정 RAG 검색     ✅ 1.2s           │
│     적용: 제3-2조 회의비 집행 기준          │
│                                             │
│  ③ 위반 패턴 감지    ⚠️ 진행 중...     │
│     [실시간 스트리밍 텍스트]                │
│                                             │
│  ④ 사유서 초안       ⏳ 대기            │
│  ⑤ 결재 라우팅       ⏳ 대기            │
│     → 검토필요: auditor 역할로 자동 할당     │
└─────────────────────────────────────────────┘
```

### 기술 구현
- `AuditDetailSheet.tsx` 내에 trace 전용 뷰 추가 (별도 컴포넌트 분리)
- 각 단계는 순서대로 실행, 완료 시 체크 + 소요시간 표시
- Gemini 응답은 `ai.models.generateContentStream()`으로 실시간 스트리밍 표시 (@google/genai v1.29.0 지원)
- 단계별 상태: `pending` → `running` → `done` | `flagged`
- 단계 클릭 시 해당 단계 상세 정보 확장

### 완료 기준
- 5단계 모두 순차 실행 후 최종 상태(정상/검토필요) 표시
- 각 단계 소요시간 표시
- 규정 인용 (P2와 연동)
- 모달 닫기 후 피드 항목 상태 자동 업데이트

---

## P3: 패턴 탐지 대시보드 (타임라인 + 알림 카드)

### 목적
단일 항목 분석이 아닌 시계열·관계 기반 이상징후 탐지. "AI만 쓴 게 아님" 기술 증명.

### 위치
사이드바 메뉴 "패턴 탐지" 신규 뷰 (P8 Router 도입 후 `/patterns` 경로, 그 전엔 `activeView: "patterns"`)

### 레이아웃
- 상단: 요약 KPI (분할결제 N건, 주말집행 N건, 중복자문 N건, 금액 outlier N건)
- 중단: 타임라인 차트 (날짜 X축, 금액 Y축, 이상항목 빨간 점)
- 하단: 알림 카드 목록 (이상 유형 / 관련 항목들 / 위험도)

### 탐지 규칙 (클라이언트 사이드 계산)
1. **분할결제**: 동일 `description` 키워드 + 7일 이내 + 3회 이상 + 합산 한도 초과
2. **주말 집행**: `date`가 토/일요일인 회의비·식대 항목
3. **중복 자문료**: `category === "전문가 활용비"` + 동일 월 + 2회 이상 + 동일 금액
4. **금액 Outlier**: 카테고리별 평균 대비 z-score > 2.0

### 완료 기준
- 4개 패턴 탐지 로직 구현
- Recharts 타임라인 (이상 항목 빨간 마커)
- 알림 카드에서 클릭 시 해당 항목들 하이라이트

---

## P4: Executive Brief PDF 자동 생성

### 목적
월말 클릭 한 번으로 감사 요약 PDF. 비개발자 평가자에게 실용적 가치 체감.

### 위치
대시보드 헤더 "리포트 내보내기" 버튼

### PDF 내용 (1~2페이지)
- 프로젝트명, 기간, 총 예산 / 집행 / 잔액
- 항목 상태 분포 (정상 / 검토필요 / 반려)
- 카테고리별 집행 현황 차트 (Recharts → html-to-image)
- 이상징후 탐지 결과 요약 (P3 연동)
- AI 총평 (Gemini 1문단 요약)

### 기술 구현
- `html-to-image` (이미 설치됨): 차트 섹션 캡처
- `jsPDF` 추가: 캡처 이미지 + 텍스트 조합
- 생성 중 로딩 표시, 완료 시 자동 다운로드

### 완료 기준
- 버튼 클릭 → 5초 이내 PDF 다운로드
- 차트 이미지 포함
- 파일명: `audit-report-YYYY-MM.pdf`

---

## P5: 모바일 PWA (영수증 즉시 촬영)

### 목적
모바일에서 카메라 촬영 → OCR → 결과 확인 흐름. 시연 임팩트 극대화.

### 구현 방식
- `manifest.json` + `service-worker.js` (Vite PWA 플러그인)
- 모바일 진입 시 NewEntrySheet에 "카메라 촬영" 버튼 표시
- `navigator.mediaDevices.getUserMedia` → 사진 캡처 → base64 → Gemini OCR
- 모바일 최적화: 터치 타겟 44px+, 하단 네비게이션 바

### 완료 기준
- iOS Safari / Android Chrome에서 "홈 화면 추가" 가능
- 카메라 촬영 → OCR 자동 입력 흐름 작동
- 모바일 뷰포트에서 레이아웃 깨짐 없음

---

## P7: API 키 보안 처리

### 결정
포트폴리오 데모 목적상 실제 프록시 구현 없이 `.env` 환경변수 관리 + 명시적 보안 경고.

### 조치 사항
- `.env.example` 파일 업데이트 (현재 존재함)
- `README.md`에 "프로덕션 배포 시 Cloud Functions 프록시 필요" 섹션 추가
- `src/lib/firebase.ts` 및 서비스 파일에 환경변수 미설정 시 명확한 에러 메시지
- `.gitignore`에 `.env` 확인 (이미 있음)

---

## P8: 테스트 + CI + 라우터

### React Router 도입
- `react-router-dom` 설치
- URL 기반 라우팅: `/dashboard`, `/settlement`, `/verification`, `/budget`, `/evidence`, `/patterns`, `/stats`
- 현재 `string-based activeView` → `useNavigate` + `useLocation`으로 교체
- 뒤로가기/앞으로가기 동작, URL 직접 진입 지원

### Vitest 테스트
핵심 로직 5개 테스트:
1. `regulationService` 키워드 매칭 정확도
2. 패턴 탐지 — 분할결제 감지 로직
3. 패턴 탐지 — 주말 집행 감지 로직
4. `AuditStatus` 상태 전이 유효성
5. 데모 모드 게스트 세션 주입

### GitHub Actions CI
```yaml
# .github/workflows/ci.yml
# trigger: push, pull_request
jobs:
  - typecheck: tsc --noEmit
  - lint: (eslint 또는 tsc)
  - test: vitest run
  - build: vite build
```

### 완료 기준
- 5개 테스트 모두 pass
- GitHub Actions 녹색
- URL 직접 입력으로 각 뷰 진입 가능

---

## 구현 병렬화 전략

**Group A (즉시, 독립적 — 동시 작업 가능)**
- P6 데모 모드
- P7 API 키 처리
- P8 React Router + Vitest + CI 세팅

**Group B (Group A 완료 후, 서로 독립)**
- P2 규정 RAG (데이터 파일 + 서비스)
- P3 패턴 탐지 대시보드
- P4 PDF 생성
- P5 모바일 PWA

**Group C (P2 완료 후)**
- P1 Agent Trace 모달 (P2 규정 인용 연동)

---

## 성공 기준 (포트폴리오 관점)

1. 포트폴리오 링크 클릭 → 로그인 없이 30초 안에 핵심 기능 체험 가능
2. "AI 분석" 클릭 → 5단계 추론 과정이 실시간으로 보임
3. 이상징후 탐지 페이지에서 분할결제 패턴이 타임라인으로 시각화됨
4. 위반 항목마다 "제3-2조 회의비 집행 기준" 같은 구체적 조항 인용
5. 모바일에서 카메라로 영수증 찍으면 자동 입력
6. GitHub Actions 뱃지 녹색, 테스트 5개 pass

# 지능형 국가연구개발비 감사 시스템 (AI Audit System)

본 프로젝트는 국가연구개발사업의 투명한 예산 집행과 효율적인 정산을 위해 **AI 기반의 실시간 감사 및 컴플라이언스 엔진**을 제공하는 플랫폼입니다.

## 🚀 핵심 기능

### 1. AI 실시간 감사 엔진 (Compliance Engine)
- **RAG (Retrieval-Augmented Generation) 기반 검증**: 120개 이상의 세부 지출 규정을 벡터 DB화하여, 업로드된 영수증 및 집행 내역의 규정 위반 여부를 실시간으로 대조합니다.
- **이상징후 탐지**: 분할 결제, 목적 외 사용, 중복 청구 등 부정 사용 패턴을 AI가 즉시 식별하여 알림을 발송합니다.

### 2. 스마트 정산 관리 (Smart Settlement)
- **OCR 및 데이터 자동 입력**: 영수증 이미지 업로드 시 날짜, 금액, 가맹점 정보를 자동으로 추출하여 입력 번거로움을 최소화합니다.
- **워크플로우 관리**: 연구자(등록), 감사자(검토), 관리자(승인) 간의 매끄러운 업무 흐름을 지원합니다.

### 3. 예산 인텔리전스 (Budget Intelligence)
- **실시간 소진율 분석**: 재원별/비목별 예산 집행 현황을 시각화하여 계획 대비 집행률을 정밀하게 모니터링합니다.
- **예측 분석**: 현재 집행 속도를 기반으로 연말 예산 잔액을 예측하고 최적의 집행 계획을 제안합니다.

### 4. 통합 증빙 아카이브 (Evidence Repository)
- **전자 증빙 관리**: 모든 영수증과 증명 서류를 클라우드에 안전하게 보관하며, 감사 시 출력 없이 즉시 제공 가능합니다.

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend/DB**: Firebase (Firestore, Authentication, Storage)
- **AI/LLM**: Google Gemini 1.5 Flash (OCR 및 규정 준수 판단)
- **State Management**: React Context API & Real-time Snapshots

## 📂 프로젝트 구조

- `/src/components`: UI 컴포넌트 (감사 피드, 차트, 관리 뷰 등)
- `/src/services`: Firebase 및 Gemini API 연동 로직
- `/src/hooks`: 실시간 데이터 구독 및 상태 관리 훅
- `/src/data`: 초기 시스템 설정을 위한 데이터 스키마 및 가이드

---
*본 시스템은 국가연구개발혁신법 및 관련 가이드라인을 준수하여 설계되었습니다.*

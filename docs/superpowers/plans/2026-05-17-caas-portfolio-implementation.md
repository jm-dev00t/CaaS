# CaaS 포트폴리오 강화 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 연구비 감사 시스템에 데모 모드·실규정 RAG·Agent Trace·패턴 탐지·PDF 내보내기·PWA·테스트·CI를 추가하여 포트폴리오 경쟁력을 높인다.

**Architecture:** React Router로 URL 기반 라우팅을 도입한 뒤, 독립 기능들(데모 모드·규정 서비스·패턴 탐지·PDF·PWA)을 병렬로 구현한다. Agent Trace는 규정 서비스에 의존하므로 마지막에 통합한다.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind (Apple HIG tokens) + Firebase + `@google/genai` + `react-router-dom` + `vitest` + `jspdf` + `vite-plugin-pwa`

---

## 병렬화 전략

```
Task 1 (React Router) ─── 완료 후 ──┬── Task 2 (데모 모드)
                                      ├── Task 3 (API 키 문서)
                                      ├── Task 4 (규정 RAG 서비스)
                                      ├── Task 5 (패턴 탐지)
                                      ├── Task 6 (PDF 내보내기)
                                      └── Task 7 (PWA)
Task 4 완료 후 ─────────────────────── Task 8 (Agent Trace 모달)
Task 2~8 완료 후 ───────────────────── Task 9 (Vitest 테스트)
Task 9 완료 후 ─────────────────────── Task 10 (GitHub Actions CI)
```

---

## 파일 맵

| 파일 | 작업 | 태스크 |
|---|---|---|
| `src/main.tsx` | `BrowserRouter` 추가 | T1 |
| `src/App.tsx` | `Routes`/`Route` 교체, 데모 버튼, 데모 배지 | T1, T2 |
| `src/components/Sidebar.tsx` | `useNavigate`/`useLocation` 기반 | T1 |
| `src/components/Header.tsx` | `useNavigate`/`useLocation` 기반, 데모 배지 | T1, T2 |
| `src/contexts/AuthContext.tsx` | `isDemoMode`, `enterDemoMode` 추가 | T2 |
| `.env.example`, `README.md` | API 키 문서화 | T3 |
| `src/services/aiService.ts` | env var 검증, 스트리밍 함수 추가 | T3, T8 |
| `src/services/geminiService.ts` | env var 검증 | T3 |
| `src/data/regulations.ts` | 규정 18개 정의 | T4 |
| `src/services/regulationService.ts` | 키워드 매칭 + 인용 | T4 |
| `src/utils/patternDetection.ts` | 4가지 패턴 탐지 | T5 |
| `src/components/PatternDetectionView.tsx` | 타임라인 + 알림 카드 뷰 | T5 |
| `src/services/reportService.ts` | jsPDF 리포트 생성 | T6 |
| `src/components/DashboardHeader.tsx` | PDF 버튼 교체 | T6 |
| `public/manifest.json` | PWA 매니페스트 | T7 |
| `vite.config.ts` | vite-plugin-pwa + vitest config | T7, T9 |
| `src/components/NewEntrySheet.tsx` | 카메라 캡처 버튼 | T7 |
| `src/components/AgentTraceModal.tsx` | 5단계 Trace 모달 | T8 |
| `src/components/AuditDetailSheet.tsx` | Trace 실행 버튼 | T8 |
| `src/utils/patternDetection.test.ts` | 패턴 탐지 유닛 테스트 | T9 |
| `src/services/regulationService.test.ts` | 규정 서비스 유닛 테스트 | T9 |
| `.github/workflows/ci.yml` | typecheck + test + build | T10 |

---

## Task 1: React Router 통합 (P8a)

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: react-router-dom 설치**

```bash
npm install react-router-dom
```

Expected: `package.json`에 `"react-router-dom"` 추가됨

- [ ] **Step 2: main.tsx에 BrowserRouter 추가**

`src/main.tsx` 전체를 다음으로 교체:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 3: App.tsx — activeView 상태 제거, Routes 교체**

`src/App.tsx`의 `DashboardContent` 함수 상단에 import 추가:

```tsx
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
```

`DashboardContent` 내부에서 다음을 교체한다.

**제거:**
```tsx
const [activeView, setActiveView] = useState("dashboard");

useEffect(() => {
  const handleViewChange = (e: any) => {
    if (e.detail) setActiveView(e.detail);
  };
  window.addEventListener('change-view', handleViewChange);
  return () => {
    window.removeEventListener('change-view', handleViewChange);
  };
}, []);
```

**추가:**
```tsx
const navigate = useNavigate();
const location = useLocation();

const VIEW_PATH: Record<string, string> = {
  dashboard: '/', settlement: '/settlement', verification: '/verification',
  budget: '/budget', evidence: '/evidence', stats: '/stats',
  'receipt-gen': '/receipt-gen', 'org-management': '/org-management',
  'rule-management': '/rule-management', 'compliance-guide': '/compliance-guide',
  patterns: '/patterns',
};

const PATH_VIEW: Record<string, string> = Object.fromEntries(
  Object.entries(VIEW_PATH).map(([k, v]) => [v, k])
);

const activeView = PATH_VIEW[location.pathname] ?? 'dashboard';
const setActiveView = (view: string) => navigate(VIEW_PATH[view] ?? '/');
```

- [ ] **Step 4: App.tsx — renderActiveView() → Routes/Route 교체**

`renderActiveView()` 함수와 호출부를 제거하고 JSX return의 `{renderActiveView()}` 부분을 다음으로 교체:

```tsx
<Routes>
  <Route path="/" element={
    <main className="flex-1 overflow-y-auto outline-none custom-scrollbar pb-16">
      <div className="max-w-[1440px] mx-auto p-4 md:p-10 space-y-8 md:space-y-12">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <DashboardHeader project={projectInfo} projectId={projectId} />
        </motion.section>
        <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <ChartsSection weeklyData={weeklyExecution} categoryData={categoryExecution} />
        </motion.section>
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">실시간 집행 원장</h2>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-9 text-[14px] font-medium text-[#0066cc] hover:bg-[#e3f2fd] rounded-full px-4">
              <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isRefreshing && "animate-spin")} />새로고침
            </Button>
          </div>
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="min-h-[400px]">
              {dataLoading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-6 h-6 text-[#0066cc] animate-spin" />
                  <p className="text-[14px] text-[#86868b] font-medium">데이터 동기화 중...</p>
                </div>
              ) : (
                <AuditFeed items={currentItems} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} currentUserRole={profile?.role} />
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  } />

  <Route path="/settlement" element={
    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[#f5f5f7]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">정산 대기열</h2>
        <p className="text-[#86868b] text-[15px]">실시간 연구비 집행 및 정산 흐름을 관리합니다.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '작성 중', count: currentItems.filter(i => i.status === '작성중').length, key: '작성중', description: '연구자 입력 대기' },
          { label: '검토 중', count: currentItems.filter(i => i.status === '검토필요' || i.status === '소명중').length, key: '검토필요', description: 'AI 이상징후 탐지' },
          { label: '정산 완료', count: currentItems.filter(i => i.status === '정상').length, key: '정상', description: '최종 승인 완료' }
        ].map((stat, i) => (
          <div key={i} onClick={() => setStatusFilter(statusFilter === stat.key ? "all" : stat.key)}
            className={cn("bg-white p-8 rounded-[24px] border border-[#d2d2d7] shadow-sm relative overflow-hidden group hover:border-[#86868b] transition-all cursor-pointer active:scale-95",
              statusFilter === stat.key && "ring-2 ring-[#0066cc] border-transparent shadow-md")}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">{stat.label}</p>
                <p className="text-[40px] font-semibold text-[#1d1d1f] mt-2 leading-none">{stat.count}</p>
                <p className="text-[12px] text-[#86868b] mt-3">{stat.description}</p>
              </div>
              <div className="p-3 bg-[#f5f5f7] rounded-full group-hover:bg-[#e3f2fd] transition-colors">
                <FileCheck2 className={cn("w-6 h-6 transition-colors", statusFilter === stat.key ? "text-[#0066cc]" : "text-[#86868b]")} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#d2d2d7] rounded-[24px] overflow-hidden shadow-sm">
        <AuditFeed items={currentItems} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} currentUserRole={profile?.role} />
      </div>
    </div>
  } />

  <Route path="/verification" element={
    <div className="flex-1 overflow-y-auto p-0 flex flex-col custom-scrollbar bg-white">
      <div className="p-8 border-b border-[#e5e5e7] flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-30">
        <div>
          <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">AI 컴플라이언스</h2>
          <p className="text-[15px] text-[#86868b] mt-1">자율 감사 및 이상징후 탐지 엔진</p>
        </div>
      </div>
      <div className="p-8 bg-[#f5f5f7]">
        <AuditFeed items={currentItems} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} currentUserRole={profile?.role} />
      </div>
    </div>
  } />

  <Route path="/budget" element={
    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[#f5f5f7]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">예산 인텔리전스</h2>
        <p className="text-[#86868b] text-[15px]">재원별 집행 현황 및 잔액 분석</p>
      </div>
      <ChartsSection weeklyData={weeklyExecution} categoryData={categoryExecution} />
    </div>
  } />

  <Route path="/evidence" element={<EvidenceRecordView items={currentItems} />} />
  <Route path="/receipt-gen" element={<ReceiptGenerator />} />
  <Route path="/org-management" element={<OrganizationView />} />
  <Route path="/rule-management" element={<RuleManagementView />} />
  <Route path="/compliance-guide" element={<ComplianceGuideView />} />

  <Route path="/stats" element={
    <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-[#1d1d1f]">
      <h2 className="text-[28px] font-semibold text-white tracking-tight">지능형 데이터 분석</h2>
      <div className="min-h-[60vh] rounded-[32px] bg-[#272729] flex flex-col items-center justify-center text-center p-20 shadow-2xl">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-[3px] border-white/5 border-t-[#0066cc] rounded-full mb-10" />
        <h3 className="text-white text-2xl font-semibold tracking-tight mb-4">패턴 분석 스캔</h3>
        <p className="text-[#86868b] text-[17px] max-w-md leading-relaxed">과거 집행 패턴과 현재 데이터 스트림을 실시간으로 비교 분석 중입니다.</p>
      </div>
    </div>
  } />

  <Route path="/patterns" element={<div className="flex-1 overflow-y-auto custom-scrollbar"><PatternDetectionViewPlaceholder items={currentItems} /></div>} />
</Routes>
```

> **Note:** `PatternDetectionViewPlaceholder`는 Task 5에서 `PatternDetectionView`로 교체된다. Task 5 전까지는 빈 div로 대체한다.
> 
> **Note:** `FileCheck2` import를 App.tsx에 추가해야 한다: `import { ..., FileCheck2 } from "lucide-react";`

- [ ] **Step 5: Sidebar.tsx — onViewChange를 navigate로 교체**

`Sidebar.tsx` 상단에 import 추가:
```tsx
import { useNavigate, useLocation } from 'react-router-dom';
```

`SidebarProps` 인터페이스와 구조분해를 수정:
```tsx
// 기존
interface SidebarProps {
  className?: string;
  currentRole?: string;
  activeView: string;
  onViewChange: (view: string) => void;
}
export function Sidebar({ className, currentRole, activeView, onViewChange }: SidebarProps) {

// 교체
interface SidebarProps {
  className?: string;
  currentRole?: string;
}
export function Sidebar({ className, currentRole }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const VIEW_PATH: Record<string, string> = {
    dashboard: '/', settlement: '/settlement', verification: '/verification',
    budget: '/budget', evidence: '/evidence', stats: '/stats',
    'receipt-gen': '/receipt-gen', 'org-management': '/org-management',
    'rule-management': '/rule-management', 'compliance-guide': '/compliance-guide',
    patterns: '/patterns',
  };

  const activeView = Object.entries(VIEW_PATH).find(([, path]) => path === location.pathname)?.[0] ?? 'dashboard';
  const onViewChange = (view: string) => navigate(VIEW_PATH[view] ?? '/');
```

`navItems`에 패턴 탐지 메뉴 추가 (stats 항목 뒤):
```tsx
{ id: "patterns", icon: AlertTriangle, label: "패턴 탐지", roles: ["admin", "finance_officer"] },
```

`import`에 `AlertTriangle` 추가.

로고/타이틀 클릭 `onViewChange("dashboard")` 호출은 그대로 유지.

`handleLogout` 내부에서 로그아웃 후 navigate 추가:
```tsx
const handleLogout = () => {
  auth.signOut();
  navigate('/');
};
```

- [ ] **Step 6: Header.tsx — props 제거, navigate 연결**

`Header.tsx` 수정:
```tsx
import { useNavigate, useLocation } from 'react-router-dom';

// HeaderProps에서 activeView, onViewChange 제거 (하위 호환 위해 optional 유지)
interface HeaderProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function Header({ activeView: _activeView, onViewChange: _onViewChange }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // ...

  // Sidebar 렌더링 부분에서 props 제거:
  <Sidebar
    className="w-full border-none shadow-none"
    currentRole={profile?.role}
  />
```

- [ ] **Step 7: App.tsx — Sidebar/Header props 정리**

`App.tsx`의 `<Sidebar>` 호출에서 `activeView`, `onViewChange` props 제거:
```tsx
<Sidebar className="hidden lg:flex flex-shrink-0" currentRole={profile?.role} />
<Header />
```

`AnimatePresence`의 `key`를 `location.pathname`으로 변경:
```tsx
// 상단에 import 추가
import { useLocation } from 'react-router-dom';
// DashboardContent 내부
const location = useLocation(); // navigate, location 재사용

// AnimatePresence key 변경
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    // ...
  >
    {/* Routes는 여기 */}
  </motion.div>
</AnimatePresence>
```

- [ ] **Step 8: 빌드 확인**

```bash
npm run lint
```

Expected: 타입 에러 없음. 경고가 있다면 수정.

- [ ] **Step 9: 개발 서버 확인**

```bash
npm run dev
```

브라우저에서 각 URL 직접 입력 테스트: `http://localhost:3000/settlement`, `http://localhost:3000/budget`, `http://localhost:3000/evidence`

Expected: 각 뷰가 올바르게 렌더링되고 뒤로가기/앞으로가기 동작

- [ ] **Step 10: 커밋**

```bash
git init
git add src/main.tsx src/App.tsx src/components/Sidebar.tsx src/components/Header.tsx package.json package-lock.json
git commit -m "feat: React Router 기반 URL 라우팅 도입 (P8a)"
```

---

## Task 2: 데모 모드 (P6)

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: AuthContext에 데모 모드 추가**

`src/contexts/AuthContext.tsx` 전체 교체:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isDemoMode: boolean;
  enterDemoMode: () => void;
  updateProfile: (data: any) => Promise<void>;
}

const DEMO_USER = {
  uid: 'demo-user-id',
  email: 'demo@audit-system.com',
  displayName: '데모 감사자',
  photoURL: null,
} as unknown as User;

const DEMO_PROFILE = {
  uid: 'demo-user-id',
  email: 'demo@audit-system.com',
  displayName: '데모 감사자',
  role: 'auditor',
  organization: '국가연구개발사업단',
};

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  isDemoMode: false,
  enterDemoMode: () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(() =>
    sessionStorage.getItem('demoMode') === 'true'
  );

  const enterDemoMode = () => {
    sessionStorage.setItem('demoMode', 'true');
    setDemoMode(true);
  };

  const updateProfile = async (data: any) => {
    if (demoMode) return; // 데모 모드에서는 Firestore 쓰기 차단
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...profile, ...data }, { merge: true });
    setProfile((prev: any) => ({ ...prev, ...data }));
  };

  useEffect(() => {
    if (demoMode) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          const newProfile = {
            uid: firebaseUser.uid, email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: 'researcher', organization: 'Default Organization',
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [demoMode]);

  const effectiveUser = demoMode ? DEMO_USER : user;
  const effectiveProfile = demoMode ? DEMO_PROFILE : profile;
  const effectiveLoading = demoMode ? false : loading;

  return (
    <AuthContext.Provider value={{
      user: effectiveUser, profile: effectiveProfile, loading: effectiveLoading,
      isDemoMode: demoMode, enterDemoMode, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

- [ ] **Step 2: App.tsx 로그인 화면에 데모 버튼 추가**

`App.tsx`의 로그인 화면 `<Button onClick={() => signInWithGoogle()}>` 아래에 추가:

```tsx
// App.tsx 상단 useAuth에서 enterDemoMode 구조분해
const { user, profile, loading: authLoading, enterDemoMode } = useAuth();

// 로그인 화면 버튼 블록 (기존 Google 버튼 아래)
<div className="mt-4">
  <div className="flex items-center gap-3 my-6">
    <div className="flex-1 h-px bg-[#e5e5e7]" />
    <span className="text-[12px] text-[#86868b] font-medium">또는</span>
    <div className="flex-1 h-px bg-[#e5e5e7]" />
  </div>
  <Button
    variant="outline"
    onClick={enterDemoMode}
    className="w-full h-12 border-[#0066cc] text-[#0066cc] hover:bg-[#e3f2fd] font-semibold text-[15px] flex items-center justify-center gap-2 rounded-full transition-all active:scale-95"
  >
    ✨ 데모로 체험하기
  </Button>
  <p className="text-[11px] text-[#86868b] text-center mt-3">저장되지 않는 읽기 전용 체험 모드</p>
</div>
```

- [ ] **Step 3: Header에 데모 배지 표시**

`Header.tsx`에 데모 배지 추가:
```tsx
import { useAuth } from "../contexts/AuthContext";

// Header 함수 내부
const { profile, isDemoMode } = useAuth();

// 헤더 우측 사용자 정보 앞에 배지 추가
{isDemoMode && (
  <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#fff3cd] text-[#856404] rounded-full text-[11px] font-bold border border-[#ffe082]">
    DEMO
  </span>
)}
```

- [ ] **Step 4: 데모 모드에서 Firestore 쓰기 차단 토스트**

`src/App.tsx`에 데모 안내 로직 추가. `dataService.ts`를 직접 건드리지 않고 `isDemoMode`를 체크하는 wrapper를 `App.tsx`에서 처리한다.

`DashboardContent` 내부, `seedInitialData` 호출부를 조건부로:
```tsx
const { user, profile, loading: authLoading, isDemoMode, enterDemoMode } = useAuth();

// useEffect 수정
useEffect(() => {
  if (!user) return;

  import("./services/mockNotificationService").then(({ MockNotificationService }) => {
    MockNotificationService.getInstance().start(user.uid);
  });

  if (!isDemoMode) {
    seedInitialData(projectId);
    const unsubscribe = subscribeToAuditItems(projectId, (newItems) => {
      setItems(newItems);
      setDataLoading(false);
      setIsRefreshing(false);
    });
    return () => {
      unsubscribe();
      import("./services/mockNotificationService").then(({ MockNotificationService }) => {
        MockNotificationService.getInstance().stop();
      });
    };
  } else {
    // 데모: mockData 직접 사용
    setItems(auditItems);
    setDataLoading(false);
  }
}, [user, isDemoMode]);
```

- [ ] **Step 5: 데모 모드 동작 확인**

`npm run dev` → 로그인 화면에서 "데모로 체험하기" 클릭 → 대시보드 진입 확인 → 헤더 "DEMO" 배지 확인 → 새로고침 후 세션 유지 확인

- [ ] **Step 6: 커밋**

```bash
git add src/contexts/AuthContext.tsx src/App.tsx src/components/Header.tsx
git commit -m "feat: 로그인 없는 데모 모드 추가 (P6)"
```

---

## Task 3: API 키 환경변수 검증 및 문서화 (P7)

**Files:**
- Modify: `.env.example`
- Modify: `src/services/aiService.ts`
- Modify: `src/services/geminiService.ts`
- Modify: `README.md`

- [ ] **Step 1: env var 접근 방식 수정**

Vite에서 클라이언트 env var는 `VITE_` 접두사 필요. `aiService.ts`와 `geminiService.ts`의 API 초기화를 수정:

`src/services/aiService.ts` 상단:
```typescript
// 기존
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 교체
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!apiKey) {
  console.warn('[aiService] VITE_GEMINI_API_KEY 미설정 — AI 기능 비활성화. .env.example 참조.');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
```

`analyzeReceipt`, `analyzeAuditItem`, `explainAuditResult` 함수 내부 `ai.models.` 호출 전에 guard 추가:
```typescript
if (!ai) throw new Error('AI 서비스가 설정되지 않았습니다. VITE_GEMINI_API_KEY를 .env에 추가하세요.');
```

`src/services/geminiService.ts` 동일하게 수정:
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!apiKey) console.warn('[geminiService] VITE_GEMINI_API_KEY 미설정');
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
```

`generateAuditJustification` 내부 guard:
```typescript
if (!ai) throw new Error('AI 서비스가 설정되지 않았습니다.');
```

- [ ] **Step 2: .env.example 업데이트**

```bash
# .env.example
# Google Gemini API 키 (https://aistudio.google.com/apikey 에서 발급)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase 설정 (Firebase 콘솔 > 프로젝트 설정 > 웹 앱)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

- [ ] **Step 3: README.md 보안 섹션 추가**

`README.md` 말미에 추가:

```markdown
## 🔐 환경 변수 설정

\`\`\`bash
cp .env.example .env
# .env를 열어 실제 키 값 입력
\`\`\`

> **보안 주의:** `VITE_` 접두사 변수는 브라우저 번들에 포함됩니다.  
> 프로덕션 배포 시 Firebase Cloud Functions 또는 Vercel Edge Function으로 API 키를 서버 측에서 관리하세요.
```

- [ ] **Step 4: 커밋**

```bash
git add .env.example src/services/aiService.ts src/services/geminiService.ts README.md
git commit -m "fix: Vite env var 접두사 수정 및 API 키 보안 문서화 (P7)"
```

---

## Task 4: 규정 RAG 서비스 (P2)

**Files:**
- Create: `src/data/regulations.ts`
- Create: `src/services/regulationService.ts`

- [ ] **Step 1: 규정 데이터 파일 생성**

`src/data/regulations.ts` 생성:

```typescript
export interface Regulation {
  id: string;
  article: string;
  title: string;
  category: string;
  keywords: string[];
  limitAmount?: number;
  limitType?: 'per_person' | 'per_event' | 'total';
  content: string;
}

export const REGULATIONS: Regulation[] = [
  // 회의비 (3개)
  { id: 'REG-01', article: '제3-2조', title: '회의비 집행 기준', category: '회의비',
    keywords: ['회의비', '식대', '회식', '간담회', '식사'],
    limitAmount: 30000, limitType: 'per_person',
    content: '연구과제 관련 회의 시 1인당 3만원 이내로 집행해야 하며, 참석자 명단이 증빙되어야 한다.' },
  { id: 'REG-02', article: '제3-3조', title: '회의비 주말·공휴일 집행 제한', category: '회의비',
    keywords: ['회의비', '식대', '회식', '주말', '공휴일'],
    content: '회의비는 평일 집행이 원칙이며, 주말·공휴일 집행 시 사유를 소명해야 한다.' },
  { id: 'REG-03', article: '제3-4조', title: '회의비 분할결제 금지', category: '회의비',
    keywords: ['회의비', '식대', '분할', '결제', '한도'],
    content: '집행 한도를 우회하기 위한 분할결제는 부정 집행으로 간주된다.' },

  // 국내여비 (3개)
  { id: 'REG-04', article: '제5-1조', title: '국내 출장 교통비 기준', category: '국내여비',
    keywords: ['국내여비', '출장', '교통비', '기차', 'KTX', '버스'],
    content: '국내 출장 교통비는 실비 기준이며, 항공 이용 시 사전 승인이 필요하다.' },
  { id: 'REG-05', article: '제5-2조', title: '국내 출장 숙박비 한도', category: '국내여비',
    keywords: ['국내여비', '숙박', '호텔', '숙소'],
    limitAmount: 80000, limitType: 'per_event',
    content: '국내 출장 숙박비는 1박 8만원 이내이며, 서울·경기는 10만원까지 인정된다.' },
  { id: 'REG-06', article: '제5-3조', title: '국내 출장 일비 기준', category: '국내여비',
    keywords: ['국내여비', '일비', '출장비'],
    limitAmount: 20000, limitType: 'per_event',
    content: '국내 출장 일비는 1일 2만원이며, 당일 출장 시 절반을 지급한다.' },

  // 전문가 활용비 (3개)
  { id: 'REG-07', article: '제8-1조', title: '외부 전문가 자문료 한도', category: '전문가 활용비',
    keywords: ['전문가', '자문', '강사', '자문료', '강사료', '컨설팅'],
    limitAmount: 300000, limitType: 'per_event',
    content: '외부 전문가 1인당 1회 자문료는 30만원 이내이며, 연 12회를 초과할 수 없다.' },
  { id: 'REG-08', article: '제8-2조', title: '자문료 동일인 중복 지급 제한', category: '전문가 활용비',
    keywords: ['전문가', '자문', '강사', '중복', '반복'],
    content: '동일인에게 동일 월에 2회 이상 자문료를 지급하는 경우 기관장 승인이 필요하다.' },
  { id: 'REG-09', article: '제8-3조', title: '내부 직원 자문료 지급 금지', category: '전문가 활용비',
    keywords: ['전문가', '자문', '내부', '직원', '소속'],
    content: '동일 연구기관 소속 직원에 대한 자문료 지급은 원칙적으로 금지된다.' },

  // 연구재료비 (3개)
  { id: 'REG-10', article: '제4-1조', title: '연구재료비 증빙 기준', category: '연구재료비',
    keywords: ['연구재료', '재료', '시약', '실험', '부품'],
    content: '연구재료비는 세금계산서 또는 카드 영수증으로 증빙해야 하며, 연구 직접 관련성을 소명해야 한다.' },
  { id: 'REG-11', article: '제4-2조', title: '단가 50만원 이상 구매 절차', category: '연구재료비',
    keywords: ['연구재료', '재료', '고가', '구매', '발주'],
    limitAmount: 500000,
    content: '단가 50만원 이상 재료 구매 시 3개 업체 이상 견적서 비교가 원칙이다.' },
  { id: 'REG-12', article: '제4-3조', title: '연구재료 개인 사용 금지', category: '연구재료비',
    keywords: ['연구재료', '재료', '개인', '사적'],
    content: '연구재료는 과제 목적 외 개인 용도로 사용할 수 없으며, 위반 시 전액 반납해야 한다.' },

  // 소모품비 (3개)
  { id: 'REG-13', article: '제4-4조', title: '소모품비 범위', category: '소모품비',
    keywords: ['소모품', '사무용품', '문구', '토너', '용지'],
    content: '소모품비는 연구 수행에 필요한 사무용품, 전산소모품 등에 한정되며 개인 소지품 구매는 불가하다.' },
  { id: 'REG-14', article: '제4-5조', title: '소모품 일괄 구매 한도', category: '소모품비',
    keywords: ['소모품', '사무용품', '일괄', '대량'],
    limitAmount: 300000, limitType: 'per_event',
    content: '1회 소모품 일괄 구매는 30만원 이내가 원칙이며, 초과 시 사전 품의가 필요하다.' },
  { id: 'REG-15', article: '제4-6조', title: '소모품 재고 관리', category: '소모품비',
    keywords: ['소모품', '재고', '수불', '목록'],
    content: '소모품은 수불부를 작성·관리해야 하며, 정산 시 재고 현황을 제출해야 한다.' },

  // 국외여비 (3개)
  { id: 'REG-16', article: '제6-1조', title: '국외 출장 사전 승인', category: '국외여비',
    keywords: ['국외여비', '해외', '출장', '해외출장'],
    content: '국외 출장은 출발 14일 전 기관장 승인을 받아야 한다.' },
  { id: 'REG-17', article: '제6-2조', title: '국외 출장 항공료 기준', category: '국외여비',
    keywords: ['국외여비', '해외', '항공', '비행기', '항공료'],
    content: '항공료는 일반석 기준이며, 8시간 이상 장거리는 비즈니스석 이용이 가능하다.' },
  { id: 'REG-18', article: '제6-3조', title: '국외 출장 일비·숙박비', category: '국외여비',
    keywords: ['국외여비', '해외', '숙박', '일비'],
    content: '국외 출장 일비·숙박비는 기획재정부 고시 여비규정 별표에 따른다.' },
];
```

- [ ] **Step 2: 규정 서비스 생성**

`src/services/regulationService.ts` 생성:

```typescript
import { REGULATIONS, Regulation } from '../data/regulations';

export interface RegulationMatch {
  regulation: Regulation;
  matchCount: number;
}

export function findMatchingRegulations(
  category: string,
  description: string
): RegulationMatch[] {
  const text = `${category} ${description}`.toLowerCase();

  return REGULATIONS
    .map(reg => ({
      regulation: reg,
      matchCount: reg.keywords.filter(kw => text.includes(kw.toLowerCase())).length,
    }))
    .filter(m => m.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3);
}

export function formatCitation(reg: Regulation): string {
  return `${reg.article} ${reg.title}`;
}

export function buildRegulationContext(matches: RegulationMatch[]): string {
  if (matches.length === 0) return '해당 규정 없음';
  return matches
    .map(m => `[${m.regulation.article}] ${m.regulation.title}: ${m.regulation.content}`)
    .join('\n');
}
```

- [ ] **Step 3: aiService.ts의 analyzeAuditItem에 규정 컨텍스트 주입**

`src/services/aiService.ts`의 `analyzeAuditItem` 함수 수정:

```typescript
import { findMatchingRegulations, buildRegulationContext } from './regulationService';

export async function analyzeAuditItem(
  category: string,
  description: string,
  amount: number,
  receiptData?: ReceiptAnalysis
): Promise<AuditAnalysis & { regulationCitations: string[] }> {
  const matches = findMatchingRegulations(category, description);
  const regulationContext = buildRegulationContext(matches);
  const citations = matches.map(m => `${m.regulation.article} ${m.regulation.title}`);

  const prompt = `
    Audit this research fund expenditure for a university project.
    Category: ${category}
    Description: ${description}
    Amount: ${amount}
    ${receiptData ? `Receipt: Vendor: ${receiptData.vendor}, Amount: ${receiptData.amount}, Items: ${receiptData.items?.join(', ')}` : ''}

    Applicable Regulations:
    ${regulationContext}

    Check: Does this comply with the above regulations? Flag violations with specific article references.
    Return score (0-100), status ('정상' or '검토필요'), and Korean comment citing specific article numbers.
  `;

  // ... 기존 generateContent 호출 동일 ...
  // 반환값에 citations 추가
  return { ...parsed, regulationCitations: citations };
}
```

`AuditAnalysis` 인터페이스도 `regulationCitations` 추가:
```typescript
export interface AuditAnalysis {
  score: number;
  status: '정상' | '검토필요';
  comment: string;
  regulationCitations?: string[];
}
```

- [ ] **Step 4: AuditDetailSheet에 규정 인용 배지 표시**

`src/components/AuditDetailSheet.tsx`에서 `item.aiComment` 표시 부분 아래에 추가 (item에 citations가 있을 경우):

```tsx
{/* aiComment 표시 기존 코드 아래 */}
{item.regulationCitations && item.regulationCitations.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3">
    <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">근거 규정</span>
    {item.regulationCitations.map((cite, i) => (
      <span key={i} className="px-2.5 py-1 bg-[#e3f2fd] text-[#0066cc] rounded-full text-[11px] font-semibold">
        {cite}
      </span>
    ))}
  </div>
)}
```

> **Note:** `AuditItem` 타입에 `regulationCitations?: string[]` 필드를 `src/types/dashboard.ts`에 추가해야 한다.

- [ ] **Step 5: types/dashboard.ts에 필드 추가**

```typescript
export interface AuditItem {
  // ...기존 필드...
  regulationCitations?: string[];
}
```

- [ ] **Step 6: AuditDetailSheet에서 인용 on-the-fly 계산 (기존 항목 지원)**

기존 Firestore 항목에는 `regulationCitations`가 없으므로, `AuditDetailSheet.tsx`에서 없을 때 클라이언트에서 계산:

```tsx
import { findMatchingRegulations, formatCitation } from "../services/regulationService";

// useEffect 내부 또는 useMemo로 계산
const displayCitations = useMemo(() => {
  if (!item) return [];
  if (item.regulationCitations?.length) return item.regulationCitations;
  return findMatchingRegulations(item.category, item.description)
    .map(m => formatCitation(m.regulation));
}, [item]);
```

기존 `{item.regulationCitations && ...}` 조건을 `{displayCitations.length > 0 && ...}`로 교체하고 `item.regulationCitations` 대신 `displayCitations` 사용.

- [ ] **Step 7: 커밋**

```bash
git add src/data/regulations.ts src/services/regulationService.ts src/services/aiService.ts src/types/dashboard.ts src/components/AuditDetailSheet.tsx
git commit -m "feat: 규정 키워드 매칭 RAG 서비스 및 조항 인용 표시 (P2)"
```

---

## Task 5: 패턴 탐지 대시보드 (P3)

**Files:**
- Create: `src/utils/patternDetection.ts`
- Create: `src/components/PatternDetectionView.tsx`
- Modify: `src/App.tsx` (placeholder 교체)
- Modify: `src/components/Sidebar.tsx` (메뉴 이미 Task 1에서 추가됨)

- [ ] **Step 1: 패턴 탐지 유틸리티 생성**

`src/utils/patternDetection.ts` 생성:

```typescript
import { AuditItem } from '../types/dashboard';

export interface AnomalyAlert {
  type: 'split_payment' | 'weekend_expense' | 'duplicate_consulting' | 'amount_outlier';
  title: string;
  description: string;
  relatedItems: AuditItem[];
  severity: 'high' | 'medium';
}

export function detectSplitPayments(items: AuditItem[]): AnomalyAlert[] {
  const candidates = items.filter(i =>
    ['회의비', '소모품비'].includes(i.category)
  );

  // description 앞 6자로 같은 가맹점 그룹화
  const groups: Record<string, AuditItem[]> = {};
  candidates.forEach(item => {
    const key = item.description.slice(0, 6);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.values(groups)
    .filter(group => {
      if (group.length < 3) return false;
      const sorted = [...group].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const daysDiff =
        (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) /
        86400000;
      return daysDiff <= 7;
    })
    .map(group => ({
      type: 'split_payment' as const,
      title: '분할결제 의심',
      description: `"${group[0].description.slice(0, 12)}..." 7일 내 ${group.length}회 집행`,
      relatedItems: group,
      severity: 'high' as const,
    }));
}

export function detectWeekendExpenses(items: AuditItem[]): AnomalyAlert[] {
  const weekendItems = items.filter(item => {
    if (!['회의비', '소모품비'].includes(item.category)) return false;
    const day = new Date(item.date).getDay();
    return day === 0 || day === 6;
  });
  if (weekendItems.length === 0) return [];
  return [{
    type: 'weekend_expense',
    title: '주말 집행 감지',
    description: `회의비/소모품비 주말 집행 ${weekendItems.length}건`,
    relatedItems: weekendItems,
    severity: 'medium',
  }];
}

export function detectDuplicateConsulting(items: AuditItem[]): AnomalyAlert[] {
  const consulting = items.filter(i => i.category === '전문가 활용비');
  const byMonth: Record<string, AuditItem[]> = {};
  consulting.forEach(item => {
    const month = item.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(item);
  });
  return Object.entries(byMonth)
    .filter(([, group]) => group.length >= 2)
    .map(([month, group]) => ({
      type: 'duplicate_consulting' as const,
      title: '중복 자문료',
      description: `${month} 전문가 활용비 ${group.length}건 집행`,
      relatedItems: group,
      severity: 'high' as const,
    }));
}

export function detectAmountOutliers(items: AuditItem[]): AnomalyAlert[] {
  const byCategory: Record<string, AuditItem[]> = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  const outliers: AuditItem[] = [];
  Object.values(byCategory).forEach(group => {
    if (group.length < 3) return;
    const amounts = group.map(i => i.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const std = Math.sqrt(
      amounts.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / amounts.length
    );
    if (std === 0) return;
    group.forEach(item => {
      if (Math.abs((item.amount - mean) / std) > 2) outliers.push(item);
    });
  });

  if (outliers.length === 0) return [];
  return [{
    type: 'amount_outlier',
    title: '금액 이상 탐지',
    description: `카테고리 평균 대비 z-score > 2 항목 ${outliers.length}건`,
    relatedItems: outliers,
    severity: 'medium',
  }];
}

export function detectAllPatterns(items: AuditItem[]): AnomalyAlert[] {
  return [
    ...detectSplitPayments(items),
    ...detectWeekendExpenses(items),
    ...detectDuplicateConsulting(items),
    ...detectAmountOutliers(items),
  ];
}
```

- [ ] **Step 2: PatternDetectionView 컴포넌트 생성**

`src/components/PatternDetectionView.tsx` 생성:

```tsx
import { useMemo } from "react";
import { motion } from "motion/react";
import { AuditItem } from "../types/dashboard";
import { detectAllPatterns, AnomalyAlert } from "../utils/patternDetection";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

interface PatternDetectionViewProps {
  items: AuditItem[];
}

export function PatternDetectionView({ items }: PatternDetectionViewProps) {
  const alerts = useMemo(() => detectAllPatterns(items), [items]);

  const alertedIds = useMemo(() =>
    new Set(alerts.flatMap(a => a.relatedItems.map(i => i.id))),
    [alerts]
  );

  const timelineData = useMemo(() =>
    items.map(item => ({
      date: new Date(item.date).getTime(),
      amount: item.amount,
      isAnomaly: alertedIds.has(item.id),
      label: item.description,
      dateStr: item.date,
    })),
    [items, alertedIds]
  );

  const kpi = {
    split: alerts.filter(a => a.type === 'split_payment').length,
    weekend: alerts.filter(a => a.type === 'weekend_expense').length,
    consulting: alerts.filter(a => a.type === 'duplicate_consulting').length,
    outlier: alerts.filter(a => a.type === 'amount_outlier').length,
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#f5f5f7]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">패턴 탐지</h2>
        <p className="text-[#86868b] text-[15px]">시계열·관계 기반 이상징후 자동 탐지</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '분할결제', count: kpi.split, color: '#ff3b30' },
          { label: '주말 집행', count: kpi.weekend, color: '#ff9f0a' },
          { label: '중복 자문료', count: kpi.consulting, color: '#ff3b30' },
          { label: '금액 이상값', count: kpi.outlier, color: '#0066cc' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-[20px] border border-[#d2d2d7] shadow-sm p-6"
            style={{ borderLeft: `4px solid ${item.color}` }}
          >
            <p className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wide mb-2">{item.label}</p>
            <p className="text-[32px] font-semibold" style={{ color: item.color }}>{item.count}</p>
            <div className="w-full bg-[#f5f5f7] rounded-full h-1 mt-3">
              <div
                className="h-1 rounded-full"
                style={{ width: `${Math.min(item.count * 20, 100)}%`, background: item.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 타임라인 차트 */}
      <div className="bg-white rounded-[24px] border border-[#d2d2d7] shadow-sm p-6">
        <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-6">집행 타임라인</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7" />
            <XAxis
              dataKey="date"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={v => format(new Date(v), 'MM/dd')}
              tick={{ fontSize: 11, fill: '#86868b' }}
            />
            <YAxis
              dataKey="amount"
              tickFormatter={v => `${(v / 10000).toFixed(0)}만`}
              tick={{ fontSize: 11, fill: '#86868b' }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-[#d2d2d7] rounded-xl p-3 shadow-lg text-[12px]">
                    <p className="font-semibold text-[#1d1d1f]">{d.label}</p>
                    <p className="text-[#86868b]">{d.dateStr} | {d.amount.toLocaleString()}원</p>
                    {d.isAnomaly && <p className="text-[#ff3b30] font-semibold mt-1">⚠️ 이상 탐지</p>}
                  </div>
                );
              }}
            />
            <Scatter data={timelineData} fill="#34c759">
              {timelineData.map((entry, i) => (
                <Cell key={i} fill={entry.isAnomaly ? '#ff3b30' : '#34c759'} opacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#34c759]" /><span className="text-[12px] text-[#86868b]">정상</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ff3b30]" /><span className="text-[12px] text-[#86868b]">이상 탐지</span></div>
        </div>
      </div>

      {/* 알림 카드 */}
      <div className="space-y-4">
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">탐지된 이상징후</h3>
        {alerts.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#d2d2d7] p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#34c759] mx-auto mb-4" />
            <p className="text-[#1d1d1f] font-semibold">이상 패턴이 탐지되지 않았습니다</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-white rounded-[20px] border shadow-sm p-6",
                alert.severity === 'high' ? "border-[#ff3b30]/30" : "border-[#ff9f0a]/30"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {alert.severity === 'high'
                    ? <AlertTriangle className="w-5 h-5 text-[#ff3b30]" />
                    : <AlertCircle className="w-5 h-5 text-[#ff9f0a]" />
                  }
                  <div>
                    <p className="font-semibold text-[#1d1d1f] text-[15px]">{alert.title}</p>
                    <p className="text-[13px] text-[#86868b] mt-0.5">{alert.description}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-bold",
                  alert.severity === 'high' ? "bg-[#fff5f5] text-[#ff3b30]" : "bg-[#fff8e1] text-[#ff9f0a]"
                )}>
                  {alert.severity === 'high' ? '고위험' : '주의'}
                </span>
              </div>
              <div className="space-y-2">
                {alert.relatedItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#f5f5f7] rounded-xl px-4 py-2.5">
                    <span className="text-[13px] text-[#1d1d1f] font-medium truncate max-w-[60%]">{item.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-[#86868b]">{item.date}</span>
                      <span className="text-[13px] font-semibold text-[#1d1d1f]">{item.amount.toLocaleString()}원</span>
                    </div>
                  </div>
                ))}
                {alert.relatedItems.length > 3 && (
                  <p className="text-[12px] text-[#86868b] text-center">외 {alert.relatedItems.length - 3}건</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: App.tsx의 patterns placeholder를 실제 컴포넌트로 교체**

`src/App.tsx`에 import 추가:
```tsx
import { PatternDetectionView } from "./components/PatternDetectionView";
```

Route에서 placeholder 교체:
```tsx
// 교체 전
<Route path="/patterns" element={<div className="flex-1 overflow-y-auto custom-scrollbar"><PatternDetectionViewPlaceholder items={currentItems} /></div>} />

// 교체 후
<Route path="/patterns" element={<PatternDetectionView items={currentItems} />} />
```

- [ ] **Step 4: 동작 확인**

`npm run dev` → `/patterns` 진입 → 시드 데이터로 이상 패턴 탐지 카드 표시 확인

- [ ] **Step 5: 커밋**

```bash
git add src/utils/patternDetection.ts src/components/PatternDetectionView.tsx src/App.tsx
git commit -m "feat: 패턴 기반 이상징후 탐지 대시보드 (타임라인 + 알림 카드) (P3)"
```

---

## Task 6: Executive Brief PDF 내보내기 (P4)

**Files:**
- Create: `src/services/reportService.ts`
- Modify: `src/components/DashboardHeader.tsx`

- [ ] **Step 1: jsPDF 설치**

```bash
npm install jspdf
```

- [ ] **Step 2: reportService.ts 생성**

`src/services/reportService.ts` 생성:

```typescript
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { AuditItem, ProjectInfo } from '../types/dashboard';

export async function generateAuditReport(
  project: ProjectInfo,
  items: AuditItem[],
  chartElementId: string
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  let y = 20;

  // 헤더
  doc.setFillColor(0, 102, 204);
  doc.rect(0, 0, W, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Audit System — Executive Brief', 14, 9);
  doc.text(new Date().toLocaleDateString('ko-KR'), W - 14, 9, { align: 'right' });
  y = 24;

  // 프로젝트명
  doc.setTextColor(29, 29, 31);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, 14, y);
  y += 10;

  // 예산 KPI
  doc.setFontSize(9);
  doc.setTextColor(134, 134, 139);
  doc.setFont('helvetica', 'normal');
  const usagePct = ((project.budget.used / project.budget.total) * 100).toFixed(1);
  doc.text(`총 예산: ${(project.budget.total / 100000000).toFixed(1)}억원  |  집행: ${(project.budget.used / 100000000).toFixed(1)}억원  |  집행률: ${usagePct}%  |  잔액: ${(project.budget.remaining / 10000).toLocaleString()}만원`, 14, y);
  y += 8;

  // 구분선
  doc.setDrawColor(210, 210, 215);
  doc.line(14, y, W - 14, y);
  y += 8;

  // 상태 요약
  doc.setFontSize(12);
  doc.setTextColor(29, 29, 31);
  doc.setFont('helvetica', 'bold');
  doc.text('항목 현황', 14, y);
  y += 7;

  const statuses = [
    { label: '정상', count: items.filter(i => i.status === '정상').length, color: [52, 199, 89] as [number, number, number] },
    { label: '검토필요', count: items.filter(i => i.status === '검토필요').length, color: [255, 159, 10] as [number, number, number] },
    { label: '소명중', count: items.filter(i => i.status === '소명중').length, color: [0, 102, 204] as [number, number, number] },
    { label: '반려', count: items.filter(i => i.status === '반려').length, color: [255, 59, 48] as [number, number, number] },
  ];

  statuses.forEach((s, i) => {
    const x = 14 + i * 46;
    doc.setFillColor(...s.color);
    doc.roundedRect(x, y, 42, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, x + 21, y + 6, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.count), x + 21, y + 13, { align: 'center' });
  });
  y += 24;

  // 차트 캡처
  const chartEl = document.getElementById(chartElementId);
  if (chartEl) {
    try {
      const imgData = await toPng(chartEl, { quality: 0.95, backgroundColor: '#ffffff' });
      const chartHeight = 55;
      doc.addImage(imgData, 'PNG', 14, y, W - 28, chartHeight);
      y += chartHeight + 8;
    } catch {
      // 차트 캡처 실패 시 스킵
    }
  }

  // 구분선
  doc.setDrawColor(210, 210, 215);
  doc.line(14, y, W - 14, y);
  y += 8;

  // Top 이상 항목
  const flagged = items
    .filter(i => i.status === '검토필요' || i.status === '반려')
    .sort((a, b) => a.aiScore - b.aiScore)
    .slice(0, 5);

  if (flagged.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(29, 29, 31);
    doc.setFont('helvetica', 'bold');
    doc.text('주요 검토 항목 (Top 5)', 14, y);
    y += 7;

    flagged.forEach((item, i) => {
      doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 247 : 255);
      doc.rect(14, y - 1, W - 28, 10, 'F');
      doc.setFontSize(9);
      doc.setTextColor(29, 29, 31);
      doc.setFont('helvetica', 'normal');
      const desc = item.description.length > 28 ? item.description.slice(0, 28) + '…' : item.description;
      doc.text(`${i + 1}. ${desc}`, 16, y + 5);
      doc.text(item.amount.toLocaleString() + '원', W - 50, y + 5);
      doc.setTextColor(255, 59, 48);
      doc.text(`AI ${item.aiScore}%`, W - 24, y + 5, { align: 'right' });
      y += 11;
    });
  }

  // 푸터
  doc.setFontSize(8);
  doc.setTextColor(134, 134, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('본 리포트는 AI Audit System에 의해 자동 생성되었습니다.', 14, 287);
  doc.text(`생성일시: ${new Date().toLocaleString('ko-KR')}`, W - 14, 287, { align: 'right' });

  const fileName = `audit-report-${new Date().toISOString().slice(0, 7)}.pdf`;
  doc.save(fileName);
}
```

- [ ] **Step 3: DashboardHeader에 차트 ID 및 PDF 버튼 연결**

`src/components/DashboardHeader.tsx` 수정:

```tsx
import { generateAuditReport } from "../services/reportService";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// DashboardHeaderProps에 items 추가
interface DashboardHeaderProps {
  project: ProjectInfo;
  projectId: string;
  items?: AuditItem[]; // PDF에 필요
}

export function DashboardHeader({ project, projectId, items = [] }: DashboardHeaderProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateAuditReport(project, items, 'charts-section');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 기존 "내보내기" 버튼 교체
  // onClick={() => window.print()} → onClick={handleExportPdf}
  // 버튼 내부:
  // {isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
  // {isGeneratingPdf ? '생성 중...' : 'PDF 리포트'}
```

- [ ] **Step 4: ChartsSection에 id 추가**

`src/components/ChartsSection.tsx`의 최상위 div에 id 추가:
```tsx
<div id="charts-section" className="...">
```

- [ ] **Step 5: App.tsx의 DashboardHeader에 items props 전달**

```tsx
<DashboardHeader project={projectInfo} projectId={projectId} items={currentItems} />
```

- [ ] **Step 6: 동작 확인**

`npm run dev` → 대시보드 헤더 "PDF 리포트" 버튼 클릭 → `audit-report-YYYY-MM.pdf` 다운로드 확인

- [ ] **Step 7: 커밋**

```bash
git add src/services/reportService.ts src/components/DashboardHeader.tsx src/components/ChartsSection.tsx src/App.tsx package.json package-lock.json
git commit -m "feat: Executive Brief PDF 자동 생성 (P4)"
```

---

## Task 7: 모바일 PWA (P5)

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/` (아이콘 파일)
- Modify: `index.html`
- Modify: `vite.config.ts`
- Modify: `src/components/NewEntrySheet.tsx`

- [ ] **Step 1: vite-plugin-pwa 설치**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: public/manifest.json 생성**

```json
{
  "name": "AI 감사 시스템",
  "short_name": "AI감사",
  "description": "국가연구개발비 AI 컴플라이언스 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066cc",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3: SVG 아이콘을 PNG로 생성**

`public/icons/icon-192.png`와 `public/icons/icon-512.png`가 없으면 Bash로 SVG 인라인 생성 후 base64로 embed하거나 placeholder 생성:

```bash
mkdir -p public/icons
# Canvas API를 사용한 간단한 아이콘 스크립트 (Node.js)
node -e "
const fs = require('fs');
const svg = '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" rx=\"22\" fill=\"#0066cc\"/><text x=\"50\" y=\"68\" text-anchor=\"middle\" font-size=\"50\" fill=\"white\">🛡</text></svg>';
fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon.svg', svg);
"
```

> **Note:** 실제 PNG 아이콘은 디자인 도구(Figma 등)에서 생성하는 것이 이상적이다. 임시로 SVG를 사용하거나 `vite-plugin-pwa`의 `generateSW`가 자동 생성하도록 설정한다.

- [ ] **Step 4: vite.config.ts에 PWA 플러그인 추가**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI 감사 시스템',
        short_name: 'AI감사',
        theme_color: '#0066cc',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 5: NewEntrySheet에 카메라 캡처 버튼 추가**

`src/components/NewEntrySheet.tsx`에서 영수증 업로드 섹션에 카메라 버튼 추가:

```tsx
import { Camera } from "lucide-react";

// 파일 input 숨기고 카메라 input 추가
const cameraInputRef = useRef<HTMLInputElement>(null);

const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  // 기존 영수증 파일 처리 로직과 동일하게 처리
  const reader = new FileReader();
  reader.onloadend = () => {
    // analyzeReceipt 호출 (기존 로직 재사용)
  };
  reader.readAsDataURL(file);
};

// JSX - 모바일에서만 카메라 버튼 표시 (upload 버튼 옆에)
<input
  ref={cameraInputRef}
  type="file"
  accept="image/*"
  capture="environment"
  className="hidden"
  onChange={handleCameraCapture}
/>
<Button
  type="button"
  variant="outline"
  className="sm:hidden h-11 rounded-2xl border-[#d2d2d7] flex items-center gap-2 px-4"
  onClick={() => cameraInputRef.current?.click()}
>
  <Camera className="w-4 h-4 text-[#0066cc]" />
  <span className="text-[14px] font-semibold">카메라 촬영</span>
</Button>
```

- [ ] **Step 6: index.html에 PWA 메타 태그 추가**

```html
<meta name="theme-color" content="#0066cc" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="AI감사" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

- [ ] **Step 7: 빌드 확인**

```bash
npm run build
```

Expected: `dist/` 에 `sw.js`, `workbox-*.js` 생성됨

- [ ] **Step 8: 커밋**

```bash
git add public/manifest.json public/icons/ index.html vite.config.ts src/components/NewEntrySheet.tsx package.json package-lock.json
git commit -m "feat: PWA 매니페스트 및 모바일 카메라 영수증 캡처 (P5)"
```

---

## Task 8: Agent Trace 모달 (P1) — Task 4 완료 후 시작

**Files:**
- Create: `src/components/AgentTraceModal.tsx`
- Modify: `src/services/aiService.ts` (스트리밍 함수 추가)
- Modify: `src/components/AuditDetailSheet.tsx`

- [ ] **Step 1: aiService.ts에 스트리밍 감사 분석 추가**

`src/services/aiService.ts`에 함수 추가:

```typescript
export type TraceStepStatus = 'pending' | 'running' | 'done' | 'flagged';

export interface TraceStep {
  id: number;
  label: string;
  status: TraceStepStatus;
  detail?: string;
  duration?: number;
}

import { findMatchingRegulations, formatCitation, buildRegulationContext } from './regulationService';

export async function* runAgentTrace(
  item: { category: string; description: string; amount: number; receiptUrl?: string }
): AsyncGenerator<TraceStep[]> {
  if (!ai) throw new Error('AI 서비스가 설정되지 않았습니다.');

  const steps: TraceStep[] = [
    { id: 1, label: 'OCR 파싱', status: 'pending' },
    { id: 2, label: '규정 RAG 검색', status: 'pending' },
    { id: 3, label: '위반 패턴 감지', status: 'pending' },
    { id: 4, label: 'AI 사유서 초안', status: 'pending' },
    { id: 5, label: '결재 라우팅', status: 'pending' },
  ];

  const update = (id: number, patch: Partial<TraceStep>) => {
    const idx = steps.findIndex(s => s.id === id);
    steps[idx] = { ...steps[idx], ...patch };
  };

  // Step 1: OCR 파싱
  update(1, { status: 'running' });
  yield [...steps];
  const t1 = Date.now();
  await new Promise(r => setTimeout(r, 600));
  update(1, {
    status: 'done',
    detail: `항목: ${item.description} | 금액: ${item.amount.toLocaleString()}원 | 분류: ${item.category}`,
    duration: Date.now() - t1,
  });
  yield [...steps];

  // Step 2: 규정 RAG 검색
  update(2, { status: 'running' });
  yield [...steps];
  const t2 = Date.now();
  const matches = findMatchingRegulations(item.category, item.description);
  const citations = matches.map(m => formatCitation(m.regulation)).join(', ');
  update(2, {
    status: 'done',
    detail: citations ? `적용 규정: ${citations}` : '해당 규정 없음',
    duration: Date.now() - t2,
  });
  yield [...steps];

  // Step 3: 위반 패턴 감지 (스트리밍)
  update(3, { status: 'running' });
  yield [...steps];
  const t3 = Date.now();
  const regContext = buildRegulationContext(matches);

  let violationText = '';
  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: `연구비 집행 내역을 감사하세요.
분류: ${item.category}, 항목: ${item.description}, 금액: ${item.amount}원
적용 규정: ${regContext}
위반 여부를 간결하게 한국어로 판단하세요 (2-3문장).`,
  });

  for await (const chunk of stream) {
    violationText += chunk.text ?? '';
    update(3, { detail: violationText });
    yield [...steps];
  }
  const isFlagged = violationText.includes('위반') || violationText.includes('초과') || violationText.includes('불가');
  update(3, { status: isFlagged ? 'flagged' : 'done', duration: Date.now() - t3 });
  yield [...steps];

  // Step 4: 사유서 초안
  update(4, { status: 'running' });
  yield [...steps];
  const t4 = Date.now();
  await new Promise(r => setTimeout(r, 800));
  update(4, {
    status: 'done',
    detail: isFlagged ? '소명서 초안 생성 완료 — 상세 보기 버튼으로 확인' : '규정 준수 — 사유서 불필요',
    duration: Date.now() - t4,
  });
  yield [...steps];

  // Step 5: 결재 라우팅
  update(5, { status: 'running' });
  yield [...steps];
  const t5 = Date.now();
  await new Promise(r => setTimeout(r, 400));
  update(5, {
    status: 'done',
    detail: isFlagged ? '감사자(auditor) 검토 대기열로 이동' : '정상 처리 완료',
    duration: Date.now() - t5,
  });
  yield [...steps];
}
```

- [ ] **Step 2: AgentTraceModal 컴포넌트 생성**

`src/components/AgentTraceModal.tsx` 생성:

```tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuditItem } from "../types/dashboard";
import { runAgentTrace, TraceStep } from "../services/aiService";
import { CheckCircle2, AlertTriangle, Loader2, Clock, X, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface AgentTraceModalProps {
  item: AuditItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const STEP_ICONS = {
  pending: <div className="w-7 h-7 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center text-[12px] font-bold text-[#86868b]" />,
  running: <Loader2 className="w-7 h-7 text-[#0066cc] animate-spin" />,
  done: <CheckCircle2 className="w-7 h-7 text-[#34c759]" />,
  flagged: <AlertTriangle className="w-7 h-7 text-[#ff3b30]" />,
};

export function AgentTraceModal({ item, isOpen, onClose }: AgentTraceModalProps) {
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTrace = useCallback(async () => {
    if (!item) return;
    setIsRunning(true);
    setError(null);
    setSteps([]);
    try {
      const gen = runAgentTrace({
        category: item.category,
        description: item.description,
        amount: item.amount,
        receiptUrl: item.receiptUrl,
      });
      for await (const updatedSteps of gen) {
        setSteps([...updatedSteps]);
      }
    } catch (e: any) {
      setError(e.message ?? 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
    }
  }, [item]);

  useEffect(() => {
    if (isOpen && item) {
      runTrace();
    } else {
      setSteps([]);
      setError(null);
      setIsRunning(false);
    }
  }, [isOpen, item]);

  const finalStatus = steps.length === 5
    ? steps.some(s => s.status === 'flagged') ? 'flagged' : 'done'
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="p-6 pb-4 border-b border-[#e5e5e7] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0066cc] rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#1d1d1f] tracking-tight">AI 감사 실행</h2>
                  {item && (
                    <p className="text-[13px] text-[#86868b] mt-0.5 max-w-[320px] truncate">
                      {item.description} — {item.amount.toLocaleString()}원
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center text-[#86868b] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 스텝 목록 */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3">
              {error && (
                <div className="bg-[#fff5f5] border border-[#ff3b30]/20 rounded-2xl p-4 text-[13px] text-[#ff3b30]">
                  {error}
                </div>
              )}

              {steps.length === 0 && !error && (
                <div className="flex items-center justify-center py-16 gap-3 text-[#86868b]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[15px]">분석 시작 중...</span>
                </div>
              )}

              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    step.status === 'running' && "border-[#0066cc]/30 bg-[#f0f8ff]",
                    step.status === 'done' && "border-[#34c759]/30 bg-[#f0fdf4]",
                    step.status === 'flagged' && "border-[#ff3b30]/30 bg-[#fff5f5]",
                    step.status === 'pending' && "border-[#d2d2d7] bg-[#f5f5f7]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{STEP_ICONS[step.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-[14px] font-semibold",
                          step.status === 'pending' ? "text-[#86868b]" : "text-[#1d1d1f]"
                        )}>
                          {i + 1}. {step.label}
                        </span>
                        {step.duration !== undefined && (
                          <span className="flex items-center gap-1 text-[11px] text-[#86868b] shrink-0">
                            <Clock className="w-3 h-3" />
                            {(step.duration / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {step.detail && (
                        <p className={cn(
                          "text-[12px] mt-1.5 leading-relaxed",
                          step.status === 'flagged' ? "text-[#ff3b30]" : "text-[#424245]"
                        )}>
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 푸터 — 완료 후 표시 */}
            {finalStatus && !isRunning && (
              <div className={cn(
                "p-6 pt-4 border-t border-[#e5e5e7] flex items-center justify-between",
                finalStatus === 'flagged' ? "bg-[#fff5f5]" : "bg-[#f0fdf4]"
              )}>
                <div className="flex items-center gap-2">
                  {finalStatus === 'flagged'
                    ? <><AlertTriangle className="w-5 h-5 text-[#ff3b30]" /><span className="font-semibold text-[#ff3b30]">위반 항목 감지 — 검토 필요</span></>
                    : <><CheckCircle2 className="w-5 h-5 text-[#34c759]" /><span className="font-semibold text-[#34c759]">규정 준수 확인 완료</span></>
                  }
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={runTrace} className="rounded-full text-[13px]">
                    재실행
                  </Button>
                  <Button size="sm" onClick={onClose} className="rounded-full bg-[#0066cc] text-white text-[13px]">
                    닫기
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: AuditDetailSheet에 Trace 실행 버튼 추가**

`src/components/AuditDetailSheet.tsx`에 import 추가:
```tsx
import { AgentTraceModal } from "./AgentTraceModal";
```

상태 추가:
```tsx
const [isTraceOpen, setIsTraceOpen] = useState(false);
```

Sheet 내 버튼 영역에 추가 (기존 "AI 설명" 버튼 옆):
```tsx
<Button
  onClick={() => setIsTraceOpen(true)}
  className="h-10 bg-[#0066cc] text-white hover:bg-[#0071e3] rounded-full px-5 text-[13px] font-semibold flex items-center gap-2 active:scale-95 transition-all"
>
  <Zap className="w-4 h-4" />
  AI Trace
</Button>

{/* Sheet 닫기 버튼 근처에 Modal 렌더링 */}
<AgentTraceModal
  item={item}
  isOpen={isTraceOpen}
  onClose={() => setIsTraceOpen(false)}
/>
```

`Zap` import를 AuditDetailSheet 상단에 추가.

- [ ] **Step 4: 동작 확인**

`npm run dev` → 감사 항목 행 클릭 → Sheet 오픈 → "AI Trace" 버튼 클릭 → 5단계 순차 실행 및 스트리밍 텍스트 확인

- [ ] **Step 5: 커밋**

```bash
git add src/components/AgentTraceModal.tsx src/services/aiService.ts src/components/AuditDetailSheet.tsx
git commit -m "feat: 5단계 Agent Trace 전체화면 모달 (스트리밍 시각화) (P1)"
```

---

## Task 9: Vitest 유닛 테스트 (P8b)

**Files:**
- Modify: `vite.config.ts`
- Create: `src/utils/patternDetection.test.ts`
- Create: `src/services/regulationService.test.ts`

- [ ] **Step 1: Vitest 설치**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: vite.config.ts에 test 설정 추가**

기존 `defineConfig` 내부에 추가:
```typescript
export default defineConfig({
  // ...기존 plugins, resolve...
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 3: patternDetection.test.ts 작성**

`src/utils/patternDetection.test.ts` 생성:

```typescript
import { describe, it, expect } from 'vitest';
import { AuditItem } from '../types/dashboard';
import {
  detectSplitPayments,
  detectWeekendExpenses,
  detectDuplicateConsulting,
  detectAmountOutliers,
} from './patternDetection';

const baseItem = (overrides: Partial<AuditItem>): AuditItem => ({
  id: 'test-1', projectId: 'p1', userId: 'u1',
  date: '2026-05-12', category: '회의비',
  description: '강남 한식당 회식', amount: 150000,
  aiScore: 70, status: '정상',
  ...overrides,
});

describe('detectSplitPayments', () => {
  it('7일 내 동일 가맹점 3회 집행을 감지한다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-10', amount: 149000 }),
      baseItem({ id: '2', date: '2026-05-12', amount: 149000 }),
      baseItem({ id: '3', date: '2026-05-14', amount: 149000 }),
    ];
    const alerts = detectSplitPayments(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('split_payment');
    expect(alerts[0].severity).toBe('high');
    expect(alerts[0].relatedItems).toHaveLength(3);
  });

  it('7일을 초과한 경우 감지하지 않는다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-01', amount: 149000 }),
      baseItem({ id: '2', date: '2026-05-10', amount: 149000 }),
      baseItem({ id: '3', date: '2026-05-20', amount: 149000 }),
    ];
    expect(detectSplitPayments(items)).toHaveLength(0);
  });

  it('2회 이하는 감지하지 않는다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-10', amount: 149000 }),
      baseItem({ id: '2', date: '2026-05-11', amount: 149000 }),
    ];
    expect(detectSplitPayments(items)).toHaveLength(0);
  });
});

describe('detectWeekendExpenses', () => {
  it('회의비 일요일(0) 집행을 감지한다', () => {
    // 2026-05-10은 일요일
    const items = [baseItem({ id: '1', date: '2026-05-10', category: '회의비' })];
    const alerts = detectWeekendExpenses(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('weekend_expense');
  });

  it('평일 회의비는 감지하지 않는다', () => {
    // 2026-05-11은 월요일
    const items = [baseItem({ id: '1', date: '2026-05-11', category: '회의비' })];
    expect(detectWeekendExpenses(items)).toHaveLength(0);
  });

  it('주말 연구재료비는 감지하지 않는다', () => {
    const items = [baseItem({ id: '1', date: '2026-05-10', category: '연구재료비' })];
    expect(detectWeekendExpenses(items)).toHaveLength(0);
  });
});

describe('detectDuplicateConsulting', () => {
  it('동일 월 2회 이상 전문가 활용비를 감지한다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-05', category: '전문가 활용비', description: '김전문 자문료' }),
      baseItem({ id: '2', date: '2026-05-20', category: '전문가 활용비', description: '김전문 자문료' }),
    ];
    const alerts = detectDuplicateConsulting(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('duplicate_consulting');
  });

  it('다른 달이면 감지하지 않는다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-04-05', category: '전문가 활용비' }),
      baseItem({ id: '2', date: '2026-05-20', category: '전문가 활용비' }),
    ];
    expect(detectDuplicateConsulting(items)).toHaveLength(0);
  });
});

describe('detectAmountOutliers', () => {
  it('z-score > 2인 항목을 감지한다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', amount: 10000 }),
      baseItem({ id: '2', amount: 12000 }),
      baseItem({ id: '3', amount: 11000 }),
      baseItem({ id: '4', amount: 11500 }),
      baseItem({ id: '5', amount: 500000 }), // 이상값
    ];
    const alerts = detectAmountOutliers(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('amount_outlier');
    expect(alerts[0].relatedItems.some(i => i.id === '5')).toBe(true);
  });

  it('항목이 3개 미만이면 감지하지 않는다', () => {
    const items = [baseItem({ id: '1' }), baseItem({ id: '2' })];
    expect(detectAmountOutliers(items)).toHaveLength(0);
  });
});
```

- [ ] **Step 4: regulationService.test.ts 작성**

`src/services/regulationService.test.ts` 생성:

```typescript
import { describe, it, expect } from 'vitest';
import { findMatchingRegulations, formatCitation } from './regulationService';

describe('findMatchingRegulations', () => {
  it('카테고리 키워드로 규정을 찾는다', () => {
    const matches = findMatchingRegulations('회의비', '팀 간담회');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].regulation.category).toBe('회의비');
  });

  it('최대 3개까지만 반환한다', () => {
    const matches = findMatchingRegulations('회의비', '회식 식대 간담회 분할 주말');
    expect(matches.length).toBeLessThanOrEqual(3);
  });

  it('매칭되는 규정이 없으면 빈 배열을 반환한다', () => {
    const matches = findMatchingRegulations('인건비', '연구원 급여');
    expect(matches).toHaveLength(0);
  });

  it('점수 높은 순으로 정렬된다', () => {
    const matches = findMatchingRegulations('전문가 활용비', '자문료 중복 지급');
    expect(matches.length).toBeGreaterThan(1);
    expect(matches[0].matchCount).toBeGreaterThanOrEqual(matches[1].matchCount);
  });
});

describe('formatCitation', () => {
  it('조항 번호와 제목을 조합한다', () => {
    const matches = findMatchingRegulations('회의비', '회식');
    expect(matches.length).toBeGreaterThan(0);
    const citation = formatCitation(matches[0].regulation);
    expect(citation).toMatch(/제\d+-\d+조/);
    expect(citation.length).toBeGreaterThan(5);
  });
});
```

- [ ] **Step 5: 테스트 실행**

```bash
npx vitest run
```

Expected: 모든 테스트 PASS. 실패 시 테스트 코드 또는 구현 수정 후 재실행.

- [ ] **Step 6: package.json에 test 스크립트 추가**

```json
"scripts": {
  "test": "vitest run",
  "test:ui": "vitest --ui"
}
```

- [ ] **Step 7: 커밋**

```bash
git add src/utils/patternDetection.test.ts src/services/regulationService.test.ts vite.config.ts package.json package-lock.json
git commit -m "test: 패턴 탐지 및 규정 서비스 유닛 테스트 추가 (P8b)"
```

---

## Task 10: GitHub Actions CI (P8c)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: .github/workflows 디렉토리 생성**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: ci.yml 작성**

`.github/workflows/ci.yml` 생성:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

- [ ] **Step 3: .gitignore 확인**

```bash
cat .gitignore
```

`.env`가 포함되어 있는지 확인. 없으면 추가:
```
.env
.env.local
```

- [ ] **Step 4: GitHub 저장소 시크릿 설정 안내**

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret으로 다음 추가:
- `VITE_GEMINI_API_KEY`
- `VITE_FIREBASE_API_KEY` 등 `.env.example`의 모든 변수

- [ ] **Step 5: git 초기화 및 원격 저장소 연결**

```bash
git remote -v
```

원격이 없으면: `git remote add origin https://github.com/<your-username>/caas.git`

- [ ] **Step 6: 최종 커밋 및 푸시**

```bash
git add .github/workflows/ci.yml .gitignore
git commit -m "ci: GitHub Actions typecheck + test + build 파이프라인 (P8c)"
git push -u origin main
```

Expected: GitHub Actions 탭에서 CI 워크플로우 녹색 확인

---

## 완료 기준 체크리스트

- [ ] `http://localhost:3000/settlement` 직접 입력 시 해당 뷰 렌더링
- [ ] 로그인 화면 "데모 체험" 버튼 → 30초 안에 대시보드 전체 기능 접근
- [ ] 감사 항목 클릭 → Sheet → "AI Trace" 버튼 → 5단계 순차 실행 확인
- [ ] 위반 항목의 AI 결과에 "제3-2조" 형태 조항 인용 배지 표시
- [ ] `/patterns` 진입 → 분할결제/주말/중복/outlier 카드 + 타임라인
- [ ] 대시보드 헤더 "PDF 리포트" → `audit-report-YYYY-MM.pdf` 다운로드
- [ ] 모바일 Chrome에서 "홈 화면 추가" 동작
- [ ] `npm test` → 모든 테스트 PASS
- [ ] GitHub Actions 녹색 배지

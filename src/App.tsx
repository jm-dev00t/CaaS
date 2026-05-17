/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardHeader } from "./components/DashboardHeader";
import { AuditFeed } from "./components/AuditFeed";
import { ReceiptGenerator } from "./components/ReceiptGenerator";
import { OrganizationView } from "./components/OrganizationView";
import { RuleManagementView } from "./components/RuleManagementView";
import { ComplianceGuideView } from "./components/ComplianceGuideView";
import { ChartsSection } from "./components/ChartsSection";
import { projectInfo, auditItems, weeklyExecution, categoryExecution } from "./data/mockData";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { signInWithGoogle } from "./lib/firebase";
import { Button } from "./components/ui/button";
import { ShieldCheck, LogIn, Loader2, RefreshCw, FileCheck2, History as HistoryIcon } from "lucide-react";
import { subscribeToAuditItems, seedInitialData } from "./services/dataService";
import { AuditItem } from "./types/dashboard";
import { cn } from "@/lib/utils";
import { EvidenceRecordView } from "./components/EvidenceRecordView";
import { PatternDetectionView } from "./components/PatternDetectionView";

function DashboardContent() {
  const { user, profile, loading: authLoading, isDemoMode, enterDemoMode } = useAuth();
  const [items, setItems] = useState<AuditItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

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

  const projectId = "P-2026-001"; // Constant for demo

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
      setItems(auditItems);
      setDataLoading(false);
    }
  }, [user, isDemoMode]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In a real app, this might trigger a server-side re-scan
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const currentItems = Array.from(new Map((items.length > 0 ? items : auditItems).map(item => [item.id, item])).values())
    .filter(item => {
      if (profile?.role === 'researcher' && user) {
        return item.userId === user.uid || item.userId === 'demo-researcher-id';
      }
      return true;
    });

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#0066cc] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f5f5f7] overflow-hidden relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="bg-white p-14 rounded-[32px] shadow-sm text-center max-w-lg w-full relative z-10 border border-[#d2d2d7]"
        >
          <div className="bg-[#0066cc] w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-[#0066cc]/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-[36px] font-semibold text-[#1d1d1f] mb-3 tracking-tight leading-tight">AI 감사 시스템</h1>
          <p className="text-[#86868b] text-[17px] mb-10 leading-relaxed max-w-sm mx-auto">
            차세대 연구비 컴플라이언스 및 집행 분석 플랫폼
          </p>
          <Button
            onClick={() => signInWithGoogle()}
            className="w-full h-14 bg-[#0066cc] text-white hover:bg-[#0071e3] font-semibold text-[17px] flex items-center justify-center gap-3 rounded-full shadow-none transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Google 계정으로 시작하기
          </Button>
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
          <div className="mt-10 pt-8 border-t border-[#e5e5e7]">
            <p className="text-[12px] font-semibold text-[#86868b] uppercase tracking-widest">기업 수준의 보안 및 암호화 적용됨</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans antialiased text-foreground">
      <Sidebar className="hidden lg:flex flex-shrink-0" currentRole={profile?.role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <Routes>
              <Route path="/" element={
                <main className="flex-1 overflow-y-auto outline-none custom-scrollbar pb-16">
                  <div className="max-w-[1440px] mx-auto p-4 md:p-10 space-y-8 md:space-y-12">
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                      <DashboardHeader project={projectInfo} projectId={projectId} items={currentItems} />
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

              <Route path="/patterns" element={<PatternDetectionView items={currentItems} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileCheck2,
  BarChart3,
  Settings,
  LogOut,
  Database,
  History,
  ShieldCheck,
  BellRing,
  UserCircle,
  ChevronRight,
  Ticket,
  FileText,
  BookOpen,
  Info,
  AlertTriangle,
} from "lucide-react";
import { auth } from "../lib/firebase";
import { sendNotification } from "../services/dataService";
import { useAuth } from "../contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  className?: string;
  currentRole?: string;
}

export function Sidebar({ className, currentRole }: SidebarProps) {
  const { user, updateProfile, logout } = useAuth();
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

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "대시보드" },
    { id: "settlement", icon: FileCheck2, label: "정산 현황", roles: ["admin", "finance_officer", "researcher"] },
    { id: "verification", icon: ShieldCheck, label: "AI 검증 피드", roles: ["admin", "finance_officer", "researcher"] },
    { id: "rule-management", icon: FileText, label: "규정 관리", roles: ["admin"] },
    { id: "compliance-guide", icon: BookOpen, label: "집행 가이드", roles: ["admin", "finance_officer", "researcher"] },
    { id: "org-management", icon: UserCircle, label: "조직 관리", roles: ["admin"] },
    { id: "budget", icon: Database, label: "예산 관리", roles: ["admin", "finance_officer"] },
    { id: "evidence", icon: History, label: "증빙 기록", roles: ["admin", "finance_officer", "researcher"] },
    { id: "stats", icon: BarChart3, label: "통계 분석", roles: ["admin", "finance_officer"] },
    { id: "patterns", icon: AlertTriangle, label: "패턴 탐지", roles: ["admin", "finance_officer"] },
    { id: "receipt-gen", icon: Ticket, label: "테스트 영수증" },
  ];

  const roles = [
    { id: "researcher", label: "연구원", desc: "정산 등록 및 관리" },
    { id: "finance_officer", label: "감사자", desc: "집행 검토 및 승인" },
    { id: "admin", label: "관리자", desc: "시스템 모든 권한" }
  ];

  const handleRoleChange = async (roleId: string) => {
    try {
      await updateProfile({ role: roleId });
    } catch (e) {
      console.error("Role change failed", e);
      alert("권한 변경 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const triggerDemoAlert = async () => {
    if (!user) return;
    await sendNotification(
      user.uid,
      "AI 정밀 검토 알림",
      "법인카드 집행 내역 #4928에서 분할 결제 의심 정황이 발견되었습니다.",
      "alert"
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r border-[#e0e0e0] text-sidebar-foreground w-[260px] relative z-40", className)}>
      <div className="p-8 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0066cc] rounded-xl flex items-center justify-center shadow-sm cursor-pointer hover:scale-95 transition-transform duration-200" onClick={() => onViewChange("dashboard")}>
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col cursor-pointer" onClick={() => onViewChange("dashboard")}>
          <span className="font-semibold text-[#1d1d1f] tracking-tight text-lg leading-tight">AI 감사 시스템</span>
          <span className="text-[10px] font-medium text-[#86868b] uppercase tracking-wider">기업용</span>
        </div>
      </div>

      <div className="px-5 py-2">
        <Popover>
          <PopoverTrigger className="bg-white/80 p-3 rounded-2xl border border-[#e5e5e7] flex flex-col gap-0.5 w-full text-left transition-all group">
            <p className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wide">사용자 권한</p>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#1d1d1f]">
                {roles.find(r => r.id === currentRole)?.label.split('(')[0] || currentRole || "로딩 중..."}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
            </div>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-64 p-2 bg-white/95 backdrop-blur-xl border border-[#d2d2d7] rounded-3xl shadow-2xl">
            <div className="p-3 mb-1">
              <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">권한 관점 선택</p>
            </div>
            <div className="space-y-1 pb-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-2xl transition-all",
                    currentRole === role.id ? "bg-[#0066cc] text-white" : "hover:bg-[#f5f5f7] text-[#1d1d1f]"
                  )}
                >
                  <p className="text-[13px] font-semibold">{role.label.split('(')[0]}</p>
                  <p className={cn("text-[11px] mt-0.5", currentRole === role.id ? "text-white/80" : "text-[#86868b]")}>{role.desc}</p>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-0.5 overflow-y-auto custom-scrollbar">
        <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#86868b] mb-1">메뉴</div>
        {navItems.map((item) => {
          if (item.roles && currentRole && !item.roles.includes(currentRole)) return null;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group text-[14px] font-medium",
                isActive
                  ? "bg-[#0066cc] text-white shadow-sm"
                  : "text-[#424245] hover:bg-[#e8e8ed] hover:text-[#1d1d1f]"
              )}
            >
              <item.icon className={cn("w-[20px] h-[20px] stroke-[2px]", isActive ? "text-white" : "text-[#86868b] group-hover:text-[#1d1d1f]")} />
              <span className="tracking-tight">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-[#e5e5e7]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-[#86868b] hover:text-[#ff3b30] transition-colors w-full text-[13px] font-medium group"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
}

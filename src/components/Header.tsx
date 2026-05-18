import React, { useState } from "react";
import { Search, UserCircle, ChevronRight, Menu, Info } from "lucide-react";
import { Input } from "./ui/input";
import { NotificationCenter } from "./NotificationCenter";
import { useAuth } from "../contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export function Header({ activeView, onViewChange }: HeaderProps) {
  const { profile, isDemoMode } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-[#e5e5e7] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* ... mobile menu trigger ... */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger className="lg:hidden p-2 hover:bg-[#f5f5f7] rounded-xl transition-colors">
            <Menu className="w-5 h-5 text-[#1d1d1f]" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] border-none">
            <SheetTitle className="sr-only">모바일 메뉴</SheetTitle>
            <Sidebar
              className="w-full border-none shadow-none"
              currentRole={profile?.role}
            />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-3 text-[13px] font-medium text-[#86868b]">
          <span className="hover:text-[#0066cc] cursor-pointer transition-colors hidden sm:inline">프로젝트</span>
          <ChevronRight className="w-3 h-3 text-[#d2d2d7] hidden sm:inline" />
          <span className="text-[#1d1d1f] font-semibold tracking-tight truncate max-w-[150px] sm:max-w-none">차세대 AI 의료 진단 플랫폼</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden xl:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b]" />
          <Input
            placeholder="통합 검색... (Enter)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 h-9 bg-[#f5f5f7] border-none focus:bg-white focus:ring-1 focus:ring-[#d2d2d7] transition-all w-60 text-[13px] rounded-full text-[#1d1d1f] placeholder:text-[#86868b]"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationCenter />

          {isDemoMode && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#fff3cd] text-[#856404] rounded-full text-[11px] font-bold border border-[#ffe082]">
              DEMO
            </span>
          )}

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[14px] font-semibold text-[#1d1d1f] leading-tight">{profile?.displayName || "사용자"}</p>
              <p className="text-[11px] text-[#86868b] font-medium uppercase tracking-wider mt-0.5">{profile?.organization || "국가연구소"}</p>
            </div>
            <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center border border-[#d2d2d7] shadow-sm">
              <UserCircle className="w-6 h-6 text-[#86868b]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

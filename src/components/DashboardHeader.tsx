import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Wallet, Calendar, User, FileText, FileDown, Plus } from "lucide-react";
import { ProjectInfo } from "../types/dashboard";
import { Button } from "./ui/button";
import { useState } from "react";
import { NewEntrySheet } from "./NewEntrySheet";

interface DashboardHeaderProps {
  project: ProjectInfo;
  projectId: string;
}

export function DashboardHeader({ project, projectId }: DashboardHeaderProps) {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const usagePercent = (project.budget.used / project.budget.total) * 100;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 md:space-y-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-[10px] md:text-[12px] font-semibold text-[#0066cc] bg-[#e3f2fd] px-2 md:px-3 py-1 rounded-full uppercase tracking-wide">PJ-2024-AI-TRX</span>
            <span className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-full bg-[#f2f2f7] text-[#86868b] text-[10px] md:text-[12px] font-medium border border-[#d2d2d7]">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#34c759]"></div>
              시스템 정상
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">{project.name}</h1>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex -space-x-2">
                {["React 18", "Tailwind", "Firebase", "Gemini 1.5"].map((tech, i) => (
                  <div key={i} className="px-2.5 py-0.5 bg-white border border-[#d2d2d7] rounded-md text-[10px] font-bold text-[#86868b] shadow-sm relative z-[10]">
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 flex-1 sm:flex-initial">
            <Button 
              variant="outline" 
              className="h-10 md:h-11 text-[13px] md:text-[14px] font-semibold rounded-full border-[#d2d2d7] px-4 md:px-6 transition-all bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] flex-1 sm:flex-initial"
              onClick={() => window.print()}
            >
              <FileDown className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button 
              className="h-10 md:h-11 bg-[#0066cc] text-white hover:bg-[#0071e3] text-[13px] md:text-[14px] font-semibold rounded-full transition-all px-6 md:px-8 active:scale-95 flex-1 sm:flex-initial"
              onClick={() => setIsNewEntryOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              항목 추가
            </Button>
          </div>
          <div className="bg-[#fef2f2] px-4 md:px-6 py-2 md:py-2.5 rounded-full flex items-center gap-3 md:gap-4 border border-[#fee2e2] w-full sm:w-auto justify-center sm:justify-start">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center text-[#ff3b30] shadow-sm">
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-semibold text-[#ff3b30] uppercase tracking-wide">정산 마감</p>
              <p className="text-[14px] md:text-[15px] font-bold text-[#ff3b30]">D-{project.dDay}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="shadow-sm bg-white rounded-[24px] overflow-hidden border border-[#d2d2d7]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] font-semibold text-[#86868b] uppercase tracking-wide">총 예산</span>
              <Wallet className="w-5 h-5 text-[#86868b]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-semibold text-[#1d1d1f]">{(project.budget.total / 100000000).toFixed(1)}</span>
                <span className="text-[15px] font-medium text-[#86868b]">억원</span>
              </div>
              <div className="mt-6 flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-[#86868b]">집행률</span>
                <span className="text-[12px] font-semibold text-[#0066cc]">{usagePercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0066cc] rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${usagePercent}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-white rounded-[24px] overflow-hidden border border-[#d2d2d7]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] font-semibold text-[#86868b] uppercase tracking-wide">잔액</span>
              <FileText className="w-5 h-5 text-[#86868b]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-semibold text-[#1d1d1f]">{(project.budget.remaining / 10000).toLocaleString()}</span>
                <span className="text-[15px] font-medium text-[#86868b]">만원</span>
              </div>
              <p className="text-[13px] text-[#86868b] mt-4">집행 가능 잔여 예산</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-white rounded-[24px] overflow-hidden border border-[#d2d2d7]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] font-semibold text-[#86868b] uppercase tracking-wide">연구책임자</span>
              <User className="w-5 h-5 text-[#86868b]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[20px] font-semibold text-[#1d1d1f] tracking-tight">{project.pi.split(' ')[0]}</span>
              <span className="text-[13px] text-[#86868b] mt-4 font-medium uppercase tracking-wider">{project.pi.split(' ').slice(1).join(' ')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-[#fafafa] rounded-[24px] overflow-hidden border border-[#d2d2d7]">
          <CardContent className="p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] font-semibold text-[#0066cc] uppercase tracking-wide">AI 감사 무결성</span>
              <div className="w-2.5 h-2.5 bg-[#34c759] rounded-full shadow-[0_0_8px_rgba(52,199,89,0.5)]"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] font-semibold text-[#34c759]">92.4</span>
                <span className="text-[17px] font-medium text-[#34c759]/70">%</span>
              </div>
              <p className="text-[13px] text-[#86868b] mt-3">무결성 점수</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <NewEntrySheet 
        isOpen={isNewEntryOpen} 
        onClose={() => setIsNewEntryOpen(false)} 
        projectId={projectId} 
      />
    </div>
  );
}

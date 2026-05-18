import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  FileText, 
  Scale, 
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { subscribeToRules } from "../services/dataService";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "전체 규정", icon: BookOpen },
  { id: "law", label: "국가법령", icon: Scale },
  { id: "regulation", label: "정부고시/지침", icon: FileText },
  { id: "internal", label: "기관내부규정", icon: Info },
  { id: "guideline", label: "집행가이드라인", icon: Lightbulb },
];

const TYPE_COLORS: Record<string, string> = {
  law: "text-blue-600 bg-blue-50",
  regulation: "text-purple-600 bg-purple-50",
  internal: "text-emerald-600 bg-emerald-50",
  guideline: "text-orange-600 bg-orange-50"
};

export function ComplianceGuideView() {
  const [rules, setRules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedRule, setSelectedRule] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToRules(setRules);
    return () => unsubscribe();
  }, []);

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         rule.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || rule.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-hidden h-full flex flex-col bg-[#f5f5f7]">
      <div className="p-12 pb-6">
        <div className="space-y-1 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#0066cc]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#0066cc]" />
            </div>
            <span className="text-[12px] font-bold text-[#0066cc] uppercase tracking-widest">Compliance Knowledge Base</span>
          </div>
          <h1 className="text-[34px] font-bold text-[#1d1d1f] tracking-tight">연구비 집행 가이드</h1>
          <p className="text-[#86868b] text-[17px] font-medium max-w-2xl">
            최신 연구비 관리 규정과 국가 R&D 법령을 확인하세요. AI 감사 엔진이 동일한 기준으로 여러분의 집행 내용을 검토합니다.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <Input 
              placeholder="궁금한 규정이나 키워드를 검색하세요 (예: 회의비, 해외출장...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 h-14 text-[16px] bg-white border-[#d2d2d7] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#0066cc]/20"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-[#e8e8ed] rounded-2xl overflow-hidden shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all",
                  activeCategory === cat.id 
                    ? "bg-white text-[#1d1d1f] shadow-sm" 
                    : "text-[#86868b] hover:text-[#1d1d1f]"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-12 pb-12 flex gap-8">
        {/* Rules List */}
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-4">
          <AnimatePresence mode="popLayout">
            {filteredRules.length > 0 ? (
              filteredRules.map((rule) => (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedRule(rule)}
                  className={cn(
                    "bg-white border p-6 rounded-[24px] cursor-pointer transition-all hover:bg-[#f5f5f7] group",
                    selectedRule?.id === rule.id ? "border-[#0066cc] ring-2 ring-[#0066cc]/10" : "border-[#d2d2d7]"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border-none capitalize", TYPE_COLORS[rule.type] || "bg-[#f2f2f7] text-[#86868b]")}>
                      {CATEGORIES.find(c => c.id === rule.type)?.label || rule.type}
                    </Badge>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", selectedRule?.id === rule.id ? "rotate-90 text-[#0066cc]" : "text-[#d2d2d7] group-hover:translate-x-1")} />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#1d1d1f] mb-2">{rule.title}</h3>
                  <p className="text-[14px] text-[#86868b] line-clamp-2 leading-relaxed">
                    {rule.content}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f2f2f7] flex items-center justify-center">
                  <Search className="w-8 h-8 text-[#d2d2d7]" />
                </div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">검색 결과가 없습니다</h3>
                <p className="text-[#86868b]">다른 키워드로 검색하거나 카테고리를 변경해보세요.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Rule Detail / Help Panel */}
        <div className="w-[450px] space-y-6 flex flex-col shrink-0">
          <AnimatePresence mode="wait">
            {selectedRule ? (
              <motion.div
                key={selectedRule.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-[#d2d2d7] rounded-[32px] overflow-hidden shadow-sm flex flex-col h-full"
              >
                <div className="p-8 border-b border-[#f5f5f7]">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border-none", TYPE_COLORS[selectedRule.type] || "bg-[#f2f2f7] text-[#86868b]")}>
                      {CATEGORIES.find(c => c.id === selectedRule.type)?.label || selectedRule.type}
                    </Badge>
                    <span className="text-[11px] font-bold text-[#86868b] ml-auto uppercase tracking-wider">
                      최종 업데이트: {selectedRule.updatedAt?.toDate?.()?.toLocaleDateString() || "최근"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
                    {selectedRule.title}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-bold text-[#86868b] uppercase tracking-wider">규정 내용</h4>
                    <p className="text-[16px] text-[#1d1d1f] leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedRule.content}
                    </p>
                  </div>
                  
                  <div className="bg-[#f2f2f7] p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-[#0066cc]" />
                      <h4 className="text-[15px] font-bold text-[#1d1d1f]">AI 감사 팁</h4>
                    </div>
                    <p className="text-[13px] text-[#424245] leading-relaxed font-medium">
                      이 규정은 연구비 집행 시 가장 빈번하게 검토되는 항목입니다. 
                      증빙 서류 제출 시 해당 사유가 명확히 기재되어 있는지 확인하세요.
                    </p>
                  </div>
                </div>
                <div className="p-8 border-t border-[#f5f5f7]">
                  <button
                    onClick={() => {
                      if (selectedRule?.sourceUrl?.startsWith('http')) {
                        window.open(selectedRule.sourceUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        alert('등록된 원문 링크가 없습니다.');
                      }
                    }}
                    className="w-full h-14 bg-[#1d1d1f] text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-[15px] hover:bg-black transition-all active:scale-95 shadow-xl shadow-black/10"
                  >
                    <ExternalLink className="w-5 h-5" />
                    관련 법령 전문 보기
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="bg-white border border-[#d2d2d7] rounded-[32px] p-8 space-y-6 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-[#0066cc]/10 flex items-center justify-center mb-2">
                    <AlertTriangle className="w-7 h-7 text-[#0066cc]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">자주 묻는 질문</h3>
                  <div className="space-y-4">
                    {[
                      { q: "야근 식대 청구 가능 시간은?", keyword: "식대" },
                      { q: "학회 등록비 정산 시 필요 서류는?", keyword: "학회" },
                      { q: "연구 재료비와 소모품비의 차이는?", keyword: "소모품" },
                    ].map(({ q, keyword }, i) => (
                      <button
                        key={i}
                        onClick={() => setSearchTerm(keyword)}
                        className="w-full p-4 rounded-2xl border border-[#d2d2d7] text-left hover:bg-[#f5f5f7] transition-all group flex items-center justify-between"
                      >
                        <span className="text-[14px] font-bold text-[#424245]">{q}</span>
                        <ChevronRight className="w-4 h-4 text-[#d2d2d7] group-hover:text-[#0066cc]" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0066cc] rounded-[32px] p-8 text-white space-y-4 shadow-xl shadow-[#0066cc]/20">
                  <CheckCircle2 className="w-10 h-10 text-white/40" />
                  <h3 className="text-xl font-bold mt-2">안전한 집행을 도와드립니다</h3>
                  <p className="text-white/80 text-[14px] leading-relaxed font-medium">
                    AI 감사 엔진은 위 규정들을 바탕으로 실시간으로 집행 가능 여부를 판단합니다. 애매한 경우 미리 규정을 확인해보세요.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

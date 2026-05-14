import React, { useState } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ImageIcon, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Eye
} from "lucide-react";
import { AuditItem } from "../types/dashboard";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface EvidenceRecordViewProps {
  items: AuditItem[];
}

export function EvidenceRecordView({ items }: EvidenceRecordViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const evidenceItems = items.filter(item => !!item.receiptUrl);
  
  const filteredItems = evidenceItems.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(evidenceItems.map(i => i.category)))];

  return (
    <div className="flex-1 overflow-hidden h-full flex flex-col bg-[#f5f5f7]">
      <div className="p-12 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0066cc]/10 flex items-center justify-center">
                <History className="w-5 h-5 text-[#0066cc]" />
              </div>
              <span className="text-[12px] font-bold text-[#0066cc] uppercase tracking-widest">Evidence Ledger</span>
            </div>
            <h1 className="text-[34px] font-bold text-[#1d1d1f] tracking-tight">전자 증빙 기록관</h1>
            <p className="text-[#86868b] text-[17px] font-medium max-w-2xl">
              실시간으로 아카이브되는 모든 지출 증빙 자료를 통합 관리합니다.
            </p>
          </div>
          <Button className="bg-white border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full px-6 py-6 h-auto font-bold flex items-center gap-2">
            <Download className="w-5 h-5" />
            전체 증빙 내려받기 (ZIP)
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
            <Input 
              placeholder="증빙 번호, 항목명 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 h-14 text-[16px] bg-white border-[#d2d2d7] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#0066cc]/20"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#d2d2d7] rounded-2xl px-2">
             <Filter className="w-4 h-4 text-[#86868b] ml-2" />
             <div className="flex overflow-x-auto no-scrollbar py-2 max-w-[400px]">
               {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setCategoryFilter(cat)}
                   className={cn(
                     "px-4 py-1.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all",
                     categoryFilter === cat ? "bg-[#0066cc] text-white" : "text-[#86868b] hover:text-[#1d1d1f]"
                   )}
                 >
                   {cat === "all" ? "전체" : cat}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="group relative"
              >
                <div className="aspect-[3/4] bg-white border border-[#d2d2d7] rounded-[24px] overflow-hidden flex flex-col shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:border-[#0066cc]/50">
                  {/* Receipt Preview */}
                  <div className="flex-1 bg-[#f5f5f7] relative overflow-hidden flex items-center justify-center">
                    {item.receiptUrl ? (
                      <img 
                        src={item.receiptUrl} 
                        alt="Receipt" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-[#d2d2d7]" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                      <Button className="opacity-0 group-hover:opacity-100 bg-white text-black hover:bg-white/90 rounded-full scale-90 group-hover:scale-100 transition-all font-bold">
                        <Eye className="w-4 h-4 mr-2" />
                        상세 보기
                      </Button>
                    </div>
                    {/* Identification Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 backdrop-blur-md text-[#1d1d1f] border-none font-black text-[10px] px-2.5 py-1 rounded-md shadow-sm">
                        {item.id}
                      </Badge>
                    </div>
                  </div>

                  {/* Info Sidebar */}
                  <div className="p-5 border-t border-[#f5f5f7] space-y-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-[#0066cc] uppercase tracking-widest">{item.category}</p>
                      <h4 className="text-[14px] font-bold text-[#1d1d1f] line-clamp-1 tracking-tight">{item.description}</h4>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider">Amount</p>
                        <p className="text-[14px] font-black text-[#1d1d1f] tabular-nums">
                          ₩{item.amount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider">Date</p>
                         <p className="text-[11px] font-bold text-[#1d1d1f]">{item.date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner mb-6">
              <Search className="w-10 h-10 text-[#d2d2d7]" />
            </div>
            <h3 className="text-xl font-bold text-[#1d1d1f]">검색된 증빙이 없습니다</h3>
            <p className="text-[#86868b] mt-1">검색어를 파악하거나 필터를 조정해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

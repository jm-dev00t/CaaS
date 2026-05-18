import { useState, useMemo, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Info,
  RefreshCw,
  Sparkles,
  Loader2,
  X,
  FileSearch,
  Image as ImageIcon
} from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { AuditItem } from "../types/dashboard";
import { cn } from "@/lib/utils";
import { AuditDetailSheet } from "./AuditDetailSheet";
import { explainAuditResult } from "../services/aiService";
import { ReceiptGenerator } from "./ReceiptGenerator";

interface AuditFeedProps {
  items: AuditItem[];
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  currentUserRole?: string;
  initialSearch?: string;
}

type SortKey = 'date' | 'amount' | 'aiScore';
type SortOrder = 'asc' | 'desc';

export function AuditFeed({ items, statusFilter = "all", onStatusFilterChange, currentUserRole, initialSearch = "" }: AuditFeedProps) {
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [autoExplain, setAutoExplain] = useState(false);

  const showSubmitter = currentUserRole === 'admin' || currentUserRole === 'finance_officer';

  // Filtering states
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  
  // Sorting states
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category)));
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter(item => {
        const titleMatch = item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const idMatch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = titleMatch || categoryMatch || idMatch;
        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        const matchesScore = item.aiScore >= scoreRange[0] && item.aiScore <= scoreRange[1];
        
        return matchesSearch && matchesStatus && matchesCategory && matchesScore;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortKey === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortKey === 'amount') comparison = a.amount - b.amount;
        if (sortKey === 'aiScore') comparison = a.aiScore - b.aiScore;
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [items, searchTerm, statusFilter, categoryFilter, scoreRange, sortKey, sortOrder]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (scoreRange[0] > 0 || scoreRange[1] < 100) count++;
    return count;
  }, [statusFilter, categoryFilter, scoreRange]);

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setScoreRange([0, 100]);
    if (onStatusFilterChange) onStatusFilterChange("all");
  };

  const handleRowClick = (item: AuditItem) => {
    setSelectedItem(item);
    setAutoExplain(false);
    setIsSheetOpen(true);
  };

  const handleExplainRow = (item: AuditItem) => {
    setSelectedItem(item);
    setAutoExplain(true);
    setIsSheetOpen(true);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    if (filteredAndSortedItems.length === 0) return;
    
    const headers = ["ID", "분류", "항목설명", "금액", "AI점수", "상태", "일자"];
    const csvRows = filteredAndSortedItems.map(item => [
      item.id,
      item.category,
      `"${item.description.replace(/"/g, '""')}"`,
      item.amount,
      item.aiScore,
      item.status,
      item.date
    ].join(","));
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `감사-보고서-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "정상":
        return <Badge className="bg-[#e8f5e9] text-[#2e7d32] border-none shadow-none text-[11px] font-semibold h-6 rounded-full px-3">정상</Badge>;
      case "검토필요":
        return <Badge className="bg-[#fff3e0] text-[#ef6c00] border-none shadow-none text-[11px] font-semibold h-6 rounded-full px-3">검토필요</Badge>;
      case "소명중":
        return <Badge className="bg-[#e3f2fd] text-[#1565c0] border-none shadow-none text-[11px] font-semibold h-6 rounded-full px-3">소명중</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px] font-semibold h-6 rounded-full px-3 border-[#d2d2d7]">{status}</Badge>;
    }
  };

  const currentSelectedItem = useMemo(() => {
    if (!selectedItem) return null;
    return items.find(i => i.id === selectedItem.id) || selectedItem;
  }, [items, selectedItem]);

  return (
    <div className="space-y-0 bg-[#ffffff] border border-[#d2d2d7] rounded-[24px] overflow-hidden shadow-sm relative">
      {/* Control Bar */}
      <div className="p-6 space-y-6 border-b border-[#e5e5e7]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-[20px] font-semibold text-[#1d1d1f] tracking-tight">집행 원장</h3>
            <p className="text-[14px] text-[#86868b]">실시간 부적정 패턴 탐지</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 min-w-full sm:min-w-[320px] lg:min-w-[450px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#86868b] group-focus-within:text-[#0066cc] transition-colors" />
              <Input 
                placeholder="문구, 분류, 또는 ID로 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-[15px] border-[#d2d2d7] bg-[#f5f5f7] focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10 focus:border-[#0066cc] placeholder:text-[#86868b] rounded-2xl transition-all text-[#1d1d1f] w-full"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#e5e5e7] text-[#86868b]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Dialog>
                <DialogTrigger 
                  render={
                    <Button 
                      variant="outline" 
                      className="h-12 px-5 rounded-2xl border border-[#d2d2d7] bg-white gap-2 transition-all hover:bg-[#f5f5f7] inline-flex items-center justify-center flex-1 sm:flex-none"
                    >
                      <FileSearch className="w-4 h-4 text-[#0066cc]" />
                      <span className="text-[14px] font-semibold">영수증 생성 도구</span>
                    </Button>
                  }
                />
                <DialogContent className="max-w-[1100px] p-0 overflow-hidden rounded-[32px] border-none bg-[#f5f5f7]">
                  <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <ReceiptGenerator />
                  </div>
                </DialogContent>
              </Dialog>

              <Popover>
                <PopoverTrigger 
                  className={cn(
                    "h-12 px-5 rounded-2xl border border-[#d2d2d7] bg-white gap-2 transition-all hover:bg-[#f5f5f7] inline-flex items-center justify-center flex-1 sm:flex-none",
                    activeFiltersCount > 0 && "border-[#0066cc] bg-[#f2f8ff] text-[#0066cc]"
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-[14px] font-semibold">필터 상세</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 bg-[#0066cc] text-white text-[10px] rounded-full ml-1 font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-5 rounded-3xl border-[#d2d2d7] shadow-2xl bg-white" align="end">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[16px] font-bold text-[#1d1d1f]">필터링 옵션</h4>
                      <Button 
                        variant="ghost" 
                        onClick={clearFilters}
                        className="h-8 px-2 text-[12px] font-bold text-[#0066cc] hover:bg-[#f2f8ff] rounded-md"
                      >
                        초기화
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">처리 상태</Label>
                        <Select value={statusFilter} onValueChange={onStatusFilterChange || (() => {})}>
                          <SelectTrigger className="h-11 rounded-xl border-[#d2d2d7] text-[14px]">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">전체 상태</SelectItem>
                            <SelectItem value="작성중">작성중</SelectItem>
                            <SelectItem value="정상">정상</SelectItem>
                            <SelectItem value="검토필요">검토필요</SelectItem>
                            <SelectItem value="소명중">소명중</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">집행 분류</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="h-11 rounded-xl border-[#d2d2d7] text-[14px]">
                            <SelectValue placeholder="분류 선택" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">전체 분류</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">AI 적합도 범위</Label>
                          <span className="text-[12px] font-bold text-[#0066cc] tabular-nums">
                            {scoreRange[0]}% - {scoreRange[1]}%
                          </span>
                        </div>
                        <Slider
                          value={scoreRange}
                          onValueChange={(val) => setScoreRange(val as [number, number])}
                          min={0}
                          max={100}
                          step={1}
                          className="py-4"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button 
                className="h-12 bg-[#0066cc] text-white hover:bg-[#0071e3] text-[14px] font-semibold rounded-2xl shadow-none px-6 active:scale-95 transition-all flex-1 sm:flex-none"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                보고서 추출
              </Button>
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[12px] font-bold text-[#86868b] mr-1">활성 필터:</span>
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="rounded-full bg-[#f2f8ff] text-[#0066cc] border-[#e1effe] px-3 py-1 flex items-center gap-1">
                상태: {statusFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => onStatusFilterChange?.("all")} />
              </Badge>
            )}
            {categoryFilter !== "all" && (
              <Badge variant="secondary" className="rounded-full bg-[#f2f8ff] text-[#0066cc] border-[#e1effe] px-3 py-1 flex items-center gap-1">
                분류: {categoryFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setCategoryFilter("all")} />
              </Badge>
            )}
            {(scoreRange[0] > 0 || scoreRange[1] < 100) && (
              <Badge variant="secondary" className="rounded-full bg-[#f2f8ff] text-[#0066cc] border-[#e1effe] px-3 py-1 flex items-center gap-1">
                AI 점수: {scoreRange[0]}~{scoreRange[1]}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setScoreRange([0, 100])} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[11px] h-7 px-2 font-bold text-[#86868b] hover:text-[#ff3b30]">필터 모두 지우기</Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-[#f5f5f7] border-b border-[#d2d2d7]">
            <TableRow className="hover:bg-transparent">
              <TableHead 
                className="w-[100px] md:w-[140px] text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4 pl-4 md:pl-10 cursor-pointer group shrink-0"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-2 group-hover:text-[#1d1d1f] transition-colors">
                  <span className="hidden md:inline">집행 일자</span>
                  <span className="md:hidden">일자</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", sortKey === 'date' && sortOrder === 'desc' ? "rotate-0 text-[#0066cc]" : "rotate-180")} />
                </div>
              </TableHead>
              <TableHead className="hidden lg:table-cell text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4">분류</TableHead>
              <TableHead className="hidden sm:table-cell text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4">증빙</TableHead>
              <TableHead className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4">항목 요약</TableHead>
              {showSubmitter && <TableHead className="hidden xl:table-cell text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4">제출자</TableHead>}
              <TableHead 
                className="text-right text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4 cursor-pointer group"
                onClick={() => toggleSort('amount')}
              >
                <div className="flex items-center justify-end gap-2 group-hover:text-[#1d1d1f] transition-colors">
                  <span className="hidden md:inline">집행 금액</span>
                  <span className="md:hidden">금액</span>
                  <ArrowUpDown className={cn("w-3.5 h-3.5", sortKey === 'amount' ? "text-[#0066cc]" : "text-[#d2d2d7]")} />
                </div>
              </TableHead>
              <TableHead 
                className="text-center text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4 cursor-pointer group"
                onClick={() => toggleSort('aiScore')}
              >
                <div className="flex items-center justify-center gap-2 group-hover:text-[#1d1d1f] transition-colors relative">
                  <div className="flex items-center gap-1.5">
                    <span className="hidden md:inline">AI 적합도</span>
                    <span className="md:hidden">AI</span>
                    <Popover>
                      <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                        <Info className="w-3 h-3 text-[#d2d2d7] hover:text-[#0066cc] cursor-help" />
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-4 bg-white/95 backdrop-blur-xl border border-[#d2d2d7] rounded-2xl shadow-xl z-50">
                        <p className="text-[12px] font-bold text-[#1d1d1f] mb-1.5">AI 적합도란?</p>
                        <p className="text-[11px] text-[#86868b] leading-relaxed">
                          Gemini 1.5 Flash 모델이 해당 집행 내역과 규정 간의 일치도를 분석한 점수입니다. 
                          <br/><br/>
                          <span className="text-[#34c759] font-bold">90%+</span> : 규정 준수 확실<br/>
                          <span className="text-[#0066cc] font-bold">70-89%</span> : 소명 증빙 필요<br/>
                          <span className="text-[#ff3b30] font-bold">70% 미만</span> : 이상 정황 탐지
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <ArrowUpDown className={cn("w-3.5 h-3.5", sortKey === 'aiScore' ? "text-[#0066cc]" : "text-[#d2d2d7]")} />
                </div>
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold text-[#86868b] uppercase tracking-wide py-4 pr-4 md:pr-10">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length > 0 ? (
              filteredAndSortedItems.map((item) => (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "cursor-pointer transition-all border-b border-[#f5f5f7] hover:bg-[#fafafa]",
                    item.aiScore < 70 ? "bg-[#fff5f5]/50 hover:bg-[#fff5f5]" : ""
                  )}
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell className="text-[13px] md:text-[14px] text-[#424245] font-medium pl-4 md:pl-10 py-4 md:py-5">
                    {item.date.slice(5)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-[12px] font-medium text-[#1d1d1f] bg-[#f5f5f7] px-2.5 py-1 rounded-md">{item.category}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-4 md:py-5">
                    {item.receiptUrl ? (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden bg-[#f5f5f7] border border-[#d2d2d7] shadow-sm">
                        <img src={item.receiptUrl} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-dashed border-[#d2d2d7] bg-[#f5f5f7] flex items-center justify-center text-[#d2d2d7]">
                        <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px] md:max-w-[340px] font-medium text-[#1d1d1f] text-[13px] md:text-[14px] py-4 md:py-5 truncate">
                    {item.description}
                  </TableCell>
                  {showSubmitter && (
                    <TableCell className="hidden xl:table-cell py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#f2f2f7] flex items-center justify-center text-[10px] font-bold border border-[#d2d2d7]">
                           {item.userId === 'demo-researcher-id' ? 'K' : item.userId?.slice(0,1).toUpperCase() || '?'}
                        </div>
                        <span className="text-[12px] font-medium text-[#1d1d1f]">
                          {item.userId === 'demo-researcher-id' ? '김연구원' : (item.userId === 'other-user-id' ? '이연구원' : '사용자')}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right font-semibold text-[#1d1d1f] py-4 text-[13px] md:text-[14px] tabular-nums">
                    {item.amount.toLocaleString()}<span className="text-[10px] md:text-[11px] text-[#86868b] ml-1">원</span>
                  </TableCell>
                  <TableCell className="text-center py-4 md:py-5">
                    <div className="flex items-center justify-center gap-1 md:gap-2 group">
                      <span className={cn(
                        "text-[12px] md:text-[13px] font-semibold px-2 py-0.5 md:py-1 transition-all rounded-md",
                        item.aiScore >= 90 ? "text-[#34c759]" : item.aiScore >= 70 ? "text-[#0066cc]" : "text-[#ff3b30]"
                      )}>
                        {item.aiScore}%
                      </span>
                      
                      <Popover>
                        <PopoverTrigger 
                          title="AI 상세 분석 설명"
                          className="w-7 h-7 md:w-8 md:h-8 rounded-full hover:bg-[#e3f2fd] text-[#0066cc] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity focus:opacity-100 flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-72 md:w-80 p-4 md:p-5 rounded-2xl border-[#d2d2d7] shadow-xl bg-white" 
                          side="bottom"
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[13px] font-bold text-[#1d1d1f]">
                              <Sparkles className="w-4 h-4 text-[#0066cc]" />
                              AI 점수 산출 근거
                            </div>
                            <div className="text-[12px] md:text-[13px] leading-relaxed text-[#424245] bg-[#f5f5f7] p-3 rounded-xl border border-[#e5e5e7]">
                              <InlineExplanation item={item} />
                            </div>
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-[11px] md:text-[12px] font-bold text-[#0066cc] hover:underline"
                              onClick={() => handleRowClick(item)}
                            >
                              상세 리포트 보기 →
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4 md:pr-10 py-4 md:py-5">
                    {getStatusBadge(item.status)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-80 text-center">
                  <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center text-[#d2d2d7]">
                      <Search className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[#1d1d1f] text-[16px] font-semibold">검색 결과가 없습니다</p>
                      <p className="text-[#86868b] text-[14px] mt-1 leading-relaxed">
                        필터 조건을 변경하거나 검색어를 지워보세요. <br/>
                        데모 시연을 위해 상단의 <span className="font-bold text-[#0066cc]">영수증 생성 도구</span>를 활용할 수도 있습니다.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="rounded-full h-10 px-6 border-[#d2d2d7] text-[#1d1d1f] font-semibold hover:bg-[#f5f5f7]"
                    >
                      필터 초기화
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AuditDetailSheet 
        item={currentSelectedItem} 
        isOpen={isSheetOpen} 
        autoExplain={autoExplain}
        onClose={() => {
          setIsSheetOpen(false);
          setAutoExplain(false);
          // Don't clear selectedItem immediately to avoid layout thrashing during transition
          setTimeout(() => setSelectedItem(null), 300);
        }} 
      />
    </div>
  );
}

function InlineExplanation({ item }: { item: AuditItem }) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchExplanation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await explainAuditResult(item);
        if (isMounted) setExplanation(result);
      } catch (err) {
        if (isMounted) setError("설명을 가져오지 못했습니다.");
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchExplanation();
    return () => { isMounted = false; };
  }, [item]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 text-[#86868b] gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>AI 분석 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[#ff3b30] py-2 text-[12px]">
        {error}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
      {explanation || "분석 결과를 생성하고 있습니다..."}
    </div>
  );
}

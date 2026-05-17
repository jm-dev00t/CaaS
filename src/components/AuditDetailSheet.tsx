import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { AuditItem, AuditLog } from "../types/dashboard";
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  Sparkles,
  Loader2,
  ChevronRight,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Send,
  Image as ImageIcon,
  Maximize2,
  Upload,
  History,
  RefreshCw,
  Clock,
  User,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateAuditJustification } from "../services/geminiService";
import { useAuth } from "../contexts/AuthContext";
import { updateAuditStatus, updateAuditReceipt, subscribeToAuditLogs } from "../services/dataService";
import { explainAuditResult } from "../services/aiService";
import { findMatchingRegulations, formatCitation } from "../services/regulationService";
import ReactMarkdown from "react-markdown";

interface AuditDetailSheetProps {
  item: AuditItem | null;
  isOpen: boolean;
  onClose: () => void;
  autoExplain?: boolean;
}

export function AuditDetailSheet({ item, isOpen, onClose, autoExplain }: AuditDetailSheetProps) {
  const { profile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [justification, setJustification] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFullReceipt, setShowFullReceipt] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayCitations = useMemo(() => {
    if (!item) return [];
    if (item.regulationCitations?.length) return item.regulationCitations;
    return findMatchingRegulations(item.category, item.description)
      .map(m => formatCitation(m.regulation));
  }, [item]);

  useEffect(() => {
    if (!isOpen) {
      setExplanation(null);
      setJustification(null);
      setShowFullReceipt(false);
      setLogs([]);
    } else if (item?.id && item?.projectId) {
      if (item.userReason) {
        setJustification(item.userReason);
      }
      const unsubscribe = subscribeToAuditLogs(item.projectId, item.id, setLogs);
      
      if (autoExplain && !explanation && !isExplaining) {
        handleExplain();
      }
      
      return () => unsubscribe();
    }
  }, [isOpen, item, autoExplain]);

  const handleExplain = async () => {
    if (!item || explanation) return;
    setIsExplaining(true);
    try {
      const result = await explainAuditResult(item);
      if (!result) throw new Error("분석 리포트를 생성할 수 없습니다.");
      setExplanation(result);
    } catch (err) {
      console.error("Explanation failed", err);
      alert("AI 상세 분석 리포트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsExplaining(false);
    }
  };

  if (!item) return null;

  const handleGenerateJustification = async () => {
    setIsGenerating(true);
    try {
      const result = await generateAuditJustification(item);
      setJustification(result);
    } catch (error) {
      console.error(error);
      setJustification("AI 소명서 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, reason?: string) => {
    if (!item.id || !item.projectId) return;
    setIsUpdating(true);
    try {
      const extraData = reason ? { userReason: reason } : {};
      await updateAuditStatus(item.projectId, item, newStatus, item.status, extraData);
      onClose();
    } catch (e) {
      console.error(e);
      alert("상태 변경 중 오류가 발생했습니다. 권한이 없거나 네트워크 상태를 확인해주세요.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !item.id || !item.projectId) return;

    setIsUpdating(true);
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
      
      await updateAuditReceipt(item.projectId, item, result);
    } catch (e) {
      console.error("Upload failed", e);
      alert("영수증 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadReceipt = (url: string, id: string) => {
    // Simple download logic using fetch/blob to handle cross-origin if needed
    // or just open in new tab if direct download is tricky.
    // Here we'll try to trigger a download.
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `receipt-${id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        // Fallback: open in new tab
        window.open(url, "_blank");
      });
  };

  const canApprove = profile?.role === 'admin' || profile?.role === 'finance_officer';
  const canAppeal = profile?.role === 'admin' || profile?.role === 'researcher';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto custom-scrollbar border-l border-border bg-background p-0 rounded-l-[40px] shadow-2xl">
        <div className="p-8 space-y-8">
          <SheetHeader className="space-y-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-muted text-muted-foreground text-[10px] font-extrabold rounded-full uppercase tracking-widest">
                기록 ID #{item.id?.slice(-4).toUpperCase()}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">AI 지수</span>
                <span className={cn(
                  "text-sm font-extrabold px-3 py-1 rounded-full",
                  item.aiScore >= 90 ? "bg-emerald-500/10 text-emerald-500" : item.aiScore >= 70 ? "bg-primary/20 text-primary" : "bg-orange-500/10 text-orange-500"
                )}>
                  {item.aiScore}%
                </span>
              </div>
            </div>
            <div>
              <SheetTitle className="text-xl font-extrabold text-foreground tracking-tight leading-tight mb-2">
                {item.description}
              </SheetTitle>
              <SheetDescription className="text-sm font-semibold text-muted-foreground flex items-center flex-wrap gap-2">
                <span className="text-[#0066cc] bg-[#e3f2fd] px-2.5 py-0.5 rounded-lg text-xs font-bold">{item.category}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{item.date}</span>
                <span className="w-1 h-1 bg-border rounded-full"></span>
                <span className="text-[#1d1d1f] font-bold text-lg">{item.amount.toLocaleString()}원</span>
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="space-y-10">
            {/* AI Analysis Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#e3f2fd] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#0066cc]" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#1d1d1f] tracking-tight">AI 부적정 분석</h3>
                </div>
                {!explanation && (
                    <Button 
                      onClick={handleExplain}
                      disabled={isExplaining}
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-3 text-[12px] font-bold text-[#0066cc] hover:bg-[#e3f2fd] rounded-full"
                    >
                      {isExplaining ? (
                        <div className="flex items-center">
                          <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> 
                          분석 중...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Sparkles className="w-3 h-3 mr-1.5" /> 
                          AI 분석 상세 설명
                        </div>
                      )}
                    </Button>
                )}
              </div>
              
              <div className={cn(
                "p-8 rounded-[32px] border transition-all duration-500 relative",
                item.aiScore >= 70 ? "bg-card border-border/50" : "bg-orange-500/5 border-orange-500/20 ring-1 ring-orange-500/10"
              )}>
                <p className="text-[15px] font-semibold text-foreground/80 leading-relaxed">
                  {item.aiComment || "분석 대기 중... AI 엔진이 가이드라인 적합성을 검토하고 있습니다."}
                </p>

                {displayCitations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide w-full">근거 규정</span>
                    {displayCitations.map((cite, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#e3f2fd] text-[#0066cc] rounded-full text-[11px] font-semibold">
                        {cite}
                      </span>
                    ))}
                  </div>
                )}

                {canAppeal && !justification && (
                  <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0066cc] animate-pulse" />
                      <p className="text-[13px] font-bold text-[#1d1d1f]">AI가 부적정 사유에 대한 소명 의견을 작성할 수 있습니다.</p>
                    </div>
                    <Button 
                      onClick={handleGenerateJustification}
                      disabled={isGenerating}
                      className="w-full sm:w-auto h-11 px-6 text-[13px] font-bold bg-[#0066cc] text-white hover:bg-[#0071e3] rounded-[18px] shadow-lg shadow-[#0066cc]/20 border-none transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
                      소명서 초안 생성
                    </Button>
                  </div>
                )}

                {explanation && (
                  <div className="mt-8 pt-8 border-t border-border/50 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-2 bg-muted rounded-2xl shadow-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground">지능형 맥락 분석</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">GEMINI 2.0 기반</p>
                      </div>
                    </div>
                    <div className="text-[14px] font-medium text-foreground/70 leading-relaxed markdown-body prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{explanation}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Receipt Preview Section */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-extrabold text-foreground tracking-tight">집행 영수증 증빙</h3>
                </div>
                {item.receiptUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-4 text-xs font-bold text-muted-foreground hover:bg-muted rounded-2xl"
                    onClick={() => handleDownloadReceipt(item.receiptUrl!, item.id!)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    저장하기
                  </Button>
                )}
              </div>
              
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept="image/*"
                onChange={handleFileUpload}
              />

              <div className={cn(
                "relative rounded-[32px] border border-border bg-card overflow-hidden transition-all duration-700 shadow-inner",
                showFullReceipt ? "aspect-auto max-h-[1000px]" : "aspect-[16/10] max-h-[360px]"
              )}>
                {item.receiptUrl ? (
                  <div className="w-full h-full relative group cursor-pointer" onClick={() => setShowFullReceipt(!showFullReceipt)}>
                    <img 
                      src={item.receiptUrl} 
                      alt="Receipt" 
                      className={cn(
                        "w-full h-full transition-all duration-700",
                        showFullReceipt ? "object-contain" : "object-cover object-center group-hover:scale-105"
                      )}
                      referrerPolicy="no-referrer"
                    />
                    {!showFullReceipt && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-3 bg-card/90 backdrop-blur-md rounded-2xl shadow-xl">
                          <Maximize2 className="w-5 h-5 text-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center py-20 px-10 gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center shadow-sm">
                      <Upload className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground mb-1">등록된 영수증이 없습니다</p>
                      <p className="text-xs font-medium text-muted-foreground mb-6">집행 증빙을 위해 영수증 사진을 업로드해주세요</p>
                      <Button 
                        className="h-11 px-6 text-xs font-bold rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 border-none"
                        onClick={triggerFileUpload}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        파일 선택하기
                      </Button>
                    </div>
                  </div>
                )}
                
                {item.receiptUrl && (
                  <div className="absolute bottom-6 right-6 flex gap-3">
                    <Button 
                      variant="secondary" 
                      className="h-10 px-4 bg-background/80 backdrop-blur-md border-none shadow-lg hover:bg-background rounded-xl text-xs font-bold text-foreground"
                      onClick={triggerFileUpload}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> 교체
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* Justification Section */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-extrabold text-foreground tracking-tight">집행 소명 기록</h3>
                </div>
                {canAppeal && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-4 text-xs font-bold text-primary hover:bg-primary/10 rounded-2xl"
                    onClick={handleGenerateJustification}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    AI 소명서 초안
                  </Button>
                )}
              </div>
              
              <div className="min-h-[160px] bg-muted/20 rounded-[32px] p-8 flex flex-col items-center justify-center relative border border-border/50">
                {isGenerating ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground tracking-tight animate-pulse">적정성 데이터 기반 소명 논리 구성 중...</p>
                  </div>
                ) : justification !== null ? (
                  <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <textarea 
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="이곳에 소명 내용을 입력하거나 AI 초안을 생성하세요..."
                      className="w-full min-h-[120px] bg-card p-6 rounded-[24px] text-[15px] font-semibold text-foreground/80 leading-relaxed shadow-sm border border-border/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all resize-none custom-scrollbar"
                    />
                    <div className="flex gap-3 justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => setJustification("")}
                        className="h-11 px-6 text-xs font-bold text-muted-foreground hover:bg-muted rounded-2xl"
                      >
                        지우기
                      </Button>
                      {canAppeal && (
                        <Button 
                          onClick={handleGenerateJustification}
                          disabled={isGenerating}
                          className="h-11 px-6 text-xs font-bold bg-[#f2f2f7] text-[#0066cc] border-none hover:bg-[#e3f2fd] rounded-2xl flex items-center gap-2"
                        >
                          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          AI로 다시 쓰기
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-muted-foreground">등록된 소명이 없습니다</p>
                      <p className="text-xs font-medium text-muted-foreground/50">정당한 집행임을 입증하기 위해 소명서를 작성해주세요</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setJustification("")}
                        className="h-11 px-6 text-xs font-bold rounded-2xl border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-all bg-transparent"
                      >
                        소명서 직접 작성
                      </Button>
                      {canAppeal && (
                        <Button 
                          onClick={handleGenerateJustification}
                          disabled={isGenerating}
                          className="h-11 px-6 text-xs font-bold rounded-2xl bg-[#f2f2f7] text-[#0066cc] border-none hover:bg-[#e3f2fd] transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          AI 소명서 자동 초안 생성
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Logs Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                  <History className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground tracking-tight">트랜잭션 히스토리</h3>
              </div>
              
              <div className="space-y-0 relative pl-4">
                <div className="absolute left-[23px] top-4 bottom-4 w-1 bg-muted rounded-full" />
                
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <div key={log.id} className="flex items-start gap-6 group relative py-6 first:pt-2">
                       <div className="relative z-10 mt-1">
                        <div className={cn(
                          "w-5 h-5 rounded-full ring-4 ring-background shadow-sm flex items-center justify-center",
                          i === 0 ? "bg-[#0066cc]" : "bg-muted"
                        )}>
                          <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-white" : "bg-muted-foreground")} />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className={cn("text-[13px] font-bold", i === 0 ? "text-foreground" : "text-muted-foreground")}>
                            {log.details}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground/40 font-mono">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString('ko-KR', { hour12: false }) : '...'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-muted-foreground/60">{log.userName}</span>
                          {i === 0 && <span className="text-[9px] font-extrabold text-[#0066cc] bg-[#e3f2fd] px-2 py-0.5 rounded-full">최신</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-10 font-bold">
                    <Clock className="w-10 h-10" />
                  </div>
                )}
              </div>
            </section>

            {/* Admin Review Section */}
            {canApprove && (
              <section className="space-y-5 p-6 bg-[#f5f5f7] rounded-[32px] border border-[#d2d2d7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-4 h-4 text-[#0066cc]" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#1d1d1f] tracking-tight">관리자 검토 및 승인</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleStatusUpdate("정상")}
                      disabled={isUpdating}
                      className="h-12 bg-[#34c759] text-white hover:bg-[#30b350] font-bold rounded-2xl shadow-lg shadow-[#34c759]/20 border-none flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      최종 승인
                    </Button>
                    <Button 
                      onClick={() => handleStatusUpdate("검토필요")}
                      disabled={isUpdating}
                      variant="outline"
                      className="h-12 border-[#ff3b30] text-[#ff3b30] hover:bg-[#fff2f2] font-bold rounded-2xl flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      보완 요청
                    </Button>
                  </div>
                  <p className="text-[11px] text-[#86868b] text-center font-medium">검토 완료 시 해당 항목이 확정 기록으로 전환됩니다.</p>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 p-8 border-t border-border bg-background/90 backdrop-blur-xl flex flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12 rounded-2xl hover:bg-muted"
                onClick={() => window.print()}
              >
                <Download className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
          
          <div className="flex gap-3">
            {canAppeal && item.status !== "정상" && (
              <Button 
                onClick={() => handleStatusUpdate("소명중", justification)}
                disabled={isUpdating}
                className="h-14 px-8 bg-[#1d1d1f] text-white hover:bg-[#000000] text-sm font-bold rounded-2xl shadow-xl transition-all active:scale-95 border-none"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                소명 제출하기
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

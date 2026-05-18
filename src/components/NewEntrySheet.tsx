import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, Loader2, Plus, AlertCircle, ImageIcon, Sparkles, Wand2, Camera } from "lucide-react";
import { addAuditItem } from "../services/dataService";
import { analyzeReceipt, analyzeAuditItem } from "../services/aiService";
import { cn } from "../lib/utils";

interface NewEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function NewEntrySheet({ isOpen, onClose, projectId }: NewEntrySheetProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categories = ["회의비", "연구장비비", "연구재료비", "소모품비", "국내여비", "국외여비", "전문가 활용비", "인건비", "기타"];

  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReceiptUrl(base64);
      
      // Start AI Analysis
      setIsAnalyzing(true);
      setAutoFilledFields(new Set());
      try {
        const analysis = await analyzeReceipt(base64);
        if (analysis.isLikelyReceipt) {
          setAiAnalysis(analysis);
          
          const newFilled = new Set<string>();
          if (analysis.amount) newFilled.add('amount');
          if (analysis.date) newFilled.add('date');
          if (analysis.vendor) newFilled.add('description');
          if (analysis.suggestedCategory) newFilled.add('category');
          setAutoFilledFields(newFilled);

          // Auto-fill form
          setFormData(prev => ({
            ...prev,
            amount: analysis.amount ? analysis.amount.toString() : prev.amount,
            date: analysis.date || prev.date,
            category: analysis.suggestedCategory || prev.category,
            description: analysis.items && analysis.items.length > 0 
              ? `${analysis.vendor} (${analysis.items.slice(0, 2).join(', ')}${analysis.items.length > 2 ? ' 외' : ''})`
              : `${analysis.vendor} 지출 내역`
          }));
        } else {
          alert("업로드하신 파일이 영수증이 아니거나 분석할 수 없습니다.");
        }
      } catch (err) {
        console.error("AI Analysis failed", err);
        alert("AI 영수증 분석 중 오류가 발생했습니다. 직접 입력해주세요.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReceiptUrl(base64);
      setIsAnalyzing(true);
      setAutoFilledFields(new Set());
      try {
        const analysis = await analyzeReceipt(base64);
        if (analysis.isLikelyReceipt) {
          setAiAnalysis(analysis);
          const newFilled = new Set<string>();
          if (analysis.amount) newFilled.add('amount');
          if (analysis.date) newFilled.add('date');
          if (analysis.vendor) newFilled.add('description');
          if (analysis.suggestedCategory) newFilled.add('category');
          setAutoFilledFields(newFilled);
          setFormData(prev => ({
            ...prev,
            amount: analysis.amount ? analysis.amount.toString() : prev.amount,
            date: analysis.date || prev.date,
            category: analysis.suggestedCategory || prev.category,
            description: analysis.items && analysis.items.length > 0
              ? `${analysis.vendor} (${analysis.items.slice(0, 2).join(', ')}${analysis.items.length > 2 ? ' 외' : ''})`
              : `${analysis.vendor} 지출 내역`,
          }));
        }
      } catch (err) {
        console.error('Camera capture analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.description || !formData.amount) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStep("AI 감사 엔진 분석 중...");
    try {
      // Final AI Audit Analysis
      const auditResult = await analyzeAuditItem(
        formData.category,
        formData.description,
        parseInt(formData.amount),
        aiAnalysis || undefined
      );
      
      setSubmitStep("데이터베이스 저장 중...");
      await addAuditItem(projectId, {
        category: formData.category,
        description: formData.description,
        amount: parseInt(formData.amount),
        date: formData.date,
        aiScore: auditResult.score,
        status: auditResult.status as any,
        aiComment: auditResult.comment,
        receiptUrl: receiptUrl || undefined,
      });

      onClose();
      // Reset form
      setFormData({
        category: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
      });
      setReceiptUrl(null);
      setAiAnalysis(null);
    } catch (error) {
      console.error("Failed to add entry:", error);
      alert("항목 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-border bg-background p-0 flex flex-col">
        <div className="p-6 border-b border-[#e5e5e7] bg-[#fafafa]">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-[#0066cc] rounded-lg shadow-lg shadow-[#0066cc]/20">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <SheetTitle className="text-[19px] font-semibold text-[#1d1d1f] tracking-tight">신규 항목 등록</SheetTitle>
            </div>
            <SheetDescription className="text-[12px] font-medium text-[#86868b] uppercase tracking-wide">
              연구비 집행 내역 및 증빙 영수증 업로드
            </SheetDescription>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <label htmlFor="category-select" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-primary" />
                집행 항목 분류
              </span>
              {autoFilledFields.has('category') && (
                <span className="flex items-center gap-1 text-[9px] text-primary animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI 자동 선택
                </span>
              )}
            </label>
            <Select 
              value={formData.category} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
              required
            >
              <SelectTrigger id="category-select" className="h-12 border-border bg-card text-sm font-bold rounded-xl focus:ring-primary/20 text-foreground">
                <SelectValue placeholder="항목을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover text-foreground">
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="text-sm font-medium py-3">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-2">
            <label htmlFor="receipt-upload" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="w-3 h-3 text-primary" />
              증빙 자료 (영수증)
            </label>
            
            <div 
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={cn(
                "relative h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group overflow-hidden",
                receiptUrl ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
                isAnalyzing && "cursor-wait opacity-80"
              )}
            >
              {isAnalyzing && (
                <div className="absolute inset-0 z-10 bg-background/80 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary/60 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">AI 영수증 분석 중...</p>
                </div>
              )}
              {receiptUrl ? (
                <>
                  <img src={receiptUrl} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Wand2 className="w-3 h-3" />
                       사진 교체하기
                    </span>
                  </div>
                  {aiAnalysis && !isAnalyzing && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-primary text-white text-[9px] font-black uppercase rounded shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <Sparkles className="w-3 h-3" />
                      AI 분석 완료
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-foreground uppercase">사진 업로드</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">PNG, JPG (최대 5MB)</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-1 opacity-5">
                 <Sparkles className="w-12 h-12 text-primary" />
               </div>
               <div className="p-1.5 bg-primary/10 rounded-lg h-fit">
                 <Sparkles className="w-3 h-3 text-primary" />
               </div>
               <div className="space-y-1 relative z-10">
                 <p className="text-[10px] font-black text-primary/80 uppercase tracking-widest">AI 자동 입력 가이드</p>
                 <p className="text-[11px] font-bold text-muted-foreground/80 leading-relaxed">
                   영수증을 업로드하면 AI가 금액, 날짜, 내용을 자동으로 분석하여 입력합니다. 
                   <br/>
                   <button 
                     type="button"
                     onClick={() => {
                       onClose();
                       navigate('/receipt-gen');
                     }}
                     className="text-[#0066cc] underline hover:text-[#004499] transition-colors"
                   >
                     테스트용 가상 영수증이 필요하신가요?
                   </button>
                 </p>
               </div>
            </div>

            <input
              id="receipt-upload"
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
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
          </div>

          <div className="space-y-2">
            <label htmlFor="description-input" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-between">
              항목 상세 설명
              {autoFilledFields.has('description') && (
                <span className="flex items-center gap-1 text-[9px] text-primary animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI 자동 완성
                </span>
              )}
            </label>
            <Textarea 
              id="description-input"
              placeholder="집행 목적, 수량 등 상세 내용을 입력하세요"
              className="min-h-[100px] border-border bg-card text-sm font-bold rounded-xl focus:ring-primary/20 placeholder:text-muted-foreground/30 text-foreground"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount-input" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                집행 금액 (원)
                {autoFilledFields.has('amount') && (
                  <Sparkles className="w-2.5 h-2.5 text-primary animate-pulse" />
                )}
              </label>
              <Input 
                id="amount-input"
                type="number"
                placeholder="0"
                className="h-12 border-border bg-card text-sm font-black font-mono rounded-xl focus:ring-primary/20 text-foreground tabular-nums"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="date-input" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                집행 날짜
                {autoFilledFields.has('date') && (
                  <Sparkles className="w-2.5 h-2.5 text-primary animate-pulse" />
                )}
              </label>
              <Input 
                id="date-input"
                type="date"
                className="h-12 border-border bg-card text-sm font-bold rounded-xl focus:ring-primary/20 text-foreground"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>

        </form>

        <SheetFooter className="p-8 border-t border-border bg-card/50">
          <Button 
            className="w-full h-14 bg-primary text-white hover:bg-primary/90 text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 border-none"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="animate-pulse">{submitStep || "처리 중..."}</span>
              </div>
            ) : (
              "항목 등록 및 AI 분석 시작"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

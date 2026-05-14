import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  FileUp,
  Scale,
  History as HistoryIcon,
  ShieldAlert,
  Edit2,
  X,
  FileSearch,
  ExternalLink,
  Info,
  Sparkles,
  UserCircle
} from "lucide-react";
import { 
  subscribeToRules, 
  addRule, 
  updateRule, 
  deleteRule, 
  subscribeToRuleHistory 
} from "../services/dataService";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { Badge } from "./ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "./ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const RULE_TYPES = [
  { id: "law", label: "국가법령", color: "text-blue-600 bg-blue-50" },
  { id: "regulation", label: "정부고시/지침", color: "text-purple-600 bg-purple-50" },
  { id: "internal", label: "기관내부규정", color: "text-emerald-600 bg-emerald-50" },
  { id: "guideline", label: "집행가이드라인", color: "text-orange-600 bg-orange-50" }
];

export function RuleManagementView() {
  const [rules, setRules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [historyRule, setHistoryRule] = useState<any | null>(null);
  const [newRule, setNewRule] = useState({ title: "", content: "", type: "law", sourceUrl: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToRules(setRules);
    return () => unsubscribe();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.title || !newRule.content) return;
    
    setIsSubmitting(true);
    try {
      await addRule(newRule.title, newRule.content, newRule.type, newRule.sourceUrl);
      setNewRule({ title: "", content: "", type: "law", sourceUrl: "" });
      setIsAdding(false);
    } catch (e) {
      console.error("규정 추가 실패:", e);
      alert("규정 추가에 실패했습니다. 권한을 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.title || !editingRule.content) return;
    
    setIsSubmitting(true);
    try {
      await updateRule(editingRule.id, {
        title: editingRule.title,
        content: editingRule.content,
        type: editingRule.type,
        active: editingRule.active,
        sourceUrl: editingRule.sourceUrl
      });
      setEditingRule(null);
    } catch (e) {
      console.error("규정 수정 실패:", e);
      alert("규정 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);

  const seedStandardRules = async () => {
    if (!confirm("현행 연구비 집행 표준 가이드라인을 일괄 등록하시겠습니까?")) return;
    setIsSeeding(true);
    const standardRules = [
      {
        title: "국가연구개발혁신법 - 연구개발비 사용의 원칙",
        type: "law",
        content: "제13조(연구개발비의 사용) \n1. 연구개발비는 연구개발과제를 수행하는 용도로만 사용해야 하며, 다른 용도로 사용해서는 아니 된다.\n2. 연구기관은 연구개발비를 관리할 때 별도의 계정을 설정하여 관리해야 한다.\n3. 연구개발비는 원칙적으로 연구개발카드를 사용하거나 계좌이체의 방법으로 집행해야 한다.",
        sourceUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=220689"
      },
      {
        title: "연구활동비 - 회의비 집행 가이드라인",
        type: "regulation",
        content: "1. 집행 요건: 연구수행과 직접 관련이 있는 외부 기관 참여 회의 (내부 인원만 참여 시 불인정)\n2. 정산 한도: 1인당 3만 원 이내 (부가가치세 포함)\n3. 필수 증빙: 일시, 장소, 목적, 참석자 명단(소속/성명/서명)이 포함된 회의록 및 영수증\n4. 제한 사항: 주말/공휴일 집행 불가 (사전 승인 시 예외), 주류 포함 영수증 일체 불인정.",
        sourceUrl: "https://www.kist.re.kr/kist_kor/main/" // Placeholder
      },
      {
        title: "연구활동비 - 야근식대(초과근무식대) 집행 기준",
        type: "regulation",
        content: "1. 집행 요건: 평일 18시 이후 2시간 이상 근무 또는 토/공휴일 근무자\n2. 지급 한도: 1인당 1만 원 이내\n3. 증빙 서류: 초과근무 내역 또는 참여 연구원 근무 기록(타임시트)과 연동된 집행 내역\n4. 참고: 점심 식대는 연구비로 집행이 불가능하며 본인 부담이 원칙임.",
        sourceUrl: "https://www.nrf.re.kr/index" // Placeholder
      },
      {
        title: "연구재료비 - 전산 소모품 및 재료 구입",
        type: "guideline",
        content: "1. 인정 범위: 시약, 재료, 시험제품, 시험만족용 부품 및 전산소모품(토너, 용지 등)\n2. 구매 시점: 연구 종료 2개월 전까지 검수 및 입고를 완료해야 함\n3. 자산 관리: 3,000만 원 이상의 연구장비는 국가연구시설장비 공동활용 서비스(ZEUS)에 등록 필수.",
        sourceUrl: "https://www.zeus.go.kr/"
      },
      {
        title: "연구수당 - 기여도 평가 및 지급 방법",
        type: "internal",
        content: "1. 지급 한도: 연구직접비(인건비+학생인건비) 총액의 20% 이내\n2. 평가 기준: 참여연구원별 연구 기여도 평가 항목(기술적 성과, 행정 지원 등)에 의거하여 지급\n3. 주의 사항: 연구과제 수행 중 중도 탈퇴자 또는 불성실 수행자에 대한 감액 기준 적용.",
        sourceUrl: "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=220689"
      }
    ];

    try {
      for (const rule of standardRules) {
        await addRule(rule.title, rule.content, rule.type, rule.sourceUrl);
      }
      alert("대한민국 국가연구개발사업 표준 규정들이 성공적으로 등록되었습니다.");
    } catch (e) {
      console.error("규정 초기화 실패:", e);
      alert("규정 일괄 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredRules = rules.filter(rule => 
    rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-hidden h-full flex flex-col bg-[#f5f5f7]">
      <div className="p-12 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0066cc]/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-[#0066cc]" />
              </div>
              <span className="text-[12px] font-bold text-[#0066cc] uppercase tracking-widest">Admin Control</span>
            </div>
            <h1 className="text-[34px] font-bold text-[#1d1d1f] tracking-tight">지출 규정 및 법안 관리</h1>
            <div className="bg-[#0066cc]/5 border border-[#0066cc]/10 p-4 rounded-2xl max-w-3xl mt-4">
              <p className="text-[13px] text-[#0066cc] font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI 감사 엔진 연동 원리
              </p>
              <p className="text-[12px] text-[#424245] mt-1.5 leading-relaxed font-medium">
                등록된 모든 규정 원문은 <span className="text-[#0066cc] font-bold">Vector Embedding</span> 처리되어 AI 엔진의 지식 베이스로 활용됩니다. 
                집행 항목이 추가될 때마다 AI는 위 규정들 중 가장 관련도가 높은 항목을 실시간으로 검색(RAG)하여 위반 여부를 교차 검증합니다.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              disabled={isSeeding}
              onClick={seedStandardRules}
              className="bg-white border-[#d2d2d7] hover:bg-[#f5f5f7] rounded-full px-6 py-6 h-auto font-bold flex items-center gap-2"
            >
              <FileUp className={cn("w-5 h-5 text-[#0066cc]", isSeeding && "animate-spin")} />
              {isSeeding ? "데이터 등록 중..." : "표준 법령 일괄 등록"}
            </Button>
            <Button 
              onClick={() => {
                setEditingRule(null);
                setIsAdding(true);
              }}
              className="bg-[#0066cc] hover:bg-[#0071e3] text-white rounded-full px-6 py-6 h-auto font-bold flex items-center gap-2 shadow-lg shadow-[#0066cc]/20"
            >
              <Plus className="w-5 h-5" />
              새 규정 추가
            </Button>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
          <Input 
            placeholder="규정 제목 또는 내용 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-14 text-[16px] bg-white border-[#d2d2d7] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#0066cc]/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {(isAdding || editingRule) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-[#0066cc]/30 rounded-[32px] p-8 shadow-xl"
              >
                <form onSubmit={editingRule ? handleUpdateRule : handleAddRule} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#1d1d1f]">
                      {editingRule ? "규정 수정" : "신규 규정 등록"}
                    </h2>
                    <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setEditingRule(null); }} className="rounded-full">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">규정 분류</label>
                      <Select 
                        value={editingRule ? editingRule.type : newRule.type} 
                        onValueChange={(val) => editingRule ? setEditingRule({...editingRule, type: val}) : setNewRule({...newRule, type: val})}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-[#d2d2d7]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {RULE_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">상태</label>
                      <Select 
                        value={editingRule ? (editingRule.active ? "active" : "inactive") : "active"} 
                        onValueChange={(val) => {
                          const isActive = val === "active";
                          if (editingRule) setEditingRule({...editingRule, active: isActive});
                        }}
                        disabled={!editingRule}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-[#d2d2d7]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="active">활성 (AI 적용)</SelectItem>
                          <SelectItem value="inactive">비활성 (제외)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">제목</label>
                      <Input 
                        value={editingRule ? editingRule.title : newRule.title}
                        onChange={(e) => editingRule ? setEditingRule({...editingRule, title: e.target.value}) : setNewRule({...newRule, title: e.target.value})}
                        placeholder="예: 국가연구개발사업 연구개발비 사용 기준"
                        className="h-12 rounded-xl border-[#d2d2d7]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">원문 링크 (URL)</label>
                      <Input 
                        value={editingRule ? (editingRule.sourceUrl || "") : (newRule.sourceUrl || "")}
                        onChange={(e) => editingRule ? setEditingRule({...editingRule, sourceUrl: e.target.value}) : setNewRule({...newRule, sourceUrl: e.target.value})}
                        placeholder="예: https://www.law.go.kr/..."
                        className="h-12 rounded-xl border-[#d2d2d7]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider ml-1">상세 내용 (원문 또는 핵심 규칙)</label>
                    <Textarea 
                      value={editingRule ? editingRule.content : newRule.content}
                      onChange={(e) => editingRule ? setEditingRule({...editingRule, content: e.target.value}) : setNewRule({...newRule, content: e.target.value})}
                      placeholder="규정 전문 또는 AI가 필터링에 사용할 핵심 규칙들을 입력하세요."
                      className="min-h-[200px] rounded-xl border-[#d2d2d7] resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#f5f5f7]">
                    <div className="flex items-center gap-2 mr-auto text-[13px] text-[#86868b]">
                      <AlertCircle className="w-4 h-4" />
                      등록/수정된 내용은 즉시 AI 감사 엔진의 판단 기준으로 학습됩니다.
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-[#0066cc] text-white px-8 rounded-full h-12 font-bold shadow-lg shadow-[#0066cc]/20"
                    >
                      {isSubmitting ? "처리 중..." : (editingRule ? "변경사항 저장" : "규정 저장 및 AI 적용")}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {filteredRules.map((rule) => {
              const typeInfo = RULE_TYPES.find(t => t.id === rule.type) || RULE_TYPES[0];
              return (
                <motion.div
                  key={rule.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-[#d2d2d7] rounded-[24px] p-6 shadow-sm group hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Badge className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border-none", typeInfo.color)}>
                          {typeInfo.label}
                        </Badge>
                        <Badge className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border-none", rule.active !== false ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>
                          {rule.active !== false ? "활성" : "비활성"}
                        </Badge>
                        <span className="text-[11px] font-medium text-[#86868b]">
                          마지막 수정: {rule.updatedAt?.toDate?.()?.toLocaleString() || "최근"} ({rule.lastModifiedBy || 'System'})
                        </span>
                      </div>
                      <h3 className="text-[17px] font-bold text-[#1d1d1f] tracking-tight">{rule.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setHistoryRule(rule)}
                        className="text-[#86868b] hover:text-[#0066cc] hover:bg-[#eaf4ff] rounded-full"
                        title="수정 내역"
                      >
                        <HistoryIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setIsAdding(false);
                          setEditingRule(rule);
                        }}
                        className="text-[#86868b] hover:text-[#0066cc] hover:bg-[#eaf4ff] rounded-full"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={async () => { 
                          if(confirm('정말 삭제하시겠습니까?')) {
                            console.log("Deleting rule:", rule.id);
                            try {
                              await deleteRule(rule.id);
                            } catch (error) {
                              console.error("Delete failed:", error);
                              alert(`삭제 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}\n관리자 권한을 확인해주세요.`);
                            }
                          }
                        }}
                        className="text-[#86868b] hover:text-[#ff3b30] hover:bg-[#fff2f2] rounded-full"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-[#f5f5f7] p-4 rounded-xl">
                    <p className="text-[14px] text-[#424245] leading-relaxed line-clamp-4 whitespace-pre-wrap font-medium">
                      {rule.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-[#0066cc]">
                      <CheckCircle2 className="w-4 h-4" />
                      AI 실시간 감사 엔진에 적용됨
                    </div>
                    <button 
                      onClick={() => {
                        console.log("Opening sourceUrl:", rule.sourceUrl);
                        if (rule.sourceUrl && rule.sourceUrl.startsWith('http')) {
                          window.open(rule.sourceUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          alert(rule.sourceUrl ? "유효하지 않은 URL 형식입니다." : "등록된 원문 링크가 없습니다.");
                        }
                      }}
                      className="text-[12px] font-bold text-[#86868b] hover:text-[#1d1d1f] flex items-center gap-1"
                    >
                      원문 파일 보기 <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* History Modal */}
      <RuleHistoryModal 
        rule={historyRule} 
        onClose={() => setHistoryRule(null)} 
      />
    </div>
  );
}

function RuleHistoryModal({ rule, onClose }: { rule: any | null, onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!rule) return;
    const unsubscribe = subscribeToRuleHistory(rule.id, setHistory);
    return () => unsubscribe();
  }, [rule]);

  if (!rule) return null;

  return (
    <Dialog open={!!rule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-[#f5f5f7]">
        <DialogHeader className="p-8 pb-6 bg-white border-b border-[#e5e5e7]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1d1d1f] flex items-center justify-center shadow-lg shadow-black/10">
                <HistoryIcon className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-bold text-[#1d1d1f]">규정 수정 이력</DialogTitle>
                <DialogDescription className="text-[#86868b] font-medium text-[13px]">
                  {rule.title}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-[#f5f5f7] border-[#d2d2d7] text-[#1d1d1f] px-3 py-1 rounded-full text-[11px] font-bold">
              Total {history.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar relative">
          {history.length > 0 ? (
            <div className="space-y-0 relative">
              {/* Vertical line that spans all items */}
              <div className="absolute left-[11px] top-2 bottom-8 w-[2px] bg-[#e5e5e7]" />
              
              <AnimatePresence initial={false}>
                {history.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-10 pb-10 last:pb-4 group"
                  >
                    {/* Timeline Dot */}
                    <div className={cn(
                      "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-110",
                      item.changeType === 'create' ? "bg-emerald-500" : "bg-[#0066cc]"
                    )} />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[12px] font-bold uppercase tracking-wider",
                            item.changeType === 'create' ? "text-emerald-600" : "text-[#0066cc]"
                          )}>
                            {item.changeType === 'create' ? '신규 등록' : '내용 업데이트'}
                          </span>
                          <span className="text-[#d2d2d7]">•</span>
                          <span className="text-[12px] font-bold text-[#1d1d1f] flex items-center gap-1.5">
                            <HistoryIcon className="w-3.5 h-3.5 text-[#86868b]" />
                            {item.modifiedBy}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#86868b] bg-white px-2 py-0.5 rounded-md border border-[#e5e5e7]">
                          {item.timestamp?.toDate?.()?.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-5 border border-[#e5e5e7] shadow-sm group-hover:shadow-md transition-all group-hover:border-[#0066cc]/20">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.title && <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[10px] px-2 py-0">제목변경</Badge>}
                          {item.content && <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-none text-[10px] px-2 py-0">내용수정</Badge>}
                          {item.type && <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none text-[10px] px-2 py-0">분류변경</Badge>}
                          {item.active !== undefined && (
                            <Badge className={cn("text-[10px] border-none px-2 py-0", item.active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                              {item.active ? "활성화" : "비활성화"}
                            </Badge>
                          )}
                        </div>
                        
                        {item.content && (
                          <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#f5f5f7] rounded-full" />
                            <p className="text-[13px] text-[#424245] leading-relaxed pl-4 whitespace-pre-wrap font-medium">
                              {item.changeType === 'create' 
                                ? item.content 
                                : `"${item.content.length > 200 ? item.content.substring(0, 200) + '...' : item.content}"`
                              }
                            </p>
                          </div>
                        )}
                        
                        {item.sourceUrl && (
                          <div className="mt-3 pt-3 border-t border-[#f5f5f7] flex items-center gap-2 text-[11px] text-[#86868b] font-medium">
                            <ExternalLink className="w-3 h-3" />
                            <span>연결 링크: {item.sourceUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#86868b] space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner">
                <FileSearch className="w-10 h-10 text-[#d2d2d7]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#1d1d1f] text-lg">기록된 이력이 없습니다</p>
                <p className="text-sm mt-1">이 규정에 가해진 모든 변경 사항이 여기에 표시됩니다.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-white border-t border-[#e5e5e7] flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2 text-[12px] text-[#86868b] font-medium">
            <ShieldAlert className="w-4 h-4" />
            최종 감사 담당자: 연구관리팀
          </div>
          <Button onClick={onClose} className="bg-[#1d1d1f] hover:bg-black text-white px-10 rounded-full h-12 font-bold transition-all active:scale-95 shadow-lg shadow-black/10">
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

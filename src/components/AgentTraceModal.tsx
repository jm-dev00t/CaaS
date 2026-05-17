// AI 감사 5단계 실행 과정을 스트리밍으로 시각화하는 에이전트 트레이스 모달

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuditItem } from "../types/dashboard";
import { runAgentTrace, TraceStep } from "../services/aiService";
import { CheckCircle2, AlertTriangle, Loader2, Clock, X, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface AgentTraceModalProps {
  item: AuditItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  pending: <div className="w-7 h-7 rounded-full bg-[#f5f5f7] border border-[#d2d2d7]" />,
  running: <Loader2 className="w-7 h-7 text-[#0066cc] animate-spin" />,
  done: <CheckCircle2 className="w-7 h-7 text-[#34c759]" />,
  flagged: <AlertTriangle className="w-7 h-7 text-[#ff3b30]" />,
};

export function AgentTraceModal({ item, isOpen, onClose }: AgentTraceModalProps) {
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTrace = useCallback(async () => {
    if (!item) return;
    setIsRunning(true);
    setError(null);
    setSteps([]);
    try {
      const gen = runAgentTrace({
        category: item.category,
        description: item.description,
        amount: item.amount,
        receiptUrl: item.receiptUrl,
      });
      for await (const updatedSteps of gen) {
        setSteps([...updatedSteps]);
      }
    } catch (e: any) {
      setError(e.message ?? 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
    }
  }, [item]);

  useEffect(() => {
    if (isOpen && item) {
      runTrace();
    } else {
      setSteps([]);
      setError(null);
      setIsRunning(false);
    }
  }, [isOpen, item]);

  const finalStatus = steps.length === 5
    ? steps.some(s => s.status === 'flagged') ? 'flagged' : 'done'
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="p-6 pb-4 border-b border-[#e5e5e7] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0066cc] rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[#1d1d1f] tracking-tight">AI 감사 실행</h2>
                  {item && (
                    <p className="text-[13px] text-[#86868b] mt-0.5 max-w-[320px] truncate">
                      {item.description} — {item.amount.toLocaleString()}원
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center text-[#86868b] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 스텝 목록 */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3">
              {error && (
                <div className="bg-[#fff5f5] border border-[#ff3b30]/20 rounded-2xl p-4 text-[13px] text-[#ff3b30]">
                  {error}
                </div>
              )}

              {steps.length === 0 && !error && (
                <div className="flex items-center justify-center py-16 gap-3 text-[#86868b]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[15px]">분석 시작 중...</span>
                </div>
              )}

              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    step.status === 'running' && "border-[#0066cc]/30 bg-[#f0f8ff]",
                    step.status === 'done' && "border-[#34c759]/30 bg-[#f0fdf4]",
                    step.status === 'flagged' && "border-[#ff3b30]/30 bg-[#fff5f5]",
                    step.status === 'pending' && "border-[#d2d2d7] bg-[#f5f5f7]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{STEP_ICONS[step.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-[14px] font-semibold",
                          step.status === 'pending' ? "text-[#86868b]" : "text-[#1d1d1f]"
                        )}>
                          {i + 1}. {step.label}
                        </span>
                        {step.duration !== undefined && (
                          <span className="flex items-center gap-1 text-[11px] text-[#86868b] shrink-0">
                            <Clock className="w-3 h-3" />
                            {(step.duration / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      {step.detail && (
                        <p className={cn(
                          "text-[12px] mt-1.5 leading-relaxed",
                          step.status === 'flagged' ? "text-[#ff3b30]" : "text-[#424245]"
                        )}>
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 푸터 — 완료 후 표시 */}
            {finalStatus && !isRunning && (
              <div className={cn(
                "p-6 pt-4 border-t border-[#e5e5e7] flex items-center justify-between",
                finalStatus === 'flagged' ? "bg-[#fff5f5]" : "bg-[#f0fdf4]"
              )}>
                <div className="flex items-center gap-2">
                  {finalStatus === 'flagged'
                    ? <><AlertTriangle className="w-5 h-5 text-[#ff3b30]" /><span className="font-semibold text-[#ff3b30]">위반 항목 감지 — 검토 필요</span></>
                    : <><CheckCircle2 className="w-5 h-5 text-[#34c759]" /><span className="font-semibold text-[#34c759]">규정 준수 확인 완료</span></>
                  }
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={runTrace} className="rounded-full text-[13px]">
                    재실행
                  </Button>
                  <Button size="sm" onClick={onClose} className="rounded-full bg-[#0066cc] text-white text-[13px]">
                    닫기
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

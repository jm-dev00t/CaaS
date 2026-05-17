// 시계열·관계 기반 이상징후 패턴 탐지 뷰 컴포넌트
import { useMemo } from "react";
import { motion } from "motion/react";
import { AuditItem } from "../types/dashboard";
import { detectAllPatterns, AnomalyAlert } from "../utils/patternDetection";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell,
} from "recharts";
import { format } from "date-fns";

interface PatternDetectionViewProps {
  items: AuditItem[];
}

export function PatternDetectionView({ items }: PatternDetectionViewProps) {
  const alerts = useMemo(() => detectAllPatterns(items), [items]);

  const alertedIds = useMemo(() =>
    new Set(alerts.flatMap(a => a.relatedItems.map(i => i.id))),
    [alerts]
  );

  const timelineData = useMemo(() =>
    items.map(item => ({
      date: new Date(item.date).getTime(),
      amount: item.amount,
      isAnomaly: alertedIds.has(item.id),
      label: item.description,
      dateStr: item.date,
    })),
    [items, alertedIds]
  );

  const kpi = {
    split: alerts.filter(a => a.type === 'split_payment').length,
    weekend: alerts.filter(a => a.type === 'weekend_expense').length,
    consulting: alerts.filter(a => a.type === 'duplicate_consulting').length,
    outlier: alerts.filter(a => a.type === 'amount_outlier').length,
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#f5f5f7]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">패턴 탐지</h2>
        <p className="text-[#86868b] text-[15px]">시계열·관계 기반 이상징후 자동 탐지</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '분할결제', count: kpi.split, color: '#ff3b30' },
          { label: '주말 집행', count: kpi.weekend, color: '#ff9f0a' },
          { label: '중복 자문료', count: kpi.consulting, color: '#ff3b30' },
          { label: '금액 이상값', count: kpi.outlier, color: '#0066cc' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-[20px] border border-[#d2d2d7] shadow-sm p-6"
            style={{ borderLeft: `4px solid ${item.color}` }}
          >
            <p className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wide mb-2">{item.label}</p>
            <p className="text-[32px] font-semibold" style={{ color: item.color }}>{item.count}</p>
            <div className="w-full bg-[#f5f5f7] rounded-full h-1 mt-3">
              <div
                className="h-1 rounded-full"
                style={{ width: `${Math.min(item.count * 20, 100)}%`, background: item.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 타임라인 차트 */}
      <div className="bg-white rounded-[24px] border border-[#d2d2d7] shadow-sm p-6">
        <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-6">집행 타임라인</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f7" />
            <XAxis
              dataKey="date"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={v => format(new Date(v), 'MM/dd')}
              tick={{ fontSize: 11, fill: '#86868b' }}
            />
            <YAxis
              dataKey="amount"
              tickFormatter={v => `${(v / 10000).toFixed(0)}만`}
              tick={{ fontSize: 11, fill: '#86868b' }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-[#d2d2d7] rounded-xl p-3 shadow-lg text-[12px]">
                    <p className="font-semibold text-[#1d1d1f]">{d.label}</p>
                    <p className="text-[#86868b]">{d.dateStr} | {d.amount.toLocaleString()}원</p>
                    {d.isAnomaly && <p className="text-[#ff3b30] font-semibold mt-1">⚠️ 이상 탐지</p>}
                  </div>
                );
              }}
            />
            <Scatter data={timelineData} fill="#34c759">
              {timelineData.map((entry, i) => (
                <Cell key={i} fill={entry.isAnomaly ? '#ff3b30' : '#34c759'} opacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#34c759]" /><span className="text-[12px] text-[#86868b]">정상</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ff3b30]" /><span className="text-[12px] text-[#86868b]">이상 탐지</span></div>
        </div>
      </div>

      {/* 알림 카드 */}
      <div className="space-y-4">
        <h3 className="text-[17px] font-semibold text-[#1d1d1f]">탐지된 이상징후</h3>
        {alerts.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#d2d2d7] p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#34c759] mx-auto mb-4" />
            <p className="text-[#1d1d1f] font-semibold">이상 패턴이 탐지되지 않았습니다</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "bg-white rounded-[20px] border shadow-sm p-6",
                alert.severity === 'high' ? "border-[#ff3b30]/30" : "border-[#ff9f0a]/30"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {alert.severity === 'high'
                    ? <AlertTriangle className="w-5 h-5 text-[#ff3b30]" />
                    : <AlertCircle className="w-5 h-5 text-[#ff9f0a]" />
                  }
                  <div>
                    <p className="font-semibold text-[#1d1d1f] text-[15px]">{alert.title}</p>
                    <p className="text-[13px] text-[#86868b] mt-0.5">{alert.description}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-bold",
                  alert.severity === 'high' ? "bg-[#fff5f5] text-[#ff3b30]" : "bg-[#fff8e1] text-[#ff9f0a]"
                )}>
                  {alert.severity === 'high' ? '고위험' : '주의'}
                </span>
              </div>
              <div className="space-y-2">
                {alert.relatedItems.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#f5f5f7] rounded-xl px-4 py-2.5">
                    <span className="text-[13px] text-[#1d1d1f] font-medium truncate max-w-[60%]">{item.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-[#86868b]">{item.date}</span>
                      <span className="text-[13px] font-semibold text-[#1d1d1f]">{item.amount.toLocaleString()}원</span>
                    </div>
                  </div>
                ))}
                {alert.relatedItems.length > 3 && (
                  <p className="text-[12px] text-[#86868b] text-center">외 {alert.relatedItems.length - 3}건</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

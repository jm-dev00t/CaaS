// 시계열·관계 기반 이상징후 패턴 탐지 뷰 컴포넌트
import { AuditItem } from '../types/dashboard';

interface PatternDetectionViewProps {
  items: AuditItem[];
}

export function PatternDetectionView({ items }: PatternDetectionViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#f5f5f7]">
      <h2 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">패턴 탐지</h2>
      <p className="text-[#86868b] text-[15px] mt-1">
        시계열·관계 기반 이상징후 자동 탐지 ({items.length}건 분석 대상)
      </p>
    </div>
  );
}

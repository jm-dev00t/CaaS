import { AuditItem } from '../types/dashboard';

export interface AnomalyAlert {
  type: 'split_payment' | 'weekend_expense' | 'duplicate_consulting' | 'amount_outlier';
  title: string;
  description: string;
  relatedItems: AuditItem[];
  severity: 'high' | 'medium';
}

export function detectSplitPayments(items: AuditItem[]): AnomalyAlert[] {
  const candidates = items.filter(i =>
    ['회의비', '소모품비'].includes(i.category)
  );

  const groups: Record<string, AuditItem[]> = {};
  candidates.forEach(item => {
    const key = item.description.slice(0, 6);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return Object.values(groups)
    .filter(group => {
      if (group.length < 3) return false;
      const sorted = [...group].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const daysDiff =
        (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) /
        86400000;
      return daysDiff <= 7;
    })
    .map(group => ({
      type: 'split_payment' as const,
      title: '분할결제 의심',
      description: `"${group[0].description.slice(0, 12)}..." 7일 내 ${group.length}회 집행`,
      relatedItems: group,
      severity: 'high' as const,
    }));
}

export function detectWeekendExpenses(items: AuditItem[]): AnomalyAlert[] {
  const weekendItems = items.filter(item => {
    if (!['회의비', '소모품비'].includes(item.category)) return false;
    const day = new Date(item.date).getDay();
    return day === 0 || day === 6;
  });
  if (weekendItems.length === 0) return [];
  return [{
    type: 'weekend_expense',
    title: '주말 집행 감지',
    description: `회의비/소모품비 주말 집행 ${weekendItems.length}건`,
    relatedItems: weekendItems,
    severity: 'medium',
  }];
}

export function detectDuplicateConsulting(items: AuditItem[]): AnomalyAlert[] {
  const consulting = items.filter(i => i.category === '전문가 활용비');
  const byMonth: Record<string, AuditItem[]> = {};
  consulting.forEach(item => {
    const month = item.date.slice(0, 7);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(item);
  });
  return Object.entries(byMonth)
    .filter(([, group]) => group.length >= 2)
    .map(([month, group]) => ({
      type: 'duplicate_consulting' as const,
      title: '중복 자문료',
      description: `${month} 전문가 활용비 ${group.length}건 집행`,
      relatedItems: group,
      severity: 'high' as const,
    }));
}

export function detectAmountOutliers(items: AuditItem[]): AnomalyAlert[] {
  const byCategory: Record<string, AuditItem[]> = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  const outliers: AuditItem[] = [];
  Object.values(byCategory).forEach(group => {
    if (group.length < 3) return;
    const amounts = group.map(i => i.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const std = Math.sqrt(
      amounts.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / amounts.length
    );
    if (std === 0) return;
    group.forEach(item => {
      if (Math.abs((item.amount - mean) / std) > 2) outliers.push(item);
    });
  });

  if (outliers.length === 0) return [];
  return [{
    type: 'amount_outlier',
    title: '금액 이상 탐지',
    description: `카테고리 평균 대비 z-score > 2 항목 ${outliers.length}건`,
    relatedItems: outliers,
    severity: 'medium',
  }];
}

export function detectAllPatterns(items: AuditItem[]): AnomalyAlert[] {
  return [
    ...detectSplitPayments(items),
    ...detectWeekendExpenses(items),
    ...detectDuplicateConsulting(items),
    ...detectAmountOutliers(items),
  ];
}

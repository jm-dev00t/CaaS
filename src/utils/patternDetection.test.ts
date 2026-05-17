// 패턴 탐지 함수에 대한 유닛 테스트
import { describe, it, expect } from 'vitest';
import { AuditItem } from '../types/dashboard';
import {
  detectSplitPayments,
  detectWeekendExpenses,
  detectDuplicateConsulting,
  detectAmountOutliers,
} from './patternDetection';

const baseItem = (overrides: Partial<AuditItem>): AuditItem => ({
  id: 'test-1', projectId: 'p1', userId: 'u1',
  date: '2026-05-12', category: '회의비',
  description: '강남 한식당 회식', amount: 150000,
  aiScore: 70, status: '정상',
  ...overrides,
});

describe('detectSplitPayments', () => {
  it('7일 내 동일 가맹점 3회 집행을 감지한다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-10', amount: 149000 }),
      baseItem({ id: '2', date: '2026-05-12', amount: 149000 }),
      baseItem({ id: '3', date: '2026-05-14', amount: 149000 }),
    ];
    const alerts = detectSplitPayments(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('split_payment');
    expect(alerts[0].severity).toBe('high');
    expect(alerts[0].relatedItems).toHaveLength(3);
  });

  it('7일을 초과한 경우 감지하지 않는다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-01', amount: 149000 }),
      baseItem({ id: '2', date: '2026-05-10', amount: 149000 }),
      baseItem({ id: '3', date: '2026-05-20', amount: 149000 }),
    ];
    expect(detectSplitPayments(items)).toHaveLength(0);
  });

  it('2회 이하는 감지하지 않는다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-10', amount: 149000 }),
      baseItem({ id: '2', date: '2026-05-11', amount: 149000 }),
    ];
    expect(detectSplitPayments(items)).toHaveLength(0);
  });
});

describe('detectWeekendExpenses', () => {
  it('회의비 일요일(0) 집행을 감지한다', () => {
    // 2026-05-10은 일요일
    const items = [baseItem({ id: '1', date: '2026-05-10', category: '회의비' })];
    const alerts = detectWeekendExpenses(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('weekend_expense');
  });

  it('평일 회의비는 감지하지 않는다', () => {
    // 2026-05-11은 월요일
    const items = [baseItem({ id: '1', date: '2026-05-11', category: '회의비' })];
    expect(detectWeekendExpenses(items)).toHaveLength(0);
  });

  it('주말 연구재료비는 감지하지 않는다', () => {
    const items = [baseItem({ id: '1', date: '2026-05-10', category: '연구재료비' })];
    expect(detectWeekendExpenses(items)).toHaveLength(0);
  });
});

describe('detectDuplicateConsulting', () => {
  it('동일 월 2회 이상 전문가 활용비를 감지한다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-05-05', category: '전문가 활용비', description: '김전문 자문료' }),
      baseItem({ id: '2', date: '2026-05-20', category: '전문가 활용비', description: '김전문 자문료' }),
    ];
    const alerts = detectDuplicateConsulting(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('duplicate_consulting');
  });

  it('다른 달이면 감지하지 않는다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', date: '2026-04-05', category: '전문가 활용비' }),
      baseItem({ id: '2', date: '2026-05-20', category: '전문가 활용비' }),
    ];
    expect(detectDuplicateConsulting(items)).toHaveLength(0);
  });
});

describe('detectAmountOutliers', () => {
  it('z-score > 2인 항목을 감지한다', () => {
    const items: AuditItem[] = [
      baseItem({ id: '1', amount: 10000 }),
      baseItem({ id: '2', amount: 12000 }),
      baseItem({ id: '3', amount: 11000 }),
      baseItem({ id: '4', amount: 11500 }),
      baseItem({ id: '5', amount: 10500 }),
      baseItem({ id: '6', amount: 11200 }),
      baseItem({ id: '7', amount: 1000000 }), // 이상값 (z-score ≈ 2.45)
    ];
    const alerts = detectAmountOutliers(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('amount_outlier');
    expect(alerts[0].relatedItems.some(i => i.id === '7')).toBe(true);
  });

  it('항목이 3개 미만이면 감지하지 않는다', () => {
    const items = [baseItem({ id: '1' }), baseItem({ id: '2' })];
    expect(detectAmountOutliers(items)).toHaveLength(0);
  });
});

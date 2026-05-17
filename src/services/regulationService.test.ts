// 규정 서비스 함수에 대한 유닛 테스트
import { describe, it, expect } from 'vitest';
import { findMatchingRegulations, formatCitation } from './regulationService';

describe('findMatchingRegulations', () => {
  it('카테고리 키워드로 규정을 찾는다', () => {
    const matches = findMatchingRegulations('회의비', '팀 간담회');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].regulation.category).toBe('회의비');
  });

  it('최대 3개까지만 반환한다', () => {
    const matches = findMatchingRegulations('회의비', '회식 식대 간담회 분할 주말');
    expect(matches.length).toBeLessThanOrEqual(3);
  });

  it('매칭되는 규정이 없으면 빈 배열을 반환한다', () => {
    const matches = findMatchingRegulations('인건비', '연구원 급여');
    expect(matches).toHaveLength(0);
  });

  it('점수 높은 순으로 정렬된다', () => {
    const matches = findMatchingRegulations('전문가 활용비', '자문료 중복 지급');
    expect(matches.length).toBeGreaterThan(1);
    expect(matches[0].matchCount).toBeGreaterThanOrEqual(matches[1].matchCount);
  });
});

describe('formatCitation', () => {
  it('조항 번호와 제목을 조합한다', () => {
    const matches = findMatchingRegulations('회의비', '회식');
    expect(matches.length).toBeGreaterThan(0);
    const citation = formatCitation(matches[0].regulation);
    expect(citation).toMatch(/제\d+-\d+조/);
    expect(citation.length).toBeGreaterThan(5);
  });
});

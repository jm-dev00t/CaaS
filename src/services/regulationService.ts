// 규정 키워드 매칭 및 인용 포맷을 제공하는 RAG 시뮬레이션 서비스

import { REGULATIONS, Regulation } from '../data/regulations';

export interface RegulationMatch {
  regulation: Regulation;
  matchCount: number;
}

export function findMatchingRegulations(
  category: string,
  description: string
): RegulationMatch[] {
  const text = `${category} ${description}`.toLowerCase();

  return REGULATIONS
    .map(reg => ({
      regulation: reg,
      matchCount: reg.keywords.filter(kw => text.includes(kw.toLowerCase())).length,
    }))
    .filter(m => m.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3);
}

export function formatCitation(reg: Regulation): string {
  return `${reg.article} ${reg.title}`;
}

export function buildRegulationContext(matches: RegulationMatch[]): string {
  if (matches.length === 0) return '해당 규정 없음';
  return matches
    .map(m => `[${m.regulation.article}] ${m.regulation.title}: ${m.regulation.content}`)
    .join('\n');
}

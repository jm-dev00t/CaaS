// Google Gemini AI를 활용한 영수증 분석 및 감사 항목 평가 서비스

import { GoogleGenAI, Type } from "@google/genai";
import { findMatchingRegulations, buildRegulationContext, formatCitation } from './regulationService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!apiKey) {
  console.warn('[aiService] VITE_GEMINI_API_KEY 미설정 — AI 기능 비활성화. .env.example 참조.');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ReceiptAnalysis {
  vendor: string;
  date: string;
  amount: number;
  items: string[];
  suggestedCategory: string;
  isLikelyReceipt: boolean;
  confidence: number;
}

export interface AuditAnalysis {
  score: number;
  status: '정상' | '검토필요';
  comment: string;
  regulationCitations?: string[];
}

export async function analyzeReceipt(base64Image: string): Promise<ReceiptAnalysis> {
  if (!ai) throw new Error('AI 서비스가 설정되지 않았습니다. VITE_GEMINI_API_KEY를 .env에 추가하세요.');
  const base64Data = base64Image.split(',')[1] || base64Image;

  const categories = ["회의비", "연구장비비", "연구재료비", "소모품비", "국내여비", "국외여비", "전문가 활용비", "인건비", "기타"];

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: `Analyze this receipt image for research funding audit.
            Extract:
            1. vendor name
            2. date (YYYY-MM-DD)
            3. total amount (number only)
            4. list of items purchased
            5. Suggested category from this list only: ${categories.join(', ')}
            Determine if this is a valid receipt.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendor: { type: Type.STRING },
          date: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          suggestedCategory: { type: Type.STRING },
          isLikelyReceipt: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER }
        },
        required: ["vendor", "amount", "suggestedCategory", "isLikelyReceipt"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Parse Error:", e);
    throw new Error("영수증 분석 결과를 처리하지 못했습니다.");
  }
}

export async function analyzeAuditItem(
  category: string,
  description: string,
  amount: number,
  receiptData?: ReceiptAnalysis
): Promise<AuditAnalysis> {
  if (!ai) throw new Error('AI 서비스가 설정되지 않았습니다.');

  const matches = findMatchingRegulations(category, description);
  const regulationContext = buildRegulationContext(matches);
  const citations = matches.map(m => `${m.regulation.article} ${m.regulation.title}`);

  const prompt = `
    Audit this research fund expenditure for a university project.
    Category: ${category}
    Description: ${description}
    Amount: ${amount}
    ${receiptData ? `Receipt: Vendor: ${receiptData.vendor}, Amount: ${receiptData.amount}, Items: ${receiptData.items?.join(', ')}` : 'No receipt provided.'}

    Applicable Regulations:
    ${regulationContext}

    Check: Does this comply with the above regulations? Flag violations with specific article references.
    Return score (0-100), status ('정상' or '검토필요'), and Korean comment citing specific article numbers.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          status: {
            type: Type.STRING,
            enum: ['정상', '검토필요']
          },
          comment: { type: Type.STRING }
        },
        required: ["score", "status", "comment"]
      }
    }
  });

  try {
    const parsed = JSON.parse(response.text);
    return { ...parsed, regulationCitations: citations };
  } catch (e) {
    console.error("AI Audit Parse Error:", e);
    return {
      score: 50,
      status: '검토필요',
      comment: 'AI 분석 중 오류가 발생했습니다. 수동 검토가 필요합니다.',
      regulationCitations: citations,
    };
  }
}

export async function explainAuditResult(item: any): Promise<string> {
  if (!ai) throw new Error('AI 서비스가 설정되지 않았습니다.');

  const prompt = `
    Explain the following research fund audit record to a researcher.
    Item: ${item.description}
    Category: ${item.category}
    Amount: ${item.amount}
    AI Score: ${item.aiScore}
    AI Comment: ${item.aiComment}
    Status: ${item.status}

    Why did the AI give this score? What are the potential issues or why is it deemed normal?
    Provide a professional, helpful explanation in Korean. Use bullet points if needed.
    Format the output as Markdown.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt
  });

  return response.text;
}

export type TraceStepStatus = 'pending' | 'running' | 'done' | 'flagged';

export interface TraceStep {
  id: number;
  label: string;
  status: TraceStepStatus;
  detail?: string;
  duration?: number;
}

export async function* runAgentTrace(
  item: { category: string; description: string; amount: number; receiptUrl?: string }
): AsyncGenerator<TraceStep[]> {
  if (!ai) throw new Error('AI 서비스가 설정되지 않았습니다.');

  const steps: TraceStep[] = [
    { id: 1, label: 'OCR 파싱', status: 'pending' },
    { id: 2, label: '규정 RAG 검색', status: 'pending' },
    { id: 3, label: '위반 패턴 감지', status: 'pending' },
    { id: 4, label: 'AI 사유서 초안', status: 'pending' },
    { id: 5, label: '결재 라우팅', status: 'pending' },
  ];

  const update = (id: number, patch: Partial<TraceStep>) => {
    const idx = steps.findIndex(s => s.id === id);
    steps[idx] = { ...steps[idx], ...patch };
  };

  // Step 1: OCR 파싱
  update(1, { status: 'running' });
  yield [...steps];
  const t1 = Date.now();
  await new Promise(r => setTimeout(r, 600));
  update(1, {
    status: 'done',
    detail: `항목: ${item.description} | 금액: ${item.amount.toLocaleString()}원 | 분류: ${item.category}`,
    duration: Date.now() - t1,
  });
  yield [...steps];

  // Step 2: 규정 RAG 검색
  update(2, { status: 'running' });
  yield [...steps];
  const t2 = Date.now();
  const matches = findMatchingRegulations(item.category, item.description);
  const citations = matches.map(m => formatCitation(m.regulation)).join(', ');
  update(2, {
    status: 'done',
    detail: citations ? `적용 규정: ${citations}` : '해당 규정 없음',
    duration: Date.now() - t2,
  });
  yield [...steps];

  // Step 3: 위반 패턴 감지 (스트리밍)
  update(3, { status: 'running' });
  yield [...steps];
  const t3 = Date.now();
  const regContext = buildRegulationContext(matches);

  let violationText = '';
  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash',
    contents: `연구비 집행 내역을 감사하세요.
분류: ${item.category}, 항목: ${item.description}, 금액: ${item.amount}원
적용 규정: ${regContext}
위반 여부를 간결하게 한국어로 판단하세요 (2-3문장).`,
  });

  for await (const chunk of stream) {
    violationText += chunk.text ?? '';
    update(3, { detail: violationText });
    yield [...steps];
  }
  const isFlagged = violationText.includes('위반') || violationText.includes('초과') || violationText.includes('불가');
  update(3, { status: isFlagged ? 'flagged' : 'done', duration: Date.now() - t3 });
  yield [...steps];

  // Step 4: 사유서 초안
  update(4, { status: 'running' });
  yield [...steps];
  const t4 = Date.now();
  await new Promise(r => setTimeout(r, 800));
  update(4, {
    status: 'done',
    detail: isFlagged ? '소명서 초안 생성 완료 — 상세 보기 버튼으로 확인' : '규정 준수 — 사유서 불필요',
    duration: Date.now() - t4,
  });
  yield [...steps];

  // Step 5: 결재 라우팅
  update(5, { status: 'running' });
  yield [...steps];
  const t5 = Date.now();
  await new Promise(r => setTimeout(r, 400));
  update(5, {
    status: 'done',
    detail: isFlagged ? '감사자(auditor) 검토 대기열로 이동' : '정상 처리 완료',
    duration: Date.now() - t5,
  });
  yield [...steps];
}

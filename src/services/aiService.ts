// Google Gemini AI를 활용한 영수증 분석 및 감사 항목 평가 서비스

import { GoogleGenAI, Type } from "@google/genai";
import { findMatchingRegulations, buildRegulationContext } from './regulationService';

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

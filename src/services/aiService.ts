import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
}

export async function analyzeReceipt(base64Image: string): Promise<ReceiptAnalysis> {
  // Remove data:image/...;base64, prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;

  const categories = ["회의비", "연구장비비", "연구재료비", "소모품비", "국내여비", "국외여비", "전문가 활용비", "인건비", "기타"];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
  const prompt = `
    Audit this research fund expenditure for a "Researcher" role in a university project.
    Category: ${category}
    Description: ${description}
    Amount: ${amount}
    ${receiptData ? `Receipt Data: Vendor: ${receiptData.vendor}, Amount: ${receiptData.amount}, Date: ${receiptData.date}, Items: ${receiptData.items?.join(', ')}` : 'No electronic receipt provided.'}

    Rules to check:
    1. Does the description match the category?
    2. Is the amount reasonable for the category? (e.g., millions for "Meeting Expenses" is suspicious)
    3. If receipt data is provided, does it match the input amount and description?
    4. Flag potential misuse: duplicate consultancies, excessive travel without details, personal use items.

    Return a score (0-100), a status ('정상' or '검토필요'), and a concise comment in Korean.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Audit Parse Error:", e);
    return {
      score: 50,
      status: '검토필요',
      comment: 'AI 분석 중 오류가 발생했습니다. 수동 검토가 필요합니다.'
    };
  }
}

export async function explainAuditResult(item: any): Promise<string> {
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
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text;
}

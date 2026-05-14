import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAuditJustification(item: any): Promise<string> {
  const prompt = `
    당신은 KAIST 등 주요 공공 연구기관의 연구비 정산 행정 전문가입니다. 
    현재 진행 중인 프로젝트는 '차세대 AI 의료 진단 플랫폼 개발'과 같은 **고도의 인공지능(AI) 연구개발(R&D)** 과제입니다.

    다음 R&D 집행 내역에 대해 국가연구개발사업 가이드라인에 부합하는 정식 '연구비 집행 사유서(소명서)' 초안을 작성해주세요. 
    항목의 성격과 AI 분석 결과(${item.aiComment})를 참고하여, 해당 지출이 연구 목적에 필수불가결했음을 논리적으로 소명해주세요.

    [집행 내역]
    - 항목명: ${item.description}
    - 세목: ${item.category}
    - 금액: ${item.amount.toLocaleString()}원

    [작성 가이드라인]
    1. 문서 제목: 연구비 집행 사유서
    2. 전문적인 비즈니스 문체(격식체) 사용
    3. **AI R&D 과제의 특성**(고성능 컴퓨팅 자원 필요성, 데이터 수집/가공의 시급성, 최신 기술 트렌드 반영 등)을 반영한 구체적 사유 제시
    4. 연구 직접 관련 성격(데이터 확보, 연구 회의, 기술 자문, 재료 구입 등)을 강조할 것
    5. 응답은 소명 내용 본문만 한국어로 작성해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "소명서 생성에 실패했습니다.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "AI 서비스 통신 중 오류가 발생했습니다.";
  }
}

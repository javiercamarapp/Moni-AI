import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

const apiKey = process.env.API_KEY;

export const analyzePortfolio = async (assets: Asset[], totalValue: number): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Unable to analyze.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare a simplified summary for the AI
  const portfolioSummary = assets.map(a => ({
    symbol: a.symbol,
    qty: a.quantity,
    boughtAt: a.purchasePrice,
    currPrice: a.currentPrice,
    type: a.type
  }));

  const prompt = `
    Act as a senior financial investment advisor. 
    Analyze this user's portfolio:
    Total Value: $${totalValue.toFixed(2)}
    Holdings: ${JSON.stringify(portfolioSummary)}

    Provide a concise, 3-sentence summary of the portfolio's health. 
    Point out 1 specific strength and 1 potential risk based on diversification or asset performance.
    Keep the tone professional, encouraging, and match the "premium fintech" vibe.
    Do not use markdown formatting like bolding, just plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Service temporarily unavailable. Please try again later.";
  }
};

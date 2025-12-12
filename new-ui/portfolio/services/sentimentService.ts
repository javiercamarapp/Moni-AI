import { AssetSentiment } from "../types";

// Simulates a backend service that aggregates news and technical indicators
export const fetchAssetSentiment = async (symbol: string): Promise<AssetSentiment> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed % 100) / 100; // Consistent pseudo-random per symbol

  let score: number;
  let status: 'Bullish' | 'Bearish' | 'Neutral';
  let summary: string;
  let trend: 'UP' | 'DOWN' | 'FLAT';

  // Generate realistic looking data based on the symbol "hash"
  if (random > 0.6) {
    score = 75 + Math.floor(random * 20);
    status = 'Bullish';
    trend = 'UP';
    summary = `Analyst consensus for ${symbol} remains strong. Technical indicators show a golden cross formation, suggesting continued upward momentum. Institutional inflow has increased by 15% in the last quarter.`;
  } else if (random < 0.3) {
    score = 20 + Math.floor(random * 20);
    status = 'Bearish';
    trend = 'DOWN';
    summary = `Market caution is advised for ${symbol} as short-term resistance levels hold firm. Recent macroeconomic headwinds and sector rotation may limit upside potential in the coming weeks.`;
  } else {
    score = 45 + Math.floor(random * 10);
    status = 'Neutral';
    trend = 'FLAT';
    summary = `${symbol} is currently trading within a consolidation channel. Volatility remains low as investors await upcoming earnings reports and clearer market signals before taking decisive positions.`;
  }

  // Overrides for popular assets to make them feel "real"
  if (symbol === 'BTC') {
    status = 'Bullish';
    score = 82;
    summary = "Bitcoin continues to show resilience above key support levels. On-chain data indicates accumulation by long-term holders, creating a supply squeeze scenario.";
  }
  if (symbol === 'NVDA') {
    status = 'Bullish';
    score = 91;
    summary = "NVIDIA dominates the AI sector with record demand. Analysts maintain a 'Strong Buy' rating, citing expanded data center revenue and unshakeable market leadership.";
  }

  return {
    score,
    status,
    summary,
    trend,
    lastUpdated: 'Hace 2 horas'
  };
};
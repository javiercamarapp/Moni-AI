
export enum AssetType {
  STOCK = 'STOCK',
  CRYPTO = 'CRYPTO',
  ETF = 'ETF',
  DIGITAL = 'DIGITAL'
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number; // In a real app, this comes from an API
}

export interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalProfit: number;
  profitPercentage: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface Transaction {
  id: string;
  assetId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string; // ISO Date
}

export interface AssetSentiment {
  score: number; // 0 to 100
  status: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  trend: 'UP' | 'DOWN' | 'FLAT';
  lastUpdated: string;
}

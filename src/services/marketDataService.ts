import { AssetType } from '@/components/portfolio/AssetCard';

type PriceUpdateCallback = (symbol: string, newPrice: number) => void;

class MarketDataService {
  private subscribers: Map<string, PriceUpdateCallback[]> = new Map();
  private prices: Map<string, number> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  // CoinCap API - Free and CORS-friendly
  private async fetchCryptoPrice(symbol: string): Promise<number | null> {
    const coinCapIds: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'XRP': 'xrp',
      'BNB': 'binance-coin',
      'AVAX': 'avalanche',
      'DOT': 'polkadot',
      'MATIC': 'polygon',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'LTC': 'litecoin',
    };

    const id = coinCapIds[symbol.toUpperCase()];
    if (!id) return null;

    try {
      const response = await fetch(`https://api.coincap.io/v2/assets/${id}`);
      if (response.ok) {
        const data = await response.json();
        return parseFloat(data.data.priceUsd);
      }
    } catch {
      // Silent failure - fallback to simulation
    }
    return null;
  }

  // Simulate stock price movements (random walk)
  private simulateStockPrice(currentPrice: number, volatility: number = 0.0005): number {
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    return currentPrice * change;
  }

  public subscribe(symbol: string, type: AssetType, initialPrice: number, callback: PriceUpdateCallback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
      this.prices.set(symbol, initialPrice);
      this.startTicker(symbol, type);
    }
    
    this.subscribers.get(symbol)?.push(callback);
  }

  public unsubscribe(symbol: string, callback: PriceUpdateCallback) {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      this.subscribers.set(symbol, subs.filter(cb => cb !== callback));
      if (this.subscribers.get(symbol)?.length === 0) {
        this.stopTicker(symbol);
      }
    }
  }

  public unsubscribeAll() {
    this.intervals.forEach((_, symbol) => this.stopTicker(symbol));
    this.subscribers.clear();
    this.prices.clear();
  }

  private startTicker(symbol: string, type: AssetType) {
    if (this.intervals.has(symbol)) return;

    // Cost-efficient: Update every 30s for crypto, 60s for stocks
    const interval = type === AssetType.CRYPTO ? 30000 : 60000;

    const intervalId = setInterval(async () => {
      let newPrice = this.prices.get(symbol) || 0;

      if (type === AssetType.CRYPTO) {
        const realPrice = await this.fetchCryptoPrice(symbol);
        if (realPrice) {
          newPrice = realPrice;
        } else {
          newPrice = this.simulateStockPrice(newPrice, 0.002);
        }
      } else {
        // Stocks/ETF - simulation only (real APIs cost $$$)
        const volatility = type === AssetType.ETF ? 0.0003 : 0.0006;
        newPrice = this.simulateStockPrice(newPrice, volatility);
      }

      this.prices.set(symbol, newPrice);
      this.notifySubscribers(symbol, newPrice);
    }, interval);

    this.intervals.set(symbol, intervalId);
  }

  private stopTicker(symbol: string) {
    const id = this.intervals.get(symbol);
    if (id) {
      clearInterval(id);
      this.intervals.delete(symbol);
    }
    this.subscribers.delete(symbol);
    this.prices.delete(symbol);
  }

  private notifySubscribers(symbol: string, price: number) {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach(cb => cb(symbol, price));
    }
  }

  public getCurrentPrice(symbol: string): number | undefined {
    return this.prices.get(symbol);
  }
}

export const marketService = new MarketDataService();

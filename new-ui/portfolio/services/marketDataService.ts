import { AssetType } from "../types";

// Interface for price updates
type PriceUpdateCallback = (symbol: string, newPrice: number) => void;

class MarketDataService {
  private subscribers: Map<string, PriceUpdateCallback[]> = new Map();
  private prices: Map<string, number> = new Map();
  private intervals: Map<string, number> = new Map();

  // Robust Crypto Data Fetching
  // Switched to CoinCap API which is generally CORS-friendly for frontend demos
  private async fetchCryptoPrice(symbol: string): Promise<number | null> {
    const sym = symbol.toUpperCase();
    
    // Map common symbols to CoinCap IDs
    const coinCapIds: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOGE': 'dogecoin'
    };

    const id = coinCapIds[sym];
    if (!id) return null; // If not in our map, use simulation

    try {
      const response = await fetch(`https://api.coincap.io/v2/assets/${id}`);
      if (response.ok) {
        const data = await response.json();
        return parseFloat(data.data.priceUsd);
      }
    } catch (e) {
      // Silent failure: fallback to simulation immediately 
      // to avoid spamming "Failed to fetch" in console
    }

    return null;
  }

  // Simulate Stock Movement (Random Walk with Drift)
  private simulateStockPrice(currentPrice: number, volatility: number = 0.0004): number {
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    return currentPrice * change;
  }

  // Start tracking a symbol
  public subscribe(symbol: string, type: AssetType, initialPrice: number, callback: PriceUpdateCallback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
      this.prices.set(symbol, initialPrice);
      
      // Start the update loop for this symbol
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

  private startTicker(symbol: string, type: AssetType) {
    // Prevent duplicate intervals
    if (this.intervals.has(symbol)) return;

    // interval ID
    const intervalId = window.setInterval(async () => {
      let newPrice = this.prices.get(symbol) || 0;

      if (type === AssetType.CRYPTO) {
        // Try to get Real Data
        const realPrice = await this.fetchCryptoPrice(symbol);
        if (realPrice) {
          newPrice = realPrice;
        } else {
          // Fallback if APIs fail: Simulate market movement
          // This prevents the app from breaking if APIs are blocked
          newPrice = this.simulateStockPrice(newPrice, 0.002); 
        }
      } else {
        // Stocks / ETF / Digital -> Simulation
        // Stocks fluctuate less than Crypto
        const volatility = type === AssetType.DIGITAL ? 0.005 : 0.0008;
        newPrice = this.simulateStockPrice(newPrice, volatility);
      }

      this.prices.set(symbol, newPrice);
      this.notifySubscribers(symbol, newPrice);

    }, type === AssetType.CRYPTO ? 5000 : 3000); // 5s for crypto, 3s for stocks

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
}

export const marketService = new MarketDataService();
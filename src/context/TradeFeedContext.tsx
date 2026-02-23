import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { subscribeToTradeFeed, TradeEntry } from '../services/tradeFeedBus';

type TradeFeedValue = {
  trades: TradeEntry[];
  liveFeed: TradeEntry[];
  dailyPnL: number;
  equityCurve: Array<{ label: string; value: number }>;
};

const STORAGE_KEY = 'tradingbotboom-trades';

const TradeFeedContext = createContext<TradeFeedValue | undefined>(undefined);

export function TradeFeedProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<TradeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as TradeEntry[];
      }
    } catch (error) {
      console.warn('Unable to hydrate trade feed', error);
    }
    return [];
  });

  useEffect(() => {
    const unsubscribe = subscribeToTradeFeed((trade) => {
      setTrades((prev) => {
        const updated = [...prev, trade].slice(-200);
        return updated;
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch (error) {
      console.warn('Unable to persist trade feed', error);
    }
  }, [trades]);

  const liveFeed = useMemo(() => {
    return trades.slice(-5).reverse();
  }, [trades]);

  const equityCurve = useMemo(() => {
    let cumulative = 0;
    return trades
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((trade) => {
        cumulative += trade.pnl;
        return {
          label: new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: cumulative,
        };
      });
  }, [trades]);

  const dailyPnL = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return trades
      .filter((trade) => new Date(trade.timestamp) >= startOfDay)
      .reduce((sum, trade) => sum + trade.pnl, 0);
  }, [trades]);

  return (
    <TradeFeedContext.Provider value={{ trades, liveFeed, dailyPnL, equityCurve }}>
      {children}
    </TradeFeedContext.Provider>
  );
}

export function useTradeFeed() {
  const context = useContext(TradeFeedContext);
  if (!context) {
    throw new Error('useTradeFeed must be used within TradeFeedProvider');
  }
  return context;
}

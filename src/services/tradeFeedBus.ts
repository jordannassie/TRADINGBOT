export type TradeEntry = {
  id: string;
  market: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  pnl: number;
  timestamp: string;
};

const listeners = new Set<(trade: TradeEntry) => void>();

export const subscribeToTradeFeed = (listener: (trade: TradeEntry) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitTradeFeed = (trade: TradeEntry) => {
  listeners.forEach((listener) => listener(trade));
};

type PolymarketTraderProfile = {
  handle: string;
  address: string;
  copyScore: number;
  categories: string[];
  summary: string;
  status: 'Candidate' | 'Vetted' | 'Active';
  favoriteMarkets: string[];
  stats: {
    pnl7d: number;
    pnl30d: number;
    pnlAll: number;
    volume: number;
  };
  profileUrl: string;
};

type MarketSummary = {
  id: string;
  title: string;
  marketType: string;
  probability: number;
};

type PlaceOrderRequest = {
  traderHandle: string;
  marketId: string;
  orderSize: number;
  side: 'buy' | 'sell';
};

type PlaceOrderResult = {
  success: boolean;
  orderId: string;
  message: string;
};

const MOCK_TRADERS_URL = new URL('../data/polymarketTopTraders.json', import.meta.url);
const MOCK_DELAY_MS = 420;

const FALLBACK_TRADERS: PolymarketTraderProfile[] = [
  {
    handle: 'FallbackTrader',
    address: '0xFallback',
    copyScore: 70,
    categories: ['Demo'],
    summary: 'Fallback trader used when mock data cannot be loaded.',
    status: 'Candidate',
    favoriteMarkets: ['Will fallback load succeed?'],
    stats: {
      pnl7d: 0,
      pnl30d: 0,
      pnlAll: 0,
      volume: 0,
    },
    profileUrl: 'https://polymarket.com/@FallbackTrader',
  },
];

const MOCK_MARKETS: MarketSummary[] = [
  { id: 'm1', title: 'Will the Fed pause in 2026?', marketType: 'Binary', probability: 62 },
  { id: 'm2', title: 'Will Bitcoin close above $55k in May?', marketType: 'Scalar', probability: 48 },
  { id: 'm3', title: 'Will Congress pass AI bill in 2026?', marketType: 'Binary', probability: 33 },
];

const delay = <T>(payload: T, ms = MOCK_DELAY_MS) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(payload), ms));

/*
// Uncomment and configure once real credentials are available.
// import { ClobClient } from '@polymarket/clob-client';
// const polymarketClient = new ClobClient({
//   apiKey: process.env.POLYMARKET_API_KEY,
//   apiSecret: process.env.POLYMARKET_API_SECRET,
//   baseUrl: 'https://clob.polymarket.com',
// });
*/

export async function fetchTopTraderProfiles(): Promise<PolymarketTraderProfile[]> {
  try {
    const response = await fetch(MOCK_TRADERS_URL);
    if (!response.ok) throw new Error('Failed to load trader mock data');
    const data = (await response.json()) as PolymarketTraderProfile[];
    return await delay(data);
  } catch (error) {
    console.warn('Polymarket mock fetch failed, falling back.', error);
    return await delay(FALLBACK_TRADERS);
  }
}

export async function fetchMarkets(): Promise<MarketSummary[]> {
  return delay(MOCK_MARKETS);
}

export async function placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResult> {
  const result: PlaceOrderResult = {
    success: true,
    orderId: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    message: 'Order simulated locally. Swap in the CLOB client when ready.',
  };
  console.debug('Polymarket placeOrder stub', request);
  return delay(result);
}

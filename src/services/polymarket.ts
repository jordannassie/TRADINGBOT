import { ClobClient, OrderType, Side } from '@polymarket/clob-client';
import { SignatureType } from '@polymarket/order-utils';
import { emitTradeFeed } from './tradeFeedBus';

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
  strategy?: string;
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
  limitPrice?: number;
};

type PlaceOrderResult = {
  success: boolean;
  orderId: string;
  message: string;
};

type PlaceOrderOptions = {
  killSwitchActive?: boolean;
};

const LEADERBOARD_ENDPOINT = 'https://clob.polymarket.com/trader-leaderboard';
const MARKET_ENDPOINT = 'https://clob.polymarket.com/markets?status=OPEN&perPage=12';
const TIMEFRAMES = ['DAY', 'WEEK', 'MONTH'];
const ORDER_BY = ['PNL', 'VOLUME'];
const MOCK_DELAY_MS = 420;
const LIVE_FEED_URL = new URL('../data/polymarketLiveFeed.json', import.meta.url);
const FALLBACK_FEED_URL = new URL('../data/polymarketTopTraders.json', import.meta.url);

const API_KEY = import.meta.env.VITE_POLY_API_KEY ?? '';
const API_SECRET = import.meta.env.VITE_POLY_API_SECRET ?? '';
const API_PASSPHRASE = import.meta.env.VITE_POLY_API_PASSPHRASE ?? '';
const PROXY_WALLET = import.meta.env.VITE_POLY_PROXY_WALLET ?? '';

const hasLiveCreds = Boolean(API_KEY && API_SECRET && API_PASSPHRASE && PROXY_WALLET);

const polymarketClient = hasLiveCreds
  ? new ClobClient(
      'https://clob.polymarket.com',
      1,
      undefined,
      {
        key: API_KEY,
        secret: API_SECRET,
        passphrase: API_PASSPHRASE,
      },
      SignatureType.ProxyWallet,
      PROXY_WALLET,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    )
  : null;

const smoothDelay = <T>(payload: T, ms = MOCK_DELAY_MS) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(payload), ms));

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

const normalizeScore = (value: number, max = 1) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value / max));
};

const scoreTrader = ({
  pnlScore,
  winRate,
  volume,
  lastActiveHours,
}: {
  pnlScore: number;
  winRate: number;
  volume: number;
  lastActiveHours: number | null;
}) => {
  const pnl = normalizeScore(pnlScore, 100);
  const wRate = winRate || 0.5;
  const volumeScore = normalizeScore(Math.log10((volume || 0) + 1), 6);
  const recency = lastActiveHours ? Math.max(0, 1 - lastActiveHours / 72) : 0.5;
  return Number(((pnl * 0.45 + wRate * 0.2 + volumeScore * 0.2 + recency * 0.15) * 100).toFixed(1));
};

const aggregateLeaderboard = (
  entries: Array<{ timeframe: string; orderBy: string; traders: any[] }>,
): PolymarketTraderProfile[] => {
  const map = new Map<string, any>();

  entries.forEach(({ timeframe, orderBy, traders }) => {
    if (!traders?.length) return;
    traders.forEach((trader: any, rank: number) => {
      const key = trader.account || trader.address || trader.username;
      if (!key) return;
      const existing =
        map.get(key) ||
        ({
          username: trader.username || trader.displayName || `Trader ${key.slice(0, 6)}`,
          address: key,
          proxyWallet: trader.proxyWallet,
          pnlHistory: {},
          volume: 0,
          lastActiveHours: trader.lastActiveHours || null,
          categories: trader.categories || [],
          favoriteMarkets: trader.favoriteMarkets || [],
          summary: trader.summary || '',
          strategy: trader.strategy,
        } as any);

      existing.pnlHistory[timeframe] = trader.pnl || trader.pnlHistory?.[timeframe] || 0;
      existing.lastRanks = existing.lastRanks || {};
      existing.lastRanks[`${timeframe}_${orderBy}`] = rank + 1;
      existing.volume = Math.max(existing.volume, trader.volume || 0);
      map.set(key, existing);
    });
  });

  if (map.size === 0) {
    return FALLBACK_TRADERS;
  }

  return Array.from(map.values()).map((entry) => {
    const pnls = entry.pnlHistory || {};
    const pnlScore = (pnls.DAY || 0) * 0.4 + (pnls.WEEK || 0) * 0.3 + (pnls.MONTH || 0) * 0.3;
    const totalTrades = (entry.winningTrades || 0) + (entry.losingTrades || 0);
    const winRate = totalTrades ? (entry.winningTrades || 0) / totalTrades : 0.5;

    return {
      handle: entry.username,
      address: entry.address,
      copyScore: scoreTrader({
        pnlScore,
        winRate,
        volume: entry.volume,
        lastActiveHours: entry.lastActiveHours,
      }),
      categories: entry.categories || [],
      summary: entry.summary || 'Live Polymarket trader',
      status:
        entry.status && ['Candidate', 'Vetted', 'Active'].includes(entry.status)
          ? entry.status
          : 'Candidate',
      favoriteMarkets: entry.favoriteMarkets || [],
      stats: {
        pnl7d: pnls.DAY || 0,
        pnl30d: pnls.MONTH || 0,
        pnlAll: pnls.ALL || 0,
        volume: entry.volume || 0,
      },
      profileUrl: entry.profileUrl || `https://polymarket.com/@${entry.username}`,
      strategy: entry.strategy,
    };
  });
};

const fetchJson = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Polymarket request failed (${response.status})`);
  return response.json();
};

const loadFallbackTraders = async () => {
  try {
    const response = await fetch(FALLBACK_FEED_URL);
    if (!response.ok) throw new Error('Unable to load fallback data');
    const fallbackData = (await response.json()) as PolymarketTraderProfile[];
    return fallbackData;
  } catch (error) {
    console.warn('Fallback feed failed, defaulting to embedded fallback.', error);
    return FALLBACK_TRADERS;
  }
};

const loadLocalLiveFeed = async () => {
  try {
    const response = await fetch(LIVE_FEED_URL);
    if (!response.ok) throw new Error('Unable to load local live feed');
    const data = (await response.json()) as PolymarketTraderProfile[];
    return data;
  } catch {
    return null;
  }
};

export async function fetchTopTraderProfiles(): Promise<PolymarketTraderProfile[]> {
  const localFeed = await loadLocalLiveFeed();
  if (localFeed?.length) return smoothDelay(localFeed);

  try {
    const requests: Promise<Response>[] = [];
    TIMEFRAMES.forEach((timeframe) => {
      ORDER_BY.forEach((orderBy) => {
        const url = `${LEADERBOARD_ENDPOINT}?timeframe=${timeframe}&orderBy=${orderBy}`;
        requests.push(fetch(url));
      });
    });

    const responses = await Promise.allSettled(requests);

    const parsedPromises = responses
      .filter((result) => result.status === 'fulfilled')
      .map(async (result, idx) => {
        const timeframe = TIMEFRAMES[Math.floor(idx / ORDER_BY.length)];
        const orderBy = ORDER_BY[idx % ORDER_BY.length];
        const body = (result as PromiseFulfilledResult<Response>).value;
        const data = await body.json();
        return {
          timeframe,
          orderBy,
          traders: data?.traders || data || [],
        };
      });

    const parsed = await Promise.all(parsedPromises);
    const aggregated = aggregateLeaderboard(parsed);
    if (aggregated.length) return aggregated;
  } catch (error) {
    console.warn('Live leaderboard fetch failed. Falling back.', error);
  }

  return await loadFallbackTraders();
}

export async function fetchMarkets(): Promise<MarketSummary[]> {
  if (polymarketClient) {
    try {
      const response = await polymarketClient.getSimplifiedMarkets();
      const markets = response?.data || response?.markets || [];
      if (markets.length) {
        return smoothDelay(
          markets.slice(0, 10).map((market: any) => ({
            id: market.id,
            title: market.title,
            marketType: market.marketType,
            probability: market.probability || market.price || 0,
          })),
        );
      }
    } catch (error) {
      console.warn('Live markets fetch failed, falling back to mocks.', error);
    }
  }
  return smoothDelay(MOCK_MARKETS);
}

export async function fetchAccountBalance() {
  if (!polymarketClient || !PROXY_WALLET) return null;
  try {
    const result = await polymarketClient.getBalanceAllowance({ address: PROXY_WALLET });
    return result;
  } catch (error) {
    console.warn('Unable to fetch Polymarket balance', error);
    return null;
  }
}

const recordTrade = (request: PlaceOrderRequest, price: number, pnl: number) => {
  emitTradeFeed({
    id: crypto.randomUUID(),
    market: request.marketId,
    side: request.side,
    price,
    size: request.orderSize,
    pnl,
    timestamp: new Date().toISOString(),
  });
};

const computePnl = (price: number, request: PlaceOrderRequest) =>
  price * request.orderSize * (request.side === 'sell' ? 1 : -1);

export async function placeOrder(
  request: PlaceOrderRequest,
  options: PlaceOrderOptions = {},
): Promise<PlaceOrderResult> {
  if (options.killSwitchActive) {
    recordTrade(request, request.limitPrice ?? 0, 0);
    return {
      success: false,
      orderId: 'KILL_SWITCH',
      message: 'Skipped: Kill switch active.',
    };
  }

  if (polymarketClient) {
    try {
      const marketOrder = {
        tokenID: request.marketId,
        amount: request.orderSize,
        side: request.side === 'buy' ? Side.BUY : Side.SELL,
        price: request.limitPrice,
      };
      const response: any = await polymarketClient.createAndPostMarketOrder(
        marketOrder,
        undefined,
        OrderType.FOK,
      );
      const executedPrice = request.limitPrice ?? marketOrder.price ?? 0;
      const pnl = computePnl(executedPrice, request);
      recordTrade(request, executedPrice, pnl);
      return {
        success: true,
        orderId: response?.orderID || 'LIVE',
        message: 'Order submitted via Polymarket SDK.',
      };
    } catch (error) {
      console.warn('Polymarket order failed, falling back to mock.', error);
    }
  }

  const fallbackPrice = request.limitPrice ?? 0;
  const fallbackPnl = computePnl(fallbackPrice, request);
  recordTrade(request, fallbackPrice, fallbackPnl);
  return smoothDelay({
    success: true,
    orderId: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    message: 'Order simulated locally. Swap in the CLOB client when ready.',
  });
}

export { PROXY_WALLET };

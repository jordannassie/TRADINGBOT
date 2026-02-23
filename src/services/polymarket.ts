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
};

type PlaceOrderResult = {
  success: boolean;
  orderId: string;
  message: string;
};

const LEADERBOARD_ENDPOINT = 'https://clob.polymarket.com/trader-leaderboard';
const MARKET_ENDPOINT = 'https://clob.polymarket.com/markets?status=OPEN&perPage=12';
const TIMEFRAMES = ['DAY', 'WEEK', 'MONTH'];
const ORDER_BY = ['PNL', 'VOLUME'];
const MOCK_DELAY_MS = 420;
const LIVE_FEED_URL = new URL('../data/polymarketLiveFeed.json', import.meta.url);
const FALLBACK_FEED_URL = new URL('../data/polymarketTopTraders.json', import.meta.url);

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
  if (!response.ok) {
    throw new Error(`Polymarket request failed (${response.status})`);
  }
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
  try {
    const data = await fetchJson(MARKET_ENDPOINT);
    const markets = data?.markets || [];
    if (!markets.length) throw new Error('Empty market payload');
    const mapped = (markets as any[]).slice(0, 10).map((market) => ({
      id: market.id,
      title: market.title,
      marketType: market.marketType,
      probability: market.probability || market.price || 0,
    }));
    return smoothDelay(mapped);
  } catch (error) {
    console.warn('Failed to load real markets, using mock subset.', error);
    return smoothDelay(MOCK_MARKETS);
  }
}

export async function placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResult> {
  const result: PlaceOrderResult = {
    success: true,
    orderId: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    message: 'Order simulated locally. Swap in the CLOB client when ready.',
  };
  console.debug('Polymarket placeOrder stub', request);
  return smoothDelay(result);
}

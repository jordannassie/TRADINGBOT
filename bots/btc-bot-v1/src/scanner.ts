import { ArbOpportunity, BotConfig, MarketOrderbook, OrderbookLevel } from './types.js';

const CLOB_BASE = 'https://clob.polymarket.com';

// ─── BTC Market Filter ────────────────────────────────────────────────────────
const BTC_TITLE_PATTERNS = [
  /bitcoin up or down/i,
  /btc up or down/i,
];

function isBtcMarket(title: string): boolean {
  return BTC_TITLE_PATTERNS.some((re) => re.test(title));
}

// ─── Fetch eligible BTC markets ───────────────────────────────────────────────
interface ClobMarket {
  condition_id: string;
  question: string;
  market_slug: string;
  tokens: Array<{ token_id: string; outcome: string }>;
  active: boolean;
  closed: boolean;
}

export async function fetchBtcMarkets(): Promise<ClobMarket[]> {
  const results: ClobMarket[] = [];
  let nextCursor = '';

  // Paginate up to 5 pages to find BTC markets quickly
  for (let page = 0; page < 5; page++) {
    const url = nextCursor
      ? `${CLOB_BASE}/markets?status=OPEN&next_cursor=${nextCursor}`
      : `${CLOB_BASE}/markets?status=OPEN`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) break;

    const json = (await res.json()) as { data: ClobMarket[]; next_cursor?: string };
    const markets = json.data ?? [];

    for (const m of markets) {
      if (!m.active || m.closed) continue;
      if (isBtcMarket(m.question)) {
        results.push(m);
      }
    }

    if (!json.next_cursor || json.next_cursor === 'LTE=') break;
    nextCursor = json.next_cursor;
  }

  return results;
}

// ─── Fetch orderbook for a single token ───────────────────────────────────────
interface RawOrderbook {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

async function fetchOrderbook(tokenId: string): Promise<RawOrderbook | null> {
  try {
    const res = await fetch(`${CLOB_BASE}/book?token_id=${tokenId}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as RawOrderbook;
  } catch {
    return null;
  }
}

function bestAsk(book: RawOrderbook): OrderbookLevel | null {
  if (!book.asks || book.asks.length === 0) return null;
  // Asks sorted ascending by price; best ask is the lowest
  const sorted = [...book.asks].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  return { price: parseFloat(sorted[0].price), size: parseFloat(sorted[0].size) };
}

function bestBid(book: RawOrderbook): OrderbookLevel | null {
  if (!book.bids || book.bids.length === 0) return null;
  // Bids sorted descending; best bid is highest
  const sorted = [...book.bids].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  return { price: parseFloat(sorted[0].price), size: parseFloat(sorted[0].size) };
}

// ─── Build orderbook snapshot for a market ────────────────────────────────────
export async function fetchMarketOrderbook(market: ClobMarket): Promise<MarketOrderbook | null> {
  const yesToken = market.tokens.find((t) => t.outcome.toUpperCase() === 'YES');
  const noToken = market.tokens.find((t) => t.outcome.toUpperCase() === 'NO');

  if (!yesToken || !noToken) return null;

  const [yesBook, noBook] = await Promise.all([
    fetchOrderbook(yesToken.token_id),
    fetchOrderbook(noToken.token_id),
  ]);

  if (!yesBook || !noBook) return null;

  return {
    marketId: market.condition_id,
    title: market.question,
    conditionId: market.condition_id,
    yesTokenId: yesToken.token_id,
    noTokenId: noToken.token_id,
    yesBestAsk: bestAsk(yesBook),
    noBestAsk: bestAsk(noBook),
    yesBestBid: bestBid(yesBook),
    noBestBid: bestBid(noBook),
  };
}

// ─── Dutch-book arb evaluation ────────────────────────────────────────────────
export function evaluateArb(
  ob: MarketOrderbook,
  cfg: BotConfig,
): ArbOpportunity | null {
  if (!ob.yesBestAsk || !ob.noBestAsk) return null;

  const yesAsk = ob.yesBestAsk.price;
  const noAsk = ob.noBestAsk.price;
  const yesAskSize = ob.yesBestAsk.size;
  const noAskSize = ob.noBestAsk.size;

  const sum = yesAsk + noAsk;
  const rawEdge = 1.0 - sum;
  const effectiveEdge = rawEdge - cfg.feeBuffer;

  if (effectiveEdge < cfg.minEdge) return null;

  const shares = Math.floor(Math.min(yesAskSize, noAskSize, cfg.minShares * 10));
  if (shares < cfg.minShares) return null;

  const estimatedUsdCost = (yesAsk + noAsk) * shares;
  if (estimatedUsdCost > cfg.maxUsdPerTrade) return null;

  return {
    marketId: ob.marketId,
    title: ob.title,
    conditionId: ob.conditionId,
    yesTokenId: ob.yesTokenId,
    noTokenId: ob.noTokenId,
    yesAsk,
    noAsk,
    yesAskSize,
    noAskSize,
    sum,
    rawEdge,
    effectiveEdge,
    shares,
    estimatedUsdCost,
  };
}

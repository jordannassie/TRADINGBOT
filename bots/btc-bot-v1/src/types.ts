// ─── Bot configuration (mirrors btc_bot_config Supabase table) ────────────────
export interface BotConfig {
  id: string;
  mode: 'PAPER' | 'LIVE';
  executionEnabled: boolean;
  killSwitch: boolean;
  minEdge: number;
  feeBuffer: number;
  minShares: number;
  maxFillMs: number;
  maxUsdPerTrade: number;
  maxOpenUsdTotal: number;
  maxDailyLossUsd: number;
  maxTradesPerHour: number;
  updatedAt: string;
}

export const DEFAULT_CONFIG: BotConfig = {
  id: 'default',
  mode: 'PAPER',
  executionEnabled: false,
  killSwitch: true,
  minEdge: 0.02,
  feeBuffer: 0.01,
  minShares: 50,
  maxFillMs: 1500,
  maxUsdPerTrade: 25,
  maxOpenUsdTotal: 200,
  maxDailyLossUsd: 100,
  maxTradesPerHour: 60,
  updatedAt: new Date().toISOString(),
};

// ─── Orderbook snapshot from Polymarket CLOB ──────────────────────────────────
export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface MarketOrderbook {
  marketId: string;
  title: string;
  conditionId: string;
  yesTokenId: string;
  noTokenId: string;
  yesBestAsk: OrderbookLevel | null;
  noBestAsk: OrderbookLevel | null;
  yesBestBid: OrderbookLevel | null;
  noBestBid: OrderbookLevel | null;
}

// ─── Arb opportunity ──────────────────────────────────────────────────────────
export interface ArbOpportunity {
  marketId: string;
  title: string;
  conditionId: string;
  yesTokenId: string;
  noTokenId: string;
  yesAsk: number;
  noAsk: number;
  yesAskSize: number;
  noAskSize: number;
  sum: number;
  rawEdge: number;
  effectiveEdge: number;
  shares: number;
  estimatedUsdCost: number;
}

// ─── Event types logged to btc_bot_events ─────────────────────────────────────
export type EventType =
  | 'HEARTBEAT'
  | 'OPPORTUNITY'
  | 'ORDER_SUBMITTED'
  | 'FILLED'
  | 'PARTIAL_FILL_FLATTENED'
  | 'SKIPPED'
  | 'HALT'
  | 'ERROR';

export interface BotEvent {
  runId: string;
  ts: string;
  mode: 'PAPER' | 'LIVE';
  type: EventType;
  market?: string;
  yesAsk?: number;
  noAsk?: number;
  sum?: number;
  effectiveEdge?: number;
  shares?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

// ─── Broker interface ─────────────────────────────────────────────────────────
export type OrderSide = 'YES' | 'NO';

export interface OrderRequest {
  marketId: string;
  conditionId: string;
  tokenId: string;
  side: OrderSide;
  shares: number;
  limitPrice: number;
  maxFillMs: number;
}

export type FillStatus = 'FILLED' | 'PARTIAL' | 'UNFILLED';

export interface OrderResult {
  orderId: string;
  status: FillStatus;
  filledShares: number;
  avgPrice: number;
}

// ─── Risk state (in-memory, reset per session) ────────────────────────────────
export interface RiskState {
  openUsd: number;
  dailyLossUsd: number;
  tradesThisHour: number;
  hourWindowStart: number;
  halted: boolean;
}

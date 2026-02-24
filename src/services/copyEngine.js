const GAMMA_BASE = 'https://gamma-api.polymarket.com';
const WALLET_CACHE_KEY = 'tradingbot-copy-target-wallet';
const TRADE_CACHE_KEY = 'tradingbot-copy-seen-trades';
export const TARGET_TRADER_HANDLE = 'k9Q2mX4L8A7ZP3R';
const MAX_STORED_TRADES = 40;

const TRADE_ENDPOINTS = [
  (wallet, limit) => `${GAMMA_BASE}/public-activity?wallet=${wallet}&limit=${limit}`,
  (wallet, limit) => `${GAMMA_BASE}/public-trades?wallet=${wallet}&limit=${limit}`,
  (wallet, limit) => `${GAMMA_BASE}/public-activity?profile=${wallet}&limit=${limit}`,
  (wallet, limit) => `${GAMMA_BASE}/account/${wallet}/history?limit=${limit}`,
];

const sanitized = (value) => (value ?? '').toString().toLowerCase().replace(/^@/, '').trim();

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const candidates = payload?.data ?? payload?.results ?? payload?.items ?? payload?.trades ?? payload?.activity;
  if (Array.isArray(candidates)) return candidates;
  return [];
}

function normalizeTrade(raw, wallet, index) {
  const timestamp =
    raw?.ts ??
    raw?.timestamp ??
    raw?.created_at ??
    raw?.updatedAt ??
    raw?.blockTimestamp ??
    new Date().toISOString();
  const marketId =
    raw?.marketId ??
    raw?.market_id ??
    raw?.contractId ??
    raw?.market?.id ??
    raw?.market?.marketId;
  const marketTitle =
    raw?.marketTitle ??
    raw?.market?.title ??
    raw?.title ??
    raw?.market?.name ??
    raw?.market;
  const side = (raw?.side ?? raw?.outcome ?? raw?.direction ?? 'YES').toString().toUpperCase();
  const price = Number(raw?.price ?? raw?.fill_price ?? raw?.avg_price ?? raw?.limit ?? 0);
  const sizeUsd = Number(raw?.size ?? raw?.notional ?? raw?.amount ?? raw?.sizeUsd ?? 0);
  const id =
    raw?.id ??
    raw?.tradeId ??
    raw?.fillId ??
    raw?.orderId ??
    `${wallet}-${timestamp}-${index}`;

  return {
    id,
    ts: timestamp,
    marketId,
    marketTitle,
    side,
    price,
    sizeUsd,
    raw,
  };
}

function safeStorage() {
  if (typeof localStorage === 'undefined') return null;
  return {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    },
  };
}

export async function resolveTargetWallet(handle = TARGET_TRADER_HANDLE) {
  const store = safeStorage();
  if (store) {
    const cached = store.get(WALLET_CACHE_KEY);
    if (cached) return cached;
  }

  const normalizedHandle = sanitized(handle);
  const response = await fetch(`${GAMMA_BASE}/public-search?q=${encodeURIComponent(handle)}`);
  if (!response.ok) {
    throw new Error('Unable to resolve Polymarket handle');
  }

  const payload = await response.json();
  const entries = extractArray(payload);
  const match = entries.find((entry) => {
    const handleValue =
      entry?.handle ??
      entry?.attributes?.handle ??
      entry?.attributes?.display_name ??
      entry?.attributes?.name ??
      '';
    return sanitized(handleValue) === normalizedHandle;
  });

  const wallet =
    match?.wallet ??
    match?.walletAddress ??
    match?.attributes?.walletAddress ??
    match?.attributes?.wallet ??
    match?.attributes?.wallet_address ??
    null;

  if (!wallet) {
    throw new Error('Trader wallet could not be found.');
  }

  if (store) {
    store.set(WALLET_CACHE_KEY, wallet);
  }

  return wallet;
}

export async function fetchWalletTrades(wallet, limit = 12) {
  if (!wallet) return [];
  for (const endpoint of TRADE_ENDPOINTS) {
    const url = endpoint(wallet, limit);
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();
      const items = extractArray(payload);
      if (!items.length) continue;
      return items
        .map((item, index) => normalizeTrade(item, wallet, index))
        .filter((trade) => Boolean(trade.marketId && trade.id))
        .sort((a, b) => new Date(b.ts).valueOf() - new Date(a.ts).valueOf());
    } catch (error) {
      console.warn('[copyEngine] failed to fetch', url, error);
      continue;
    }
  }
  return [];
}

export function persistSeenTradeIds(ids) {
  const store = safeStorage();
  if (!store) return;
  const trimmed = ids.slice(-MAX_STORED_TRADES);
  store.set(TRADE_CACHE_KEY, JSON.stringify(trimmed));
}

export function loadSeenTradeIds() {
  const store = safeStorage();
  if (!store) return [];
  try {
    const payload = store.get(TRADE_CACHE_KEY);
    const parsed = payload ? JSON.parse(payload) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

import 'dotenv/config';
import { ClobClient, Side } from '@polymarket/clob-client';
import { SignatureType } from '@polymarket/order-utils';
import { ArbOpportunity, BotConfig, OrderResult } from '../types.js';
import { Broker } from './interface.js';

// ─── Env vars — same names as the main app (VITE_ prefix) ────────────────────
// The bot reads these from its own local .env file when running in Terminal.
// They are never exposed to the browser.
const API_KEY = process.env.VITE_POLY_API_KEY ?? '';
const API_SECRET = process.env.VITE_POLY_API_SECRET ?? '';
const API_PASSPHRASE = process.env.VITE_POLY_API_PASSPHRASE ?? '';
const PROXY_WALLET = process.env.VITE_POLY_PROXY_WALLET ?? '';

// DRY_RUN=true (default) → log what would happen but never call the API.
// DRY_RUN=false          → send real orders.
const DRY_RUN = process.env.DRY_RUN !== 'false';

const hasLiveCreds =
  Boolean(API_KEY) && Boolean(API_SECRET) && Boolean(API_PASSPHRASE) && Boolean(PROXY_WALLET);

// ─── ClobClient singleton (only built when creds are present) ─────────────────
function buildClient(): ClobClient {
  if (!hasLiveCreds) {
    throw new Error(
      '[LiveBroker] Missing Polymarket credentials.\n' +
      'Set VITE_POLY_API_KEY, VITE_POLY_API_SECRET, VITE_POLY_API_PASSPHRASE, ' +
      'VITE_POLY_PROXY_WALLET in bots/btc-bot-v1/.env',
    );
  }
  return new ClobClient(
    'https://clob.polymarket.com',
    137, // Polygon mainnet
    undefined,
    { key: API_KEY, secret: API_SECRET, passphrase: API_PASSPHRASE },
    SignatureType.POLY_PROXY,
    PROXY_WALLET,
  );
}

// Lazy singleton — only instantiated on first real order attempt.
let _client: ClobClient | null = null;
function getClient(): ClobClient {
  if (!_client) _client = buildClient();
  return _client;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseOrderResult(raw: unknown, shares: number, price: number): OrderResult {
  // @polymarket/clob-client returns different shapes depending on version.
  // We normalise to our internal OrderResult type.
  const r = raw as Record<string, unknown>;
  const orderId = (r?.orderID ?? r?.order_id ?? r?.id ?? `LIVE-${Date.now()}`) as string;

  // Treat any non-error response as FILLED for now.
  // If the client throws, the error propagates and is handled in runner.ts.
  return {
    orderId: String(orderId),
    status: 'FILLED',
    filledShares: shares,
    avgPrice: price,
  };
}

// ─── LiveBroker ───────────────────────────────────────────────────────────────
export class LiveBroker implements Broker {
  async placeArbOrders(
    opp: ArbOpportunity,
    _cfg: BotConfig,
  ): Promise<{ yes: OrderResult; no: OrderResult }> {
    if (DRY_RUN) {
      console.log(`[LiveBroker][DRY_RUN] Would place arb orders for: "${opp.title}"`);
      console.log(`  YES: ${opp.shares} shares @ ${opp.yesAsk} — token ${opp.yesTokenId}`);
      console.log(`  NO:  ${opp.shares} shares @ ${opp.noAsk} — token ${opp.noTokenId}`);
      console.log(`  Estimated cost: $${opp.estimatedUsdCost.toFixed(2)} | Effective edge: ${(opp.effectiveEdge * 100).toFixed(3)}%`);
      const dry = (price: number): OrderResult => ({
        orderId: `DRY-${Date.now()}`,
        status: 'FILLED',
        filledShares: opp.shares,
        avgPrice: price,
      });
      return { yes: dry(opp.yesAsk), no: dry(opp.noAsk) };
    }

    const client = getClient();

    // Submit both legs concurrently; if either throws, let the error propagate
    // to runner.ts which handles partial-fill protection.
    const [yesRaw, noRaw] = await Promise.all([
      client.createAndPostMarketOrder({
        tokenID: opp.yesTokenId,
        side: Side.BUY,
        amount: opp.shares,
        price: opp.yesAsk,
      }),
      client.createAndPostMarketOrder({
        tokenID: opp.noTokenId,
        side: Side.BUY,
        amount: opp.shares,
        price: opp.noAsk,
      }),
    ]);

    return {
      yes: parseOrderResult(yesRaw, opp.shares, opp.yesAsk),
      no: parseOrderResult(noRaw, opp.shares, opp.noAsk),
    };
  }

  async flattenPosition(
    tokenId: string,
    shares: number,
    bestBidPrice: number,
    _cfg: BotConfig,
  ): Promise<boolean> {
    if (DRY_RUN) {
      console.log(`[LiveBroker][DRY_RUN] Would flatten: tokenId=${tokenId} shares=${shares} bid=${bestBidPrice}`);
      return true;
    }

    const client = getClient();

    try {
      // Sell the filled position at best bid to flatten.
      await client.createAndPostMarketOrder({
        tokenID: tokenId,
        side: Side.SELL,
        amount: shares,
        price: bestBidPrice,
      });
      return true;
    } catch (err) {
      console.error('[LiveBroker] Flatten failed:', err);
      return false;
    }
  }
}

// ─── Startup log ─────────────────────────────────────────────────────────────
if (DRY_RUN) {
  console.log('[LiveBroker] DRY_RUN=true — no real orders will be placed.');
} else if (!hasLiveCreds) {
  console.warn('[LiveBroker] DRY_RUN=false but credentials missing — LIVE orders will fail.');
} else {
  console.log('[LiveBroker] DRY_RUN=false + credentials present — LIVE orders ENABLED.');
}

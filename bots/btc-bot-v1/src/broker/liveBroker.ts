import 'dotenv/config';
import { ArbOpportunity, BotConfig, OrderResult } from '../types.js';
import { Broker } from './interface.js';

// ─── Live Broker ──────────────────────────────────────────────────────────────
// Wraps the Polymarket CLOB client for real order placement.
// Currently STUBBED: wire up ClobClient when ready to go live.
//
// To activate:
//   1. Confirm POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE, POLY_PROXY_WALLET
//      are in your .env file.
//   2. Replace the stub bodies below with actual ClobClient calls,
//      mirroring the pattern in /src/services/polymarket.ts in the main app.
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = process.env.POLY_API_KEY ?? '';
const API_SECRET = process.env.POLY_API_SECRET ?? '';
const API_PASSPHRASE = process.env.POLY_API_PASSPHRASE ?? '';
const PROXY_WALLET = process.env.POLY_PROXY_WALLET ?? '';

const hasLiveCreds =
  Boolean(API_KEY) && Boolean(API_SECRET) && Boolean(API_PASSPHRASE) && Boolean(PROXY_WALLET);

if (!hasLiveCreds) {
  console.warn(
    '[LiveBroker] WARNING: Live credentials not found. ' +
    'LiveBroker will throw if called. Switch mode to PAPER.',
  );
}

export class LiveBroker implements Broker {
  async placeArbOrders(
    opp: ArbOpportunity,
    cfg: BotConfig,
  ): Promise<{ yes: OrderResult; no: OrderResult }> {
    if (!hasLiveCreds) {
      throw new Error(
        'LiveBroker: Missing Polymarket API credentials. ' +
        'Set POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE, POLY_PROXY_WALLET in .env.',
      );
    }

    // ── STUB: replace with real ClobClient calls ──────────────────────────────
    // Example (using @polymarket/clob-client):
    //
    //   const client = new ClobClient(
    //     'https://clob.polymarket.com',
    //     137,                          // Polygon mainnet
    //     undefined,                    // provider (not needed for proxy wallet)
    //     { key: API_KEY, secret: API_SECRET, passphrase: API_PASSPHRASE },
    //     SignatureType.POLY_PROXY,
    //     PROXY_WALLET,
    //   );
    //
    //   const yesOrder = await client.createAndPostMarketOrder({
    //     tokenID: opp.yesTokenId,
    //     side: Side.BUY,
    //     amount: opp.shares,
    //     price: opp.yesAsk,
    //   });
    //   const noOrder = await client.createAndPostMarketOrder({
    //     tokenID: opp.noTokenId,
    //     side: Side.BUY,
    //     amount: opp.shares,
    //     price: opp.noAsk,
    //   });
    // ──────────────────────────────────────────────────────────────────────────

    console.log('[LiveBroker] STUB — would place orders for:', opp.title);
    console.log(`  YES: ${opp.shares} shares @ ${opp.yesAsk}`);
    console.log(`  NO:  ${opp.shares} shares @ ${opp.noAsk}`);

    // Return as if filled for stub purposes (real impl replaces this)
    const stub = (price: number): OrderResult => ({
      orderId: `LIVE-STUB-${Date.now()}`,
      status: 'FILLED',
      filledShares: opp.shares,
      avgPrice: price,
    });

    return { yes: stub(opp.yesAsk), no: stub(opp.noAsk) };
  }

  async flattenPosition(
    tokenId: string,
    shares: number,
    bestBidPrice: number,
    _cfg: BotConfig,
  ): Promise<boolean> {
    if (!hasLiveCreds) throw new Error('LiveBroker: Missing credentials for flatten.');

    // ── STUB: replace with real cancel + sell order ───────────────────────────
    console.log(`[LiveBroker] STUB — would flatten: tokenId=${tokenId} shares=${shares} bid=${bestBidPrice}`);
    return true;
  }
}

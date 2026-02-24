import { ArbOpportunity, BotConfig, OrderResult } from '../types.js';
import { Broker } from './interface.js';

// Simulates orderbook fills with randomised latency and occasional partial fills.
export class SimBroker implements Broker {
  private delay(): Promise<void> {
    const ms = 300 + Math.random() * 500; // 300–800ms
    return new Promise((r) => setTimeout(r, ms));
  }

  private simulateFill(
    shares: number,
    price: number,
  ): OrderResult {
    const roll = Math.random();

    // ~80% full fill, ~15% partial, ~5% unfilled
    let status: OrderResult['status'];
    let filledShares: number;

    if (roll > 0.20) {
      status = 'FILLED';
      filledShares = shares;
    } else if (roll > 0.05) {
      status = 'PARTIAL';
      filledShares = Math.max(1, Math.floor(shares * (0.3 + Math.random() * 0.5)));
    } else {
      status = 'UNFILLED';
      filledShares = 0;
    }

    return {
      orderId: `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status,
      filledShares,
      avgPrice: price,
    };
  }

  async placeArbOrders(
    opp: ArbOpportunity,
    _cfg: BotConfig,
  ): Promise<{ yes: OrderResult; no: OrderResult }> {
    // Simulate concurrent order submission with individual latency
    const [yes, no] = await Promise.all([
      this.delay().then(() => this.simulateFill(opp.shares, opp.yesAsk)),
      this.delay().then(() => this.simulateFill(opp.shares, opp.noAsk)),
    ]);

    return { yes, no };
  }

  async flattenPosition(
    tokenId: string,
    shares: number,
    bestBidPrice: number,
    _cfg: BotConfig,
  ): Promise<boolean> {
    await this.delay();
    console.log(
      `[SimBroker] Flattening position: tokenId=${tokenId} shares=${shares} bidPrice=${bestBidPrice}`,
    );
    // Simulate a 90% success rate for flatten
    return Math.random() > 0.10;
  }
}

import { ArbOpportunity, BotConfig, OrderResult } from '../types.js';

export interface Broker {
  /**
   * Attempt to place both legs of a Dutch-book arb simultaneously.
   * Returns results for each leg independently so partial-fill logic can act.
   */
  placeArbOrders(
    opp: ArbOpportunity,
    cfg: BotConfig,
  ): Promise<{ yes: OrderResult; no: OrderResult }>;

  /**
   * Flatten (exit/sell) a filled position when the other leg didn't fill.
   * Returns true if the flatten succeeded.
   */
  flattenPosition(
    tokenId: string,
    shares: number,
    bestBidPrice: number,
    cfg: BotConfig,
  ): Promise<boolean>;
}

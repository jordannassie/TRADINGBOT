import { ArbOpportunity, BotConfig, RiskState } from './types.js';

export function createRiskState(): RiskState {
  return {
    openUsd: 0,
    dailyLossUsd: 0,
    tradesThisHour: 0,
    hourWindowStart: Date.now(),
    halted: false,
  };
}

// Returns null if trade is allowed, or a rejection reason string.
export function checkRiskLimits(
  opp: ArbOpportunity,
  cfg: BotConfig,
  state: RiskState,
): string | null {
  if (state.halted) return 'Risk guard: bot is halted.';
  if (cfg.killSwitch) return 'Kill switch is active.';

  // Reset hourly trade counter if window has elapsed
  if (Date.now() - state.hourWindowStart > 3_600_000) {
    state.tradesThisHour = 0;
    state.hourWindowStart = Date.now();
  }

  if (state.tradesThisHour >= cfg.maxTradesPerHour) {
    return `Max trades per hour reached (${cfg.maxTradesPerHour}).`;
  }

  if (state.openUsd + opp.estimatedUsdCost > cfg.maxOpenUsdTotal) {
    return `Max open USD would be exceeded (open=${state.openUsd.toFixed(2)}, new=${opp.estimatedUsdCost.toFixed(2)}, cap=${cfg.maxOpenUsdTotal}).`;
  }

  if (state.dailyLossUsd >= cfg.maxDailyLossUsd) {
    return `Daily loss limit hit (${state.dailyLossUsd.toFixed(2)} >= ${cfg.maxDailyLossUsd}).`;
  }

  return null;
}

export function recordTradeOpen(opp: ArbOpportunity, state: RiskState): void {
  state.openUsd += opp.estimatedUsdCost;
  state.tradesThisHour += 1;
}

export function recordTradeClosed(
  costBasis: number,
  proceeds: number,
  state: RiskState,
): void {
  state.openUsd = Math.max(0, state.openUsd - costBasis);
  const pnl = proceeds - costBasis;
  if (pnl < 0) {
    state.dailyLossUsd += Math.abs(pnl);
  }
}

export function recordFlattenLoss(flattenCost: number, state: RiskState): void {
  state.dailyLossUsd += flattenCost;
  state.openUsd = Math.max(0, state.openUsd - flattenCost);
}

export function haltBot(state: RiskState, reason: string): void {
  state.halted = true;
  console.error(`[riskGuard] HALT triggered: ${reason}`);
}

import { loadConfig } from './config.js';
import { log } from './logger.js';
import { fetchBtcMarkets, fetchMarketOrderbook, evaluateArb } from './scanner.js';
import { Broker } from './broker/interface.js';
import { SimBroker } from './broker/simBroker.js';
import { LiveBroker } from './broker/liveBroker.js';
import {
  createRiskState,
  checkRiskLimits,
  recordTradeOpen,
  recordTradeClosed,
  recordFlattenLoss,
  haltBot,
} from './riskGuard.js';
import { BotConfig, RiskState, ArbOpportunity } from './types.js';

const SCAN_INTERVAL_MS = 5_000;
const CONFIG_REFRESH_INTERVAL_MS = 3_000;

let broker: Broker = new SimBroker();
let cfg: BotConfig;
const risk: RiskState = createRiskState();

// ─── Config polling ────────────────────────────────────────────────────────────
let lastConfigRefresh = 0;

async function maybeRefreshConfig(): Promise<void> {
  if (Date.now() - lastConfigRefresh < CONFIG_REFRESH_INTERVAL_MS) return;
  cfg = await loadConfig();
  lastConfigRefresh = Date.now();

  // Swap broker implementation when mode changes
  if (cfg.mode === 'LIVE') {
    if (!(broker instanceof LiveBroker)) {
      console.log('[runner] Switching to LiveBroker (LIVE mode enabled).');
      broker = new LiveBroker();
    }
  } else {
    if (!(broker instanceof SimBroker)) {
      console.log('[runner] Switching to SimBroker (PAPER mode).');
      broker = new SimBroker();
    }
  }
}

// ─── Partial-fill protection ───────────────────────────────────────────────────
async function handlePartialFill(
  opp: ArbOpportunity,
  filledTokenId: string,
  filledShares: number,
  bestBidPrice: number,
): Promise<void> {
  console.warn(`[runner] Partial fill on ${opp.title}. Attempting flatten...`);

  const ok = await broker.flattenPosition(filledTokenId, filledShares, bestBidPrice, cfg);

  if (ok) {
    const flattenProceeds = filledShares * bestBidPrice;
    const flattenCostBasis = filledShares * (filledTokenId === opp.yesTokenId ? opp.yesAsk : opp.noAsk);
    recordFlattenLoss(flattenCostBasis - flattenProceeds, risk);

    await log('PARTIAL_FILL_FLATTENED', {
      market: opp.title,
      yesAsk: opp.yesAsk,
      noAsk: opp.noAsk,
      sum: opp.sum,
      effectiveEdge: opp.effectiveEdge,
      shares: filledShares,
      message: `Flatten succeeded. Proceeds approx $${flattenProceeds.toFixed(2)}.`,
      meta: { filledTokenId, bestBidPrice },
    });
  } else {
    // Flatten failed → emergency halt
    haltBot(risk, `Flatten failed for ${opp.title}`);
    await log('ERROR', {
      market: opp.title,
      message: 'CRITICAL: Flatten failed after partial fill. Bot halted.',
      meta: { filledTokenId, filledShares, bestBidPrice },
    });
    await log('HALT', {
      market: opp.title,
      message: 'Emergency halt: could not flatten partial fill position.',
    });
  }
}

// ─── Single arb execution ──────────────────────────────────────────────────────
async function executeArb(opp: ArbOpportunity): Promise<void> {
  const riskReason = checkRiskLimits(opp, cfg, risk);

  if (riskReason) {
    await log('SKIPPED', {
      market: opp.title,
      yesAsk: opp.yesAsk,
      noAsk: opp.noAsk,
      sum: opp.sum,
      effectiveEdge: opp.effectiveEdge,
      shares: opp.shares,
      message: riskReason,
    });
    return;
  }

  if (!cfg.executionEnabled && cfg.mode === 'LIVE') {
    await log('SKIPPED', {
      market: opp.title,
      message: 'ExecutionEnabled=false in LIVE mode. Skipping.',
    });
    return;
  }

  await log('ORDER_SUBMITTED', {
    market: opp.title,
    yesAsk: opp.yesAsk,
    noAsk: opp.noAsk,
    sum: opp.sum,
    effectiveEdge: opp.effectiveEdge,
    shares: opp.shares,
    message: `Submitting arb: ${opp.shares} shares each side. Cost ≈ $${opp.estimatedUsdCost.toFixed(2)}`,
  });

  recordTradeOpen(opp, risk);

  const { yes, no } = await broker.placeArbOrders(opp, cfg);

  const bothFilled = yes.status === 'FILLED' && no.status === 'FILLED';
  const yesFilled = yes.status === 'FILLED' || yes.status === 'PARTIAL';
  const noFilled = no.status === 'FILLED' || no.status === 'PARTIAL';

  if (bothFilled) {
    const proceeds = yes.filledShares * yes.avgPrice + no.filledShares * no.avgPrice;
    const costBasis = opp.estimatedUsdCost;
    recordTradeClosed(costBasis, proceeds, risk);

    await log('FILLED', {
      market: opp.title,
      yesAsk: opp.yesAsk,
      noAsk: opp.noAsk,
      sum: opp.sum,
      effectiveEdge: opp.effectiveEdge,
      shares: opp.shares,
      message: `Both legs filled. yesOrderId=${yes.orderId} noOrderId=${no.orderId}`,
      meta: { yesResult: yes, noResult: no },
    });
    return;
  }

  // Partial fill handling
  if (yesFilled && !noFilled) {
    const bestBidPrice = opp.yesAsk * 0.98; // approximate; real impl should fetch live bid
    await handlePartialFill(opp, opp.yesTokenId, yes.filledShares, bestBidPrice);
  } else if (noFilled && !yesFilled) {
    const bestBidPrice = opp.noAsk * 0.98;
    await handlePartialFill(opp, opp.noTokenId, no.filledShares, bestBidPrice);
  } else {
    // Both unfilled — no position, just log
    recordTradeClosed(opp.estimatedUsdCost, opp.estimatedUsdCost, risk); // net zero
    await log('SKIPPED', {
      market: opp.title,
      message: 'Both legs returned UNFILLED.',
      meta: { yesResult: yes, noResult: no },
    });
  }
}

// ─── Single scan cycle ─────────────────────────────────────────────────────────
async function scanCycle(): Promise<void> {
  await maybeRefreshConfig();

  await log('HEARTBEAT', { message: `mode=${cfg.mode} killSwitch=${cfg.killSwitch}` });

  if (cfg.killSwitch) {
    // Still alive, just not scanning
    return;
  }

  if (risk.halted) {
    await log('HALT', { message: 'Bot halted — risk guard engaged. Restart to reset.' });
    return;
  }

  let markets;
  try {
    markets = await fetchBtcMarkets();
  } catch (err) {
    await log('ERROR', { message: `fetchBtcMarkets failed: ${String(err)}` });
    return;
  }

  for (const market of markets) {
    if (risk.halted) break;

    let ob;
    try {
      ob = await fetchMarketOrderbook(market);
    } catch {
      continue;
    }

    if (!ob) continue;

    const opp = evaluateArb(ob, cfg);

    if (!opp) continue;

    await log('OPPORTUNITY', {
      market: opp.title,
      yesAsk: opp.yesAsk,
      noAsk: opp.noAsk,
      sum: opp.sum,
      effectiveEdge: opp.effectiveEdge,
      shares: opp.shares,
      message: `Edge found: rawEdge=${opp.rawEdge.toFixed(4)} effectiveEdge=${opp.effectiveEdge.toFixed(4)}`,
    });

    await executeArb(opp);
  }
}

// ─── Main loop ─────────────────────────────────────────────────────────────────
export async function startRunner(initialConfig: BotConfig): Promise<void> {
  cfg = initialConfig;
  broker = cfg.mode === 'LIVE' ? new LiveBroker() : new SimBroker();

  console.log(`[runner] Starting in ${cfg.mode} mode. killSwitch=${cfg.killSwitch}`);

  const loop = async () => {
    try {
      await scanCycle();
    } catch (err) {
      await log('ERROR', { message: `Unhandled loop error: ${String(err)}` }).catch(() => {});
      console.error('[runner] Unhandled error:', err);
    }
    setTimeout(loop, SCAN_INTERVAL_MS);
  };

  await loop();
}

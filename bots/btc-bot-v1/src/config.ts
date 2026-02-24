import { supabase } from './supabase.js';
import { BotConfig, DEFAULT_CONFIG } from './types.js';

// Fetches config from Supabase; falls back to safe defaults if unavailable.
export async function loadConfig(): Promise<BotConfig> {
  try {
    const { data, error } = await supabase
      .from('btc_bot_config')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) {
      console.warn('[config] Could not load from Supabase, using defaults:', error?.message);
      return safeDefaults();
    }

    return {
      id: data.id ?? 'default',
      mode: data.mode === 'LIVE' ? 'LIVE' : 'PAPER',
      // Double-check: even if DB says true, env guard must agree for LIVE mode
      executionEnabled: Boolean(data.executionEnabled) && envExecutionAllowed(),
      killSwitch: Boolean(data.killSwitch ?? true),
      minEdge: Number(data.minEdge ?? DEFAULT_CONFIG.minEdge),
      feeBuffer: Number(data.feeBuffer ?? DEFAULT_CONFIG.feeBuffer),
      minShares: Number(data.minShares ?? DEFAULT_CONFIG.minShares),
      maxFillMs: Number(data.maxFillMs ?? DEFAULT_CONFIG.maxFillMs),
      maxUsdPerTrade: Number(data.maxUsdPerTrade ?? DEFAULT_CONFIG.maxUsdPerTrade),
      maxOpenUsdTotal: Number(data.maxOpenUsdTotal ?? DEFAULT_CONFIG.maxOpenUsdTotal),
      maxDailyLossUsd: Number(data.maxDailyLossUsd ?? DEFAULT_CONFIG.maxDailyLossUsd),
      maxTradesPerHour: Number(data.maxTradesPerHour ?? DEFAULT_CONFIG.maxTradesPerHour),
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  } catch (err) {
    console.error('[config] Unexpected error loading config:', err);
    return safeDefaults();
  }
}

// Ensures config table exists with the default row.
export async function ensureConfigRow(): Promise<void> {
  const { error } = await supabase
    .from('btc_bot_config')
    .upsert(
      {
        id: 'default',
        mode: 'PAPER',
        executionEnabled: false,
        killSwitch: true,
        minEdge: DEFAULT_CONFIG.minEdge,
        feeBuffer: DEFAULT_CONFIG.feeBuffer,
        minShares: DEFAULT_CONFIG.minShares,
        maxFillMs: DEFAULT_CONFIG.maxFillMs,
        maxUsdPerTrade: DEFAULT_CONFIG.maxUsdPerTrade,
        maxOpenUsdTotal: DEFAULT_CONFIG.maxOpenUsdTotal,
        maxDailyLossUsd: DEFAULT_CONFIG.maxDailyLossUsd,
        maxTradesPerHour: DEFAULT_CONFIG.maxTradesPerHour,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

  if (error) {
    console.warn('[config] Could not upsert default config row:', error.message);
  }
}

function envExecutionAllowed(): boolean {
  return process.env.EXECUTION_ENABLED_DEFAULT === 'true';
}

function safeDefaults(): BotConfig {
  return {
    ...DEFAULT_CONFIG,
    killSwitch: true,
    mode: 'PAPER',
    executionEnabled: false,
  };
}

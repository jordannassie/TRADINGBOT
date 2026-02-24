import { supabase } from './supabase.js';
import { BotEvent, EventType } from './types.js';

let currentRunId = '';
let currentMode: 'PAPER' | 'LIVE' = 'PAPER';

export function setRunContext(runId: string, mode: 'PAPER' | 'LIVE'): void {
  currentRunId = runId;
  currentMode = mode;
}

export async function log(
  type: EventType,
  partial: Partial<BotEvent> = {},
): Promise<void> {
  const event: BotEvent = {
    runId: currentRunId,
    ts: new Date().toISOString(),
    mode: currentMode,
    type,
    ...partial,
  };

  const prefix = `[${event.mode}][${event.type}]`;
  const detail = event.message ?? event.market ?? '';
  if (type !== 'HEARTBEAT') {
    console.log(`${prefix} ${detail}`, event.effectiveEdge != null ? `edge=${event.effectiveEdge.toFixed(4)}` : '');
  }

  const { error } = await supabase.from('btc_bot_events').insert({
    runId: event.runId,
    ts: event.ts,
    mode: event.mode,
    type: event.type,
    market: event.market ?? null,
    yesAsk: event.yesAsk ?? null,
    noAsk: event.noAsk ?? null,
    sum: event.sum ?? null,
    effectiveEdge: event.effectiveEdge ?? null,
    shares: event.shares ?? null,
    message: event.message ?? null,
    meta: event.meta ?? null,
  });

  if (error) {
    console.error(`[logger] Failed to write event (${type}):`, error.message);
  }
}

export async function createRun(): Promise<string> {
  const { data, error } = await supabase
    .from('btc_bot_runs')
    .insert({
      startedAt: new Date().toISOString(),
      status: 'running',
      notes: `Started in ${process.env.NODE_ENV ?? 'development'} mode`,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[logger] Could not create run row:', error?.message);
    // Return a fallback UUID-like string so the bot can still operate
    return `fallback-${Date.now()}`;
  }

  return data.id as string;
}

export async function finalizeRun(runId: string, status: string): Promise<void> {
  await supabase
    .from('btc_bot_runs')
    .update({ status })
    .eq('id', runId);
}

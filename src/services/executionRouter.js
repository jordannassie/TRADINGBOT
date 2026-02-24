import { supabase } from './supabaseClient.js';

const TABLES = {
  orders: 'paper_orders',
  positions: 'paper_positions',
  activity: 'paper_activity_log',
};

const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const toUpper = (value) => (typeof value === 'string' ? value.toUpperCase() : `${value ?? ''}`.toUpperCase());

const randomId = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

async function logActivity(eventType, message, metadata = {}, strategyMode = 'COPY') {
  if (!isSupabaseConfigured) {
    console.warn('[executionRouter] Supabase anon client missing, skipping activity log', eventType);
    return null;
  }

  const payload = {
    id: randomId(),
    ts: new Date().toISOString(),
    event_type: eventType,
    message,
    metadata_json: JSON.stringify(metadata),
    strategy_mode: toUpper(strategyMode),
  };

  const { error } = await supabase.from(TABLES.activity).insert(payload);
  if (error) {
    console.warn('[executionRouter] Failed to log paper activity', error);
  }
  return payload;
}

export async function routeOrder(intent, options = {}) {
  const {
    botOn = true,
    execMode = 'paper',
    strategyMode = 'copy',
  } = options;
  const normalizedExec = (execMode ?? 'paper').toLowerCase();
  const normalizedStrategy = (strategyMode ?? intent.strategyMode ?? 'copy').toLowerCase();

  if (!botOn || normalizedExec !== 'paper' || normalizedStrategy !== 'copy') {
    await logActivity(
      'BLOCKED',
      'Execution blocked: BOT must be ON, PAPER, and COPY to route orders.',
      { intent, botOn, execMode, strategyMode },
      strategyMode,
    );
    return { blocked: true };
  }

  if (!isSupabaseConfigured) {
    const error = new Error('Supabase anon client is not configured.');
    await logActivity('ERROR', error.message, { intent }, 'COPY');
    return { success: false, error };
  }

  try {
    const ts = new Date().toISOString();
    const orderId = randomId();
    const positionId = randomId();
    const strategyLabel = toUpper(intent.strategyMode ?? strategyMode ?? 'copy');

    const orderPayload = {
      id: orderId,
      ts,
      strategy_mode: strategyLabel,
      market_id: intent.marketId,
      side: intent.side,
      price: intent.limitPrice ?? 0,
      size_usd: intent.sizeUsd,
      status: 'FILLED',
      source_ref: intent.sourceRef ?? 'simulation',
    };

    const { error: orderError } = await supabase.from(TABLES.orders).insert(orderPayload);
    if (orderError) {
      await logActivity(
        'ERROR',
        `Paper order insert failed: ${orderError.message}`,
        { intent, orderId },
        strategyLabel,
      );
      return { success: false, error: orderError };
    }

    const positionPayload = {
      id: positionId,
      opened_at: ts,
      market_id: intent.marketId,
      side: intent.side,
      avg_entry: orderPayload.price,
      size: orderPayload.size_usd,
      status: 'OPEN',
      realized_pnl: 0,
      unrealized_pnl: 0,
      strategy_mode: strategyLabel,
      source_ref: intent.sourceRef ?? 'simulation',
    };

    const { error: positionError } = await supabase
      .from(TABLES.positions)
      .upsert(positionPayload, { onConflict: 'id' });
    if (positionError) {
      await logActivity(
        'ERROR',
        `Paper position insert failed: ${positionError.message}`,
        { intent, positionId },
        strategyLabel,
      );
      return { success: false, error: positionError };
    }

    await logActivity(
      'ORDER_CREATED',
      'Simulated paper order recorded.',
      { intent, orderId },
      strategyLabel,
    );
    await logActivity(
      'POSITION_UPDATED',
      'Simulated paper position recorded.',
      { intent, orderId, positionId },
      strategyLabel,
    );

    return { success: true, orderId, positionId };
  } catch (error) {
    await logActivity('ERROR', 'Unexpected simulation failure.', { error: String(error), intent }, 'COPY');
    return { success: false, error };
  }
}

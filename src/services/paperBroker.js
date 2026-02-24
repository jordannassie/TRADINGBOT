import crypto from 'crypto';
import { getServerSupabaseClient } from './supabaseServerClient.js';

const TABLES = {
  orders: 'paper_orders',
  fills: 'paper_fills',
  positions: 'paper_positions',
  activity: 'paper_activity_log',
};

export async function logActivity(eventType, message, metadata = {}, strategyMode) {
  const client = getServerSupabaseClient();
  try {
    await client.from(TABLES.activity).insert({
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      event_type: eventType,
      message,
      metadata_json: JSON.stringify(metadata),
      strategy_mode: strategyMode,
    });
  } catch (error) {
    console.warn('[paperBroker] activity log failed', error);
  }
}

export async function placeOrderPaper(intent) {
  const client = getServerSupabaseClient();
  const ts = new Date().toISOString();
  const orderId = crypto.randomUUID();
  const orderPayload = {
    id: orderId,
    ts,
    strategy_mode: intent.strategyMode,
    market_id: intent.marketId,
    side: intent.side,
    price: intent.limitPrice ?? 0,
    size_usd: intent.sizeUsd,
    status: 'FILLED',
    source_ref: intent.sourceRef ?? null,
  };

  await logActivity('ORDER_CREATED', 'Paper order created', { intent, orderId }, intent.strategyMode);
  await client.from(TABLES.orders).insert(orderPayload);

  const fillId = crypto.randomUUID();
  const fillPayload = {
    id: fillId,
    order_id: orderId,
    ts,
    fill_price: orderPayload.price,
    fill_size: orderPayload.size_usd,
    fee: 0,
  };
  await logActivity('FILL_CREATED', 'Paper fill recorded', { orderId, fillId }, intent.strategyMode);
  await client.from(TABLES.fills).insert(fillPayload);

  const positionId = crypto.randomUUID();
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
    strategy_mode: intent.strategyMode,
    source_ref: intent.sourceRef ?? null,
  };
  await logActivity('POSITION_UPDATED', 'Paper position updated', { positionId, orderId }, intent.strategyMode);
  await client.from(TABLES.positions).upsert(positionPayload, { onConflict: 'id' });

  return { orderId, fillId, positionId };
}

export async function cancelOrderPaper() {
  await logActivity('CANCEL_SKIPPED', 'Cancel called (noop for MVP)', {}, null);
  return { success: false, message: 'Paper cancel not implemented yet.' };
}

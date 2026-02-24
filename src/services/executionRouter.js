import { supabase } from './supabaseClient.js';

const TABLES = {
  activity: 'paper_activity_log',
};
const FUNCTION_URL = '/.netlify/functions/paper-execute';

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
    detection = null,
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
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, detection }),
    });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error ?? 'Paper execution failed';
      await logActivity('ERROR', message, { intent, detection }, strategyMode);
      return { success: false, error: new Error(message) };
    }
    return { success: true, result: payload };
  } catch (error) {
    await logActivity('ERROR', 'Copy engine request failed.', { error: String(error), intent, detection }, strategyMode);
    return { success: false, error };
  }
}

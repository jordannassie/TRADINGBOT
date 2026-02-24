import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient.js';

// ─── Existing constants and helpers (unchanged) ───────────────────────────────
const POLL_INTERVAL_MS = 5_000;

const DEFAULT_CONFIG = {
  id: 'default',
  mode: 'PAPER',
  executionEnabled: false,
  killSwitch: true,
  minEdge: 0.02,
  feeBuffer: 0.01,
  minShares: 50,
  maxUsdPerTrade: 25,
  maxOpenUsdTotal: 200,
  maxDailyLossUsd: 100,
  maxTradesPerHour: 60,
  updatedAt: null,
};

function formatTs(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

// ─── Event type tag (terminal style) ─────────────────────────────────────────
const EVENT_TYPE_CLASS = {
  OPPORTUNITY: 'g-tag--active',
  ORDER_SUBMITTED: 'g-tag g-tag--mode',
  FILLED: 'g-tag--active',
  PARTIAL_FILL_FLATTENED: 'g-tag--warn',
  SKIPPED: 'g-tag--watch',
  HALT: 'g-tag--danger',
  ERROR: 'g-tag--danger',
  HEARTBEAT: 'g-tag--mode',
};

function EventTypeTag({ type }) {
  const cls = EVENT_TYPE_CLASS[type] ?? 'g-tag--mode';
  return <span className={`g-tag ${cls}`}>{type}</span>;
}

// ─── Main BTC Bot Dashboard ───────────────────────────────────────────────────
export default function BtcBot() {
  // ── Existing state and data wiring (unchanged) ────────────────────────────────
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [opportunities, setOpportunities] = useState([]);
  const [execEvents, setExecEvents] = useState([]);
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [configRes, eventsRes] = await Promise.all([
        supabase.from('btc_bot_config').select('*').eq('id', 'default').single(),
        supabase
          .from('btc_bot_events')
          .select('*')
          .order('ts', { ascending: false })
          .limit(100),
      ]);

      if (configRes.data) setConfig(configRes.data);

      const events = eventsRes.data ?? [];
      const hb = events.find((e) => e.type === 'HEARTBEAT');
      if (hb) setLastHeartbeat(hb.ts);

      setOpportunities(events.filter((e) => e.type === 'OPPORTUNITY').slice(0, 50));
      setExecEvents(
        events
          .filter((e) => ['ORDER_SUBMITTED', 'FILLED', 'PARTIAL_FILL_FLATTENED', 'SKIPPED', 'HALT', 'ERROR'].includes(e.type))
          .slice(0, 50),
      );
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const isLive = config.mode === 'LIVE';
  const ksActive = Boolean(config.killSwitch);
  const execEnabled = Boolean(config.executionEnabled);
  const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL);

  return (
    <div className="page-stack g-dashboard">
      {/* ── Page header ── */}
      <div className="t-page-header">
        <div>
          <span className="t-eyebrow">BTC Bot v1</span>
          <h1 className="t-page-title">Bitcoin Arbitrage Dashboard</h1>
          <p className="g-dim" style={{ fontSize: 12, marginTop: 2 }}>
            Dutch-book arb scanner · "Bitcoin Up or Down" markets only
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`g-status-dot${ksActive ? ' g-status-halted' : ' g-status-ok'}`} />
          <span className="t-page-count">{ksActive ? 'HALTED' : 'SCANNING'}</span>
          <span className="g-dim" style={{ fontSize: 11 }}>Heartbeat: {formatTs(lastHeartbeat)}</span>
        </div>
      </div>

      {!hasSupabase && (
        <div className="kill-switch-banner">
          VITE_SUPABASE_URL not set — showing defaults, not live data.
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
        </div>
      )}
      {error && <div className="kill-switch-banner">Supabase error: {error}</div>}
      {ksActive && (
        <div className="kill-switch-banner">
          Kill switch ACTIVE — not scanning. Edit <code>killSwitch</code> in Supabase (<code>btc_bot_config</code>) to resume.
        </div>
      )}

      {/* ── Config summary bar ── */}
      <div className="g-pnl-bar">
        <div className="g-pnl-group">
          <span className="g-pnl-label">Mode</span>
          <span className={`g-pnl-val${isLive ? ' g-neg' : ' g-pos'}`} style={{ fontSize: 16 }}>{config.mode}</span>
        </div>
        <div className="g-pnl-group">
          <span className="g-pnl-label">Execution</span>
          <span className={`g-pnl-val${execEnabled ? ' g-pos' : ' g-dim'}`} style={{ fontSize: 16 }}>{execEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="g-pnl-group">
          <span className="g-pnl-label">Kill Switch</span>
          <span className={`g-pnl-val${ksActive ? ' g-neg' : ' g-pos'}`} style={{ fontSize: 16 }}>{ksActive ? 'Active' : 'Standby'}</span>
        </div>
        <div className="g-pnl-divider" />
        <div className="g-pnl-group">
          <span className="g-pnl-label g-pnl-label--dim">Min Edge</span>
          <span className="g-pnl-val g-pnl-val--sm">{((config.minEdge ?? 0) * 100).toFixed(2)}%</span>
        </div>
        <div className="g-pnl-group">
          <span className="g-pnl-label g-pnl-label--dim">Fee Buffer</span>
          <span className="g-pnl-val g-pnl-val--sm">{((config.feeBuffer ?? 0) * 100).toFixed(2)}%</span>
        </div>
        <div className="g-pnl-group">
          <span className="g-pnl-label g-pnl-label--dim">Max USD/Trade</span>
          <span className="g-pnl-val g-pnl-val--sm">${config.maxUsdPerTrade}</span>
        </div>
        <div className="g-pnl-group">
          <span className="g-pnl-label g-pnl-label--dim">Daily Loss Cap</span>
          <span className="g-pnl-val g-pnl-val--sm">${config.maxDailyLossUsd}</span>
        </div>
      </div>

      {/* ── Config note ── */}
      <div className="t-info-strip">
        Config is edited in Supabase (<code>btc_bot_config</code>, row id = "default"). Changes apply within ~3s.
        Last updated: {formatTs(config.updatedAt)}
      </div>

      {/* ── Two-column: Opportunities + Execution ── */}
      <div className="t-two-col">
        {/* Opportunities */}
        <section className="g-section">
          <div className="g-section-header">
            <h2 className="g-section-title">Opportunities</h2>
            <span className="g-section-meta">Last 50 OPPORTUNITY events</span>
          </div>
          {loading ? (
            <p className="g-empty">Loading…</p>
          ) : opportunities.length === 0 ? (
            <p className="g-empty">No opportunities yet. Bot must be running and not kill-switched.</p>
          ) : (
            <div className="g-table-wrap">
              <table className="g-table">
                <thead>
                  <tr><th>Market</th><th>Yes Ask</th><th>No Ask</th><th>Edge</th><th>Shares</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {opportunities.map((ev) => (
                    <tr key={ev.id}>
                      <td className="g-market-cell">{ev.market ?? '—'}</td>
                      <td className="g-mono">{ev.yesAsk != null ? ev.yesAsk.toFixed(3) : '—'}</td>
                      <td className="g-mono">{ev.noAsk != null ? ev.noAsk.toFixed(3) : '—'}</td>
                      <td className={`g-mono${(ev.effectiveEdge ?? 0) > 0 ? ' g-pos' : ' g-dim'}`}>
                        {ev.effectiveEdge != null ? `${(ev.effectiveEdge * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="g-mono">{ev.shares ?? '—'}</td>
                      <td className="g-mono g-dim t-ts">{formatTs(ev.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Execution log */}
        <section className="g-section">
          <div className="g-section-header">
            <h2 className="g-section-title">Execution Log</h2>
            <span className="g-section-meta">Orders · Fills · Skips · Errors</span>
          </div>
          {loading ? (
            <p className="g-empty">Loading…</p>
          ) : execEvents.length === 0 ? (
            <p className="g-empty">No execution events yet.</p>
          ) : (
            <div className="g-table-wrap">
              <table className="g-table">
                <thead>
                  <tr><th>Type</th><th>Market</th><th>Edge</th><th>Message</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {execEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td><EventTypeTag type={ev.type} /></td>
                      <td className="g-market-cell">{ev.market ?? '—'}</td>
                      <td className="g-mono g-dim">
                        {ev.effectiveEdge != null ? `${(ev.effectiveEdge * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="g-dim" style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.message ?? '—'}</td>
                      <td className="g-mono g-dim t-ts">{formatTs(ev.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── Setup reminder ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Setup</h2>
        </div>
        <p className="g-empty" style={{ paddingBottom: 20 }}>
          Terminal: <code>cd bots/btc-bot-v1 &amp;&amp; npm install &amp;&amp; npm start</code>
          {' '}· Run <code>npm run test:live</code> to verify creds without placing orders.
          {' '}See <strong>bots/btc-bot-v1/README.md</strong> for full setup and Supabase SQL.
        </p>
      </section>
    </div>
  );
}

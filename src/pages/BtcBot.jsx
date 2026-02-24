import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient.js';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTs(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function Badge({ value, onLabel = 'YES', offLabel = 'NO', danger = false }) {
  const active = Boolean(value);
  const style = active
    ? danger
      ? 'btc-badge btc-badge--danger'
      : 'btc-badge btc-badge--on'
    : 'btc-badge btc-badge--off';
  return <span className={style}>{active ? onLabel : offLabel}</span>;
}

function EventRow({ ev }) {
  const typeClass = `btc-event-type btc-event-type--${ev.type?.toLowerCase() ?? 'info'}`;
  return (
    <li className="btc-event-row">
      <span className={typeClass}>{ev.type}</span>
      <span className="btc-event-market">{ev.market ?? '—'}</span>
      <span className="btc-event-edge">
        {ev.effectiveEdge != null ? `edge ${(ev.effectiveEdge * 100).toFixed(2)}%` : ''}
      </span>
      <span className="btc-event-msg fine">{ev.message ?? ''}</span>
      <span className="btc-event-ts fine">{formatTs(ev.ts)}</span>
    </li>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function BtcBot() {
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

      if (configRes.data) {
        setConfig(configRes.data);
      }

      const events = eventsRes.data ?? [];

      const hb = events.find((e) => e.type === 'HEARTBEAT');
      if (hb) setLastHeartbeat(hb.ts);

      setOpportunities(
        events.filter((e) => e.type === 'OPPORTUNITY').slice(0, 50),
      );

      setExecEvents(
        events
          .filter((e) =>
            ['ORDER_SUBMITTED', 'FILLED', 'PARTIAL_FILL_FLATTENED', 'SKIPPED', 'HALT', 'ERROR'].includes(e.type),
          )
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
    <div className="page-stack">
      {/* ── Header ── */}
      <header className="top-bar">
        <div>
          <p className="eyebrow">BTC Bot v1</p>
          <h1>Bitcoin Arbitrage Dashboard</h1>
          <p className="fine">Dutch-book arb scanner · "Bitcoin Up or Down" markets only</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge value={!ksActive} onLabel="SCANNING" offLabel="HALTED" danger={ksActive} />
          <p className="fine" style={{ marginTop: 6 }}>
            Last heartbeat: {formatTs(lastHeartbeat)}
          </p>
        </div>
      </header>

      {/* ── No Supabase warning ── */}
      {!hasSupabase && (
        <div className="kill-switch-banner">
          VITE_SUPABASE_URL not set — dashboard is showing defaults, not live data.
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
        </div>
      )}

      {error && (
        <div className="kill-switch-banner">
          Supabase error: {error}
        </div>
      )}

      {/* ── At-a-Glance strip ── */}
      <section className="glance-strip">
        <article className="glance-card">
          <p className="metric-label">Mode</p>
          <p className={`metric-value ${isLive ? 'btc-live-value' : ''}`}>
            {config.mode ?? '—'}
          </p>
          <p className="metric-sub">{isLive ? 'Real orders active' : 'Paper simulation'}</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Execution</p>
          <p className="metric-value">{execEnabled ? 'Enabled' : 'Disabled'}</p>
          <p className="metric-sub">{execEnabled ? 'Orders will fire' : 'Orders blocked'}</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Kill Switch</p>
          <p className={`metric-value ${ksActive ? 'btc-danger-value' : ''}`}>
            {ksActive ? 'Active' : 'Standby'}
          </p>
          <p className="metric-sub">{ksActive ? 'Scanning paused' : 'Ready'}</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Min Edge</p>
          <p className="metric-value">{((config.minEdge ?? 0) * 100).toFixed(1)}%</p>
          <p className="metric-sub">Fee buffer: {((config.feeBuffer ?? 0) * 100).toFixed(1)}%</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Max USD / Trade</p>
          <p className="metric-value">${config.maxUsdPerTrade ?? '—'}</p>
          <p className="metric-sub">Open cap: ${config.maxOpenUsdTotal ?? '—'}</p>
        </article>
        <article className="glance-card">
          <p className="metric-label">Daily Loss Cap</p>
          <p className="metric-value">${config.maxDailyLossUsd ?? '—'}</p>
          <p className="metric-sub">Trades/hr: {config.maxTradesPerHour ?? '—'}</p>
        </article>
      </section>

      {/* ── Kill switch active banner ── */}
      {ksActive && (
        <div className="kill-switch-banner">
          Kill switch is ACTIVE — bot is not scanning or placing orders.
          Edit <code>killSwitch</code> in Supabase (<code>btc_bot_config</code>) to resume.
        </div>
      )}

      {/* ── Config (read-only) ── */}
      <section className="card" style={{ padding: '24px 28px' }}>
        <header className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <p className="eyebrow">Configuration</p>
            <h2>Bot Config</h2>
          </div>
        </header>

        <div className="status-message" style={{ marginBottom: 16 }}>
          Config is edited in Supabase (<code>btc_bot_config</code> table, row id = "default").
          Changes apply within ~3 seconds of saving.
        </div>

        <div className="btc-controls-grid">
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Mode</span></span>
            <Badge value={isLive} onLabel="LIVE" offLabel="PAPER" danger={isLive} />
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Kill Switch</span></span>
            <Badge value={ksActive} onLabel="Active (halted)" offLabel="Standby (running)" danger={ksActive} />
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Execution Enabled</span></span>
            <Badge value={execEnabled} onLabel="Yes" offLabel="No" />
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Min Edge</span></span>
            <span className="fine">{((config.minEdge ?? 0) * 100).toFixed(2)}%</span>
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Fee Buffer</span></span>
            <span className="fine">{((config.feeBuffer ?? 0) * 100).toFixed(2)}%</span>
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Max USD / Trade</span></span>
            <span className="fine">${config.maxUsdPerTrade ?? '—'}</span>
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Max Open USD</span></span>
            <span className="fine">${config.maxOpenUsdTotal ?? '—'}</span>
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Daily Loss Cap</span></span>
            <span className="fine">${config.maxDailyLossUsd ?? '—'}</span>
          </div>
          <div className="btc-control-row">
            <span className="btc-control-label"><span>Max Trades / Hour</span></span>
            <span className="fine">{config.maxTradesPerHour ?? '—'}</span>
          </div>
        </div>

        <p className="fine" style={{ marginTop: 16, opacity: 0.6 }}>
          Last updated: {formatTs(config.updatedAt)}
        </p>
      </section>

      {/* ── Opportunities feed ── */}
      <section className="card">
        <header className="section-header">
          <div>
            <p className="eyebrow">Scanner</p>
            <h2>Recent Opportunities</h2>
            <p className="fine">Last 50 OPPORTUNITY events — markets where effective edge ≥ minEdge</p>
          </div>
        </header>
        {loading ? (
          <p className="fine">Loading...</p>
        ) : opportunities.length === 0 ? (
          <p className="fine">
            No opportunities logged yet. Make sure the bot is running and not kill-switched.
          </p>
        ) : (
          <ul className="btc-event-list">
            <li className="btc-event-row btc-event-header">
              <span>Type</span>
              <span>Market</span>
              <span>Edge</span>
              <span>Message</span>
              <span>Time</span>
            </li>
            {opportunities.map((ev) => (
              <EventRow key={ev.id} ev={ev} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Execution log ── */}
      <section className="card">
        <header className="section-header">
          <div>
            <p className="eyebrow">Execution</p>
            <h2>Recent Orders &amp; Fills</h2>
            <p className="fine">ORDER_SUBMITTED · FILLED · PARTIAL_FILL_FLATTENED · SKIPPED · HALT · ERROR</p>
          </div>
        </header>
        {loading ? (
          <p className="fine">Loading...</p>
        ) : execEvents.length === 0 ? (
          <p className="fine">
            No execution events yet. Events appear here when the bot attempts trades.
          </p>
        ) : (
          <ul className="btc-event-list">
            <li className="btc-event-row btc-event-header">
              <span>Type</span>
              <span>Market</span>
              <span>Edge</span>
              <span>Message</span>
              <span>Time</span>
            </li>
            {execEvents.map((ev) => (
              <EventRow key={ev.id} ev={ev} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Setup reminder ── */}
      <section className="card strategy-callout" style={{ marginBottom: 32 }}>
        <p className="eyebrow">Setup</p>
        <h3>Running the bot</h3>
        <p className="fine">
          Terminal: <code>cd bots/btc-bot-v1 &amp;&amp; npm install &amp;&amp; npm start</code>
          <br />
          The bot logs heartbeats every 5s, opportunities as found, and fills/skips on each arb attempt.
          <br />
          See <strong>bots/btc-bot-v1/README.md</strong> for full setup instructions and Supabase SQL.
        </p>
      </section>
    </div>
  );
}

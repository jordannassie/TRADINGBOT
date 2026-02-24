import { useEffect, useMemo, useState } from 'react';
import useLeaderboard from '../hooks/useLeaderboard.js';
import { useCopyList } from '../context/CopyListContext.jsx';

// ─── Existing formatters (unchanged) ─────────────────────────────────────────
const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};
const formatCompact = (value) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
};
const shortAddress = (address) => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—';
const formatExposure = (volume) => {
  if (!Number.isFinite(volume) || volume <= 0) return '—';
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(volume / 1_000).toLocaleString()}K`;
};
const STATUS_ORDER = ['Candidate', 'Vetted', 'Active'];

export default function Traders({ embedded = false }) {
  // ── Existing wiring (unchanged) ───────────────────────────────────────────────
  const { traders, status } = useLeaderboard();
  const { state, addTrader, removeTrader, updateNote, logEvent } = useCopyList();
  const [selectedTrader, setSelectedTrader] = useState(null);

  useEffect(() => {
    if (!selectedTrader && traders.length) setSelectedTrader(traders[0]);
    else if (traders.length && selectedTrader) {
      const exists = traders.some((t) => t.address === selectedTrader.address);
      if (!exists) setSelectedTrader(traders[0]);
    }
  }, [traders, selectedTrader]);

  const groupedTraders = useMemo(() => {
    const base = { Candidate: [], Vetted: [], Active: [] };
    traders.forEach((trader) => {
      const key = STATUS_ORDER.includes(trader.status) ? trader.status : 'Candidate';
      base[key].push(trader);
    });
    return base;
  }, [traders]);

  const promoteToVetted = (trader) => {
    addTrader(trader, 'vetted', 'Auto-vetted from leaderboard');
    logEvent({
      type: 'VETTED', trader: trader.username, action: 'Reviewed',
      market: trader.favoriteMarkets?.[0] || 'Unknown market',
      positionSize: formatExposure(trader.stats?.volume),
      strategy: trader.strategy || 'Core copy flow',
      reason: 'Promoted to vetted list from Traders page',
      detail: 'Promoted to vetted list from Traders page',
    });
  };

  const activateTrader = (trader) => {
    addTrader(trader, 'active', 'Copying with default sizing');
    logEvent({
      type: 'ACTIVATED', trader: trader.username, action: 'Copied',
      market: trader.favoriteMarkets?.[0] || 'Unknown market',
      positionSize: formatExposure(trader.stats?.volume),
      strategy: trader.strategy || 'Core copy flow',
      reason: 'Added to Active Copy list',
      detail: 'Added to Active Copy list',
    });
  };

  const containerClass = embedded ? 'command-embed' : 'page-stack g-dashboard';

  return (
    <div className={containerClass}>
      {!embedded && (
        <div className="t-page-header">
          <div>
            <span className="t-eyebrow">Trader Discovery</span>
            <h1 className="t-page-title">Copy List Intelligence</h1>
          </div>
          <span className="t-page-count">{status === 'loading' ? 'Loading…' : `${traders.length} traders`}</span>
        </div>
      )}

      {/* ── Main leaderboard table ── */}
      {STATUS_ORDER.map((group) => (
        <section className="g-section" key={group}>
          <div className="g-section-header">
            <h2 className="g-section-title">{group}</h2>
            <span className="g-section-meta">{groupedTraders[group].length} traders</span>
          </div>
          <div className="g-table-wrap">
            <table className="g-table">
              <thead>
                <tr>
                  <th>Trader</th>
                  <th>7D PnL</th>
                  <th>30D PnL</th>
                  <th>Volume</th>
                  <th>Score</th>
                  <th>Categories</th>
                  <th>Profile</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedTraders[group].length === 0 ? (
                  <tr><td colSpan={8} className="g-empty">No traders in this cohort yet.</td></tr>
                ) : (
                  groupedTraders[group].map((trader) => (
                    <tr
                      key={trader.address}
                      className={selectedTrader?.address === trader.address ? 't-row-selected' : ''}
                      onClick={() => setSelectedTrader(trader)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="g-bold">{trader.username}</span>
                        <span className="g-mono g-dim" style={{ display: 'block', fontSize: 11 }}>{shortAddress(trader.address)}</span>
                      </td>
                      <td className={`g-mono${(trader.stats?.pnl7d ?? 0) >= 0 ? ' g-pos' : ' g-neg'}`}>{formatCurrency(trader.stats?.pnl7d)}</td>
                      <td className={`g-mono${(trader.stats?.pnl30d ?? 0) >= 0 ? ' g-pos' : ' g-neg'}`}>{formatCurrency(trader.stats?.pnl30d)}</td>
                      <td className="g-mono">{formatCompact(trader.stats?.volume)}</td>
                      <td className="g-mono">{trader.copyScore}</td>
                      <td className="g-dim" style={{ fontSize: 12 }}>{trader.categories?.slice(0, 2).join(', ') || '—'}</td>
                      <td>
                        <a href={trader.polymarketUrl} target="_blank" rel="noreferrer" className="g-link" onClick={(e) => e.stopPropagation()}>
                          View ↗
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="t-btn t-btn--sm" onClick={(e) => { e.stopPropagation(); promoteToVetted(trader); }}>Vet</button>
                          <button type="button" className="t-btn t-btn--sm t-btn--green" onClick={(e) => { e.stopPropagation(); activateTrader(trader); }}>Activate</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* ── Selected trader info panel ── */}
      {selectedTrader && (
        <section className="g-section">
          <div className="g-section-header">
            <h2 className="g-section-title">Selected: {selectedTrader.username}</h2>
            <a href={selectedTrader.polymarketUrl} target="_blank" rel="noreferrer" className="g-link">Full profile ↗</a>
          </div>
          <div className="t-info-grid">
            <div className="g-panel-item"><span className="g-panel-label">CopyScore</span><span className="g-panel-val">{selectedTrader.copyScore}</span></div>
            <div className="g-panel-item"><span className="g-panel-label">Volume</span><span className="g-panel-val">{formatCompact(selectedTrader.stats?.volume)}</span></div>
            <div className="g-panel-item"><span className="g-panel-label">7D PnL</span><span className={`g-panel-val${(selectedTrader.stats?.pnl7d ?? 0) >= 0 ? ' g-pos' : ' g-neg'}`}>{formatCurrency(selectedTrader.stats?.pnl7d)}</span></div>
            <div className="g-panel-item"><span className="g-panel-label">Status</span><span className="g-panel-val">{selectedTrader.status}</span></div>
          </div>
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--g-border)' }}>
            <p className="g-panel-label" style={{ marginBottom: 6 }}>Summary</p>
            <p className="g-dim" style={{ fontSize: 13, lineHeight: 1.6 }}>{selectedTrader.summary || '—'}</p>
          </div>
          {selectedTrader.favoriteMarkets?.length > 0 && (
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--g-border)' }}>
              <p className="g-panel-label" style={{ marginBottom: 6 }}>Favourite Markets</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selectedTrader.favoriteMarkets.map((m) => <li key={m} className="g-dim" style={{ fontSize: 13 }}>{m}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* ── Copy lists ── */}
      {['vetted', 'active'].map((listKey) => {
        const list = state[listKey] ?? [];
        return (
          <section className="g-section" key={listKey}>
            <div className="g-section-header">
              <h2 className="g-section-title">{listKey.charAt(0).toUpperCase() + listKey.slice(1)} Copy List</h2>
              <span className="g-section-meta">{list.length} traders</span>
            </div>
            {list.length === 0 ? (
              <p className="g-empty">No traders in this list yet.</p>
            ) : (
              <div className="g-table-wrap">
                <table className="g-table">
                  <thead><tr><th>Trader</th><th>Address</th><th>Note</th><th></th></tr></thead>
                  <tbody>
                    {list.map((trader) => {
                      const key = trader.address || trader.username;
                      return (
                        <tr key={key}>
                          <td className="g-bold">{trader.username}</td>
                          <td className="g-mono g-dim">{shortAddress(key)}</td>
                          <td>
                            <textarea
                              className="t-note-input"
                              placeholder="Why we copy"
                              value={trader.note || ''}
                              onChange={(e) => updateNote(listKey, key, e.target.value)}
                            />
                          </td>
                          <td>
                            <button className="t-btn t-btn--sm" onClick={() => removeTrader(listKey, key)}>Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

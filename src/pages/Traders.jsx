import { useEffect, useMemo, useState } from 'react';
import useLeaderboard from '../hooks/useLeaderboard.js';
import { useCopyList } from '../context/CopyListContext.jsx';

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompact = (value) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
};

const shortAddress = (address) =>
  address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—';

const STATUS_ORDER = ['Candidate', 'Vetted', 'Active'];

const TraderRow = ({ trader, onSelect, isSelected, onVet, onActivate }) => (
  <tr
    className={`trader-row ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(trader)}
  >
    <td>
      <div className="trader-handle">
        <strong>{trader.username}</strong>
        <span>{shortAddress(trader.address)}</span>
      </div>
    </td>
    <td>{formatCurrency(trader.stats?.pnl7d)}</td>
    <td>{formatCurrency(trader.stats?.pnl30d)}</td>
    <td>{formatCompact(trader.stats?.volume)}</td>
    <td>{trader.copyScore}</td>
    <td>{trader.categories?.slice(0, 2).join(', ') || '—'}</td>
    <td>
      <a href={trader.polymarketUrl} target="_blank" rel="noreferrer">
        View on Polymarket ↗
      </a>
    </td>
    <td>
      <div className="table-actions">
        <button
          type="button"
          className="ghost-btn"
          onClick={(event) => {
            event.stopPropagation();
            onVet(trader);
          }}
        >
          Vet
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={(event) => {
            event.stopPropagation();
            onActivate(trader);
          }}
        >
          Activate
        </button>
      </div>
    </td>
  </tr>
);

const TradersInfo = ({ trader }) => {
  if (!trader) {
    return (
      <div className="info-placeholder">
        <p className="fine">Select a trader to preview their profile summary and favorite markets.</p>
      </div>
    );
  }

  return (
    <div className="info-content">
      <p className="eyebrow">Profile summary</p>
      <h3>{trader.username}</h3>
      <p className="info-summary">{trader.summary}</p>
      <div className="info-stats">
        <div>
          <p className="metric-label">CopyScore</p>
          <p className="metric-value">{trader.copyScore}</p>
        </div>
        <div>
          <p className="metric-label">Volume</p>
          <p className="metric-value">{formatCompact(trader.stats?.volume)}</p>
        </div>
        <div>
          <p className="metric-label">7D PnL</p>
          <p className="metric-value">{formatCurrency(trader.stats?.pnl7d)}</p>
        </div>
      </div>
      <div className="info-markets">
        <p className="metric-label">Favorite markets</p>
        <ul>
          {trader.favoriteMarkets.length > 0 ? (
            trader.favoriteMarkets.map((market) => <li key={market}>{market}</li>)
          ) : (
            <li className="fine">No markets annotated</li>
          )}
        </ul>
      </div>
      <a href={trader.polymarketUrl} target="_blank" rel="noreferrer" className="link-btn">
        View full profile on Polymarket ↗
      </a>
    </div>
  );
};

export default function Traders() {
  const { traders, status } = useLeaderboard();
  const { state, addTrader, removeTrader, updateNote, logEvent } = useCopyList();
  const [selectedTrader, setSelectedTrader] = useState(null);

  useEffect(() => {
    if (!selectedTrader && traders.length) {
      setSelectedTrader(traders[0]);
    } else if (traders.length && selectedTrader) {
      const exists = traders.some((trader) => trader.address === selectedTrader.address);
      if (!exists) {
        setSelectedTrader(traders[0]);
      }
    }
  }, [traders, selectedTrader]);

  const groupedTraders = useMemo(() => {
    const base = {
      Candidate: [],
      Vetted: [],
      Active: [],
    };

    traders.forEach((trader) => {
      const key = STATUS_ORDER.includes(trader.status) ? trader.status : 'Candidate';
      base[key].push(trader);
    });

    return base;
  }, [traders]);

  const promoteToVetted = (trader) => {
    addTrader(trader, 'vetted', 'Auto-vetted from leaderboard');
    logEvent({
      type: 'VETTED',
      trader: trader.username,
      action: 'Reviewed',
      market: trader.favoriteMarkets?.[0],
      reason: 'Promoted to vetted list from Traders page',
      detail: 'Promoted to vetted list from Traders page',
    });
  };

  const activateTrader = (trader) => {
    addTrader(trader, 'active', 'Copying with default sizing');
    logEvent({
      type: 'ACTIVATED',
      trader: trader.username,
      action: 'Copied',
      market: trader.favoriteMarkets?.[0],
      reason: 'Added to Active Copy list',
      detail: 'Added to Active Copy list',
    });
  };

  const renderList = (list, name) => (
    <div className="card copylist-card">
      <header className="section-header">
        <div>
          <p className="eyebrow">{name}</p>
          <h3>{list.length} traders</h3>
        </div>
      </header>
      <ul className="copylist">
        {list.map((trader) => {
          const key = trader.address || trader.username;
          return (
            <li key={key}>
              <div>
                <strong>{trader.username}</strong>
                <span className="mono">
                  {key.slice(0, 6)}…{key.slice(-4)}
                </span>
                <textarea
                  placeholder="Why we copy"
                  value={trader.note || ''}
                  onChange={(e) => updateNote(name.toLowerCase(), key, e.target.value)}
                />
              </div>
              <div className="copylist-actions">
                <button className="ghost-btn" onClick={() => removeTrader(name.toLowerCase(), key)}>
                  Remove
                </button>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <p className="fine">No traders yet.</p>}
      </ul>
    </div>
  );

  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Trader discovery</p>
          <h1>Copy List intelligence</h1>
        </div>
        <span className="mono">Status: {status}</span>
      </header>

      <section className="grid traders-main-grid">
        <article className="card traders-list-card">
          <header className="section-header">
            <div>
              <p className="eyebrow">Top traders</p>
              <h2>Polymarket leaderboard</h2>
            </div>
            <span className="fine">Grouped by copy status</span>
          </header>

          <div className="trader-groups">
            {STATUS_ORDER.map((group) => (
              <div className="trader-section" key={group}>
                <header className="trader-section-header">
                  <div>
                    <p className="eyebrow">Status</p>
                    <h3>{group}</h3>
                  </div>
                  <span className="mono">{groupedTraders[group].length} traders</span>
                </header>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Trader</th>
                        <th>7D PnL</th>
                        <th>30D PnL</th>
                        <th>Volume</th>
                        <th>CopyScore</th>
                        <th>Categories</th>
                        <th>Profile</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedTraders[group].map((trader) => (
                        <TraderRow
                          key={trader.address}
                          trader={trader}
                          onSelect={setSelectedTrader}
                          isSelected={selectedTrader?.address === trader.address}
                          onVet={promoteToVetted}
                          onActivate={activateTrader}
                        />
                      ))}
                      {groupedTraders[group].length === 0 && (
                        <tr>
                          <td colSpan={8} className="fine">
                            No traders in this cohort yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card info-panel">
          <header className="section-header">
            <div>
              <p className="eyebrow">Focused trader</p>
              <h2>Info panel</h2>
            </div>
          </header>
          <TradersInfo trader={selectedTrader} />
        </article>
      </section>

      <section className="grid trades-and-markets">
        {renderList(state.vetted, 'Vetted')}
        {renderList(state.active, 'Active')}
      </section>
    </div>
  );
}

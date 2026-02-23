import { useMemo, useState } from 'react';
import useLeaderboard from '../hooks/useLeaderboard.js';
import { useCopyList } from '../context/CopyListContext.jsx';

const formatNumber = (value, options = {}) => {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', options).format(value);
};

const TraderRow = ({ trader, onVet, onActivate }) => (
  <tr>
    <td>
      <div className="trader-handle">
        <strong>{trader.username}</strong>
        <span>{trader.address.slice(0, 6)}…{trader.address.slice(-4)}</span>
      </div>
    </td>
    <td>{formatNumber(trader.pnlHistory.DAY, { style: 'currency', currency: 'USD' })}</td>
    <td>{formatNumber(trader.pnlHistory.MONTH, { style: 'currency', currency: 'USD' })}</td>
    <td>{formatNumber(trader.volume, { notation: 'compact' })}</td>
    <td>{trader.copyScore}</td>
    <td>{trader.categories?.slice(0, 2).join(', ') || '—'}</td>
    <td>
      <div className="table-actions">
        <button className="ghost-btn" onClick={() => onVet(trader)}>
          Vet
        </button>
        <button className="primary-btn" onClick={() => onActivate(trader)}>
          Activate
        </button>
      </div>
    </td>
  </tr>
);

export default function Traders() {
  const { traders, status } = useLeaderboard();
  const { state, addTrader, removeTrader, updateNote, logEvent } = useCopyList();
  const [filter, setFilter] = useState('top');

  const filtered = useMemo(() => {
    if (filter === 'top') return traders.slice(0, 20);
    if (filter === 'momentum') return traders.filter((t) => (t.pnlHistory?.DAY || 0) > 0).slice(0, 20);
    if (filter === 'defensive') return traders.filter((t) => (t.pnlHistory?.MONTH || 0) > 0 && (t.winRate || 0.5) > 0.55);
    return traders;
  }, [traders, filter]);

  const promoteToVetted = (trader) => {
    addTrader(trader, 'vetted', 'Auto-vetted from leaderboard');
    logEvent({
      type: 'VETTED',
      trader: trader.username,
      detail: 'Promoted to vetted list from Traders page',
    });
  };

  const activateTrader = (trader) => {
    addTrader(trader, 'active', 'Copying with default sizing');
    logEvent({
      type: 'ACTIVATED',
      trader: trader.username,
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
                <span className="mono">{key.slice(0, 6)}…{key.slice(-4)}</span>
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
        <div className="toggle-group">
          <button className={filter === 'top' ? 'active' : ''} onClick={() => setFilter('top')}>
            Top 20
          </button>
          <button className={filter === 'momentum' ? 'active' : ''} onClick={() => setFilter('momentum')}>
            Momentum
          </button>
          <button className={filter === 'defensive' ? 'active' : ''} onClick={() => setFilter('defensive')}>
            Defensive
          </button>
        </div>
      </header>

      <section className="card">
        <header className="section-header">
          <div>
            <p className="eyebrow">Leaderboard pull</p>
            <h2>Polymarket trader ranking</h2>
          </div>
          <span className="mono">Status: {status}</span>
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
                <th>Style</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trader) => (
                <TraderRow
                  key={trader.address}
                  trader={trader}
                  onVet={promoteToVetted}
                  onActivate={activateTrader}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid trades-and-markets">
        {renderList(state.vetted, 'Vetted')}
        {renderList(state.active, 'Active')}
      </section>
    </div>
  );
}

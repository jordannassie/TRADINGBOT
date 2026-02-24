import { useUI } from '../../context/UIContext.jsx';

export default function PositionsToolbar({
  activeTab,
  onChangeTab,
  searchTerm,
  onSearch,
  onSort,
}) {
  const { strategyView, setStrategyView, execView, setExecView } = useUI();

  return (
    <div className="profile-toolbar">
      <div className="tab-group">
        {['active', 'closed'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-chip${activeTab === tab ? ' active' : ''}`}
            onClick={() => onChangeTab(tab)}
          >
            {tab === 'active' ? 'Active' : 'Closed'}
          </button>
        ))}
      </div>

      <div className="toolbar-actions">
        <div className="search-wrap">
          <input
            type="search"
            placeholder="Search positions"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            className="profile-search"
          />
        </div>
        <button type="button" className="profile-sort" onClick={() => onSort('value')}>
          Value
        </button>
      </div>

      <div className="toolbar-pill-groups">
        <div className="pill-group">
          <span className="pill-label">Strategy</span>
          <button
            type="button"
            className={`pill${strategyView === 'copy' ? ' active' : ''}`}
            onClick={() => setStrategyView('copy')}
          >
            Copy
          </button>
          <button
            type="button"
            className={`pill${strategyView === 'arb' ? ' active' : ''}`}
            onClick={() => setStrategyView('arb')}
          >
            Arbitrage
          </button>
        </div>

        <div className="pill-group">
          <span className="pill-label">Execution</span>
          <button
            type="button"
            className={`pill${execView === 'paper' ? ' active' : ''}`}
            onClick={() => setExecView('paper')}
          >
            Paper
          </button>
          <button
            type="button"
            className={`pill${execView === 'live' ? ' active' : ''}`}
            onClick={() => setExecView('live')}
          >
            Live
          </button>
        </div>
      </div>
    </div>
  );
}

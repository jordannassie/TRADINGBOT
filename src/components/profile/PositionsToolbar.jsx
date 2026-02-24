export default function PositionsToolbar({
  activeTab,
  onChangeTab,
  searchTerm,
  onSearch,
  onSort,
}) {
  return (
    <div className="profile-toolbar poly-toolbar">
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
    </div>
  );
}

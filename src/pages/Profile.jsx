import { useMemo, useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { useTradeFeed } from '../context/TradeFeedContext';
import { fallbackTimeline } from '../data/signalsTimeline';
import { openPositions } from '../data/analyticsMocks';
import ProfileHeaderCard from '../components/profile/ProfileHeaderCard.jsx';
import ProfitLossCard from '../components/profile/ProfitLossCard.jsx';
import ProfileTabs from '../components/profile/ProfileTabs.jsx';
import PositionsToolbar from '../components/profile/PositionsToolbar.jsx';
import PositionsList from '../components/profile/PositionsList.jsx';
import ActivityList from '../components/profile/ActivityList.jsx';

const formatDollar = (value) => {
  if (!value) return '—';
  const formatted = Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `$${formatted}`;
};

export default function Profile() {
  const { state } = useCopyList();
  const { liveFeed } = useTradeFeed();
  const [mainTab, setMainTab] = useState('positions');
  const [positionsTab, setPositionsTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('value');

  const closedPositions = useMemo(() => {
    if (liveFeed.length) {
      return liveFeed.slice(0, 6).map((trade, index) => ({
        market: trade.market ?? `Live market ${index + 1}`,
        trader: trade.trader || 'Live fill',
        status: 'Closed',
        value: formatDollar(trade.size && trade.price ? trade.size * trade.price : null),
        pnl: trade.pnl ?? 0,
      }));
    }
    return openPositions.map((pos, index) => ({
      ...pos,
      status: 'Closed',
      value: pos.notional,
      pnl: (index % 2 === 0 ? 1200 : -400),
    }));
  }, [liveFeed]);

  const filteredPositions = useMemo(() => {
    const base = positionsTab === 'active' ? openPositions : closedPositions;
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const filtered = normalizedTerm
      ? base.filter((entry) => (entry.market ?? '').toLowerCase().includes(normalizedTerm))
      : base;

    if (sortField === 'value') {
      return [...filtered].sort((a, b) => {
        const aNum = Number(String(a.value ?? a.notional ?? '').replace(/[^0-9.-]+/g, '')) || 0;
        const bNum = Number(String(b.value ?? b.notional ?? '').replace(/[^0-9.-]+/g, '')) || 0;
        return bNum - aNum;
      });
    }
    return filtered;
  }, [positionsTab, searchTerm, sortField, closedPositions]);

  const activityTimeline = useMemo(() => {
    const raw = state.auditLog.length ? state.auditLog : fallbackTimeline;
    return raw
      .map((event) => ({
        ...event,
        timestamp: event.timestamp,
        market: event.market || event.detail || 'Unknown market',
        action: event.action || event.type || 'Activity',
        reason: event.reason || event.detail || '—',
      }))
      .slice(0, 12);
  }, [state.auditLog]);

  return (
    <div className="page-stack profile-page">
      <div className="profile-grid">
        <ProfileHeaderCard />
        <ProfitLossCard />
      </div>

      <ProfileTabs activeTab={mainTab} onChange={(tab) => setMainTab(tab)} />

      {mainTab === 'positions' ? (
        <>
          <PositionsToolbar
            activeTab={positionsTab}
            onChangeTab={setPositionsTab}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onSort={(field) => setSortField(field)}
          />
          <PositionsList positions={filteredPositions} type={positionsTab} />
        </>
      ) : (
        <ActivityList events={activityTimeline} />
      )}

      <details className="profile-advanced">
        <summary>Advanced</summary>
        <div className="profile-advanced-panel">
          <p className="g-dim" style={{ margin: 0 }}>
            Kill switch: {state.riskControls?.killSwitchActive ? 'Active' : 'Standby'}
          </p>
          <p className="g-dim" style={{ margin: '4px 0' }}>
            Daily loss limit: ${state.riskControls?.dailyLossLimit?.toLocaleString()}
          </p>
          <p className="g-dim" style={{ margin: 0 }}>
            Exposure cap: ${state.riskControls?.exposureCap?.toLocaleString()}
          </p>
        </div>
      </details>
    </div>
  );
}

import { useState } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import ProfileHeaderCard from '../components/profile/ProfileHeaderCard.jsx';
import ProfitLossCard from '../components/profile/ProfitLossCard.jsx';
import ProfileTabs from '../components/profile/ProfileTabs.jsx';
import PositionsToolbar from '../components/profile/PositionsToolbar.jsx';
import PositionsList from '../components/profile/PositionsList.jsx';
import ActivityList from '../components/profile/ActivityList.jsx';

export default function Profile() {
  const { state } = useCopyList();
  const [mainTab, setMainTab] = useState('positions');
  const [positionsTab, setPositionsTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('value');

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
          <PositionsList
            positions={[]}
            type={positionsTab}
            emptyMessage="No paper positions yet. See Control Center for live copy activity."
          />
        </>
      ) : (
        <ActivityList events={[]} />
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

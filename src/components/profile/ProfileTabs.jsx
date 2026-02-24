export default function ProfileTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'positions', label: 'Positions' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="profile-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`profile-tab${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

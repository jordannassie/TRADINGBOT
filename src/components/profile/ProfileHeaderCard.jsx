import { memo } from 'react';

const stats = [
  { label: 'Positions value', value: '$41.5K' },
  { label: 'Biggest win', value: '$23.6K' },
  { label: 'Predictions', value: '23,022' },
];

function ProfileHeaderCard() {
  return (
    <section className="profile-card profile-header-card">
      <div className="profile-avatar-wrap">
        <img src="/nick-profile.jpg" alt="Nick Cross" className="profile-avatar" />
      </div>
      <div>
        <p className="profile-eyebrow">Operator</p>
        <h2 className="profile-title">Nick Cross</h2>
        <p className="profile-subtitle">Copy strategy lead</p>
      </div>
      <div className="profile-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="profile-stat">
            <span className="profile-stat-label">{stat.label}</span>
            <span className="profile-stat-value">{stat.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(ProfileHeaderCard);

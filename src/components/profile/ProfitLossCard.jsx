export default function ProfitLossCard() {
  return (
    <section className="profile-card profit-loss-card">
      <div className="profit-header">
        <div>
          <p className="profile-eyebrow">Profit / Loss</p>
          <h2 className="profile-title">Awaiting paper trades</h2>
          <p className="profile-subtitle">Real-time PnL registers once copy orders execute.</p>
        </div>
      </div>
      <div className="sparkline">
        <p className="g-empty" style={{ margin: 0 }}>
          No historical data yet — monitor Control Center for paper copy execution.
        </p>
      </div>
    </section>
  );
}

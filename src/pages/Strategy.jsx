const strategyPlays = [
  {
    title: 'Arbitrage Engine (YES + NO)',
    summary: 'Run Dutch-book arbitrage when panic pushes combined YES+NO odds below 100%. Bot buys both sides instantly, locking the spread.',
    tactics: ['Monitor markets with high panic volatility or news shocks.', 'Automate detection when YES + NO < 0.995 after fees.', 'Fire both orders simultaneously; exit when premium compresses.'],
  },
  {
    title: 'Catalyst Event Farming',
    summary: 'Track traders who specialize in macro/political catalysts. Copy only when they size into markets within a defined window before the catalyst.',
    tactics: ['Filter leaderboard for traders with repeated wins around scheduled events.', 'Pair their positions with our own calendar + probability drift alerts.', 'Auto-attach commentary links so we know which narrative they are chasing.'],
  },
  {
    title: 'Liquidity Provision & Range Reversion',
    summary: 'Mirror steady whales who make PnL by providing liquidity to mispriced ranges. Copy only when depth > $50k and odds are range-bound.',
    tactics: ['Use Polymarket order-book depth to confirm spreads before copying.', 'Set hard caps so we never become majority liquidity in that corridor.', 'Exit when spread compresses or volume drops below threshold.'],
  },
  {
    title: 'Cross-market Arbitrage',
    summary: 'Top shops hit correlated markets when probabilities diverge. We ingest their fills and replicate basket hedges so risk stays neutral.',
    tactics: ['Link each trader to favorite market clusters (US politics, sports, crypto).', 'Copy only if ≥2 markets meet liquidity + divergence criteria.', 'Log net exposure per cluster to keep drawdown under control.'],
  },
  {
    title: 'Time-decay Momentum',
    summary: 'Fast scalpers grind intraday momentum as news propagates. We copy only when hit-rate is 70%+ and we can enforce a time stop.',
    tactics: ['Require signals < 5 minutes old before mirroring.', 'Auto-schedule take-profit + time-based exit.', 'Throttle copy sizing during low-liquidity sessions.'],
  },
];

const operationSteps = [
  { title: 'Discovery', detail: 'Ingest the Polymarket leaderboard, live dashboard, and risk feed to identify consistently sized winners.' },
  { title: 'Vetting', detail: 'Review trade summaries, liquidity footprints, copy score trends, and correlated baskets before promoting.' },
  { title: 'Copy / Arbitrage', detail: 'Mirror trades with defined sizing, Dutch-book hedges, and kill-switch guardrails tied to drawdown triggers.' },
  { title: 'Audit & Analytics', detail: 'Document signals, run performance dashboards, and feed data back into the analytics hub every cycle.' },
];

const riskRules = [
  'Global kill switch can pause every execution.',
  'Daily loss limit capped at configured USD amount.',
  'Per-trader exposure never exceeds the configured cap shown in Settings.',
  'Hard drawdown pause kicks in at −$10 per day before resuming.',
];

const capitalGrowthPlan = [
  'Bake bankroll at ~$40 and trade $4–$6 per edge (~10–15% per trade) until we prove sizing.',
  'Run Dutch-book arbitrage / YES+NO spreads repeatedly, letting the spread compress before unwinding.',
  'Auto-scale sizes once bankroll tiers hit $100, $250, $500, etc., with checkpoints at each milestone.',
  'Enforce kill switch and hard daily drawdown pause (−$10) before stacking further risk.',
];

const proofLinks = {
  profile: 'https://polymarket.com/@0x0eA',
  telegram: 'https://t.me/polymarketarb',
};

export default function Strategy({ embedded = false }) {
  const containerClass = embedded ? 'command-embed' : 'page-stack g-dashboard';
  return (
    <div className={containerClass}>
      {!embedded && (
        <div className="t-page-header">
          <div>
            <span className="t-eyebrow">Strategy</span>
            <h1 className="t-page-title">Playbooks, capital, and execution flow</h1>
          </div>
        </div>
      )}

      {/* ── Playbooks ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Playbooks</h2>
          <span className="g-section-meta">Derived from top trader behaviour</span>
        </div>
        <div className="g-table-wrap">
          <table className="g-table">
            <thead>
              <tr><th>Strategy</th><th>Summary</th><th>Key Tactics</th></tr>
            </thead>
            <tbody>
              {strategyPlays.map((play) => (
                <tr key={play.title}>
                  <td className="g-bold" style={{ whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: 16 }}>{play.title}</td>
                  <td className="g-dim" style={{ fontSize: 12, lineHeight: 1.55, verticalAlign: 'top', paddingTop: 16, maxWidth: 280 }}>{play.summary}</td>
                  <td style={{ verticalAlign: 'top', paddingTop: 16 }}>
                    <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {play.tactics.map((tip) => (
                        <li key={tip} className="g-dim" style={{ fontSize: 12 }}>{tip}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Capital Growth Plan ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Capital Growth Plan</h2>
          <span className="g-section-meta">Bankroll + arbitrage playbook</span>
        </div>
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr><th>#</th><th>Rule</th></tr></thead>
            <tbody>
              {capitalGrowthPlan.map((point, i) => (
                <tr key={i}>
                  <td className="g-mono g-dim" style={{ width: 40 }}>{i + 1}</td>
                  <td style={{ fontSize: 13, lineHeight: 1.5 }}>{point}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="t-proof-callout">
          <span className="g-tag g-tag--active">Proof of Concept</span>
          <p className="g-dim" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
            0x0eA… demonstrated a $400K/month 5-minute BTC arbitrage sweep. We layer that cadence into our auto-scaling rules.{' '}
            <a href={proofLinks.profile} target="_blank" rel="noreferrer" className="g-link">Polymarket profile ↗</a>
            {' '}·{' '}
            <a href={proofLinks.telegram} target="_blank" rel="noreferrer" className="g-link">Telegram log ↗</a>
          </p>
        </div>
      </section>

      {/* ── Execution Flow ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Execution Flow</h2>
          <span className="g-section-meta">Discovery → Vetting → Copy/Arb → Audit/Analytics</span>
        </div>
        <div className="g-table-wrap">
          <table className="g-table">
            <thead><tr><th>Phase</th><th>Detail</th></tr></thead>
            <tbody>
              {operationSteps.map((step) => (
                <tr key={step.title}>
                  <td className="g-bold" style={{ whiteSpace: 'nowrap' }}>{step.title}</td>
                  <td className="g-dim" style={{ fontSize: 13, lineHeight: 1.5 }}>{step.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Risk Rules ── */}
      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Risk Rules</h2>
        </div>
        <div className="g-table-wrap">
          <table className="g-table">
            <tbody>
              {riskRules.map((rule, i) => (
                <tr key={i}>
                  <td className="g-mono g-dim" style={{ width: 40 }}>R{i + 1}</td>
                  <td style={{ fontSize: 13 }}>{rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="g-empty" style={{ paddingTop: 12 }}>
          Deployment cadence: Weekly recap, daily feeds, and kill switch tests each morning.
        </p>
      </section>
    </div>
  );
}

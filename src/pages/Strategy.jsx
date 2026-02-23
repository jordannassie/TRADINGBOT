const strategyPlays = [
  {
    title: 'Arbitrage Engine (YES + NO)',
    summary:
      'Run Dutch-book arbitrage when panic pushes combined YES+NO odds below 100%. Bot buys both sides instantly, locking the spread.',
    tactics: [
      'Monitor markets with high panic volatility or news shocks.',
      'Automate detection when YES + NO < 0.995 after fees.',
      'Fire both orders simultaneously; exit when premium compresses.',
    ],
  },
  {
    title: 'Catalyst Event Farming',
    summary:
      'Track traders who specialize in macro/political catalysts (CPI prints, Fed meetings, election filing deadlines). Copy only when they size into markets within a defined window before the catalyst.',
    tactics: [
      'Filter leaderboard for traders with repeated wins around scheduled events.',
      'Pair their positions with our own calendar + probability drift alerts.',
      'Auto-attach commentary links so we know which narrative they are chasing.',
    ],
  },
  {
    title: 'Liquidity Provision & Range Reversion',
    summary:
      'Some whales make steady PnL by providing liquidity to mispriced ranges and clipping rebates/spreads. We mirror only when depth > $50k and odds are range-bound.',
    tactics: [
      'Use Polymarket order-book depth to confirm spreads before copying.',
      'Set hard caps so we never become majority liquidity in that corridor.',
      'Exit when spread compresses or volume drops below threshold.',
    ],
  },
  {
    title: 'Cross-market Arbitrage',
    summary:
      'Top shops hit correlated markets when probabilities diverge. We ingest their fills and replicate basket hedges so risk stays neutral.',
    tactics: [
      'Link each trader to favorite market clusters (US politics, sports, crypto).',
      'Copy only if ≥2 markets meet liquidity + divergence criteria.',
      'Log net exposure per cluster to keep drawdown under control.',
    ],
  },
  {
    title: 'Time-decay Momentum',
    summary:
      'Fast scalpers grind intraday momentum as news propagates. We copy only when hit-rate is 70%+ and we can enforce a time stop.',
    tactics: [
      'Require signals < 5 minutes old before mirroring.',
      'Auto-schedule take-profit + time-based exit.',
      'Throttle copy sizing during low-liquidity sessions.',
    ],
  },
];

const operationSteps = [
  {
    title: 'Discover',
    detail: 'Ingest the Polymarket leaderboard + our live dashboard to spot consistent wins, volume, and CopyScores.',
  },
  {
    title: 'Vet',
    detail: 'Review trade summaries, liquidity footprints, and correlation to our copy rules before promoting.',
  },
  {
    title: 'Copy',
    detail: 'Mirror trades with defined sizing, kill-switch guardrails, and same-market hedges.',
  },
];

const riskRules = [
  'Global kill switch can pause every execution.',
  'Daily loss limit capped at configured USD amount.',
  'Per-trader exposure never exceeds the configured cap shown in Settings.',
];

export default function Strategy() {
  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Strategy</p>
          <h1>Playbook, notes, and operating cadence</h1>
        </div>
      </header>

      <section className="card playbook-card strategy-playbook">
        <header className="section-header">
          <div>
            <p className="eyebrow">Polymarket alpha</p>
            <h2>Money-making playbook</h2>
          </div>
          <span className="mono">Derived from top trader behavior</span>
        </header>
        <div className="play-grid">
          {strategyPlays.map((play) => (
            <article key={play.title} className="play-card">
              <h3>{play.title}</h3>
              <p className="fine">{play.summary}</p>
              <ul>
                {play.tactics.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="card strategy-notes">
        <div className="manager-info">
          <img src="/nick-profile.jpg" alt="Nick Cross" />
          <div>
            <p className="eyebrow">Nick Cross</p>
            <h3>Copy strategy lead</h3>
            <p className="fine">
              Managing TradingBotBoom · Building the Polymarket copy engine. Every trade is vetted
              against our risk rules before sizing; strategy notes keep the team aligned with the
              latest narrative.
            </p>
          </div>
        </div>
      </section>

      <section className="card strategy-flow">
        <header className="section-header">
          <div>
            <p className="eyebrow">How we operate</p>
            <h2>Copy flow & cadence</h2>
          </div>
        </header>
        <div className="strategy-steps">
          {operationSteps.map((step) => (
            <article key={step.title} className="strategy-step">
              <h3>{step.title}</h3>
              <p className="fine">{step.detail}</p>
            </article>
          ))}
        </div>
        <div className="strategy-risks">
          <p className="eyebrow">Risk rules</p>
          <ul>
            {riskRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="fine">Deployment cadence: Weekly recap, daily feeds, and kill switch tests each morning.</p>
        </div>
      </section>
    </div>
  );
}

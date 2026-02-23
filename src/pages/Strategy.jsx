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
    title: 'Discovery',
    detail: 'Ingest the Polymarket leaderboard, live dashboard, and risk feed to identify consistently sized winners.',
  },
  {
    title: 'Vetting',
    detail: 'Review trade summaries, liquidity footprints, copy score trends, and correlated baskets before promoting.',
  },
  {
    title: 'Copy / Arbitrage',
    detail: 'Mirror trades with defined sizing, Dutch-book hedges, and kill-switch guardrails tied to drawdown triggers.',
  },
  {
    title: 'Audit & Analytics',
    detail: 'Document signals, run performance dashboards, and feed data back into the analytics hub every cycle.',
  },
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

export default function Strategy() {
  const proofMarkup = (
    <p className="fine">
      Proof-of-concept: <a href={proofLinks.profile} target="_blank" rel="noreferrer">
        0x0eA… Polymarket profile
      </a>{' '}
      and the <a href={proofLinks.telegram} target="_blank" rel="noreferrer">
        decoupled Telegram log
      </a>{' '}
      detail a $400K/month, 5-minute BTC arbitrage sweep that we mirror in this plan.
    </p>
  );

  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Strategy</p>
          <h1>Playbooks, capital, and execution flow</h1>
        </div>
      </header>

      <section className="card playbook-card strategy-playbook">
        <header className="section-header">
          <div>
            <p className="eyebrow">Polymarket alpha</p>
            <h2>Playbooks</h2>
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

      <section className="card capital-growth">
        <header className="section-header">
          <div>
            <p className="eyebrow">Capital Growth Plan</p>
            <h2>Bankroll + arbitrage playbook</h2>
          </div>
        </header>
        <div className="capital-grid">
          {capitalGrowthPlan.map((point) => (
            <article key={point} className="capital-point">
              <p className="fine">{point}</p>
            </article>
          ))}
        </div>
        <div className="proof-callout">
          <p className="capital-highlight">
            Rolling proof: 0x0eA… demonstrated a $400K/month 5-minute BTC arbitrage (Polymarket
            profile + Telegram proof). We layer that cadence into our auto-scaling rules.
          </p>
          {proofMarkup}
        </div>
      </section>

      <section className="card strategy-flow">
        <header className="section-header">
          <div>
            <p className="eyebrow">Execution Flow</p>
            <h2>Discovery → Vetting → Copy/Arb → Audit/Analytics</h2>
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
          <p className="fine">
            Deployment cadence: Weekly recap, daily feeds, and kill switch tests each morning.
          </p>
        </div>
      </section>
    </div>
  );
}

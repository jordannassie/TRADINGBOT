import { useCopyList } from '../context/CopyListContext.jsx';

const polymarketPlays = [
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
      'Track traders who specialize in macro/political catalysts (CPI prints, Fed meetings, election filing deadlines). Copy only when they size into markets within a defined window before the catalyst, then unwind on the news.',
    tactics: [
      'Filter leaderboard for traders with repeated wins around scheduled events.',
      'Pair their positions with our own calendar + probability drift alerts.',
      'Auto-attach commentary links so we know which narrative they are chasing.',
    ],
  },
  {
    title: 'Liquidity Provision & Range Reversion',
    summary:
      'Some whales make steady PnL by providing liquidity to mispriced ranges and clipping rebates/spreads. We mirror only when depth > $50k and odds are in a tight corridor.',
    tactics: [
      'Use Polymarket order-book depth to confirm spreads before copying.',
      'Set hard caps so we never become majority liquidity in that range.',
      'Exit when spread compresses or volume drops below threshold.',
    ],
  },
  {
    title: 'Cross-market Arbitrage',
    summary:
      'Top shops hit correlated markets (e.g., multiple state election markets) when probabilities diverge. We ingest their fills and replicate basket hedges so risk stays neutral.',
    tactics: [
      'Link each trader to their favorite market clusters (US politics, sports, crypto).',
      'Copy only if at least two markets meet liquidity + divergence criteria.',
      'Log net exposure per cluster to keep drawdown under control.',
    ],
  },
  {
    title: 'Time-decay Momentum',
    summary:
      'Fast scalpers grind intraday momentum as news propagates. We only copy when the trader has a 70%+ intraday hit rate and we can enforce a time stop (e.g., 45 minutes).',
    tactics: [
      'Require signals < 5 minutes old before mirroring.',
      'Auto-schedule take-profit + time-based exit.',
      'Throttle copy sizing during low-liquidity sessions.',
    ],
  },
];

export default function Dashboard() {
  const { state } = useCopyList();
  const totalActive = state.active.length;
  const totalVetted = state.vetted.length;
  const signalsLogged = state.auditLog.length;

  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Live control</p>
          <h1>Polymarket trading bot · v0.1</h1>
        </div>
        <div className="status-pill">
          <span className="pulse" />
          Connected
        </div>
      </header>

      <section className="grid overview">
        <article className="metric-card">
          <p className="metric-label">Active copy traders</p>
          <p className="metric-value">{totalActive}</p>
          <p className="metric-sub">Qualified + mirrored right now</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Vetted pipeline</p>
          <p className="metric-value">{totalVetted}</p>
          <p className="metric-sub">Ready for promotion</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Signals logged</p>
          <p className="metric-value">{signalsLogged}</p>
          <p className="metric-sub">Audit-ready events</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Risk posture</p>
          <p className="metric-value">Paused toggle</p>
          <p className="metric-sub">Kill switch available in Settings</p>
        </article>
      </section>

      <section className="card">
        <header className="section-header">
          <div>
            <p className="eyebrow">Game plan</p>
            <h2>How TradingBotBoom wins</h2>
          </div>
        </header>
        <ol className="roadmap-list">
          <li>Auto-discover elite Polymarket traders via leaderboard ingestion.</li>
          <li>Score, vet, and document a transparent Copy List.</li>
          <li>Mirror trades with defined sizing, liquidity, and slippage controls.</li>
          <li>Publish real-time performance, audit logs, and daily recaps.</li>
        </ol>
      </section>

      <section className="card playbook-card">
        <header className="section-header">
          <div>
            <p className="eyebrow">Polymarket alpha</p>
            <h2>Money-making playbook</h2>
          </div>
          <span className="mono">Derived from top trader behavior</span>
        </header>
        <div className="play-grid">
          {polymarketPlays.map((play) => (
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

      <section className="card manager-card">
        <div className="manager-info">
          <img src="/nick-profile.jpg" alt="Nick Cross" />
          <div>
            <p className="eyebrow">Copy strategy lead</p>
            <h3>Nick Cross</h3>
            <p className="fine">
              Managing TradingBotBoom · Building the Polymarket copy engine
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

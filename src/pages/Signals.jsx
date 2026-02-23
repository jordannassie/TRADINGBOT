import { useMemo } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';

const FALLBACK_TIMELINE = [
  {
    id: 'fallback-1',
    timestamp: '2026-02-21T12:20:00Z',
    trader: 'MacroBuffers',
    action: 'Copied',
    market: 'Will the Fed pause in 2026?',
    reason: 'Strong catalyst + proven drawdown control',
  },
  {
    id: 'fallback-2',
    timestamp: '2026-02-20T15:10:00Z',
    trader: 'AlphaWhale',
    action: 'Skipped',
    market: 'Will ETH drop below $2.6k?',
    reason: 'Volatility too high for current sizing rules',
  },
  {
    id: 'fallback-3',
    timestamp: '2026-02-19T09:05:00Z',
    trader: 'BasketArbFund',
    action: 'Copied',
    market: 'Will two swing states flip in 2026?',
    reason: 'Cross-market hedge lined up with active basket',
  },
];

export default function Signals() {
  const { state } = useCopyList();

  const timeline = useMemo(() => {
    const rawEvents = state.auditLog.length ? state.auditLog : FALLBACK_TIMELINE;
    return rawEvents.map((event) => ({
      id: event.id,
      timestamp: new Date(event.timestamp),
      trader: event.trader,
      action: event.action || event.type || 'Activity',
      market: event.market || event.detail || 'Unknown market',
      reason: event.reason || event.detail || 'No reason provided',
    }));
  }, [state.auditLog]);

  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Signals</p>
          <h1>Trader events & audit log</h1>
        </div>
      </header>

      <section className="card timeline-card">
        <div className="timeline">
          {timeline.map((event) => (
            <article className="timeline-item" key={event.id}>
              <div className="timeline-dot" aria-hidden="true" />
              <div className="timeline-body">
                <p className="mono">{event.timestamp.toLocaleString()}</p>
                <div className="timeline-topline">
                  <strong>{event.trader}</strong>
                  <span className="fine">{event.market}</span>
                </div>
                <p className="timeline-action">
                  <span className="tag-pill">{event.action}</span>
                  <span className="timeline-reason">{event.reason}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useMemo } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { fallbackTimeline } from '../data/signalsTimeline';

export default function Signals() {
  const { state } = useCopyList();

  const timeline = useMemo(() => {
    const rawEvents = state.auditLog.length ? state.auditLog : fallbackTimeline;
    return rawEvents
      .map((event) => ({
        ...event,
        timestamp: new Date(event.timestamp),
        action: event.action || event.type || 'Activity',
        market: event.market || event.detail || 'Unknown market',
        reason: event.reason || event.detail || 'No reason provided',
        positionSize: event.positionSize || '—',
        strategy: event.strategy || 'General copy flow',
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
                <div className="timeline-meta">
                  <span>Position {event.positionSize}</span>
                  <span>Strategy {event.strategy}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

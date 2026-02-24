import { useMemo } from 'react';
import { useCopyList } from '../context/CopyListContext.jsx';
import { fallbackTimeline } from '../data/signalsTimeline';

export default function Signals({ embedded = false }) {
  // ── Existing data wiring (unchanged) ─────────────────────────────────────────
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

  const containerClass = embedded ? 'command-embed' : 'page-stack g-dashboard';

  return (
    <div className={containerClass}>
      {!embedded && (
        <div className="t-page-header">
          <div>
            <span className="t-eyebrow">Signals</span>
            <h1 className="t-page-title">Trader events &amp; audit log</h1>
          </div>
          <span className="t-page-count">{timeline.length} events</span>
        </div>
      )}

      <section className="g-section">
        <div className="g-section-header">
          <h2 className="g-section-title">Execution Log</h2>
          <span className="g-section-meta">All copy / skip / error events in order</span>
        </div>
        <div className="g-table-wrap">
          <table className="g-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Trader</th>
                <th>Action</th>
                <th>Market</th>
                <th>Position</th>
                <th>Strategy</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {timeline.length === 0 ? (
                <tr>
                  <td colSpan={7} className="g-empty">No signals logged yet.</td>
                </tr>
              ) : (
                timeline.map((event) => (
                  <tr key={event.id}>
                    <td className="g-mono g-dim t-ts">{event.timestamp.toLocaleString()}</td>
                    <td className="g-bold">{event.trader}</td>
                    <td>
                      <span className={`g-tag${event.action === 'Copied' ? ' g-tag--active' : event.action === 'Skipped' ? ' g-tag--watch' : ''}`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="g-market-cell">{event.market}</td>
                    <td className="g-mono">{event.positionSize}</td>
                    <td className="g-dim" style={{ fontSize: 11 }}>{event.strategy}</td>
                    <td className="g-dim" style={{ fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

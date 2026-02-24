function formatTs(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function ActivityList({ events }) {
  if (!events.length) {
    return <p className="g-empty">No activity yet.</p>;
  }

  return (
    <div className="g-table-wrap">
      <table className="g-table profile-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Trader</th>
            <th>Market</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td className="g-mono g-dim">{formatTs(event.timestamp)}</td>
              <td>
                <span className={`g-tag${event.action === 'Copied' ? ' g-tag--active' : ' g-tag--watch'}`}>
                  {event.action}
                </span>
              </td>
              <td className="g-bold">{event.trader}</td>
              <td className="g-market-cell">{event.market}</td>
              <td className="g-dim" style={{ fontSize: 11, maxWidth: 200 }}>{event.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

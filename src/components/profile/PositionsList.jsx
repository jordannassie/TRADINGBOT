function formatPnl(value) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString()}`;
}

export default function PositionsList({ positions, type }) {
  if (!positions.length) {
    return <p className="g-empty">No {type} positions.</p>;
  }

  return (
    <div className="g-table-wrap">
      <table className="g-table profile-table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Trader</th>
            <th>Status</th>
            <th>Value</th>
            <th>PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos, idx) => (
            <tr key={`${pos.market}-${idx}`}>
              <td className="g-market-cell">{pos.market}</td>
              <td className="g-bold">{pos.trader}</td>
              <td>
                <span className={`g-tag${pos.status === 'Active hedge' ? ' g-tag--active' : ' g-tag--watch'}`}>
                  {pos.status}
                </span>
              </td>
              <td className="g-mono">{pos.value ?? pos.notional ?? '—'}</td>
              <td className={`g-mono${(pos.pnl ?? 0) >= 0 ? ' g-pos' : ' g-neg'}`}>{formatPnl(pos.pnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

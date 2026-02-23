import { useCopyList } from '../context/CopyListContext.jsx';

export default function Signals() {
  const { state } = useCopyList();
  return (
    <div className="page-stack">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Signals</p>
          <h1>Trader events & audit log</h1>
        </div>
      </header>
      <section className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Trader</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {state.auditLog.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td>{item.type}</td>
                  <td>{item.trader}</td>
                  <td>{item.detail}</td>
                </tr>
              ))}
              {state.auditLog.length === 0 && (
                <tr>
                  <td colSpan={4} className="fine">
                    No signals yet. Once copy execution is live, trader actions will stream in here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

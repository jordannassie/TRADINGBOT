import { useMemo, useState } from 'react';
import { dailyPnL, equityCurve } from '../../data/analyticsMocks';

const timeframes = ['1D', '1W', '1M', 'ALL'];

export default function ProfitLossCard() {
  const [activeFrame, setActiveFrame] = useState('ALL');
  const totalPnL = useMemo(() => dailyPnL.reduce((sum, bar) => sum + bar.value, 0), []);
  const sparklinePoints = useMemo(() => {
    return equityCurve.slice(-16).map((point) => point.value);
  }, []);

  return (
    <section className="profile-card profit-loss-card">
      <div className="profit-header">
        <div>
          <p className="profile-eyebrow">Profit / Loss</p>
          <h2 className="profile-title">${totalPnL.toLocaleString()}</h2>
          <p className="profile-subtitle">All-time · Polymarket style</p>
        </div>
        <div className="timeframe-pills">
          {timeframes.map((frame) => (
            <button
              key={frame}
              className={`timeframe-pill${frame === activeFrame ? ' active' : ''}`}
              type="button"
              onClick={() => setActiveFrame(frame)}
            >
              {frame}
            </button>
          ))}
        </div>
      </div>
      <div className="sparkline">
        {sparklinePoints.map((value, index) => (
          <span
            key={value + index}
            style={{ height: `${(value / Math.max(...sparklinePoints)) * 100}%` }}
            className="sparkline-bar"
          />
        ))}
      </div>
    </section>
  );
}

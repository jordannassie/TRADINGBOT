// Pure UI context — holds only display state (strategy/execution toggle).
// No backend calls, no business logic, no data fetching.
import { createContext, useContext, useState } from 'react';

const UIContext = createContext({
  strategyView: 'copy',
  setStrategyView: () => {},
  execView: 'paper',
  setExecView: () => {},
});

export function UIProvider({ children }) {
  const [strategyView, setStrategyView] = useState('copy');
  const [execView, setExecView] = useState('paper');

  return (
    <UIContext.Provider value={{ strategyView, setStrategyView, execView, setExecView }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);

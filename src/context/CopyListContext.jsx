import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'tradingbotboom-copylist';

const CopyListContext = createContext();

const defaultState = {
  vetted: [],
  active: [],
  auditLog: [],
};

const getKey = (trader) =>
  trader?.address || trader?.account || trader?.proxyWallet || trader?.username;

export function CopyListProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addTrader = (trader, listName, note = '') => {
    const key = getKey(trader);
    if (!key) return;
    setState((prev) => {
      const alreadyExists = prev[listName].some((t) => getKey(t) === key);
      if (alreadyExists) return prev;
      return {
        ...prev,
        [listName]: [
          {
            ...trader,
            addedAt: new Date().toISOString(),
            note,
          },
          ...prev[listName],
        ],
      };
    });
  };

  const removeTrader = (listName, traderKey) => {
    setState((prev) => ({
      ...prev,
      [listName]: prev[listName].filter((t) => getKey(t) !== traderKey),
    }));
  };

  const updateNote = (listName, traderKey, note) => {
    setState((prev) => ({
      ...prev,
      [listName]: prev[listName].map((t) =>
        getKey(t) === traderKey ? { ...t, note } : t,
      ),
    }));
  };

  const logEvent = (event) => {
    setState((prev) => ({
      ...prev,
      auditLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          ...event,
        },
        ...prev.auditLog,
      ].slice(0, 200),
    }));
  };

  const value = useMemo(
    () => ({
      state,
      addTrader,
      removeTrader,
      updateNote,
      logEvent,
    }),
    [state],
  );

  return (
    <CopyListContext.Provider value={value}>{children}</CopyListContext.Provider>
  );
}

export function useCopyList() {
  const context = useContext(CopyListContext);
  if (!context) throw new Error('useCopyList must be used within provider');
  return context;
}

import React, { createContext, useContext, useMemo, useState } from 'react';

const API_ENDPOINT = 'http://localhost:5070/api/action/process';
const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([
    {
      id: `sys-${Math.random().toString(36).slice(2, 10)}`,
      role: 'system',
      text: 'FlowSpeak demo: ask to check stock for a product.',
      intent: 'SYSTEM',
      status: 'SUCCESS',
      ts: new Date().toISOString(),
    },
  ]);
  const [transactions, setTransactions] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitMessage = async (e) => {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Math.random().toString(36).slice(2, 10)}`,
      role: 'user',
      text,
      ts: new Date().toISOString(),
    };

    setChat((current) => [...current, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const resp = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'CHECK_STOCK', entity: text, parameters: {} }),
      });

      const body = await resp.json().catch(() => ({}));
      const returnedIntent = body.intent || 'CHECK_STOCK';
      const status = body.success === true ? 'SUCCESS' : body.success === false ? 'FAILED' : 'UNKNOWN';
      const systemText = body.message || 'Processed stock request';

      const sysMsg = {
        id: `sys-${Math.random().toString(36).slice(2, 10)}`,
        role: 'system',
        text: systemText,
        intent: returnedIntent,
        status,
        ts: new Date().toISOString(),
      };
      setChat((current) => [...current, sysMsg]);

      const txn = {
        id: `txn-${Math.random().toString(36).slice(2, 10)}`,
        timestamp: new Date().toISOString(),
        activity: `Stock check: ${text}`,
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      };
      setTransactions((current) => [txn, ...current].slice(0, 200));

      const aiLog = {
        id: `log-${Math.random().toString(36).slice(2, 10)}`,
        intentToken: returnedIntent,
        payload: JSON.stringify({ request: { intent: 'CHECK_STOCK', entity: text, parameters: {} }, response: body }, null, 2),
        pipelineStatus: status === 'SUCCESS' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'QUEUED',
        ts: new Date().toISOString(),
      };
      setAiLogs((current) => [aiLog, ...current].slice(0, 500));
    } catch (err) {
      setError('Unable to reach backend. Ensure http://localhost:5070 is running.');

      const failMsg = {
        id: `sys-${Math.random().toString(36).slice(2, 10)}`,
        role: 'system',
        text: 'Network error: failed to reach backend.',
        intent: 'ERROR',
        status: 'FAILED',
        ts: new Date().toISOString(),
      };
      setChat((current) => [...current, failMsg]);

      const txn = {
        id: `txn-${Math.random().toString(36).slice(2, 10)}`,
        timestamp: new Date().toISOString(),
        activity: `Failed to check: ${text}`,
        status: 'FAILED',
      };
      setTransactions((current) => [txn, ...current]);

      const aiLog = {
        id: `log-${Math.random().toString(36).slice(2, 10)}`,
        intentToken: 'NETWORK_ERROR',
        payload: JSON.stringify({ request: { intent: 'CHECK_STOCK', entity: text }, error: String(err) }, null, 2),
        pipelineStatus: 'FAILED',
        ts: new Date().toISOString(),
      };
      setAiLogs((current) => [aiLog, ...current]);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const total = aiLogs.length;
    const success = aiLogs.filter((log) => log.pipelineStatus === 'COMPLETED' || log.pipelineStatus === 'SUCCESS').length;
    const rate = total ? Math.round((success / total) * 100) : 0;
    return { total, successRate: rate, gateways: 3 };
  }, [aiLogs]);

  const value = useMemo(
    () => ({
      input,
      setInput,
      chat,
      transactions,
      aiLogs,
      loading,
      error,
      submitMessage,
      metrics,
    }),
    [input, chat, transactions, aiLogs, loading, error, submitMessage, metrics]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

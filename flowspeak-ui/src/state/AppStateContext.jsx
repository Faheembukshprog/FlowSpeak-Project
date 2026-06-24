import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';
const API_ENDPOINT = `${API_BASE}/api/action/interpret`;
const AUTH_ENDPOINT = `${API_BASE}/api/auth`;

function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([
    {
      id: uid('sys-'),
      role: 'system',
      text: 'FlowSpeak: Ask to check stock, create an order, or request a quote!',
      intent: 'SYSTEM',
      status: 'SUCCESS',
      ts: new Date().toISOString(),
    },
  ]);
  const [transactions, setTransactions] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authUser, setAuthUser] = useState(null);

  const submitMessage = useCallback(async (e) => {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg = {
      id: uid('user-'),
      role: 'user',
      text,
      ts: new Date().toISOString(),
    };

    setChat((current) => [...current, userMsg].slice(-100));
    setInput('');
    setLoading(true);
    setError('');

    try {
      let resp = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      if (resp.status === 401) {
        const refreshResp = await fetch(`${AUTH_ENDPOINT}/refresh`, { method: 'POST', credentials: 'include' });
        if (refreshResp.ok) {
          resp = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text }),
          });
        } else {
          setAuthUser(null);
          return;
        }
      }

      const body = await resp.json().catch(() => ({}));
      const returnedIntent = body.intent || 'UNKNOWN_INTENT';
      
      let status = 'UNKNOWN';
      if (resp.status === 403 || body.errorCode === 'FORBIDDEN') {
        status = 'FORBIDDEN';
      } else if (body.success === true) {
        status = 'SUCCESS';
      } else if (body.success === false) {
        status = 'FAILED';
      }

      const systemText = body.message || body.text || `Processed intent ${returnedIntent}`;

      const sysMsg = {
        id: uid('sys-'),
        role: 'system',
        text: systemText,
        intent: returnedIntent,
        status,
        data: body.data || null,
        ts: new Date().toISOString(),
      };
      setChat((current) => [...current, sysMsg].slice(-100));

      const txn = {
        id: uid('txn-'),
        timestamp: new Date().toISOString(),
        activity: `Intent: ${returnedIntent} - ${text}`,
        status,
      };
      setTransactions((current) => [txn, ...current].slice(0, 200));

      const aiLog = {
        id: uid('log-'),
        intentToken: returnedIntent,
        payload: JSON.stringify({ request: { text }, response: body }, null, 2),
        pipelineStatus: status,
        ts: new Date().toISOString(),
      };
      setAiLogs((current) => [aiLog, ...current].slice(0, 500));
    } catch (err) {
      setError('Unable to reach backend. Ensure the backend server is running.');

      const failMsg = {
        id: uid('sys-'),
        role: 'system',
        text: 'Network error: failed to reach backend.',
        intent: 'NETWORK_ERROR',
        status: 'FAILED',
        ts: new Date().toISOString(),
      };
      setChat((current) => [...current, failMsg]);

      const txn = {
        id: uid('txn-'),
        timestamp: new Date().toISOString(),
        activity: `Failed to process: ${text}`,
        status: 'FAILED',
      };
      setTransactions((current) => [txn, ...current]);

      const aiLog = {
        id: uid('log-'),
        intentToken: 'NETWORK_ERROR',
        payload: JSON.stringify({ request: { text }, error: String(err) }, null, 2),
        pipelineStatus: 'FAILED',
        ts: new Date().toISOString(),
      };
      setAiLogs((current) => [aiLog, ...current]);
    } finally {
      setLoading(false);
    }
  }, [input]);

  const metrics = useMemo(() => {
    const total = aiLogs.length;
    const success = aiLogs.filter((log) => log.pipelineStatus === 'SUCCESS' || log.pipelineStatus === 'COMPLETED').length;
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
      authUser,
      setAuthUser,
    }),
    [input, chat, transactions, aiLogs, loading, error, submitMessage, metrics, authUser]
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

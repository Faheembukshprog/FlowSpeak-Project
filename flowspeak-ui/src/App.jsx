import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquare,
  LayoutGrid,
  ShieldAlert,
  Send,
  Clock,
  Database,
  RefreshCcw,
  CheckCircle2,
  Cpu,
  Zap,
} from 'lucide-react';

const TABS = [
  { id: 'chat', label: 'Demo Chat', icon: MessageSquare },
  { id: 'transactions', label: 'Transactions', icon: LayoutGrid },
  { id: 'admin', label: 'Admin', icon: ShieldAlert },
];

const INTENT_BADGE = {
  SUCCESS: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
  UNKNOWN: 'bg-amber-100 text-amber-800',
};

// Matches backend launchSettings.json, but securely injected via Vite environments
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5070/api/action/process';

function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function formatLocal(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function parseIntentSimple(text) {
  const t = (text || '').trim();
  const lower = t.toLowerCase();
  const forMatch = t.match(/(?:for|of|about|on)\\s+([\\w\\s-]+)/i);
  const product = forMatch ? forMatch[1].trim() : (t.match(/\\b(dell|lenovo|hp|asus|acer|macbook|xps|thinkpad|widget)\\b/i)?.[0] || t);

  if (!t) return { intent: 'UNKNOWN_INTENT', entity: t || 'unknown', parameters: {} };

  if (lower.includes('check') || lower.includes('stock') || lower.includes('inventory')) {
    return { intent: 'CHECK_STOCK', entity: product, parameters: {} };
  }

  return { intent: 'UNKNOWN_INTENT', entity: t, parameters: {} };
}

export default function App() {
  const [active, setActive] = useState('chat');
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([
    {
      id: uid('sys-'),
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
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chat]);

  const metrics = useMemo(() => {
    const total = aiLogs.length;
    const success = aiLogs.filter((l) => l.pipelineStatus === 'COMPLETED' || l.pipelineStatus === 'SUCCESS').length;
    const rate = total ? Math.round((success / total) * 100) : 0;
    return { total, successRate: rate, gateways: 3 };
  }, [aiLogs]);

  const submitMessage = async (e) => {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const parsed = parseIntentSimple(text);
    const userMsg = { id: uid('user-'), role: 'user', text, ts: new Date().toISOString() };
    setChat((current) => [...current, userMsg].slice(-100));
    setInput('');
    setLoading(true);
    setError('');

    try {
      const resp = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: parsed.intent, entity: parsed.entity, parameters: parsed.parameters }),
      });

      const body = await resp.json().catch(() => ({}));
      const returnedIntent = body.intent || parsed.intent || 'UNKNOWN_INTENT';
      const status = body.success === true ? 'SUCCESS' : body.success === false ? 'FAILED' : 'UNKNOWN';
      const systemText = body.message || body.text || `Processed intent ${returnedIntent}`;

      const sysMsg = {
        id: uid('sys-'),
        role: 'system',
        text: systemText,
        intent: returnedIntent,
        status,
        ts: new Date().toISOString(),
      };
      setChat((current) => [...current, sysMsg].slice(-100));

      const txn = {
        id: uid('txn-'),
        timestamp: new Date().toISOString(),
        activity: returnedIntent === 'CHECK_STOCK' ? `Checked Stock for ${parsed.entity}` : `Executed ${returnedIntent}`,
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      };
      setTransactions((current) => [txn, ...current].slice(0, 200));

      const aiLog = {
        id: uid('log-'),
        intentToken: returnedIntent,
        payload: JSON.stringify({ request: { intent: parsed.intent, entity: parsed.entity, parameters: parsed.parameters }, response: body }, null, 2),
        pipelineStatus: status === 'SUCCESS' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'QUEUED',
        ts: new Date().toISOString(),
      };
      setAiLogs((current) => [aiLog, ...current].slice(0, 500));
    } catch (err) {
      setError('Unable to reach backend. Ensure http://localhost:5070 is running.');
      const failMsg = { id: uid('sys-'), role: 'system', text: 'Network error: failed to reach backend.', intent: 'FAILED', status: 'FAILED', ts: new Date().toISOString() };
      setChat((current) => [...current, failMsg]);
      const txn = { id: uid('txn-'), timestamp: new Date().toISOString(), activity: `Network error for: ${text}`, status: 'FAILED' };
      setTransactions((current) => [txn, ...current]);
      const aiLog = { id: uid('log-'), intentToken: 'NETWORK_ERROR', payload: JSON.stringify({ request: { intent: parsed.intent, entity: parsed.entity }, error: String(err) }, null, 2), pipelineStatus: 'FAILED', ts: new Date().toISOString() };
      setAiLogs((current) => [aiLog, ...current]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (active === 'transactions') {
      return (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Transaction Summary</h3>
            <p className="mt-2 text-sm text-slate-500">Recent workflow activity generated from chat commands.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      No transactions yet — submit a chat to generate activity.
                    </td>
                  </tr>
                ) : (
                  transactions.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 text-slate-600">{formatLocal(row.timestamp)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.activity}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (active === 'admin') {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Requests</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{metrics.total}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Success Rate</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{metrics.successRate}%</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active Gateways</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{metrics.gateways}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-4">Audit ID</th>
                  <th className="px-6 py-4">Intent Token</th>
                  <th className="px-6 py-4">Payload</th>
                  <th className="px-6 py-4">Pipeline Status</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {aiLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No audit logs available yet.
                    </td>
                  </tr>
                ) : (
                  aiLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 font-medium text-slate-900">{log.id}</td>
                      <td className="px-6 py-4 text-slate-700">{log.intentToken}</td>
                      <td className="px-6 py-4">
                        <pre className="max-h-44 overflow-auto rounded-2xl bg-slate-100 p-3 text-xs font-mono text-slate-700">{log.payload}</pre>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{log.pipelineStatus}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Conversation Dashboard</h3>
              <p className="mt-2 text-sm text-slate-500">Send a message and let the backend resolve inventory status in real time.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <Clock className="h-4 w-4" /> Backend-first response
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div ref={chatScrollRef} className="max-h-[42rem] space-y-4 overflow-y-auto p-6">
            {chat.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${message.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200'} max-w-[78%] rounded-3xl px-5 py-4 shadow-sm`}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                  {message.role === 'system' && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      <span className={`inline-flex rounded-full px-2.5 py-1 ${message.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : message.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {message.intent}
                      </span>
                      <span>{formatLocal(message.ts)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submitMessage} className="border-t border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about product availability, e.g. Check stock for Dell XPS 15"
                className="min-h-[110px] w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {loading ? 'Processing...' : 'Send Request'}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-2xl shadow-slate-500/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">FlowSpeak</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Inventory Intelligence Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                A production-ready view for backend-driven stock checks, audit telemetry, and transaction monitoring.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-800/80 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Requests</p>
                <p className="mt-3 text-2xl font-semibold">{metrics.total}</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Success</p>
                <p className="mt-3 text-2xl font-semibold">{metrics.successRate}%</p>
              </div>
              <div className="rounded-3xl bg-slate-800/80 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Gateways</p>
                <p className="mt-3 text-2xl font-semibold">{metrics.gateways}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 rounded-3xl bg-slate-900 px-4 py-4 text-white shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-900">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">FlowSpeak</h2>
                <p className="text-sm text-slate-300">Core intent execution engine</p>
              </div>
            </div>

            <nav className="space-y-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium ${
                      isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">System metrics</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Total requests</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.total}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Success rate</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.successRate}%</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.4em] text-emerald-600">Active Page</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900 capitalize">{active === 'chat' ? 'Demo Chat' : active === 'transactions' ? 'Transactions' : 'Admin Telemetry'}</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  <Database className="h-4 w-4" /> Backend driven results
                </div>
              </div>

              <div className="mt-6 grid gap-6">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

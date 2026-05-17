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

const API_ENDPOINT = 'http://localhost:5070/api/action/process';

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
  const forMatch = t.match(/(?:for|of|about|on)\s+([\w\s-]+)/i);
  const product = forMatch ? forMatch[1].trim() : (t.match(/\b(dell|lenovo|hp|asus|acer|macbook|xps|thinkpad|widget)\b/i)?.[0] || t);

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
    { id: uid('sys-'), role: 'system', text: 'FlowSpeak demo: ask to check stock for a product.', intent: 'SYSTEM', status: 'SUCCESS', ts: new Date().toISOString() },
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
    const gateways = 3;
    return { total, successRate: rate, gateways };
  }, [aiLogs]);

  const submitMessage = async (e) => {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const parsed = parseIntentSimple(text);

    const userMsg = { id: uid('user-'), role: 'user', text, ts: new Date().toISOString() };
    setChat((c) => [...c, userMsg]);
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
      const status = (body.success === true || body.status === 'SUCCESS' || body.status === 'COMPLETED') ? 'SUCCESS' : (body.success === false || body.status === 'FAILED' ? 'FAILED' : (returnedIntent === 'UNKNOWN_INTENT' ? 'UNKNOWN' : 'SUCCESS'));
      const systemText = body.message || body.text || `Processed intent ${returnedIntent}`;

      const sysMsg = { id: uid('sys-'), role: 'system', text: systemText, intent: returnedIntent, status, ts: new Date().toISOString() };
      setChat((c) => [...c, sysMsg]);

      const activity = returnedIntent === 'CHECK_STOCK' ? `Checked Stock for ${parsed.entity}` : returnedIntent === 'UNKNOWN_INTENT' ? `Unknown intent: ${parsed.entity}` : `Executed ${returnedIntent}`;
      const txn = { id: uid('txn-'), timestamp: new Date().toISOString(), activity, status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED' };
      setTransactions((t) => [txn, ...t].slice(0, 200));

      const aiLog = { id: uid('log-'), intentToken: returnedIntent, payload: JSON.stringify({ request: { intent: parsed.intent, entity: parsed.entity, parameters: parsed.parameters }, response: body }, null, 2), pipelineStatus: status === 'SUCCESS' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'QUEUED', ts: new Date().toISOString() };
      setAiLogs((l) => [aiLog, ...l].slice(0, 500));
    } catch (err) {
      setError('Unable to reach backend. Ensure http://localhost:5070 is running.');
      const failMsg = { id: uid('sys-'), role: 'system', text: 'Network error: failed to reach backend.', intent: 'FAILED', status: 'FAILED', ts: new Date().toISOString() };
      setChat((c) => [...c, failMsg]);
      const txn = { id: uid('txn-'), timestamp: new Date().toISOString(), activity: `Network error for: ${text}`, status: 'FAILED' };
      setTransactions((t) => [txn, ...t]);
      const aiLog = { id: uid('log-'), intentToken: 'NETWORK_ERROR', payload: JSON.stringify({ request: { intent: parsed.intent, entity: parsed.entity }, error: String(err) }, null, 2), pipelineStatus: 'FAILED', ts: new Date().toISOString() };
      setAiLogs((l) => [aiLog, ...l]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="sticky top-6 h-[calc(100vh-48px)] w-full max-w-xs shrink-0 rounded-2xl border bg-white p-4 shadow">
          <div className="flex items-center gap-3 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">FlowSpeak</h1>
              <p className="text-xs text-slate-500">Deterministic intent execution</p>
            </div>
          </div>

          <nav className="space-y-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const activeTab = t.id === active;
              return (
                <button key={t.id} onClick={() => setActive(t.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${activeTab ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                <span>Cadence</span>
              </div>
              <span className="font-semibold">7m</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <span>Gateways</span>
              </div>
              <span className="font-semibold">{metrics.gateways}</span>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          {active === 'chat' && (
            <section className="flex h-[calc(100vh-96px)] flex-col gap-4">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Demo Chat Window</h2>
                  <p className="text-sm text-slate-500">AI interprets intent; backend executes truth.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  <Clock className="h-4 w-4" /> Intent parser
                </div>
              </header>

              <div className="flex-1 overflow-hidden rounded-2xl border bg-white">
                <div ref={chatScrollRef} className="h-full overflow-y-auto p-6">
                  <div className="space-y-4">
                    {chat.map((m) => (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${m.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-white border'} max-w-[78%] rounded-2xl px-4 py-3 shadow`}> 
                          <div className="whitespace-pre-wrap text-sm">{m.text}</div>
                          {m.role === 'system' && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${m.status === 'SUCCESS' ? INTENT_BADGE.SUCCESS : m.status === 'FAILED' ? INTENT_BADGE.FAILED : INTENT_BADGE.UNKNOWN}`}>{m.intent}</span>
                              <span className="text-2xs text-slate-400">{formatLocal(m.ts)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={submitMessage} className="sticky bottom-0 z-10 mt-auto bg-white px-6 py-4">
                  <div className="mx-auto flex max-w-4xl gap-3">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. Check stock for Dell XPS" className="min-h-[56px] flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                    <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      <Send className="h-4 w-4" /> {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
                </form>
              </div>
            </section>
          )}

          {active === 'transactions' && (
            <section className="flex min-h-[calc(100vh-96px)] flex-col gap-4">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">User Account Transaction Log</h2>
                  <p className="text-sm text-slate-500">Chronological activity from recent workflows.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Live
                </div>
              </header>

              <div className="overflow-hidden rounded-2xl border bg-white">
                <table className="min-w-full divide-y text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Operational Activity</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {transactions.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">No transactions yet — submit a chat to generate activity.</td></tr>
                    )}
                    {transactions.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 text-slate-600">{formatLocal(r.timestamp)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.activity}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${r.status === 'SUCCESS' ? INTENT_BADGE.SUCCESS : INTENT_BADGE.FAILED}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'admin' && (
            <section className="flex min-h-[calc(100vh-96px)] flex-col gap-4">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Admin Master Telemetry</h2>
                  <p className="text-sm text-slate-500">Audit stream from AI_CommandLogs (simulated).</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1 text-sm text-amber-700">
                  <Database className="h-4 w-4" /> Audit
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-xs text-slate-500">Total Requests</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.total}</p>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-xs text-slate-500">Success Rate</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.successRate}%</p>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-xs text-slate-500">Active System Gateways</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics.gateways}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border bg-white">
                <table className="min-w-full divide-y text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Audit ID</th>
                      <th className="px-4 py-3">Intent Token</th>
                      <th className="px-4 py-3">Extracted JSON Payload</th>
                      <th className="px-4 py-3">Route Pipeline Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {aiLogs.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No audit logs yet — run some transactions.</td></tr>
                    )}
                    {aiLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{log.id}</td>
                        <td className="px-4 py-3 text-slate-700">{log.intentToken}</td>
                        <td className="px-4 py-3">
                          <pre className="max-h-36 overflow-auto rounded-md bg-slate-100 p-2 text-xs font-mono text-slate-700">{log.payload}</pre>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{log.pipelineStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

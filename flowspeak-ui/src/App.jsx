import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  Activity,
  Package,
  Zap,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Tag,
  LogOut,
  Lock
} from 'lucide-react';
import { useTelemetry } from './contexts/TelemetryContext.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5070';

const API_ENDPOINT = `${API_BASE}/api/action/interpret`;
const AUTH_ENDPOINT = `${API_BASE}/api/auth`;

function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function formatLocal(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

export default function App() {
  // Auth state
  const [authUser, setAuthUser] = useState(null); // { fullName, role }
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Command center state
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([
    {
      id: uid('sys-'),
      role: 'system',
      text: 'SYSTEM ONLINE. Awaiting natural language intent commands. Try: "Check stock for Dell XPS 15" or "Reserve 2 Dell XPS 15s".',
      intent: 'SYSTEM_READY',
      status: 'SUCCESS',
      ts: new Date().toISOString(),
    },
  ]);
  const { latestTick, isConnected, historyRef } = useTelemetry();
  const [activeContext, setActiveContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const chatScrollRef = useRef(null);

  // ── Login Handler ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const resp = await fetch(`${AUTH_ENDPOINT}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Mistake #9 Avoided
        body: JSON.stringify(loginForm),
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.ok && body.success) {
        setAuthUser(body.user);
      } else {
        setAuthError(body.message || 'Login failed.');
      }
    } catch {
      setAuthError('Cannot connect to server.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Logout Handler ──
  const handleLogout = async () => {
    await fetch(`${AUTH_ENDPOINT}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setAuthUser(null);
    setLoginForm({ username: '', password: '' });
  };

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chat]);

  const submitMessage = async (e) => {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: uid('user-'), role: 'user', text, ts: new Date().toISOString() };
    
    // Rule: SPA Memory Management
    setChat((current) => [...current, userMsg].slice(-100));
    setInput('');
    setLoading(true);

    try {
      let body = null;
      // Send raw text to the backend NLP engine — the server does all the thinking
      // Mistake #9 Avoided: credentials: 'include' sends HttpOnly cookies automatically
      const resp = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      // If 401, session expired — try refresh
      if (resp.status === 401) {
        const refreshResp = await fetch(`${AUTH_ENDPOINT}/refresh`, { method: 'POST', credentials: 'include' });
        if (refreshResp.ok) {
          // Retry the original request with the new cookie
          const retryResp = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text }),
          });
          // Continue with retried response
          body = await retryResp.json().catch(() => ({}));
        } else {
          setAuthUser(null);
          return;
        }
      }

      if (!body) body = await resp.json().catch(() => ({}));
      const returnedIntent = body.intent || 'UNKNOWN_INTENT';
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
      
      // Rule: SPA Memory Management
      setChat((current) => [...current, sysMsg].slice(-100));

      // Update Context Cards based on response type
      if (body.success && body.data) {
        // If data is an array (CHECK_STOCK), use first element
        if (Array.isArray(body.data) && body.data.length > 0) {
          setActiveContext({ type: 'product', ...body.data[0] });
        }
        // If data is an object with orderNumber (RESERVE_STOCK), show order receipt
        else if (body.data.orderNumber) {
          setActiveContext({ type: 'order', ...body.data });
        }
      }

    } catch (err) {
      const failMsg = { id: uid('sys-'), role: 'system', text: 'CONNECTION SEVERED: Failed to reach Execution Layer backend.', intent: 'NETWORK_ERROR', status: 'FAILED', ts: new Date().toISOString() };
      setChat((current) => [...current, failMsg].slice(-100));
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    return (
      <div className="h-screen w-full bg-[#0B0F19] flex items-center justify-center text-slate-300 font-sans">
        <form onSubmit={handleLogin} className="bg-[#151B2B] p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Lock className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-white mb-6 tracking-widest uppercase">Command Center</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Username</label>
              <input type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500" autoFocus />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Password</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          {authError && <p className="text-red-400 text-xs mt-4 text-center">{authError}</p>}

          <button type="submit" disabled={authLoading} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            {authLoading ? 'Authenticating...' : 'Access Terminal'}
          </button>
        </form>
      </div>
    );
  }

  return (
    // Core Layout: Deep Dark Mode, 100vh, hidden overflow for fixed app feel
    <div className="h-screen w-full bg-[#0B0F19] text-slate-300 font-sans overflow-hidden flex flex-col">
      
      {/* Top Navigation / Status Bar */}
      <header className="h-16 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Zap className="h-4 w-4" />
          </div>
          <h1 className="text-sm font-semibold tracking-widest text-slate-100 uppercase">FlowSpeak Command Center</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              )}
            </span>
            <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
              {isConnected ? "TELEMETRY_LINK" : "DISCONNECTED"}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800"></div>
          <span className="text-slate-400">ID: {authUser.fullName} ({authUser.role})</span>
          <button onClick={handleLogout} className="ml-2 flex items-center gap-1 text-slate-500 hover:text-white transition-colors" title="Disconnect">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 3-Panel HUD Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] h-[calc(100vh-4rem)]">
        
        {/* PANEL 1: LIVE LEDGER */}
        <aside className="border-r border-slate-800 bg-[#0F1423] flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-slate-800/50 bg-[#0B0F19]/50">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Activity className="h-4 w-4" /> Live Ledger
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {historyRef.current.length === 0 ? (
              <p className="text-xs text-slate-600 font-mono text-center mt-10">No transactions recorded.</p>
            ) : (
              historyRef.current.map((txn, index) => (
                <div key={txn.id || index} className="rounded-lg border border-slate-800 bg-[#151B2B] p-3 text-xs font-mono shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500">{formatLocal(txn.timestamp)}</span>
                    {txn.status === 'SUCCESS' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">INTENT: </span>
                    <span className={txn.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>{txn.intent}</span>
                  </div>
                  <div className="text-slate-300 mt-1 truncate">
                    <span className="text-slate-500">ENTITY: </span>
                    {txn.entity}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* PANEL 2: COMMAND CHAT */}
        <section className="flex flex-col bg-[#0B0F19] relative">
          
          {/* Background subtle gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10">
            {chat.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-5 py-3.5 text-white shadow-lg shadow-blue-900/20">
                    <p className="text-[15px] leading-relaxed">{msg.text}</p>
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#151B2B] border border-slate-700/50 px-5 py-4 shadow-lg shadow-black/20">
                    <div className="flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-wide">
                      <Cpu className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-400">Execution Engine</span>
                      <span className="text-slate-600 px-1">•</span>
                      <span className={msg.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
                        [{msg.intent}]
                      </span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-[#0B0F19] border-t border-slate-800 z-10">
            <form onSubmit={submitMessage} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Execute a command... (e.g. 'Reserve 5 Dell Laptops')"
                autoFocus
                className="w-full rounded-2xl bg-[#151B2B] border border-slate-700 py-4 pl-5 pr-16 text-[15px] text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </form>
          </div>
        </section>

        {/* PANEL 3: CONTEXT CARDS */}
        <aside className="border-l border-slate-800 bg-[#0F1423] flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-slate-800/50 bg-[#0B0F19]/50">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Database className="h-4 w-4" /> Live Context
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {!activeContext ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50">
                <Package className="h-12 w-12" />
                <p className="text-xs font-mono uppercase text-center">No active record in context.<br/>Query a product to load.</p>
              </div>
            ) : activeContext.type === 'order' ? (
              /* ORDER RECEIPT CARD */
              <div className="rounded-xl bg-[#1A2235] border border-slate-700/60 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 border-b border-slate-700/60 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <CheckCircle2 className="h-24 w-24" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold relative z-10">Order Receipt</p>
                  <h3 className="text-xl font-bold text-white relative z-10 mt-1">{activeContext.orderNumber}</h3>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</p>
                    <span className="rounded-full bg-amber-500/20 text-amber-400 px-3 py-1 text-xs font-bold uppercase">{activeContext.status}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Product</p>
                    <p className="text-sm text-slate-200">{activeContext.productName}</p>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{activeContext.productSKU}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Qty Reserved</p>
                      <p className="text-2xl font-mono text-white">{activeContext.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Total</p>
                      <p className="text-2xl font-light text-emerald-400">${activeContext.totalAmount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#151B2B] border-t border-slate-700/60 text-center">
                  <p className="text-[10px] uppercase font-mono text-slate-500">Order Logged to SQL Server</p>
                </div>
              </div>
            ) : (
              /* PRODUCT CONTEXT CARD */
              <div className="rounded-xl bg-[#1A2235] border border-slate-700/60 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 border-b border-slate-700/60 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Package className="h-24 w-24" />
                  </div>
                  <h3 className="text-lg font-semibold text-white relative z-10 leading-tight">{activeContext.name}</h3>
                  <div className="mt-2 flex items-center gap-2 relative z-10">
                    <Tag className="h-3 w-3 text-slate-400" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{activeContext.sku}</span>
                  </div>
                </div>
                
                <div className="p-5 space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Pricing</p>
                    <p className="text-3xl font-light text-white">${activeContext.price?.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Inventory Status</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${activeContext.stockQuantity > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`}></div>
                        <span className="text-sm font-medium text-slate-300">
                          {activeContext.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <span className="text-xl font-mono text-white">{activeContext.stockQuantity}</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${activeContext.stockQuantity > 20 ? 'bg-emerald-500' : activeContext.stockQuantity > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min((activeContext.stockQuantity / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#151B2B] border-t border-slate-700/60 text-center">
                  <p className="text-[10px] uppercase font-mono text-slate-500">Live Database Binding Active</p>
                </div>
              </div>
            )}
          </div>
        </aside>

      </main>
      
      {/* Global styles for custom scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}} />
    </div>
  );
}

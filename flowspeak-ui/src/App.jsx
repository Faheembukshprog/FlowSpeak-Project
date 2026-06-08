import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  BarChart3,
  ScrollText,
  FileUp,
  MessageSquare,
  ShieldAlert,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useTelemetry } from './contexts/TelemetryContext.jsx';
import DashboardPanel from './components/DashboardPanel.jsx';
import AuditLogPanel from './components/AuditLogPanel.jsx';
import CsvImportPanel from './components/CsvImportPanel.jsx';
import AccessTerminal from './components/AccessTerminal.jsx';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';
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

function parseTickPayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try { return JSON.parse(payload); } catch { return null; }
  }
  if (typeof payload === 'object') return payload;
  return null;
}

function txnMatchesLowStockAlert(txn, alerts) {
  if (!alerts?.length) return false;
  if (txn.eventType === 'LOW_STOCK_ALERT') return true;

  const entity = (txn.entity || '').toLowerCase();
  const payload = parseTickPayload(txn.payload);
  const payloadSku = (payload?.sku || '').toUpperCase();

  return alerts.some((alert) => {
    if (alert.name && entity && alert.name.toLowerCase() === entity) return true;
    if (payloadSku && alert.sku && payloadSku === alert.sku.toUpperCase()) return true;
    if (entity && alert.sku && entity === alert.sku.toLowerCase()) return true;
    return false;
  });
}

function intentStatusClass(status) {
  if (status === 'SUCCESS') return 'text-emerald-400';
  if (status === 'FORBIDDEN') return 'text-amber-400';
  return 'text-rose-500';
}

function PanelHeader({ icon: Icon, title, badge, badgeClassName = 'text-emerald-400' }) {
  return (
    <div className="shrink-0 p-3 sm:p-4 border-b border-slate-800/60 bg-[#0E1422]/50">
      <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest min-w-0">
        <Icon className="h-3.5 w-3.5 text-emerald-400/80 shrink-0" />
        <span className="text-slate-400 shrink-0 leading-none">{title}</span>
        {badge ? (
          <>
            <span className="text-slate-700 shrink-0 leading-none">·</span>
            <span className={`shrink-0 leading-none truncate ${badgeClassName}`}>{badge}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function getTabsForRole(role) {
  const tabs = [{ id: 'command', label: 'Command', icon: MessageSquare }];
  if (role === 'Admin' || role === 'Sales') {
    tabs.push({ id: 'dashboard', label: 'Dashboard', icon: BarChart3 });
  }
  if (role === 'Admin') {
    tabs.push({ id: 'audit', label: 'Audit Log', icon: ScrollText });
    tabs.push({ id: 'import', label: 'Import', icon: FileUp });
  }
  return tabs;
}

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [activeView, setActiveView] = useState('command');
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
  const { latestTick, isConnected, historyRef, lowStockAlerts, dismissLowStockAlert } = useTelemetry();
  const [activeContext, setActiveContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlightedLedgerKey, setHighlightedLedgerKey] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const chatScrollRef = useRef(null);
  const ledgerScrollRef = useRef(null);
  const ledgerRowRefs = useRef({});

  const tabs = useMemo(() => (authUser ? getTabsForRole(authUser.role) : []), [authUser]);

  const ledgerItems = useMemo(() => {
    void latestTick;
    return [...historyRef.current];
  }, [latestTick, historyRef]);

  useEffect(() => {
    if (lowStockAlerts.length > 0) {
      requestAnimationFrame(() => setBannerVisible(true));
    } else {
      setBannerVisible(false);
    }
  }, [lowStockAlerts.length]);

  const getLedgerKeyForTxn = (txn) => {
    const entity = (txn.entity || '').toLowerCase();
    const payload = parseTickPayload(txn.payload);
    const sku = (payload?.sku || '').toUpperCase();
    return sku || entity || txn.id;
  };

  const focusLedgerForAlert = (alert) => {
    setActiveView('command');
    const keys = [alert.sku?.toUpperCase(), alert.name?.toLowerCase()].filter(Boolean);
    setHighlightedLedgerKey(keys[0] || alert.id);

    requestAnimationFrame(() => {
      const items = historyRef.current;
      let targetKey = null;
      for (const txn of items) {
        const key = getLedgerKeyForTxn(txn);
        const entity = (txn.entity || '').toLowerCase();
        if (
          (alert.sku && (key === alert.sku.toUpperCase() || entity === alert.sku.toLowerCase())) ||
          (alert.name && entity === alert.name.toLowerCase()) ||
          txn.eventType === 'LOW_STOCK_ALERT'
        ) {
          targetKey = key;
          break;
        }
      }
      const refKey = targetKey || keys[0];
      const el = ledgerRowRefs.current[refKey];
      if (el && ledgerScrollRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    setTimeout(() => setHighlightedLedgerKey(null), 2500);
  };

  const handleAuthenticated = (user) => {
    setAuthUser(user);
    setActiveView('command');
  };

  const handleLogout = async () => {
    await fetch(`${AUTH_ENDPOINT}/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setAuthUser(null);
    setActiveView('command');
  };

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chat]);

  const submitMessage = async (e) => {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg = { id: uid('user-'), role: 'user', text, ts: new Date().toISOString() };
    setChat((current) => [...current, userMsg].slice(-100));
    setInput('');
    setLoading(true);

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
        ts: new Date().toISOString(),
      };
      setChat((current) => [...current, sysMsg].slice(-100));

      if (body.success && body.data) {
        if (Array.isArray(body.data) && body.data.length > 0) {
          setActiveContext({ type: 'product', ...body.data[0] });
        } else if (body.data.orderNumber) {
          setActiveContext({ type: 'order', ...body.data });
        } else if (body.data.productSKU || body.data.productName) {
          setActiveContext({ type: 'product', name: body.data.productName, sku: body.data.productSKU, price: body.data.price, stockQuantity: body.data.stockQuantity ?? body.data.newStock });
        }
      }
    } catch {
      const failMsg = { id: uid('sys-'), role: 'system', text: 'CONNECTION SEVERED: Failed to reach Execution Layer backend.', intent: 'NETWORK_ERROR', status: 'FAILED', ts: new Date().toISOString() };
      setChat((current) => [...current, failMsg].slice(-100));
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    return <AccessTerminal onAuthenticated={handleAuthenticated} />;
  }

  const renderMainContent = () => {
    if (activeView === 'dashboard') return <DashboardPanel />;
    if (activeView === 'audit') return <AuditLogPanel />;
    if (activeView === 'import') return <CsvImportPanel />;

    return (
      <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 lg:h-full lg:flex lg:flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-[1600px] mx-auto lg:flex-1 lg:min-h-0">
        <aside className="order-2 lg:order-1 flex flex-col min-w-0 border border-slate-800/60 lg:border-r bg-[#0B0F19] lg:min-h-0 lg:h-full">
          <PanelHeader icon={Activity} title="Live Ledger" badge="[STREAMING]" />
          <div ref={ledgerScrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar max-h-80 sm:max-h-96 lg:max-h-none">
            {ledgerItems.length === 0 ? (
              <p className="text-[11px] text-slate-600 font-mono text-center mt-10 uppercase tracking-wider">No transactions recorded.</p>
            ) : (
              ledgerItems.map((txn, index) => {
                const isLowStock = txnMatchesLowStockAlert(txn, lowStockAlerts);
                const ledgerKey = getLedgerKeyForTxn(txn);
                const isPulsing = highlightedLedgerKey && (
                  highlightedLedgerKey === ledgerKey ||
                  highlightedLedgerKey === (txn.entity || '').toLowerCase() ||
                  highlightedLedgerKey === ledgerKey?.toUpperCase()
                );
                return (
                  <div
                    key={txn.id || index}
                    ref={(el) => { if (el) ledgerRowRefs.current[ledgerKey] = el; }}
                    className={`border border-slate-800/60 p-3 text-[11px] font-mono transition-all duration-150 ease-in-out ${
                      isPulsing
                        ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                        : isLowStock
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'bg-[#0E1422]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-slate-500 tabular-nums">{formatLocal(txn.timestamp)}</span>
                      <div className="flex items-center gap-1.5">
                        {isLowStock && (
                          <span className="text-[9px] uppercase tracking-wider text-amber-400">LOW STOCK</span>
                        )}
                        {txn.status === 'SUCCESS' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-rose-500" />
                        )}
                      </div>
                    </div>
                    <div className="text-slate-100 min-w-0">
                      <span className="text-slate-500">INTENT: </span>
                      <span className={`break-all ${txn.status === 'SUCCESS' ? 'text-emerald-400' : txn.eventType === 'LOW_STOCK_ALERT' ? 'text-amber-400' : 'text-rose-500'}`}>
                        {txn.intent || txn.eventType}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1 min-w-0">
                      <span className="text-slate-500">ENTITY: </span>
                      <span className="break-all">{txn.entity}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section className="order-1 lg:order-2 flex flex-col min-h-[min(56vh,520px)] lg:min-h-0 lg:h-full bg-[#0B0F19] border border-slate-800/60 overflow-hidden">
          <PanelHeader icon={Cpu} title="Execution Engine" badge="[SYSTEM_READY]" />
          <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-3 sm:space-y-4 custom-scrollbar">
            {chat.map((msg) => (
              <div key={msg.id} className={`flex w-full min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-full sm:max-w-[85%] lg:max-w-[80%] min-w-0 border border-emerald-500/30 bg-[#0E1422]/50 px-3 sm:px-4 py-3 text-slate-100 transition-all duration-150 ease-in-out">
                    <p className="font-mono text-xs sm:text-sm leading-relaxed break-words">{msg.text}</p>
                  </div>
                ) : (
                  <div className="max-w-full sm:max-w-[90%] lg:max-w-[85%] min-w-0 border border-slate-800/60 bg-[#0E1422]/50 px-3 sm:px-4 py-3 transition-all duration-150 ease-in-out">
                    <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-widest min-w-0 overflow-x-auto">
                      <Cpu className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="text-slate-400 shrink-0 leading-none">Execution Engine</span>
                      <span className="text-slate-700 shrink-0 leading-none">·</span>
                      <span className={`shrink-0 leading-none whitespace-nowrap ${intentStatusClass(msg.status)}`}>
                        [{msg.intent}]
                      </span>
                      {msg.status === 'FORBIDDEN' && <ShieldAlert className="h-3 w-3 text-amber-400 shrink-0" />}
                    </div>
                    <p className="font-mono text-xs sm:text-sm leading-relaxed text-slate-100 whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800/60 bg-[#0B0F19]">
            <form onSubmit={submitMessage} className="flex flex-col gap-2 sm:block sm:relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Execute a command..."
                autoFocus
                className="w-full bg-slate-950/40 border border-slate-800/60 py-3 pl-3 sm:pl-4 pr-3 sm:pr-14 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all duration-150 ease-in-out"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-full sm:w-auto sm:absolute sm:right-1.5 sm:top-1/2 sm:-translate-y-1/2 flex h-10 sm:h-9 sm:w-9 items-center justify-center gap-2 border border-emerald-500/40 bg-[#0E1422]/80 text-emerald-400 font-mono text-[10px] sm:text-inherit uppercase sm:normal-case tracking-widest sm:tracking-normal transition-all duration-150 ease-in-out hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] disabled:opacity-40 disabled:hover:shadow-none disabled:hover:bg-[#0E1422]/80"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="sm:hidden">{loading ? 'Processing...' : 'Execute'}</span>
              </button>
            </form>
          </div>
        </section>

        <aside className="order-3 flex flex-col min-w-0 border border-slate-800/60 lg:border-l bg-[#0B0F19] lg:min-h-0 lg:h-full">
          <PanelHeader
            icon={Database}
            title="Live Context"
            badge={activeContext ? '[BOUND]' : '[IDLE]'}
            badgeClassName={activeContext ? 'text-emerald-400' : 'text-slate-500'}
          />
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 custom-scrollbar">
            {!activeContext ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-600">
                <Package className="h-10 w-10 text-slate-700" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-center text-slate-500 leading-relaxed">
                  No active record in context.<br />Query a product to load.
                </p>
              </div>
            ) : activeContext.type === 'order' ? (
              <div className="border border-slate-800/60 bg-[#0E1422]/50 overflow-hidden">
                <div className="p-4 border-b border-slate-800/60 bg-slate-950/40">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/80">Order Receipt</p>
                  <h3 className="font-mono text-base sm:text-lg text-slate-100 mt-1 break-all">{activeContext.orderNumber}</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Status</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1">{activeContext.status}</span>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">Product</p>
                    <p className="font-mono text-sm text-slate-100 break-words">{activeContext.productName}</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-0.5 break-all">{activeContext.productSKU}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">Qty Reserved</p>
                      <p className="font-mono text-xl text-slate-100 tabular-nums">{activeContext.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total</p>
                      <p className="font-mono text-xl text-emerald-400 tabular-nums">${activeContext.totalAmount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-800/60 bg-slate-950/40 text-center">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Order Logged to Database</p>
                </div>
              </div>
            ) : (
              <div className="border border-slate-800/60 bg-[#0E1422]/50 overflow-hidden">
                <div className="p-4 border-b border-slate-800/60 bg-slate-950/40">
                  <h3 className="font-mono text-sm sm:text-base text-slate-100 leading-snug break-words">{activeContext.name}</h3>
                  <div className="mt-2 flex items-center gap-2 min-w-0">
                    <Tag className="h-3 w-3 text-slate-500 shrink-0" />
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest break-all">{activeContext.sku}</span>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pricing</p>
                    <p className="font-mono text-2xl text-slate-100 tabular-nums">${activeContext.price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">Inventory Status</p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${activeContext.stockQuantity > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                          {activeContext.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <span className="font-mono text-lg text-slate-100 tabular-nums">{activeContext.stockQuantity}</span>
                    </div>
                    <div className="mt-3 h-1 w-full bg-slate-800/80 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-150 ease-in-out ${activeContext.stockQuantity > 20 ? 'bg-emerald-500' : activeContext.stockQuantity > 0 ? 'bg-amber-400' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min((activeContext.stockQuantity / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-800/60 bg-slate-950/40 text-center">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">Live Database Binding Active</p>
                </div>
              </div>
            )}
          </div>
        </aside>
          </div>
        </div>
      </main>
    );
  };

  return (
    <div className="h-screen w-full bg-[#0B0F19] text-slate-300 font-sans overflow-hidden flex flex-col">
      <header className="shrink-0 border-b border-slate-800/60 bg-[#0B0F19] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 z-10">
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-5 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <h1 className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-widest text-slate-100 uppercase truncate">FlowSpeak Command Center</h1>
          </div>

          <nav className="flex items-center gap-1 shrink-0 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ease-in-out border ${
                    isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-800/60 hover:bg-[#0E1422]/50'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              )}
            </span>
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-500'}>
              {isConnected ? 'TELEMETRY_LINK' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-800/60" />
          <span className="text-slate-400 normal-case tracking-normal truncate max-w-[140px] sm:max-w-none">ID: {authUser.fullName} ({authUser.role})</span>
          <button
            onClick={handleLogout}
            className="ml-1 flex items-center gap-1 text-slate-500 hover:text-slate-100 transition-all duration-150 ease-in-out"
            title="Disconnect"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div
        className={`shrink-0 overflow-hidden transition-all duration-150 ease-in-out border-b border-amber-500/30 bg-amber-500/5 ${
          bannerVisible && lowStockAlerts.length > 0
            ? 'max-h-48 opacity-100 translate-y-0'
            : 'max-h-0 opacity-0 -translate-y-1 border-b-0'
        }`}
      >
        {lowStockAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-4 sm:px-5 py-2 border-b border-amber-500/20 last:border-b-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle className={`h-3 w-3 shrink-0 ${alert.status === 'CRITICAL' ? 'text-rose-500' : 'text-amber-400'}`} />
              <p className="text-[11px] font-mono text-slate-300 truncate">
                <span className="text-amber-400 uppercase tracking-wider mr-2">Low Stock</span>
                <button
                  type="button"
                  onClick={() => focusLedgerForAlert(alert)}
                  className="text-slate-100 hover:text-emerald-400 transition-all duration-150 ease-in-out"
                >
                  {alert.name}
                </button>
                <span className="text-slate-600 mx-1.5">·</span>
                <button
                  type="button"
                  onClick={() => focusLedgerForAlert(alert)}
                  className="text-slate-400 hover:text-emerald-400 transition-all duration-150 ease-in-out"
                >
                  {alert.sku}
                </button>
                <span className="text-slate-600 mx-1.5">·</span>
                <span className={alert.stockQuantity === 0 ? 'text-rose-500' : 'text-amber-400'}>
                  {alert.stockQuantity} unit{alert.stockQuantity === 1 ? '' : 's'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissLowStockAlert(alert.id)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 border border-amber-500/30 text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all duration-150 ease-in-out"
            >
              <X className="h-3 w-3" /> Dismiss
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {renderMainContent()}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

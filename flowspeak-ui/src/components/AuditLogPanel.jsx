import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, RefreshCw, Radio } from 'lucide-react';
import { useTelemetry } from '../contexts/TelemetryContext.jsx';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';

function formatLocal(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function resolveStatusLabel(log) {
  const err = (log.errorMessage || '').toLowerCase();
  if (err.includes('access denied') || err.includes('not authorized') || log.statusLabel === 'FORBIDDEN') {
    return 'FORBIDDEN';
  }
  if (log.wasSuccessful) return 'SUCCESS';
  return 'FAILED';
}

function StatusBadge({ log }) {
  const label = resolveStatusLabel(log);
  if (label === 'SUCCESS') {
    return (
      <span className="font-mono text-[10px] tracking-wider text-emerald-400/70 bg-emerald-500/5 border border-emerald-500/15 px-2 py-0.5 rounded">
        [ SUCCESS ]
      </span>
    );
  }
  if (label === 'FORBIDDEN') {
    return (
      <span className="font-mono text-[10px] tracking-wider text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
        [ FORBIDDEN ]
      </span>
    );
  }
  return (
    <span className="font-mono text-[10px] tracking-wider text-red-400 font-bold bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded">
      [ FAILED ]
    </span>
  );
}

function tickToLiveLog(tick) {
  const payload = typeof tick.payload === 'string'
    ? tick.payload
    : tick.payload ? JSON.stringify(tick.payload) : null;

  const isForbidden = tick.status === 'FORBIDDEN';
  const isFailed = tick.status === 'FAILED' || tick.status === 'CRITICAL';

  return {
    externalId: `live-${tick.id || Date.now()}`,
    intent: tick.intent || tick.eventType || 'TELEMETRY',
    entity: tick.entity || '—',
    wasSuccessful: !isFailed && !isForbidden && tick.status !== 'FAILED',
    errorMessage: isForbidden ? 'Access denied by RBAC gate' : isFailed ? payload : null,
    processedAt: tick.timestamp || new Date().toISOString(),
    isLive: true,
    statusLabel: isForbidden ? 'FORBIDDEN' : isFailed ? 'FAILED' : 'SUCCESS',
  };
}

export default function AuditLogPanel() {
  const { latestTick } = useTelemetry();
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveStream, setLiveStream] = useState(false);
  const [liveRows, setLiveRows] = useState([]);
  const seenLiveIdsRef = useRef(new Set());

  const [intent, setIntent] = useState('');
  const [success, setSuccess] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (intent.trim()) params.set('intent', intent.trim());
      if (success !== '') params.set('success', success);
      if (from) params.set('from', new Date(from).toISOString());
      if (to) params.set('to', new Date(to).toISOString());

      const resp = await fetch(`${API_BASE}/api/telemetry/logs?${params}`, { credentials: 'include' });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.message || `Failed to load logs (${resp.status})`);
      }
      const json = await resp.json();
      setLogs(json.logs || []);
      setTotalCount(json.totalCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs.');
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, intent, success, from, to]);

  useEffect(() => {
    if (!liveStream) fetchLogs();
  }, [fetchLogs, liveStream]);

  useEffect(() => {
    if (!liveStream || !latestTick) return;
    const tickId = latestTick.id;
    if (tickId && seenLiveIdsRef.current.has(tickId)) return;
    if (tickId) seenLiveIdsRef.current.add(tickId);

    const row = tickToLiveLog(latestTick);
    setLiveRows((current) => [row, ...current].slice(0, 100));
  }, [latestTick, liveStream]);

  const displayLogs = liveStream ? liveRows : logs;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0B0F19]">
      <div className="shrink-0 border-b border-slate-800/80 bg-[#0F1423] px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setLiveStream((v) => !v);
            if (!liveStream) {
              setLiveRows([]);
              seenLiveIdsRef.current.clear();
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-200 ${
            liveStream
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
          }`}
        >
          <Radio className={`h-3.5 w-3.5 ${liveStream ? 'animate-pulse' : ''}`} />
          [ LIVE TELEMETRY STREAM ]
        </button>
        {liveStream && (
          <span className="text-[10px] font-mono text-emerald-400/70 animate-pulse">
            ● INGESTING SIGNALR CHUNKS
          </span>
        )}
      </div>

      {!liveStream && (
        <form onSubmit={applyFilters} className="shrink-0 border-b border-slate-800/80 bg-[#0F1423] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Query Filters</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Intent (e.g. CHECK_STOCK)"
              className="bg-[#151B2B] border border-slate-700/80 rounded-lg py-2 px-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
            <select
              value={success}
              onChange={(e) => setSuccess(e.target.value)}
              className="bg-[#151B2B] border border-slate-700/80 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All statuses</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-[#151B2B] border border-slate-700/80 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
            />
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-[#151B2B] border border-slate-700/80 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-mono font-semibold rounded-lg py-2 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Apply
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {error && !liveStream && <p className="p-4 text-xs font-mono text-red-400">{error}</p>}
        {loading && !liveStream ? (
          <p className="p-8 text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">
            Loading audit logs...
          </p>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-[#0B0F19] text-slate-500 border-b border-slate-800/80 z-10">
              <tr>
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-normal">Timestamp</th>
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-normal">Intent</th>
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-normal">Entity</th>
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-normal">Status</th>
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-normal">Error</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-600 text-[11px]">
                    {liveStream ? 'Awaiting telemetry stream...' : 'No audit logs match your filters.'}
                  </td>
                </tr>
              ) : (
                displayLogs.map((log) => (
                  <tr
                    key={log.externalId}
                    className={`border-b border-slate-800/40 hover:bg-[#151B2B]/40 transition-all duration-300 ${
                      log.isLive ? 'animate-[fadeIn_0.4s_ease-out] bg-emerald-500/[0.03]' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 text-slate-500">{formatLocal(log.processedAt)}</td>
                    <td className="py-2.5 px-4 text-slate-200">{log.intent}</td>
                    <td className="py-2.5 px-4 text-slate-300 truncate max-w-[200px]">{log.entity || '—'}</td>
                    <td className="py-2.5 px-4">
                      <StatusBadge log={log} />
                    </td>
                    <td className="py-2.5 px-4 text-red-400/70 truncate max-w-[240px]">{log.errorMessage || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!liveStream && (
        <div className="shrink-0 border-t border-slate-800/80 bg-[#0F1423] px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            {totalCount} total · page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

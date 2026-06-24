import React, { useCallback, useEffect, useRef, useState, memo } from 'react';

import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, Radio, Activity } from 'lucide-react';

import { useTelemetry } from '../contexts/TelemetryContext.jsx';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';
const REFRESH_INTERVAL = 30000;

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₨ ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const StatCard = memo(function StatCard({ label, value, icon: Icon, accent, flash, alertPulse, children }) {
  return (
    <div
      className={`group min-w-0 rounded-xl sm:rounded-2xl border p-3 sm:p-5 lg:p-6 transition-all duration-300 ease-out select-none
        ${flash
          ? 'border-emerald-500/50 bg-linear-to-b from-emerald-950/20 to-emerald-900/10 shadow-[0_0_30px_rgba(16,185,129,0.12)] scale-[1.03]'
          : alertPulse
            ? 'border-amber-500/50 bg-linear-to-b from-amber-950/20 to-amber-900/10 animate-pulse'
            : 'border-slate-800/80 bg-[#121824]/90 hover:border-slate-700/80 hover:bg-[#151c2a] hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:scale-[1.015]'
        }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-5">
        <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-slate-400 truncate">
          {label}
        </span>
        <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-inner ${accent}`}>
          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </div>
      </div>

      <div className="space-y-1 sm:space-y-1.5">
        <p className={`text-xl sm:text-2xl lg:text-3xl font-mono font-bold tracking-tight truncate transition-colors duration-200 ${flash ? 'text-emerald-400' : 'text-white'}`}>
          {value}
        </p>
        {children}
      </div>
    </div>
  );
});

const CommandVolumeChart = memo(function CommandVolumeChart({ chartData }) {
  const [hovered, setHovered] = useState(null);

  if (!chartData?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 sm:py-16 border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/20">
        <p className="text-[11px] text-slate-500 font-mono">No telemetry command logs loaded.</p>
      </div>
    );
  }

  const maxVal = Math.max(...chartData.map((d) => d.success + d.failed), 1);
  const barWidth = 32;
  const gap = 14;
  const chartHeight = 140;
  const padding = { top: 16, bottom: 32, left: 12, right: 12 };
  const svgWidth = chartData.length * (barWidth + gap) - gap + padding.left + padding.right;

  return (
    <div className="relative w-full">
      <div className="overflow-x-auto custom-scrollbar pb-3 snap-x">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight + padding.top + padding.bottom}`}
          className="w-full min-w-115 h-auto overflow-visible"
        >
          {chartData.map((day, i) => {
            const total = day.success + day.failed;
            const barH = (total / maxVal) * chartHeight;
            const successH = total > 0 ? (day.success / total) * barH : 0;
            const failedH = barH - successH;
            const x = padding.left + i * (barWidth + gap);
            const baseY = padding.top + chartHeight;
            const isHovered = hovered === i;
            const fullDayName = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

            return (
              <g
                key={`metric-group-${day.date}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer group snap-center"
              >
                <rect
                  x={x - gap / 2}
                  y={padding.top - 8}
                  width={barWidth + gap}
                  height={chartHeight + padding.bottom}
                  fill="transparent"
                />
                <rect
                  x={x}
                  y={padding.top}
                  width={barWidth}
                  height={chartHeight}
                  fill="#1e293b"
                  opacity={0.12}
                  rx={4}
                />
                <rect
                  x={x}
                  y={baseY - failedH - successH}
                  width={barWidth}
                  height={Math.max(successH, 0)}
                  rx={3}
                  fill={isHovered ? '#34d399' : '#10b981'}
                  opacity={isHovered ? 1 : 0.8}
                  className="transition-all duration-200 ease-out"
                />
                {failedH > 0 && (
                  <rect
                    key={`failed-bar-${day.date}`}
                    x={x}
                    y={baseY - failedH}
                    width={barWidth}
                    height={failedH}
                    rx={3}
                    fill={isHovered ? '#f87171' : '#ef4444'}
                    opacity={isHovered ? 0.95 : 0.75}
                    className="transition-all duration-200 ease-out"
                  />
                )}
                <text
                  x={x + barWidth / 2}
                  y={baseY + 20}
                  textAnchor="middle"
                  fill={isHovered ? '#a1a1aa' : '#4b5563'}
                  fontSize="10"
                  className="font-mono tracking-wider transition-colors duration-200"
                >
                  {day.dayName}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={baseY - barH - 8}
                  textAnchor="middle"
                  fill={isHovered ? '#34d399' : '#64748b'}
                  fontSize="9.5"
                  className="font-mono font-bold transition-all duration-200"
                >
                  {total}
                </text>
                {isHovered && <title>{`${fullDayName}: ${total} System Packets`}</title>}
              </g>
            );
          })}
        </svg>
      </div>

      {hovered !== null && chartData[hovered] && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150 min-w-40">
          <div className="rounded-xl border border-slate-800 bg-[#0c101a]/95 px-4 py-3 text-center shadow-2xl backdrop-blur-md">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {new Date(chartData[hovered].date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <p className="text-sm font-mono font-bold text-white mt-0.5">
              {chartData[hovered].success + chartData[hovered].failed} Commands Routed
            </p>
            <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
              <span className="text-emerald-400 font-medium">● {chartData[hovered].success} OK</span>
              <span className="text-slate-700">|</span>
              <span className="text-red-400 font-medium">● {chartData[hovered].failed} Failures</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default function DashboardPanel() {
  const { latestTick } = useTelemetry();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordersFlash, setOrdersFlash] = useState(false);
  const prevOrdersRef = useRef(null);

  const fetchSummary = useCallback(async (signal) => {
    try {
      const resp = await fetch(`${API_BASE}/api/dashboard/summary`, { credentials: 'include', signal });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.message || `Telemetry sync drop (${resp.status})`);
      }
      return await resp.json();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null;
      throw err;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function initializeDashboard() {
      setLoading(true);
      setError('');
      try {
        const json = await fetchSummary(controller.signal);
        if (json) {
          setData(json);
          prevOrdersRef.current = json.ordersToday;
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'System failed to link core aggregator.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    initializeDashboard();
    return () => controller.abort();
  }, [fetchSummary]);

  useEffect(() => {
    const controller = new AbortController();
    const interval = setInterval(async () => {
      try {
        const json = await fetchSummary(controller.signal);
        if (!json) return;
        setData((prev) => {
          if (prev && json.ordersToday > prev.ordersToday) {
            setOrdersFlash(true);
            setTimeout(() => setOrdersFlash(false), 1000);
          }
          return json;
        });
      } catch {}
    }, REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [fetchSummary]);

  useEffect(() => {
    if (!latestTick) return;
    const isOrderEvent =
      latestTick.eventType === 'ORDER_CREATED' ||
      latestTick.eventType === 'ORDER_CANCELLED' ||
      latestTick.intent === 'RESERVE_STOCK' ||
      latestTick.intent === 'CANCEL_ORDER';
    if (isOrderEvent) {
      setOrdersFlash(true);
      const timer = setTimeout(() => setOrdersFlash(false), 1000);
      const controller = new AbortController();
      fetchSummary(controller.signal)
        .then((json) => { if (json) setData(json); })
        .catch(() => {});
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }
  }, [latestTick, fetchSummary]);

  useEffect(() => {
    if (data?.ordersToday == null) return;
    if (prevOrdersRef.current !== null && data.ordersToday > prevOrdersRef.current) {
      setOrdersFlash(true);
      const timer = setTimeout(() => setOrdersFlash(false), 1000);
      prevOrdersRef.current = data.ordersToday;
      return () => clearTimeout(timer);
    }
    prevOrdersRef.current = data.ordersToday;
  }, [data?.ordersToday]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F19]">
        <div className="text-center space-y-4 sm:space-y-5">
          <Radio className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-400 mx-auto animate-pulse" />
          <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 uppercase tracking-[0.35em]">Synching active metric nodes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F19] p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 sm:px-6 py-4 sm:py-5 max-w-md shadow-2xl">
          <Activity className="h-5 w-5 text-red-400 shrink-0 animate-bounce" />
          <p className="text-[11px] sm:text-xs font-mono text-red-300/90 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const lowStockActive = (data?.lowStockCount ?? 0) > 0;

  return (
    <div className="relative h-full overflow-y-auto p-3 sm:p-5 lg:p-8 space-y-5 sm:space-y-7 lg:space-y-8 custom-scrollbar bg-[#0B0F19] text-slate-200">
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-60 sm:w-80 h-60 sm:h-80 bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start sm:items-center gap-3 sm:gap-4 sm:flex sm:flex-wrap sm:justify-between border-b border-slate-900/80 pb-4 sm:pb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-500">
            <Activity className="h-3.5 w-3.5 text-blue-500/70 shrink-0" />
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] truncate">Metrics HUD Terminal</p>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight mt-1.5 truncate">Real-Time Aggregate Engine</h2>
        </div>

        <div className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 px-3 sm:px-4 py-1.5 rounded-full shadow-lg shadow-emerald-950/20 shrink-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="truncate">LIVE RECEIVER READY</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        <StatCard
          label="Orders Today"
          value={data?.ordersToday ?? 0}
          icon={ShoppingCart}
          accent="bg-blue-500/10 text-blue-400 border border-blue-500/10"
          flash={ordersFlash}
        />
        <StatCard
          label="Weekly Revenue"
          value={formatCurrency(data?.weeklyRevenue)}
          icon={DollarSign}
          accent="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
        />
        <StatCard
          label="Low-Stock Count"
          value={data?.lowStockCount ?? 0}
          icon={Package}
          accent="bg-amber-500/10 text-amber-400 border border-amber-500/10"
          alertPulse={lowStockActive}
        >
          {lowStockActive && (
            <p className="text-[9px] font-mono text-amber-500/90 uppercase tracking-widest mt-1 sm:mt-1.5">
              Threshold &lt; 5 units
            </p>
          )}
        </StatCard>
        <StatCard
          label="System Success Rate"
          value={`${Number(data?.aiSuccessRate ?? 100).toFixed(1)}%`}
          icon={TrendingUp}
          accent="bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7 lg:gap-8">
        {/* Chart */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-800/80 bg-[#121824]/60 p-4 sm:p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center gap-2.5 mb-5 sm:mb-8">
              <BarChart3 className="h-4 w-4 text-slate-400 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
                7-Day Command Volume
              </h3>
            </div>
            <CommandVolumeChart chartData={data?.chartData} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> Success
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" /> Failed
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">Hover analytics column path for logs</span>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-800/80 bg-[#121824]/60 p-4 sm:p-6 shadow-2xl flex flex-col">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
              Top Active Commodities
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1 rounded-xl border border-slate-800/40 bg-[#0e131d]/30">
            <table className="w-full min-w-115 text-xs font-mono text-left whitespace-nowrap">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/70 bg-[#0e131d]/80 sticky top-0">
                  <th className="py-3 px-3 sm:py-3.5 sm:px-4 font-semibold uppercase tracking-wider text-[10px] w-20 sm:w-24">SKU</th>
                  <th className="py-3 px-3 sm:py-3.5 sm:px-4 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                  <th className="py-3 px-3 sm:py-3.5 sm:px-4 font-semibold uppercase tracking-wider text-[10px] text-right w-14 sm:w-16">Qty</th>
                  <th className="py-3 px-3 sm:py-3.5 sm:px-4 font-semibold uppercase tracking-wider text-[10px] text-right w-24 sm:w-28">Gross Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {(!data?.topProducts || data.topProducts.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="py-10 sm:py-14 text-center text-slate-600 text-[11px] font-medium">
                      <div className="border border-dashed border-slate-800/80 rounded-xl py-6 sm:py-8 mx-3 sm:mx-4 bg-slate-900/10">
                        No batch transactions registered yet.
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.topProducts.map((product) => (
                    <tr
                      key={`top-prod-${product.sku}`}
                      className="group transition-colors duration-150 hover:bg-white/2"
                    >
                      <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-slate-400 group-hover:text-slate-300 font-medium transition-colors">
                        {product.sku}
                      </td>
                      <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-slate-200 max-w-[130 px] sm:max-w-45 lg:max-w-55 truncate font-medium group-hover:text-white transition-colors">
                        {product.name}
                      </td>
                      <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-right text-slate-400 group-hover:text-slate-300 tabular-nums font-medium">
                        {product.totalQuantity}
                      </td>
                      <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-right text-emerald-400 font-bold tabular-nums">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

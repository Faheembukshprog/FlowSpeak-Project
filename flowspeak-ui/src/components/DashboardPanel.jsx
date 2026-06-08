import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, Radio } from 'lucide-react';
import { useTelemetry } from '../contexts/TelemetryContext.jsx';

const API_BASE = import.meta.env.VITE_API_ENDPOINT || '';

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₨ ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function StatCard({ label, value, icon: Icon, accent, flash, alertPulse, children }) {
  return (
    <div
      className={`min-w-0 border bg-[#151B2B] p-3 md:p-4 lg:p-5 transition-all duration-150 ease-in-out ${
        flash
          ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
          : alertPulse
            ? 'border-amber-500/30 animate-pulse'
            : 'border-slate-800/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
        <span className="text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-400 truncate">{label}</span>
        <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center ${accent}`}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>
      <p className={`text-lg sm:text-xl md:text-2xl font-mono font-semibold truncate transition-colors duration-150 ease-in-out ${flash ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
      {children}
    </div>
  );
}

function CommandVolumeChart({ chartData }) {
  const [hovered, setHovered] = useState(null);

  if (!chartData?.length) {
    return <p className="text-xs text-slate-600 font-mono text-center py-8">No command data available.</p>;
  }

  const maxVal = Math.max(...chartData.map((d) => d.success + d.failed), 1);
  const barWidth = 36;
  const gap = 18;
  const chartHeight = 150;
  const padding = { top: 12, bottom: 36, left: 12, right: 12 };
  const svgWidth = chartData.length * (barWidth + gap) + padding.left + padding.right;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${svgWidth} ${chartHeight + padding.top + padding.bottom}`} className="w-full h-auto">
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
              key={day.date}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x - 2}
                y={padding.top - 4}
                width={barWidth + 4}
                height={chartHeight + 8}
                fill="transparent"
              />
              <rect
                x={x}
                y={baseY - failedH - successH}
                width={barWidth}
                height={Math.max(successH, 0)}
                rx={2}
                fill={isHovered ? '#34d399' : '#10b981'}
                opacity={isHovered ? 1 : 0.85}
                className="transition-all duration-150"
              />
              {failedH > 0 && (
                <rect
                  x={x}
                  y={baseY - failedH}
                  width={barWidth}
                  height={failedH}
                  rx={2}
                  fill={isHovered ? '#f87171' : '#ef4444'}
                  opacity={isHovered ? 0.9 : 0.75}
                  className="transition-all duration-150"
                />
              )}
              <text x={x + barWidth / 2} y={baseY + 18} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                {day.dayName}
              </text>
              <text
                x={x + barWidth / 2}
                y={baseY - barH - 6}
                textAnchor="middle"
                fill={isHovered ? '#34d399' : '#94a3b8'}
                fontSize="9"
                fontFamily="monospace"
              >
                {total}
              </text>
              {isHovered && (
                <title>{`${fullDayName}: ${total} Commands Executed`}</title>
              )}
            </g>
          );
        })}
      </svg>

      {hovered !== null && chartData[hovered] && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 z-10 pointer-events-none"
          style={{ minWidth: 200 }}
        >
          <div className="rounded border border-slate-700/80 bg-[#0B0F19]/95 px-3 py-2 text-center shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              {new Date(chartData[hovered].date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <p className="text-sm font-mono font-semibold text-emerald-400 mt-0.5">
              {chartData[hovered].success + chartData[hovered].failed} Commands Executed
            </p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              <span className="text-emerald-400">{chartData[hovered].success}</span> ok ·{' '}
              <span className="text-red-400">{chartData[hovered].failed}</span> failed
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPanel() {
  const { latestTick } = useTelemetry();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordersFlash, setOrdersFlash] = useState(false);
  const prevOrdersRef = useRef(null);

  const fetchSummary = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/dashboard/summary`, { credentials: 'include' });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.message || `Failed to load dashboard (${resp.status})`);
      }
      return await resp.json();
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const json = await fetchSummary();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchSummary]);

  // Poll aggregates every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const json = await fetchSummary();
        setData((prev) => {
          if (prev && json.ordersToday > prev.ordersToday) {
            setOrdersFlash(true);
            setTimeout(() => setOrdersFlash(false), 1000);
          }
          return json;
        });
      } catch { /* silent refresh */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  // Flash on new order telemetry tick
  useEffect(() => {
    if (!latestTick) return;
    const isOrder =
      latestTick.eventType === 'ORDER_CREATED' ||
      latestTick.eventType === 'ORDER_CANCELLED' ||
      latestTick.intent === 'RESERVE_STOCK' ||
      latestTick.intent === 'CANCEL_ORDER';
    if (isOrder) {
      setOrdersFlash(true);
      const t = setTimeout(() => setOrdersFlash(false), 1000);
      fetchSummary().then((json) => setData(json)).catch(() => {});
      return () => clearTimeout(t);
    }
  }, [latestTick, fetchSummary]);

  useEffect(() => {
    if (data == null) return;
    if (prevOrdersRef.current !== null && data.ordersToday > prevOrdersRef.current) {
      setOrdersFlash(true);
      const t = setTimeout(() => setOrdersFlash(false), 1000);
      prevOrdersRef.current = data.ordersToday;
      return () => clearTimeout(t);
    }
    prevOrdersRef.current = data.ordersToday;
  }, [data?.ordersToday]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F19]">
        <div className="text-center space-y-3">
          <Radio className="h-5 w-5 text-emerald-400 mx-auto animate-pulse" />
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">Initializing telemetry metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F19]">
        <p className="text-xs font-mono text-red-400 border border-red-500/30 bg-red-500/5 px-4 py-2 rounded">{error}</p>
      </div>
    );
  }

  const lowStockActive = data.lowStockCount > 0;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 custom-scrollbar bg-[#0B0F19]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-slate-500">Metrics HUD</p>
          <h2 className="text-sm font-semibold text-slate-200 mt-1 tracking-wide truncate">Real-Time Aggregate Engine</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400/80 shrink-0">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          LIVE FEED
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Orders Today"
          value={data.ordersToday}
          icon={ShoppingCart}
          accent="bg-blue-500/15 text-blue-400"
          flash={ordersFlash}
        />
        <StatCard
          label="Weekly Revenue"
          value={formatCurrency(data.weeklyRevenue)}
          icon={DollarSign}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="Low-Stock Count"
          value={data.lowStockCount}
          icon={Package}
          accent="bg-amber-500/15 text-amber-400"
          alertPulse={lowStockActive}
        >
          {lowStockActive && (
            <p className="text-[9px] font-mono text-amber-500/80 mt-2 uppercase tracking-wider">Threshold &lt; 5 units</p>
          )}
        </StatCard>
        <StatCard
          label="System Success Rate"
          value={`${Number(data.aiSuccessRate).toFixed(1)}%`}
          icon={TrendingUp}
          accent="bg-violet-500/15 text-violet-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="min-w-0 border border-slate-800/60 bg-[#151B2B] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <BarChart3 className="h-4 w-4 text-slate-400 shrink-0" />
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 truncate">7-Day Command Volume</h3>
          </div>
          <div className="overflow-x-auto">
            <CommandVolumeChart chartData={data.chartData} />
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" /> Success
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-sm bg-red-500" /> Failed
            </span>
            <span className="text-slate-600 sm:ml-auto">Hover bars for detail</span>
          </div>
        </div>

        <div className="min-w-0 border border-slate-800/60 bg-[#151B2B] p-4 sm:p-5">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-4">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/60">
                  <th className="text-left py-2.5 pr-2 sm:pr-3 font-normal uppercase tracking-wider text-[10px]">SKU</th>
                  <th className="text-left py-2.5 pr-2 sm:pr-3 font-normal uppercase tracking-wider text-[10px]">Name</th>
                  <th className="text-right py-2.5 pr-2 sm:pr-3 font-normal uppercase tracking-wider text-[10px]">Qty</th>
                  <th className="text-right py-2.5 font-normal uppercase tracking-wider text-[10px]">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(!data.topProducts || data.topProducts.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-600 text-[11px]">No order data yet.</td>
                  </tr>
                ) : (
                  data.topProducts.map((p) => (
                    <tr key={p.sku} className="border-b border-slate-800/40 text-slate-300 hover:bg-slate-800/20 transition-colors duration-150 ease-in-out">
                      <td className="py-2.5 pr-2 sm:pr-3 text-slate-500 max-w-[72px] sm:max-w-none truncate">{p.sku}</td>
                      <td className="py-2.5 pr-2 sm:pr-3 max-w-[100px] sm:max-w-[140px] truncate">{p.name}</td>
                      <td className="py-2.5 pr-2 sm:pr-3 text-right tabular-nums">{p.totalQuantity}</td>
                      <td className="py-2.5 text-right text-emerald-400 whitespace-nowrap tabular-nums">{formatCurrency(p.revenue)}</td>
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

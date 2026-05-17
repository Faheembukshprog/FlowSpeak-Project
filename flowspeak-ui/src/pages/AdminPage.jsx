import { Database } from 'lucide-react';
import { useAppState } from '../state/AppStateContext.jsx';

function formatLocal(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const { metrics, aiLogs } = useAppState();

  return (
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
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No audit logs yet — run some transactions.
                </td>
              </tr>
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
  );
}

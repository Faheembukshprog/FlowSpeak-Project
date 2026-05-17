import { CheckCircle2 } from 'lucide-react';
import { useAppState } from '../state/AppStateContext.jsx';

function formatLocal(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function TransactionsPage() {
  const { transactions } = useAppState();

  return (
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
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                  No transactions yet — submit a chat to generate activity.
                </td>
              </tr>
            )}
            {transactions.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-slate-600">{formatLocal(row.timestamp)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{row.activity}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { NavLink, Outlet } from 'react-router-dom';
import { MessageSquare, LayoutGrid, ShieldAlert, Zap, RefreshCcw, Cpu } from 'lucide-react';
import { useAppState } from '../state/AppStateContext.jsx';

const PAGES = [
  { path: '/', label: 'Demo Chat', icon: MessageSquare },
  { path: '/transactions', label: 'Transactions', icon: LayoutGrid },
  { path: '/admin', label: 'Admin', icon: ShieldAlert },
];

export default function MainLayout() {
  const { metrics } = useAppState();

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
            {PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <NavLink
                  to={page.path}
                  key={page.path}
                  end={page.path === '/'}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{page.label}</span>
                </NavLink>
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

        <main className="flex-1 overflow-hidden rounded-2xl bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';

const AUTH_ENDPOINT = `${import.meta.env.VITE_API_ENDPOINT || ''}/api/auth`;
const PRESENTATION_USER = 'admin';
const PRESENTATION_PASS = 'admin123';

const isPresentationMode = () =>
  import.meta.env.VITE_PRESENTATION_MODE === 'true' ||
  new URLSearchParams(window.location.search).get('present') === '1';

const inputClass =
  'w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 outline-none px-3 py-2.5 text-slate-100 font-mono text-sm placeholder:text-slate-700 transition-colors duration-150';

function parseAuthError(response, body, mode) {
  const message = body?.message || body?.detail || body?.title || '';
  const lower = message.toLowerCase();
  const status = response?.status;

  if (status === 409 || lower.includes('already exists')) {
    return {
      code: '!! CRITICAL ERROR: REGISTRATION_DENIED // USERNAME_CONFLICT',
      detail: `Operator ID "${body?.username || 'requested'}" is already registered. Use [ Return to Login ] or choose a unique username.`,
    };
  }
  if (status === 429 || lower.includes('rate limit') || lower.includes('too many')) {
    return {
      code: '!! CRITICAL ERROR: ACCESS_DENIED // RATE_LIMIT_EXCEEDED',
      detail: 'Too many attempts. Wait 60 seconds and retry.',
    };
  }
  if (lower.includes('invalid credential') || lower.includes('login failed') || status === 401) {
    return {
      code: '!! CRITICAL ERROR: ACCESS_DENIED // INVALID_CREDENTIALS',
      detail: 'Authentication rejected. Verify username and password.',
    };
  }
  if (lower.includes('at least 6') || lower.includes('password must')) {
    return {
      code: '!! CRITICAL ERROR: VALIDATION_FAILED // PASSWORD_TOO_SHORT',
      detail: 'Password must be at least 6 characters.',
    };
  }
  if (lower.includes('required')) {
    return {
      code: '!! CRITICAL ERROR: VALIDATION_FAILED // MISSING_FIELDS',
      detail: message || 'Username and password are required.',
    };
  }
  if (status >= 500 || lower.includes('unexpected error') || lower.includes('traceid')) {
    return {
      code: '!! CRITICAL ERROR: SERVER_FAULT // AUTH_SERVICE_UNAVAILABLE',
      detail: 'Authentication service fault. Restart the API and verify JWT_SECRET is configured (32+ characters).',
    };
  }
  if (message) {
    return {
      code: `!! CRITICAL ERROR: ${mode === 'login' ? 'ACCESS_DENIED' : 'REGISTRATION_DENIED'} // ${mode === 'login' ? 'AUTH_FAILURE' : 'REGISTRATION_FAILURE'}`,
      detail: message,
    };
  }
  return {
    code: `!! CRITICAL ERROR: ${mode === 'login' ? 'ACCESS_DENIED' : 'REGISTRATION_DENIED'} // ${mode === 'login' ? 'AUTH_FAILURE' : 'REGISTRATION_FAILURE'}`,
    detail: mode === 'login'
      ? 'Unable to authenticate. Check credentials and API uplink.'
      : 'Unable to register account. Username may already exist — try logging in instead.',
  };
}

export default function AccessTerminal({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [btnHighlight, setBtnHighlight] = useState(false);
  const userEditedRef = useRef(false);
  const presentationRanRef = useRef(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setNotice('');
    setBtnHighlight(false);
    userEditedRef.current = false;
  };

  const markUserEdited = () => {
    userEditedRef.current = true;
    setBtnHighlight(false);
  };

  useEffect(() => {
    if (!isPresentationMode() || mode !== 'login' || presentationRanRef.current) return;
    presentationRanRef.current = true;

    let cancelled = false;
    const timers = [];

    const schedule = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    const typeChars = (text, field, durationMs, onDone) => {
      if (!text.length) {
        onDone?.();
        return;
      }
      const step = Math.max(16, Math.floor(durationMs / text.length));
      let index = 0;
      const tick = () => {
        if (cancelled || userEditedRef.current) return;
        index += 1;
        setForm((f) => ({ ...f, [field]: text.slice(0, index) }));
        if (index < text.length) {
          schedule(tick, step);
        } else {
          onDone?.();
        }
      };
      schedule(tick, step);
    };

    schedule(() => {
      typeChars(PRESENTATION_USER, 'username', 800, () => {
        schedule(() => {
          typeChars(PRESENTATION_PASS, 'password', 600, () => {
            if (!cancelled && !userEditedRef.current) setBtnHighlight(true);
          });
        }, 300);
      });
    }, 400);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice('');
    setBtnHighlight(false);

    try {
      if (mode === 'login') {
        const resp = await fetch(`${AUTH_ENDPOINT}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
        const body = await resp.json().catch(() => ({}));
        if (resp.ok && body.success) {
          onAuthenticated(body.user);
        } else {
          setError(parseAuthError(resp, body, 'login'));
        }
      } else {
        const resp = await fetch(`${AUTH_ENDPOINT}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: form.username.trim(),
            password: form.password,
            fullName: (form.fullName || form.username).trim(),
            role: 'Viewer',
          }),
        });
        const body = await resp.json().catch(() => ({}));
        if (resp.ok && body.success) {
          setNotice('[ ACCESS_REQUEST: APPROVED — PROCEED TO LOGIN ]');
          setMode('login');
          setForm((f) => ({ ...f, password: '' }));
        } else {
          setError(parseAuthError(resp, { ...body, username: form.username.trim() }, 'register'));
        }
      }
    } catch {
      setError({
        code: '!! CRITICAL ERROR: UPLINK_SEVERED // API_UNREACHABLE',
        detail: 'Cannot reach authentication server. Ensure API is running on port 3001.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0F19]">
      <div className="w-full max-w-lg border border-slate-800/80 bg-[#0B0F19] shadow-[0_0_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="inline-block w-2 h-2 bg-emerald-500" />
            <span>TERMINAL.ACCESS // FLOWSPEAK ENGINE V2</span>
          </div>
          <span className="text-emerald-500/80 flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            ONLINE
          </span>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 flex flex-col">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-3">
            {mode === 'login'
              ? 'ENTER AUTHENTICATION CREDENTIALS...'
              : 'REQUEST NEW ACCESS ACCOUNT...'}
          </p>

          <div className="space-y-3.5 px-1.5">
            {mode === 'register' && (
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                  Full Name:
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => { markUserEdited(); setForm({ ...form, fullName: e.target.value }); }}
                  placeholder="operator_display_name"
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                Username:
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => { markUserEdited(); setForm({ ...form, username: e.target.value }); }}
                placeholder="user_id"
                className={inputClass}
                autoComplete="username"
                autoFocus={!isPresentationMode()}
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
                Password:
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => { markUserEdited(); setForm({ ...form, password: e.target.value }); }}
                placeholder="••••••••"
                className={inputClass}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'register' ? 6 : undefined}
              />
            </div>
          </div>

          <div className="min-h-12 mt-5 mb-3 px-1.5 flex items-center">
            {error && (
              <div className="w-full border border-rose-500/25 bg-rose-500/4 px-3 py-2 font-mono text-[11px] leading-relaxed">
                <p className="text-rose-500 tracking-wide">{error.code}</p>
                {error.detail && (
                  <p className="text-rose-500/60 mt-1 text-[10px] normal-case tracking-normal">
                    {error.detail}
                  </p>
                )}
              </div>
            )}

            {!error && notice && (
              <div className="w-full border border-emerald-500/25 bg-emerald-500/4 px-3 py-2 font-mono text-[11px] text-emerald-400">
                {notice}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 font-mono text-xs uppercase tracking-widest border text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed py-3 px-4 transition-all duration-200 ${btnHighlight
                  ? 'border-emerald-500/70 bg-emerald-500/15 shadow-[0_0_14px_rgba(16,185,129,0.22)]'
                  : 'border-emerald-500/30 hover:bg-emerald-500/10'
                }`}
            >
              {loading
                ? 'PROCESSING...'
                : mode === 'login'
                  ? '[ INITIALIZE ACCESS ]'
                  : '[ SUBMIT REQUEST ]'}
            </button>

            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-200 transition-colors duration-150 py-3 px-3 text-center sm:text-left"
            >
              {mode === 'login' ? '[ Request Access Account ]' : '[ Return to Login ]'}
            </button>
          </div>

          <p className="mt-4 font-mono text-[9px] text-slate-600 uppercase tracking-wider text-center">
            Secure uplink · HttpOnly session · RBAC enforced
          </p>
        </form>
      </div>
    </div>
  );
}

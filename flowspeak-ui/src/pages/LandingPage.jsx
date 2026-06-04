import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Brain, ShieldCheck, Terminal, ArrowRight, ArrowUpRight,
  MessageSquare, Database, Activity, Cpu,
  CheckCircle2, XCircle, Lock, RefreshCw,
  Menu, X, Code2, GitBranch, Package, AlertTriangle, Users
} from 'lucide-react';

/* ── GitHub SVG (removed from lucide-react) ─────────────────── */
function GithubIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
function LinkedinIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ── Scroll Reveal ───────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── Animated Terminal ───────────────────────────────────────── */
const LINES = [
  { delay: 0,    cls: 't-dim',    text: '# FlowSpeak intent execution engine' },
  { delay: 600,  cls: 't-muted',  text: '$ flowspeak start --env production' },
  { delay: 1200, cls: 't-green',  text: '✓ NLP layer initialized' },
  { delay: 1800, cls: 't-green',  text: '✓ Intent dispatcher ready' },
  { delay: 2400, cls: 't-muted',  text: '> "Reserve 3 Dell XPS for Karachi"' },
  { delay: 3200, cls: 't-blue',   text: '  intent  RESERVE_STOCK' },
  { delay: 3600, cls: 't-blue',   text: '  entity  Dell XPS 15 × 3  →  Karachi' },
  { delay: 4200, cls: 't-green',  text: '✓ Order #FS-2026-0042 committed' },
  { delay: 4800, cls: 't-violet', text: '  telemetry  broadcast → 2 clients' },
  { delay: 5400, cls: 't-muted',  text: '> "Check stock levels"' },
  { delay: 6000, cls: 't-blue',   text: '  intent  CHECK_STOCK  →  5 products' },
  { delay: 6600, cls: 't-green',  text: '✓ Done  (42ms)' },
];

function AnimatedTerminal() {
  const [visible, setVisible] = useState([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    setVisible([]);
    const timers = LINES.map((l, i) => setTimeout(() => setVisible((p) => [...p, i]), l.delay));
    const restart = setTimeout(() => { setVisible([]); setRunning((r) => !r); }, 9000);
    return () => { timers.forEach(clearTimeout); clearTimeout(restart); };
  }, [running]);

  return (
    <div className="terminal-box">
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: '#ef4444' }} />
        <span className="terminal-dot" style={{ background: '#f59e0b' }} />
        <span className="terminal-dot" style={{ background: '#22c55e' }} />
        <span className="t-faint font-mono" style={{ marginLeft: 10, fontSize: 11, color: '#52525b' }}>flowspeak — bash</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>LIVE</span>
        </span>
      </div>
      <div className="terminal-body" style={{ minHeight: 260 }}>
        {LINES.map((l, i) => (
          <div key={i} className="code-line" style={{
            opacity: visible.includes(i) ? 1 : 0,
            transform: visible.includes(i) ? 'none' : 'translateX(-4px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}>
            <span className={l.cls}>{l.text}</span>
          </div>
        ))}
        {visible.length === LINES.length && <span className="cursor" style={{ marginTop: 4, display: 'block' }} />}
      </div>
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────────── */
function Navbar({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #1f1f1f' : '1px solid transparent',
      transition: 'all 0.2s ease',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, background: '#fafafa', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="#000" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#fafafa', letterSpacing: '-0.01em' }}>FlowSpeak</span>
        </div>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hide-mobile">
          {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#team', 'Team']].map(([href, label]) => (
            <a key={href} href={href} className="nav-link">{label}</a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hide-mobile">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="nav-link" style={{ display: 'flex', alignItems: 'center' }}>
            <GithubIcon size={17} />
          </a>
          <button onClick={onLaunch} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
            Launch App <ArrowRight size={13} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }} className="show-mobile">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: '#000', borderTop: '1px solid #1f1f1f', padding: '16px 24px 24px' }}>
          {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#team', 'Team']].map(([href, label]) => (
            <a key={href} href={href} className="nav-link" style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #111' }} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <button onClick={() => { onLaunch(); setOpen(false); }} className="btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
            Launch App <ArrowRight size={13} />
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .hide-mobile { display: none !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
      `}</style>
    </nav>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */
function Hero({ onLaunch }) {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 56 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', width: '100%' }}>

        {/* Label */}
        <div style={{ marginBottom: 32 }}>
          <span className="tag">
            <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
            v1.0 — Production Ready
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#fafafa', marginBottom: 24, maxWidth: 800 }}>
          Natural language,<br />
          <span style={{ color: '#52525b' }}>deterministic execution.</span>
        </h1>

        <p style={{ fontSize: 17, color: '#a1a1aa', maxWidth: 520, lineHeight: 1.65, marginBottom: 40 }}>
          FlowSpeak separates AI's language parsing from safe, transactional backend workflows. Speak a command, get a committed database transaction.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 64 }}>
          <button onClick={onLaunch} className="btn-primary">
            <Terminal size={14} /> Open Command Center
          </button>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="btn-ghost">
            <GithubIcon size={14} /> View on GitHub
          </a>
        </div>

        {/* Terminal + stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 1, border: '1px solid #1f1f1f', borderRadius: 10, overflow: 'hidden', background: '#1f1f1f' }}>
          {/* Terminal */}
          <div style={{ background: '#0a0a0a' }}>
            <AnimatedTerminal />
          </div>
          {/* Stats column */}
          <div style={{ background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
            {[
              { value: '< 50ms', label: 'Intent dispatch latency', icon: Zap },
              { value: 'JWT', label: 'HttpOnly dual-token auth', icon: ShieldCheck },
              { value: 'SignalR', label: 'Real-time telemetry', icon: Activity },
              { value: 'EF Core', label: 'Transactional DB layer', icon: Database },
            ].map((s, i, arr) => (
              <div key={i} style={{
                padding: '20px 24px',
                borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none',
                flex: 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <s.icon size={13} color="#52525b" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive stack override */}
        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </section>
  );
}

/* ── Divider line ────────────────────────────────────────────── */
function SectionDivider() {
  return <div className="divider" />;
}

/* ── Problem / Solution ──────────────────────────────────────── */
function ProblemSolution() {
  const problems = [
    'LLMs produce non-deterministic, unrepeatable outputs',
    'No clear separation between AI classification and DB mutation',
    'Zero audit trail for AI-initiated data changes',
    'Session tokens stored in localStorage — XSS attack surface',
  ];
  const solutions = [
    'AI only classifies intent — typed handlers own all mutations',
    'IntentDispatcher routes to isolated, testable service methods',
    'AI_CommandLogs table captures every command for full auditability',
    'JWT in HttpOnly cookies with 15-min access + 7-day refresh rotation',
  ];

  return (
    <section id="features" style={{ padding: '96px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>The Problem</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fafafa', lineHeight: 1.15 }}>
            Most AI pipelines are&nbsp;
            <span style={{ color: '#52525b' }}>architecturally unsafe.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: '1px solid #1f1f1f', borderRadius: 10, overflow: 'hidden', background: '#1f1f1f' }}>
          {/* Before */}
          <div className="reveal" style={{ background: '#0a0a0a', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <XCircle size={16} color="#ef4444" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Before</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {problems.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: '#3f3f46', marginTop: 2, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 14, color: '#71717a', lineHeight: 1.55 }}>{p}</span>
                </div>
              ))}
            </div>
            {/* Code example */}
            <div className="terminal-box" style={{ marginTop: 28 }}>
              <div className="terminal-header">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b' }}>dangerous.py</span>
              </div>
              <div className="terminal-body">
                <span className="t-dim"># ❌ LLM directly mutates production</span><br />
                <span className="t-amber">llm</span><span className="t-muted">.execute_sql(</span><span style={{ color: '#f87171' }}>"DELETE old orders"</span><span className="t-muted">)</span>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="reveal reveal-delay-2" style={{ background: '#0a0a0a', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FlowSpeak</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {solutions.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <CheckCircle2 size={14} color="#4ade80" style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.55 }}>{s}</span>
                </div>
              ))}
            </div>
            <div className="terminal-box" style={{ marginTop: 28 }}>
              <div className="terminal-header">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b' }}>safe.cs</span>
              </div>
              <div className="terminal-body">
                <span className="t-dim">// ✅ AI classifies, handler commits</span><br />
                <span className="t-blue">var intent</span><span className="t-muted"> = </span><span className="t-violet">ai</span><span className="t-muted">.Classify(input);</span><br />
                <span className="t-blue">await</span><span className="t-muted"> </span><span className="t-violet">dispatcher</span><span className="t-muted">.Execute(intent);</span>
              </div>
            </div>
          </div>
        </div>

        <style>{`@media(max-width:768px){.prob-grid{grid-template-columns:1fr!important;}}`}</style>
      </div>
    </section>
  );
}

/* ── Features Bento ──────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Brain, title: 'Dual AI Providers',
    desc: 'LLM-powered classification with a deterministic rule-based fallback. Pluggable interface — swap providers without touching business logic.',
    tag: 'AI Layer',
  },
  {
    icon: ShieldCheck, title: 'JWT + HttpOnly Auth',
    desc: 'Dual-token flow — 15-min access tokens, 7-day rotating refresh tokens. Zero exposure in localStorage. BCrypt password hashing.',
    tag: 'Security',
  },
  {
    icon: Activity, title: 'SignalR Telemetry',
    desc: 'MessagePack-encoded real-time event streaming. Every intent execution is broadcast to all authenticated clients in under 10ms.',
    tag: 'Real-time',
  },
  {
    icon: Database, title: 'Transactional EF Core',
    desc: 'Soft-delete, append-only audit logs, and optimistic concurrency across all entities. No raw SQL from AI — ever.',
    tag: 'Database',
  },
  {
    icon: GitBranch, title: 'Intent Dispatcher',
    desc: 'Handler-chain architecture. Each intent maps to a strictly typed, independently testable C# method with no shared mutable state.',
    tag: 'Architecture',
  },
  {
    icon: Lock, title: 'RBAC + CORS',
    desc: 'Admin / Sales / Viewer roles with policy-based authorization. Fine-grained per-endpoint access control throughout the API surface.',
    tag: 'Enterprise',
  },
];

function Features() {
  return (
    <section style={{ padding: '0 0 96px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="reveal" style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Core Architecture</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fafafa', lineHeight: 1.15 }}>
            Engineered for production,<br />
            <span style={{ color: '#52525b' }}>not prototyping.</span>
          </h2>
        </div>

        <div className="bento-grid reveal">
          {FEATURES.map((f, i) => (
            <div key={i} className={`bento-cell reveal reveal-delay-${(i % 3) + 1}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, border: '1px solid #1f1f1f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <f.icon size={16} color="#71717a" />
                </div>
                <span className="tag">{f.tag}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', marginBottom: 8, letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ────────────────────────────────────────────── */
const STEPS = [
  { n: '01', icon: MessageSquare, title: 'User inputs a command', desc: 'Plain English typed into the command center interface. No syntax to learn.' },
  { n: '02', icon: Brain, title: 'AI classifies intent', desc: 'LLM or rule-based engine extracts intent type and named entities from the text.' },
  { n: '03', icon: GitBranch, title: 'Dispatcher routes', desc: 'IntentDispatcher matches the classified intent to the correct typed C# handler.' },
  { n: '04', icon: Database, title: 'Handler commits', desc: 'The handler runs a scoped EF Core transaction. AI never touches the database directly.' },
  { n: '05', icon: Activity, title: 'Telemetry fires', desc: 'A SignalR event broadcasts the result to all connected authenticated clients.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '0 0 96px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Execution Pipeline</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fafafa', lineHeight: 1.15 }}>
            From text to committed<br />
            <span style={{ color: '#52525b' }}>transaction in 50ms.</span>
          </h2>
        </div>

        {/* Step list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #1f1f1f', borderRadius: 10, overflow: 'hidden' }}>
          {STEPS.map((step, i) => (
            <div key={i}
              className={`reveal reveal-delay-${i + 1} surface-hover`}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                borderBottom: i < STEPS.length - 1 ? '1px solid #1a1a1a' : 'none',
                background: '#0a0a0a',
              }}>
              {/* Number column */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 0', borderRight: '1px solid #1a1a1a' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#3f3f46', fontWeight: 600 }}>{step.n}</span>
              </div>
              {/* Content */}
              <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 32, height: 32, border: '1px solid #1f1f1f', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <step.icon size={14} color="#52525b" />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 5, letterSpacing: '-0.01em' }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack row */}
        <div className="reveal" style={{ marginTop: 40, padding: '24px 28px', border: '1px solid #1f1f1f', borderRadius: 10, background: '#0a0a0a' }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Stack</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['React 19', 'Vite 8', 'Tailwind CSS v4', 'ASP.NET Core 10', 'Entity Framework', 'SignalR', 'MessagePack', 'SQLite', 'JWT / BCrypt'].map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Team ────────────────────────────────────────────────────── */
const TEAM = [
  {
    initials: 'MFK',
    name: 'Muhammad Faheem Khan',
    role: 'Frontend & Backend Engineer',
    linkedin: 'https://www.linkedin.com/in/muhammadfaheemkhan-dev/',
    skills: ['React 19', 'ASP.NET Core', 'Vite', 'UI Architecture'],
    bio: 'Architected the full-stack foundation: dark-mode command center, .NET 10 API, JWT dual-token auth, Vite proxy setup, and the complete frontend design system.',
  },
  {
    initials: 'MA',
    name: 'Muhammad Anees',
    role: 'Backend & AI Engineer',
    linkedin: 'https://www.linkedin.com/in/muhammadanees-dev/',
    skills: ['NLP / AI', 'EF Core', 'SignalR', 'System Design'],
    bio: 'Engineered the intent dispatch engine, AI provider abstraction layer, real-time SignalR telemetry pipeline, and the deterministic transaction commit logic.',
  },
];

function Team() {
  return (
    <section id="team" style={{ padding: '0 0 96px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="reveal" style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>The Team</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fafafa', lineHeight: 1.15 }}>
            Two engineers,<br />
            <span style={{ color: '#52525b' }}>one clean system.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: '1px solid #1f1f1f', borderRadius: 10, overflow: 'hidden', background: '#1f1f1f' }}>
          {TEAM.map((m, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1} team-card`}
              style={{ background: '#0a0a0a', padding: 32 }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, background: '#111', border: '1px solid #27272a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#fafafa', letterSpacing: '0.02em' }}>
                  {m.initials}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em', marginBottom: 2 }}>{m.name}</p>
                  <p style={{ fontSize: 12, color: '#52525b', fontFamily: 'var(--font-mono)' }}>{m.role}</p>
                </div>
              </div>

              {/* Bio */}
              <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7, marginBottom: 20 }}>{m.bio}</p>

              {/* Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {m.skills.map((s) => <span key={s} className="tag">{s}</span>)}
              </div>

              {/* LinkedIn */}
              <a href={m.linkedin} target="_blank" rel="noreferrer" className="btn-ghost"
                style={{ fontSize: 12, padding: '6px 14px' }}>
                <LinkedinIcon size={13} />
                LinkedIn Profile
                <ArrowUpRight size={12} />
              </a>
            </div>
          ))}
        </div>

        <style>{`@media(max-width:768px){.team-grid{grid-template-columns:1fr!important;}}`}</style>

        {/* Context note */}
        <div className="reveal" style={{ marginTop: 24, padding: '20px 24px', border: '1px solid #1f1f1f', borderRadius: 8, background: '#0a0a0a', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b' }}>FS_PROJECT_TYPE</span>
          <span style={{ width: 1, height: 14, background: '#27272a' }} />
          <span style={{ fontSize: 13, color: '#52525b' }}>Final Year Project — 2026 · Built with focus on clean architecture, production security standards, and real-world engineering patterns.</span>
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────────── */
function CTA({ onLaunch }) {
  return (
    <section style={{ padding: '0 0 96px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="reveal" style={{ border: '1px solid #1f1f1f', borderRadius: 10, padding: '56px 48px', background: '#0a0a0a', textAlign: 'center' }}>
          <p className="section-label" style={{ marginBottom: 20 }}>Get Started</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 16, lineHeight: 1.1 }}>
            Try it live.
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', maxWidth: 400, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Launch the command center and execute real intents against the live backend.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            <button onClick={onLaunch} className="btn-primary">
              <Terminal size={14} /> Open Command Center
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn-ghost">
              <GithubIcon size={14} /> View Source
            </a>
          </div>
          {/* Credentials */}
          <div className="terminal-box" style={{ display: 'inline-block', textAlign: 'left' }}>
            <div className="terminal-header" style={{ padding: '8px 14px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#52525b' }}>demo credentials</span>
            </div>
            <div className="terminal-body" style={{ padding: '12px 16px' }}>
              <span className="t-dim">admin</span><span className="t-muted"> / </span><span className="t-white">admin123</span><br />
              <span className="t-dim">sales</span><span className="t-muted"> / </span><span className="t-white">sales123</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #1f1f1f', padding: '24px', background: '#000' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, background: '#fafafa', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={12} color="#000" />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#52525b' }}>FlowSpeak · Intent Execution Engine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {[['#features', 'Features'], ['#how-it-works', 'Pipeline'], ['#team', 'Team']].map(([href, label]) => (
            <a key={href} href={href} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3f3f46', textDecoration: 'none' }}>{label}</a>
          ))}
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: '#3f3f46', display: 'flex' }}>
            <GithubIcon size={15} />
          </a>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3f3f46' }}>© 2026 Faheem & Anees</span>
      </div>
    </footer>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  useScrollReveal();
  const launch = () => navigate('/app');

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <Navbar onLaunch={launch} />
      <Hero onLaunch={launch} />
      <SectionDivider />
      <ProblemSolution />
      <SectionDivider />
      <Features />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <Team />
      <SectionDivider />
      <CTA onLaunch={launch} />
      <Footer />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Brain, ShieldCheck, Terminal, ArrowRight,
  MessageSquare, Database, Activity, Cpu,
  CheckCircle2, XCircle, Layers, Globe, Lock, RefreshCw,
  Menu, X, Sparkles, Code2, GitBranch,
  Package, AlertTriangle, Users, Star
} from 'lucide-react';

function GithubIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// ── Scroll Reveal Hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('visible'); }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Animated Terminal ─────────────────────────────────────────────────────────
const TERMINAL_LINES = [
  { delay: 0,    color: '#64748b', text: '$ flowspeak init --mode=production' },
  { delay: 800,  color: '#10b981', text: '✓ Engine online. NLP layer ready.' },
  { delay: 1600, color: '#94a3b8', text: '> Reserve 3 Dell XPS 15 for Karachi' },
  { delay: 2400, color: '#3b82f6', text: 'AI → INTENT: RESERVE_STOCK | entity: Dell XPS 15 | qty: 3' },
  { delay: 3200, color: '#10b981', text: '✓ Order #FS-2026-0042 committed to DB' },
  { delay: 4000, color: '#94a3b8', text: '> Check stock levels across all SKUs' },
  { delay: 4800, color: '#8b5cf6', text: 'AI → INTENT: CHECK_STOCK | 5 products resolved' },
  { delay: 5600, color: '#10b981', text: '✓ Telemetry broadcast → 2 connected clients' },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState([]);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setVisibleLines([]);
    setIsRunning(true);
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, i]);
      }, line.delay)
    );
    const restart = setTimeout(() => {
      setVisibleLines([]);
      setIsRunning(false);
      setTimeout(() => setIsRunning(true), 400);
    }, 8500);
    return () => { timers.forEach(clearTimeout); clearTimeout(restart); };
  }, [isRunning]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl" style={{ background: '#0a0e1a' }}>
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800" style={{ background: '#0d1117' }}>
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-slate-500 font-mono">flowspeak-cli — bash</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
        </div>
      </div>
      {/* Terminal body */}
      <div className="p-5 font-mono text-sm min-h-[280px]">
        {TERMINAL_LINES.map((line, i) => (
          <div
            key={i}
            className="flex items-start gap-2 mb-2 transition-all duration-300"
            style={{
              opacity: visibleLines.includes(i) ? 1 : 0,
              transform: visibleLines.includes(i) ? 'translateX(0)' : 'translateX(-8px)',
              transitionDelay: '0ms',
            }}
          >
            <span style={{ color: line.color }} className="leading-relaxed">{line.text}</span>
          </div>
        ))}
        {visibleLines.length === TERMINAL_LINES.length && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-slate-500">$</span>
            <span className="w-2 h-4 bg-blue-400 animate-pulse rounded-sm" />
          </div>
        )}
      </div>
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)' }} />
    </div>
  );
}

// ── Orbit Visual ──────────────────────────────────────────────────────────────
function OrbitVisual() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center mx-auto">
      {/* Core */}
      <div className="absolute inset-0 rounded-full border border-blue-500/10 animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute rounded-full border border-violet-500/10" style={{ inset: '24px', animation: 'rotate-slow 15s linear infinite reverse' }} />
      {/* Center node */}
      <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d1b69)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 40px rgba(59,130,246,0.2)' }}>
        <Zap className="w-8 h-8 text-blue-400" />
      </div>
      {/* Orbiting nodes */}
      {[
        { label: 'NLP', icon: Brain, color: '#8b5cf6', delay: '0s', radius: 90, angle: 0 },
        { label: 'DB', icon: Database, color: '#10b981', delay: '1.5s', radius: 90, angle: 120 },
        { label: 'Auth', icon: Lock, color: '#06b6d4', delay: '3s', radius: 90, angle: 240 },
      ].map((node, i) => (
        <div key={i} className="absolute" style={{
          width: 40, height: 40,
          top: '50%', left: '50%',
          marginTop: -20, marginLeft: -20,
          transform: `rotate(${node.angle}deg) translateX(${node.radius}px) rotate(-${node.angle}deg)`,
          animation: `rotate-slow 8s linear infinite`,
          animationDelay: node.delay,
          transformOrigin: `-${node.radius - 20}px 20px`,
        }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{ background: `${node.color}18`, borderColor: `${node.color}44`, color: node.color }}>
            <node.icon className="w-4 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ onLaunchApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = ['Features', 'How it Works', 'Team'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(6,9,18,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
      }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">FlowSpeak</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200">
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="https://github.com" target="_blank" rel="noreferrer"
            className="p-2 text-slate-400 hover:text-white transition-colors">
            <GithubIcon className="w-5 h-5" />
          </a>
          <button onClick={onLaunchApp}
            className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Launch App
          </button>
        </div>

        {/* Mobile menu btn */}
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-6 space-y-4" style={{ background: 'rgba(6,9,18,0.98)', backdropFilter: 'blur(20px)' }}>
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              className="block text-slate-400 hover:text-white py-2 border-b border-slate-800"
              onClick={() => setMenuOpen(false)}>
              {l}
            </a>
          ))}
          <button onClick={() => { onLaunchApp(); setMenuOpen(false); }}
            className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2">
            <Terminal className="w-4 h-4" /> Launch App
          </button>
        </div>
      )}
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection({ onLaunchApp }) {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden grid-bg">
      {/* Radial glow */}
      <div className="absolute inset-0 radial-glow-blue pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: `${4 + i * 2}px`, height: `${4 + i * 2}px`,
            background: i % 2 === 0 ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)',
            top: `${15 + i * 12}%`, left: `${5 + i * 14}%`,
            animation: `float ${4 + i}s ease-in-out infinite ${i * 0.7}s`,
          }} />
      ))}

      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border text-sm font-medium"
              style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)', color: '#93c5fd' }}>
              <Sparkles className="w-3.5 h-3.5" />
              AI-Augmented Intent Execution Engine
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6">
              Speak.{' '}
              <span className="gradient-text">Execute.</span>
              <br />
              Ship Faster.
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl">
              FlowSpeak translates natural language into deterministic, transactional backend workflows — bridging the gap between AI's creativity and production-grade reliability.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-8 mb-10">
              {[
                { value: '< 50ms', label: 'Intent dispatch' },
                { value: '100%', label: 'Type-safe API' },
                { value: 'Real-time', label: 'SignalR telemetry' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button onClick={onLaunchApp}
                className="btn-primary px-7 py-3.5 rounded-xl font-semibold text-white flex items-center gap-2.5 text-base">
                <Terminal className="w-5 h-5" />
                Live Demo
                <ArrowRight className="w-4 h-4" />
              </button>
              <a href="https://github.com" target="_blank" rel="noreferrer"
                className="btn-secondary px-7 py-3.5 rounded-xl font-semibold text-slate-300 flex items-center gap-2.5 text-base">
                <GithubIcon className="w-5 h-5" />
                View Codebase
              </a>
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="relative float-anim">
            <AnimatedTerminal />
            {/* Floating badges around terminal */}
            <div className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 flex items-center gap-2 float-anim-2 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-mono font-semibold">SYSTEM ONLINE</span>
            </div>
            <div className="absolute -bottom-4 -left-4 glass rounded-xl px-3 py-2 flex items-center gap-2 float-anim-3 border border-blue-500/20">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-400 font-mono">NLP Engine Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-slate-600">Scroll to explore</span>
        <div className="w-5 h-8 rounded-full border border-slate-700 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-slate-500" style={{ animation: 'float 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  );
}

// ── Ticker Bar ────────────────────────────────────────────────────────────────
function TickerBar() {
  const items = [
    '⚡ Intent Dispatch', '🛡️ JWT Auth', '📡 SignalR Telemetry',
    '🗄️ SQLite / SQL Server', '🤖 LLM + Rule-Based AI', '🔄 Dual-Token Refresh',
    '📦 Order Management', '🔍 Stock Intelligence', '🧩 Plugin Architecture',
    '⚡ Intent Dispatch', '🛡️ JWT Auth', '📡 SignalR Telemetry',
    '🗄️ SQLite / SQL Server', '🤖 LLM + Rule-Based AI', '🔄 Dual-Token Refresh',
  ];
  return (
    <div className="border-y border-slate-800/60 py-3 overflow-hidden"
      style={{ background: 'rgba(13,17,23,0.8)' }}>
      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i} className="mx-8 text-sm text-slate-500 font-mono whitespace-nowrap flex items-center gap-2">
            {item}
            <span className="text-slate-700 ml-6">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Problem & Solution ────────────────────────────────────────────────────────
const PROBLEMS = [
  { icon: AlertTriangle, text: 'AI outputs are non-deterministic & unpredictable' },
  { icon: XCircle, text: 'Natural language ≠ safe database transactions' },
  { icon: AlertTriangle, text: 'No audit trail for AI-driven decisions' },
  { icon: XCircle, text: 'Security gaps when LLMs touch production systems' },
];
const SOLUTIONS = [
  { icon: CheckCircle2, text: 'Deterministic intent handlers — AI only classifies, never mutates' },
  { icon: CheckCircle2, text: 'Strict service layer + EF Core transactions for every operation' },
  { icon: CheckCircle2, text: 'Append-only AI_CommandLogs table for full auditability' },
  { icon: CheckCircle2, text: 'JWT + HttpOnly cookies, RBAC, zero PII in tokens' },
];

function ProblemSolutionSection() {
  return (
    <section id="features" className="py-28 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 mb-4">
            <Layers className="w-4 h-4" /> The Problem We Solve
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            AI is powerful.{' '}
            <span className="gradient-text">AI is risky.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Most AI pipelines are dangerous — they let language models directly mutate production data.
            FlowSpeak separates concerns at the architectural level.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Problems */}
          <div className="reveal hover-card rounded-2xl p-8 border border-red-500/10"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(15,22,35,0.8))' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-red-400">The Old Way</h3>
            </div>
            <div className="space-y-4">
              {PROBLEMS.map((p, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <p.icon className="w-5 h-5 text-red-400/70 mt-0.5 shrink-0" />
                  <span className="text-slate-400 text-sm leading-relaxed">{p.text}</span>
                </div>
              ))}
            </div>
            {/* Code snippet */}
            <div className="mt-6 rounded-xl p-4 font-mono text-xs border border-red-500/10"
              style={{ background: 'rgba(239,68,68,0.04)' }}>
              <div className="text-slate-500 mb-2"># ❌ Dangerous pattern</div>
              <div className="text-red-400">llm.run(<span className="text-yellow-400">"delete old orders"</span>)</div>
              <div className="text-slate-500"># AI executes raw SQL. No guard.</div>
            </div>
          </div>

          {/* Solutions */}
          <div className="reveal reveal-delay-2 hover-card rounded-2xl p-8 border border-emerald-500/10"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(15,22,35,0.8))' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400">The FlowSpeak Way</h3>
            </div>
            <div className="space-y-4">
              {SOLUTIONS.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <s.icon className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-slate-300 text-sm leading-relaxed">{s.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl p-4 font-mono text-xs border border-emerald-500/10"
              style={{ background: 'rgba(16,185,129,0.04)' }}>
              <div className="text-slate-500 mb-2"># ✅ FlowSpeak pattern</div>
              <div className="text-emerald-400">intent = ai.classify(<span className="text-yellow-400">"check Dell stock"</span>)</div>
              <div className="text-blue-400">handler.execute(intent) <span className="text-slate-500"># typed, safe</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features Bento ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Brain, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.15)',
    title: 'Dual AI Providers', desc: 'LLM-powered classification with a rule-based fallback. Never goes blind.',
    badge: 'Pluggable', large: true,
  },
  {
    icon: ShieldCheck, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.15)',
    title: 'JWT + HttpOnly Cookies', desc: 'Dual-token auth with 15-min access + 7-day rotating refresh. Zero localStorage exposure.',
    badge: 'Secure',
  },
  {
    icon: Activity, color: '#10b981', bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.15)',
    title: 'Live Telemetry', desc: 'SignalR + MessagePack streaming. Sub-10ms event propagation to all connected clients.',
    badge: 'Real-time',
  },
  {
    icon: Database, color: '#06b6d4', bgColor: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.15)',
    title: 'Transactional DB', desc: 'EF Core with soft-delete, audit logs, and optimistic concurrency across all entities.',
    badge: 'Reliable',
  },
  {
    icon: Package, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.15)',
    title: 'Intent Dispatcher', desc: 'Handler-chain architecture. Each intent maps to a typed, testable business handler.',
    badge: 'Extensible', large: true,
  },
  {
    icon: Globe, color: '#ec4899', bgColor: 'rgba(236,72,153,0.08)', borderColor: 'rgba(236,72,153,0.15)',
    title: 'CORS + RBAC', desc: 'Role-based access control with Admin / Sales / Viewer tiers. Fine-grained policy enforcement.',
    badge: 'Enterprise',
  },
];

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['All Features', 'Security', 'AI Layer', 'Realtime'];

  return (
    <section id="features-section" className="py-28 relative"
      style={{ background: 'linear-gradient(180deg, transparent, rgba(13,17,23,0.6), transparent)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 mb-4">
            <Code2 className="w-4 h-4" /> Core Architecture
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Built for{' '}
            <span className="gradient-text">Production.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Every feature is engineered with enterprise-grade patterns — not a prototype.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center justify-center gap-2 mb-12 flex-wrap reveal">
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`tab-btn px-5 py-2 rounded-xl text-sm font-medium border transition-all ${activeTab === i ? 'active text-white' : 'text-slate-500 border-slate-800 hover:text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i}
              className={`reveal hover-card rounded-2xl p-6 border transition-all duration-300 cursor-default reveal-delay-${i + 1}`}
              style={{ background: f.bgColor, borderColor: f.borderColor, gridColumn: f.large ? 'span 1' : 'span 1' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}33` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}25` }}>
                  {f.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', icon: MessageSquare, color: '#3b82f6', title: 'User Speaks', desc: 'User types a natural language command in the command center interface.' },
  { n: '02', icon: Brain, color: '#8b5cf6', title: 'AI Classifies', desc: 'The NLP layer extracts intent + entity from the raw text using LLM or rule-based logic.' },
  { n: '03', icon: GitBranch, color: '#06b6d4', title: 'Intent Dispatched', desc: 'The IntentDispatcher routes to the correct typed handler with zero ambiguity.' },
  { n: '04', icon: Database, color: '#10b981', title: 'DB Transaction', desc: 'The handler executes a transactional EF Core query, updates stock, creates order.' },
  { n: '05', icon: Activity, color: '#f59e0b', title: 'Telemetry Fired', desc: 'Real-time event broadcast via SignalR to all authenticated clients instantly.' },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 radial-glow-violet pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 reveal">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 mb-4">
            <RefreshCw className="w-4 h-4" /> Execution Pipeline
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            How It <span className="gradient-text-emerald">Works</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            From natural language to committed database transaction in under 50ms.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(139,92,246,0.3), rgba(16,185,129,0.3), transparent)' }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1} flex flex-col items-center text-center group`}>
                {/* Step number bubble */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: `${step.color}12`,
                      borderColor: `${step.color}35`,
                      boxShadow: `0 0 0 0 ${step.color}40`,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 30px ${step.color}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
                    <step.icon className="w-8 h-8" style={{ color: step.color }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: step.color, color: '#fff' }}>
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture diagram (simplified) */}
        <div className="mt-20 reveal glass rounded-2xl p-8 border border-slate-700/30">
          <div className="text-center mb-6">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Tech Stack</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'React 19', color: '#61dafb' },
              { label: 'ASP.NET Core 10', color: '#512bd4' },
              { label: 'Entity Framework', color: '#10b981' },
              { label: 'SignalR', color: '#3b82f6' },
              { label: 'MessagePack', color: '#f59e0b' },
              { label: 'SQLite', color: '#06b6d4' },
              { label: 'JWT', color: '#ec4899' },
              { label: 'Tailwind CSS v4', color: '#38bdf8' },
              { label: 'BCrypt', color: '#8b5cf6' },
              { label: 'Vite 8', color: '#facc15' },
            ].map((tech, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/50"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: tech.color }} />
                <span className="text-sm text-slate-300 font-medium">{tech.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Team Section ──────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: 'Muhammad Faheem Khan',
    role: 'Frontend / Backend Engineer',
    initials: 'MFK',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
    linkedin: 'https://www.linkedin.com/in/muhammadfaheemkhan-dev/',
    skills: ['React 19', 'ASP.NET Core', 'Vite', 'UI/UX'],
    bio: 'Architected the full-stack foundation — from the dark-mode command center UI to the secure .NET API layer with JWT dual-token authentication.',
  },
  {
    name: 'Muhammad Anees',
    role: 'Backend / AI Engineer',
    initials: 'MA',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #2d1b69, #7c3aed)',
    linkedin: 'https://www.linkedin.com/in/muhammadanees-dev/',
    skills: ['AI/NLP', 'EF Core', 'SignalR', 'SQLite'],
    bio: 'Engineered the intent dispatch engine, AI provider abstraction, real-time telemetry pipeline, and the deterministic transaction layer.',
  },
];

function TeamSection() {
  return (
    <section id="team" className="py-28 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 mb-4">
            <Users className="w-4 h-4" /> The Builders
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Meet the <span className="gradient-text">Team</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Two engineers who turned a complex problem into a clean, production-ready system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {TEAM.map((member, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 2} team-card relative rounded-3xl overflow-hidden border border-slate-700/30 cursor-default`}
              style={{ background: 'rgba(15,22,35,0.9)' }}>

              {/* Top gradient bar */}
              <div className="h-1 w-full" style={{ background: member.gradient }} />

              <div className="p-8">
                {/* Avatar + name */}
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
                    style={{ background: member.gradient, boxShadow: `0 8px 32px ${member.color}40` }}>
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                    <p className="text-sm font-medium" style={{ color: member.color }}>{member.role}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-slate-400 leading-relaxed mb-6">{member.bio}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {member.skills.map((skill, j) => (
                    <span key={j} className="text-xs px-3 py-1 rounded-full font-medium border"
                      style={{ background: `${member.color}10`, borderColor: `${member.color}30`, color: member.color }}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* LinkedIn */}
                <a href={member.linkedin} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border"
                  style={{ borderColor: `${member.color}30`, color: member.color, background: `${member.color}08` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${member.color}20`;
                    e.currentTarget.style.borderColor = `${member.color}60`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${member.color}08`;
                    e.currentTarget.style.borderColor = `${member.color}30`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                  <LinkedinIcon className="w-4 h-4" />
                  Connect on LinkedIn
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Hover overlay glow */}
              <div className="card-overlay absolute inset-0 pointer-events-none rounded-3xl"
                style={{ background: `radial-gradient(circle at 50% 0%, ${member.color}08, transparent 70%)` }} />
            </div>
          ))}
        </div>

        {/* University / project context */}
        <div className="mt-16 text-center reveal">
          <div className="glass inline-block rounded-2xl px-8 py-6 border border-slate-700/30">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-bold">Final Year Project — 2026</span>
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-slate-400 text-sm">
              Built with passion for clean architecture, security, and real-world production standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CTASection({ onLaunchApp }) {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)' }} />
      <div className="max-w-4xl mx-auto px-6 text-center relative">
        <div className="reveal glass rounded-3xl p-12 border border-slate-700/40">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 40px rgba(59,130,246,0.4)' }}>
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Ready to see it <span className="gradient-text">in action?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Launch the live command center and experience deterministic AI intent execution firsthand.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={onLaunchApp}
              className="btn-primary px-8 py-4 rounded-xl font-bold text-white text-base flex items-center gap-3">
              <Terminal className="w-5 h-5" />
              Launch Live Demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="btn-secondary px-8 py-4 rounded-xl font-bold text-slate-300 text-base flex items-center gap-3">
              <GithubIcon className="w-5 h-5" />
              GitHub Repo
            </a>
          </div>
          {/* Credentials hint */}
          <div className="mt-8 inline-flex items-center gap-3 glass rounded-xl px-5 py-3 border border-slate-700/30">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500">
              Demo credentials: <span className="text-slate-300 font-mono">admin / admin123</span> or <span className="text-slate-300 font-mono">sales / sales123</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-800/60 py-12"
      style={{ background: 'rgba(6,9,18,0.9)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">FlowSpeak</span>
            <span className="text-slate-600 text-sm">— Intent Execution Engine</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-300 transition-colors">How it Works</a>
            <a href="#team" className="hover:text-slate-300 transition-colors">Team</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <GithubIcon className="w-4 h-4" /> GitHub
            </a>
          </div>

          {/* Copyright */}
          <p className="text-slate-600 text-sm">
            © 2026 FlowSpeak. Built by Faheem & Anees.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Main LandingPage ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  useScrollReveal();

  const handleLaunchApp = () => navigate('/app');

  return (
    <div style={{ background: '#060912', minHeight: '100vh' }}>
      <Navbar onLaunchApp={handleLaunchApp} />
      <HeroSection onLaunchApp={handleLaunchApp} />
      <TickerBar />
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TeamSection />
      <CTASection onLaunchApp={handleLaunchApp} />
      <Footer />
    </div>
  );
}

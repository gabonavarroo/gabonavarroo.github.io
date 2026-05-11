'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { useWeather } from '@/hooks/useWeather';
import { RESEARCH_TAGS } from '@/data/research';
import { HUDFrame } from '@/components/ui/HUDFrame';

gsap.registerPlugin(ScrollTrigger);

// ── Uptime Counter ─────────────────────────────────────────────
function UptimeCounter() {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${sec}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <HUDFrame label="UPTIME" status="ACTIVE">
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(24px, 3vw, 36px)',
            color: 'var(--cyan-pure)',
            letterSpacing: '0.1em',
            textShadow: '0 0 12px var(--cyan-pure)',
            margin: 0,
          }}
        >
          {elapsed}
        </p>
        <p
          className="hud-label"
          style={{ color: 'rgba(255,255,255,0.35)', marginTop: 6, fontSize: '10px' }}
        >
          SESSION ACTIVE
        </p>
      </div>
    </HUDFrame>
  );
}

// ── GitHub Widget ──────────────────────────────────────────────
function GithubWidget() {
  const stats = useGitHubStats();

  const content = () => {
    if (stats.isLoading) {
      return (
        <p className="hud-label" style={{ color: 'var(--cyan-pure)', padding: '16px 0' }}>
          UPLINK ESTABLISHING…
        </p>
      );
    }
    if (stats.error) {
      // GitHub GraphQL requires auth token even for public data in 2024+
      // Show cached/static display when unauthenticated
      return (
        <div style={{ padding: '12px 0' }}>
          <p className="hud-label" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
            GITHUB UPLINK REQUIRES AUTH TOKEN
          </p>
          <a
            href="https://github.com/gabonavarroo"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--cyan-pure)',
              textDecoration: 'none',
              letterSpacing: '0.06em',
            }}
          >
            → VISIT GITHUB PROFILE ↗
          </a>
        </div>
      );
    }
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
          {[
            { label: 'CONTRIBUTIONS', value: stats.totalCommits.toLocaleString() },
            { label: 'STREAK (DAYS)', value: String(stats.contributionStreak) },
            { label: 'TOP LANGUAGE', value: stats.topLanguage },
            { label: 'ACTIVE REPOS', value: String(stats.topRepos.length) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="hud-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                {label}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  color: 'var(--cyan-pure)',
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
        {stats.topRepos.length > 0 && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border-dim)', paddingTop: 10 }}>
            <p className="hud-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
              TOP REPOS
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {stats.topRepos.map((r) => (
                <span
                  key={r}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    padding: '2px 6px',
                    border: '1px solid var(--border-dim)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return <HUDFrame label="GITHUB COMMITS" status={stats.isLoading ? 'SYNCING' : stats.error ? 'OFFLINE' : 'ACTIVE'}>{content()}</HUDFrame>;
}

// ── Weather Widget ─────────────────────────────────────────────
const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀', '01n': '☾',
  '02d': '⛅', '02n': '☁',
  '03d': '☁', '03n': '☁',
  '04d': '☁', '04n': '☁',
  '09d': '🌧', '09n': '🌧',
  '10d': '🌦', '10n': '🌧',
  '11d': '⛈', '11n': '⛈',
  '13d': '❄', '13n': '❄',
  '50d': '🌫', '50n': '🌫',
};

function WeatherWidget() {
  const wx = useWeather();

  const noKey = wx.error === 'NO_KEY';

  const content = () => {
    if (wx.isLoading) {
      return (
        <p className="hud-label" style={{ color: 'var(--cyan-pure)', padding: '16px 0' }}>
          UPLINK ESTABLISHING…
        </p>
      );
    }
    if (noKey) {
      return (
        <div style={{ padding: '12px 0' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '28px',
              color: 'var(--text-dim, #4A6480)',
              margin: '0 0 4px',
            }}
          >
            ──°C
          </p>
          <p className="hud-label" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginBottom: 4 }}>
            MEXICO CITY · NO API KEY
          </p>
          <p className="hud-label" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>
            SET NEXT_PUBLIC_OPENWEATHER_KEY
          </p>
        </div>
      );
    }
    if (wx.error) {
      return (
        <p className="hud-label" style={{ color: 'var(--alert-red)', padding: '16px 0' }}>
          WEATHER UPLINK SEVERED — RETRY 0:30
        </p>
      );
    }
    const icon = WEATHER_ICONS[wx.icon] ?? '◈';
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>{icon}</span>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(28px, 3vw, 40px)',
              color: 'var(--cyan-pure)',
              margin: 0,
              fontWeight: 600,
              textShadow: '0 0 12px var(--cyan-pure)',
            }}
          >
            {wx.temp}°C
          </p>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 4,
          }}
        >
          {wx.condition}
        </p>
        <p className="hud-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>
          HUMIDITY: {wx.humidity}% · MEXICO CITY
        </p>
      </div>
    );
  };

  return <HUDFrame label="MEXICO CITY WEATHER" status={wx.isLoading ? 'SYNCING' : wx.error ? 'OFFLINE' : 'ACTIVE'}>{content()}</HUDFrame>;
}

// ── System Fuel Gauge ──────────────────────────────────────────
const FUEL_LABELS = [
  'CALIBRATING CAFFEINE LEVELS…',
  'COFFEE MATRIX INITIALIZED',
  'MONSTER PROTOCOL ACTIVE',
  'SYNAPTIC FUEL OPTIMAL',
  'CAFFEINE CRITICAL — REFUEL REQUIRED',
  'OPERATING AT PEAK ESPRESSO',
  'MONSTER WHITE DOSAGE: NOMINAL',
  'JITTER FREQUENCY: ELEVATED',
];

function computeFuel(): { coffee: number; monster: number; pct: number } {
  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay(); // 0=Sun

  // Coffee peaks morning/afternoon, Monster at night/evening
  const coffeePct = Math.max(0, Math.sin(((hour - 7) / 14) * Math.PI));
  const monsterPct = hour >= 20 || hour <= 2 ? 0.8 : hour >= 16 ? 0.4 : 0.1;
  const weekdayMultiplier = dow >= 1 && dow <= 5 ? 1.2 : 0.7;

  const coffee = Math.min(4, Math.round(coffeePct * 3 * weekdayMultiplier));
  const monster = Math.min(2, Math.round(monsterPct * 2 * weekdayMultiplier));
  const pct = Math.min(100, Math.round((coffeePct * 0.6 + monsterPct * 0.4) * 100 * weekdayMultiplier));

  return { coffee, monster, pct };
}

function SystemFuelGauge() {
  const barRef = useRef<HTMLDivElement>(null);
  const fuel = computeFuel();
  const labelIndex = Math.floor((fuel.pct / 100) * (FUEL_LABELS.length - 1));
  const label = FUEL_LABELS[labelIndex];

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bar,
        { width: '0%' },
        {
          width: `${fuel.pct}%`,
          duration: 1.6,
          ease: 'expo.out',
          scrollTrigger: { trigger: bar, start: 'top 90%' },
        }
      );
    }, bar);
    return () => ctx.revert();
  }, [fuel.pct]);

  return (
    <HUDFrame label="SYSTEM FUEL" status="ACTIVE">
      <div style={{ padding: '8px 0' }}>
        <p className="hud-label" style={{ color: 'var(--cyan-pure)', marginBottom: 10, fontSize: '10px' }}>
          {label}
        </p>
        {/* Bar track */}
        <div
          style={{
            height: 6,
            background: 'var(--border-dim)',
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            ref={barRef}
            style={{
              height: '100%',
              width: 0,
              background: 'linear-gradient(90deg, var(--cyan-pure), var(--system-green))',
              boxShadow: '0 0 8px var(--cyan-pure)',
            }}
          />
        </div>
        {/* Readouts */}
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'COFFEE', value: `${fuel.coffee} cups`, icon: '☕' },
            { label: 'MONSTER', value: `${fuel.monster} cans`, icon: '⚡' },
            { label: 'LEVEL', value: `${fuel.pct}%`, icon: '▣' },
          ].map(({ label: l, value, icon }) => (
            <div key={l}>
              <p className="hud-label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>
                {l}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                {icon} {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </HUDFrame>
  );
}

// ── Research Tags vortex ───────────────────────────────────────
function ResearchTags() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const tags = Array.from(el.querySelectorAll<HTMLSpanElement>('.research-tag'));
    const N = tags.length;
    const baseAngles = tags.map((_, i) => (i / N) * Math.PI * 2);
    const radii = tags.map(() => 80 + Math.random() * 50);
    const speeds = tags.map(() => 0.18 + Math.random() * 0.12);
    const phases = [...baseAngles];

    const tick = (t: number) => {
      const time = t / 1000;
      tags.forEach((tag, i) => {
        const angle = phases[i] + time * speeds[i];
        const rx = radii[i] * 1.8;
        const ry = radii[i] * 0.5;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        const depth = (Math.sin(angle) + 1) / 2; // 0..1
        const scale = 0.75 + depth * 0.35;
        const opacity = 0.25 + depth * 0.75;
        tag.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        tag.style.opacity = String(opacity);
        tag.style.zIndex = String(Math.round(depth * 10));
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <HUDFrame label="RESEARCH INTERESTS" status="ACTIVE">
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {RESEARCH_TAGS.map((tag) => (
          <span
            key={tag}
            className="research-tag"
            style={{
              position: 'absolute',
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(10px, 1.1vw, 12px)',
              padding: '4px 12px',
              border: '1px solid rgba(0,212,255,0.3)',
              color: 'var(--cyan-pure)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              background: 'rgba(0,212,255,0.04)',
              cursor: 'default',
              willChange: 'transform, opacity',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </HUDFrame>
  );
}

// ── Tech Stack Placeholder ─────────────────────────────────────
function TechStackPlaceholder() {
  const STACK = [
    'Python', 'PyTorch', 'HuggingFace', 'Kafka',
    'Docker', 'Next.js', 'PostgreSQL', 'MongoDB',
  ];

  return (
    <HUDFrame label="CURRENT STACK — TECH MATRIX" status="ACTIVE">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          padding: '16px 0',
        }}
      >
        {STACK.map((tech) => (
          <div
            key={tech}
            style={{
              border: '1px solid var(--border-dim)',
              padding: '10px 8px',
              textAlign: 'center',
              position: 'relative',
              background: 'rgba(0,212,255,0.02)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--cyan-pure)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,212,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-dim)';
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,212,255,0.02)';
            }}
          >
            {/* Corner bracket */}
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 6,
                height: 6,
                borderTop: '1px solid var(--cyan-pure)',
                borderLeft: '1px solid var(--cyan-pure)',
                opacity: 0.4,
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(9px, 1vw, 11px)',
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
                letterSpacing: '0.04em',
              }}
            >
              {tech}
            </p>
          </div>
        ))}
      </div>
    </HUDFrame>
  );
}

// ── SystemMonitor (composed) ───────────────────────────────────
export function SystemMonitor() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-monitor-row]',
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="labs"
      style={{
        position: 'relative',
        padding: 'clamp(64px, 10vw, 128px) clamp(20px, 5vw, 80px)',
        background: 'var(--bg-void)',
        borderTop: '1px solid var(--border-dim)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 30% at 80% 50%, rgba(0,212,255,0.03), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div data-monitor-row style={{ marginBottom: 48, maxWidth: '100%' }}>
        <HUDFrame label="SECTION.06 — SYSTEM MONITOR" status="ACTIVE">
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
            }}
          >
            LIVE TELEMETRY · RESEARCH FREQUENCIES · TECH STACK
          </p>
        </HUDFrame>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Top row — 4 widgets */}
        <div
          data-monitor-row
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <GithubWidget />
          <WeatherWidget />
          <SystemFuelGauge />
          <UptimeCounter />
        </div>

        {/* Middle — research tags */}
        <div data-monitor-row style={{ marginBottom: 20 }}>
          <ResearchTags />
        </div>

        {/* Bottom — tech stack */}
        <div data-monitor-row>
          <TechStackPlaceholder />
        </div>
      </div>
    </section>
  );
}

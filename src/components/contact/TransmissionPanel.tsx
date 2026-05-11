'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import emailjs from '@emailjs/browser';
import { OPERATOR } from '@/data/operator';
import { HUDFrame } from '@/components/ui/HUDFrame';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? '';
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? '';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? '';
const CONFIG_OK = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

interface FormState {
  name: string;
  email: string;
  message: string;
}

// ── Blinking cursor ────────────────────────────────────────────
function BlinkCursor() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 8,
        height: '1em',
        background: 'var(--cyan-pure)',
        verticalAlign: 'text-bottom',
        animation: 'blink-cursor 1s step-end infinite',
      }}
    />
  );
}

// ── Terminal input ─────────────────────────────────────────────
function TerminalInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const id = `tx-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    resize: 'none',
    caretColor: 'var(--cyan-pure)',
    lineHeight: 1.65,
  };

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-dim)',
        paddingBottom: 10,
        marginBottom: 18,
        display: 'flex',
        gap: 12,
        alignItems: multiline ? 'flex-start' : 'center',
      }}
    >
      <label
        htmlFor={id}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--cyan-pure)',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          paddingTop: multiline ? 2 : 0,
          minWidth: 90,
          cursor: 'text',
        }}
      >
        &gt; {label} :
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          style={inputStyle}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );
}

// ── Social chip ────────────────────────────────────────────────
function SocialChip({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        padding: '5px 12px',
        border: '1px solid var(--border-dim)',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.08em',
        textDecoration: 'none',
        transition: 'color 0.2s, border-color 0.2s',
        display: 'inline-block',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--cyan-pure)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--cyan-pure)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.55)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-dim)';
      }}
    >
      [{label}]
    </a>
  );
}

export function TransmissionPanel() {
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const setField = useCallback((field: keyof FormState) => (v: string) => {
    setForm((prev) => ({ ...prev, [field]: v }));
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    if (!CONFIG_OK) {
      setStatus('error');
      setErrorMsg('EMAILJS NOT CONFIGURED — SET ENV VARS');
      return;
    }

    setStatus('sending');

    // Flash animation
    const flash = flashRef.current;
    if (flash) {
      gsap.fromTo(flash, { opacity: 0 }, { opacity: 0.35, duration: 0.2, yoyo: true, repeat: 1 });
    }

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
          to_email: OPERATOR.email,
        },
        PUBLIC_KEY
      );
      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'CHANNEL ERROR';
      setErrorMsg(msg.toUpperCase());
      setStatus('error');
    }
  }, [form]);

  const isValid = form.name.trim() && form.email.trim() && form.message.trim();

  return (
    <section
      ref={sectionRef}
      data-section="contact"
      style={{
        position: 'relative',
        padding: 'clamp(64px, 10vw, 128px) clamp(20px, 5vw, 80px)',
        background: 'var(--bg-void)',
        borderTop: '1px solid var(--border-dim)',
        overflow: 'hidden',
      }}
    >
      {/* Flash overlay */}
      <div
        ref={flashRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--cyan-pure)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 40% at 50% 100%, rgba(0,212,255,0.04), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Section header */}
      <div style={{ marginBottom: 48, maxWidth: '100%' }}>
        <HUDFrame label="SECTION.07 — TRANSMISSION TERMINAL" status="ACTIVE">
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
            }}
          >
            SATELLITE: ONLINE · ENCRYPTION: AES-256 · LATENCY: 12ms
          </p>
        </HUDFrame>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div ref={panelRef}>
          {/* Status bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid var(--border-dim)',
              paddingBottom: 14,
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--system-green)',
                boxShadow: '0 0 6px var(--system-green)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.08em',
              }}
            >
              ESTABLISH CONTACT ────────────────────────────────────────
            </span>
          </div>

          {/* Form or result */}
          {status === 'success' ? (
            <div
              style={{
                padding: '40px 24px',
                border: '1px solid var(--system-green)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: 'clamp(16px, 2.5vw, 24px)',
                  color: 'var(--system-green)',
                  fontWeight: 700,
                  marginBottom: 12,
                  textShadow: '0 0 16px var(--system-green)',
                }}
              >
                TRANSMISSION SENT.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  margin: 0,
                }}
              >
                RESPONSE ETA: &lt;24H
              </p>
            </div>
          ) : (
            <>
              {/* Recipient line */}
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 24,
                  letterSpacing: '0.06em',
                }}
              >
                &gt; RECIPIENT: <span style={{ color: 'var(--cyan-pure)' }}>{OPERATOR.email}</span>
              </div>

              {/* Inputs */}
              <TerminalInput
                label="OPERATOR"
                value={form.name}
                onChange={setField('name')}
                placeholder="your name"
              />
              <TerminalInput
                label="CHANNEL"
                value={form.email}
                onChange={setField('email')}
                type="email"
                placeholder="your@email.com"
              />
              <TerminalInput
                label="MESSAGE"
                value={form.message}
                onChange={setField('message')}
                placeholder="type your message…"
                multiline
              />

              {/* Error state */}
              {status === 'error' && (
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--alert-red)',
                    marginBottom: 16,
                    letterSpacing: '0.06em',
                  }}
                >
                  ✕ TRANSMISSION FAILED. {errorMsg || 'CHANNEL ERROR.'}{' '}
                  <button
                    onClick={() => setStatus('idle')}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--cyan-pure)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    RETRY
                  </button>
                </p>
              )}

              {/* No config warning */}
              {!CONFIG_OK && (
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'rgba(255,183,0,0.7)',
                    marginBottom: 16,
                    letterSpacing: '0.05em',
                  }}
                >
                  ⚠ EMAILJS NOT CONFIGURED — SET NEXT_PUBLIC_EMAILJS_* ENV VARS TO ENABLE SENDING
                </p>
              )}

              {/* Submit button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginTop: 8,
                }}
              >
                <button
                  onClick={handleSubmit}
                  disabled={!isValid || status === 'sending'}
                  style={{
                    fontFamily: 'var(--font-orbitron)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    padding: '12px 28px',
                    border: `1px solid ${isValid ? 'var(--cyan-pure)' : 'var(--border-dim)'}`,
                    color: isValid ? 'var(--cyan-pure)' : 'rgba(255,255,255,0.25)',
                    background: 'transparent',
                    cursor: isValid ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s, box-shadow 0.2s',
                    boxShadow: isValid ? '0 0 16px rgba(0,212,255,0.15)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isValid) return;
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(0,212,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = isValid ? '0 0 16px rgba(0,212,255,0.15)' : 'none';
                  }}
                >
                  {status === 'sending' ? 'TRANSMITTING…' : 'INITIATE TRANSMISSION'}
                </button>
                {status === 'idle' && <BlinkCursor />}
              </div>
            </>
          )}

          {/* Social row */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid var(--border-dim)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
                marginRight: 4,
                letterSpacing: '0.08em',
              }}
            >
              SOCIAL LINKS:
            </span>
            <SocialChip label="GH" href={`https://github.com/${OPERATOR.github}`} />
            <SocialChip label="LI" href={`https://linkedin.com/in/${OPERATOR.linkedin.replace('www.linkedin.com/in/', '')}`} />
            <SocialChip label="MAIL" href={`mailto:${OPERATOR.email}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

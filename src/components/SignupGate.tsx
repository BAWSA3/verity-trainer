'use client';

import { useCallback, useState } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { Button, GlassPanel } from './ui';
import TurnstileWidget, { TURNSTILE_ENABLED } from './TurnstileWidget';

// Mirrors the key in CreatePageClient — read on submit so attribution travels
// from the QR scan → onboarding → signup without a server-side cookie.
const REFERRAL_KEY = 'verity:ref:v1';

function readReferralFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(REFERRAL_KEY);
    if (!raw) return undefined;
    const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
    return cleaned || undefined;
  } catch {
    return undefined;
  }
}

interface SignupGateProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  onSuccess: (id: string) => void;
  onClose: () => void;
  /** Pre-fill the X handle field (e.g. from the AI flow's input). */
  initialHandle?: string;
  /** AI-generated one-liner persisted to the share card. Absent for manual flow. */
  reasoning?: string;
}

export default function SignupGate({ config, personality, onSuccess, onClose, initialHandle, reasoning }: SignupGateProps) {
  const [email, setEmail] = useState('');
  const [xHandle, setXHandle] = useState(initialHandle ?? '');
  const [trainerName, setTrainerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Turnstile token, only required when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
  // The widget verifies invisibly for most users; some get a checkbox.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);
  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = trainerName.trim();
    if (!email || !trimmedName) {
      setError('Email and trainer name required');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Trainer name must be at least 2 characters');
      return;
    }
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError('Captcha check pending — please try again in a moment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          xHandle: xHandle.replace('@', ''),
          trainerName: trimmedName.toUpperCase().slice(0, 12),
          trainerConfig: config,
          trainerPersonality: personality,
          reasoning: reasoning || undefined,
          referredBy: readReferralFromStorage(),
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          const secs = data.retryAfter ?? 60;
          const mins = Math.max(1, Math.ceil(secs / 60));
          throw new Error(
            `Too many signups from your network. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`,
          );
        }
        throw new Error(data.error || 'Signup failed');
      }

      onSuccess(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(22, 39, 44, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md">
        <GlassPanel padding="lg" radius="xl" tone="cream" strength="strong">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[color:var(--accent-coral)]">
              Step 2 of 2
            </p>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid place-items-center rounded-full transition opacity-60 hover:opacity-100"
              style={{ width: 28, height: 28, color: 'var(--ink-soft)' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <h2 className="text-[24px] font-bold tracking-tight text-[color:var(--ink)] leading-tight">
            Claim your trainer.
          </h2>
          <p className="text-[13px] text-[color:var(--ink-soft)] leading-relaxed mt-2 mb-5">
            Enter your details to generate your VERITY trainer card and claim early access to the marketplace drop.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Trainer name"
              required
              value={trainerName}
              onChange={(v) => setTrainerName(v.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12))}
              placeholder="Max 12 chars"
              maxLength={12}
              uppercase
            />
            <Field
              label="Email"
              required
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
            />
            <Field
              label="X / Twitter handle"
              value={xHandle}
              onChange={setXHandle}
              placeholder="@handle"
            />

            {/* Invisible Turnstile widget — only renders when env var set */}
            <TurnstileWidget
              onVerify={handleTurnstileVerify}
              onExpire={handleTurnstileExpire}
            />

            {error && (
              <p className="text-[12px] text-[color:var(--accent-coral-dark)] tracking-tight">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading} loading={loading}>
              {loading ? 'Saving…' : 'Generate my card →'}
            </Button>
          </form>
        </GlassPanel>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  uppercase?: boolean;
}

function Field({ label, value, onChange, placeholder, type = 'text', required, maxLength, uppercase }: FieldProps) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.18em] uppercase font-bold text-[color:var(--ink-soft)] mb-1.5">
        {label}{required ? ' *' : ''}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 rounded-xl text-[14px] focus:outline-none transition"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid rgba(22, 39, 44, 0.15)',
          color: 'var(--ink)',
          textTransform: uppercase ? 'uppercase' : 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-coral)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(22, 39, 44, 0.15)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
        }}
      />
    </div>
  );
}

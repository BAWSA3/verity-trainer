'use client';

import { useEffect, useState } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { randomConfig } from '@/lib/trainer-options';
import TrainerDashboard from '@/components/dashboard/TrainerDashboard';
import { GlassPanel, Button } from '@/components/ui';

const INITIAL_PERSONALITY: TrainerPersonality = { zodiac: '', likes: [], dislikes: [] };
// Local-storage key for the referral handle so it survives the X-auth bounce
// + AI generation phase before signup. Captured from `?ref=<handle>` on the
// /create landing.
const REFERRAL_KEY = 'verity:ref:v1';

type Phase = 'enter-handle' | 'generating' | 'reviewing';

interface AiResult {
  config: TrainerConfig;
  personality: TrainerPersonality;
  reasoning: string;
  source: 'live' | 'mock';
  profile: { handle: string; name: string; bio: string; avatarUrl: string | null; followers: number; source: 'live' | 'mock' };
}

export default function CreatePageClient() {
  const [phase, setPhase] = useState<Phase>('enter-handle');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [statusText, setStatusText] = useState('Reading your X profile…');

  // Capture ?ref=<handle> from the URL on first load and stash it. Survives
  // the AI generation phase + signup gate so /api/signup can attribute.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const cleaned = ref.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);
      if (cleaned) {
        try { window.localStorage.setItem(REFERRAL_KEY, cleaned); } catch {}
      }
    }
  }, []);

  async function generate(input: string, regenerate = false) {
    setError(null);
    setPhase('generating');
    cycleStatus();
    try {
      const r = await fetch('/api/generate-trainer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handle: input, regenerate }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(data.message || data.error || `${r.status}`);
      }
      const data = (await r.json()) as AiResult;
      setAi(data);
      setPhase('reviewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'generation failed');
      setPhase('enter-handle');
    }
  }

  function cycleStatus() {
    const messages = [
      'Reading your X profile…',
      'Listening to your last 30 posts…',
      'Picking your vibe…',
      'Choosing your fit…',
      'Computing stats…',
    ];
    let i = 0;
    setStatusText(messages[0]);
    const id = setInterval(() => {
      i++;
      if (i >= messages.length) {
        clearInterval(id);
        return;
      }
      setStatusText(messages[i]);
    }, 1800);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = handle.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(trimmed)) {
      setError('Enter a valid X handle (letters, numbers, underscore — max 15 chars)');
      return;
    }
    generate(trimmed);
  }

  // Re-roll: local random shuffle of the visual layers. NOT a re-scan of the
  // X profile (that's only the initial generation). Keeps personality + AI
  // reasoning intact; only the visual config changes. Instant + free.
  function handleRegenerate() {
    if (!ai) return;
    setAi({
      ...ai,
      config: randomConfig(),
      reasoning: '🎲 Random remix. Tweak any layer below or claim as-is.',
    });
  }

  if (phase === 'reviewing' && ai) {
    return (
      <TrainerDashboard
        initialConfig={ai.config}
        initialPersonality={ai.personality}
        aiContext={{ reasoning: ai.reasoning }}
        onRegenerate={handleRegenerate}
        initialHandle={ai.profile.handle}
      />
    );
  }

  if (phase === 'generating') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          {/* Loading video centerpiece */}
          <div
            className="relative rounded-[28px] overflow-hidden w-full aspect-square animate-float"
            style={{
              boxShadow: '0 32px 80px -24px rgba(67, 56, 202, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.6)',
            }}
          >
            <video
              src="/video/loading.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Status */}
          <div className="text-center">
            <p
              className="text-[14px] tracking-tight font-semibold text-[color:var(--ink)] mb-1"
            >
              {statusText}
            </p>
            <p className="text-[12px] text-[color:var(--ink-muted)]">
              Building your trainer from @{handle.replace(/^@/, '')}…
            </p>
          </div>
        </div>
      </main>
    );
  }

  // enter-handle phase
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <GlassPanel padding="lg" radius="xl" tone="cream" strength="strong">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[color:var(--accent-coral)] mb-2">
                Step 1 of 2
              </p>
              <h1 className="text-[26px] sm:text-[28px] leading-tight font-bold tracking-tight text-[color:var(--ink)]">
                Get your trainer in 10 seconds.
              </h1>
              <p className="text-[13px] text-[color:var(--ink-soft)] leading-relaxed mt-2">
                Drop your X handle. We&apos;ll read your bio + recent posts and generate a hi-fi pixel
                trainer that captures your vibe. You can tweak it before you claim it.
              </p>
            </div>

            <div>
              <label
                htmlFor="x-handle"
                className="block text-[10px] tracking-[0.18em] uppercase font-bold text-[color:var(--ink-soft)] mb-2"
              >
                X Handle
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--ink-muted)] font-medium pointer-events-none"
                  aria-hidden
                >
                  @
                </span>
                <input
                  id="x-handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="elonmusk"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-8 pr-3 py-3 rounded-xl text-[15px] focus:outline-none transition"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(22, 39, 44, 0.15)',
                    color: 'var(--ink)',
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
              {error && (
                <p className="text-[12px] text-[color:var(--accent-coral-dark)] mt-2 tracking-tight">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={!handle.trim()}>
              Pull my trainer →
            </Button>

            <p className="text-center text-[11px] text-[color:var(--ink-muted)] leading-relaxed">
              We read your public X profile to generate your trainer.
              <br />
              We never post on your behalf.
            </p>
          </form>
        </GlassPanel>
      </div>
    </main>
  );
}

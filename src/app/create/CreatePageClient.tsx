'use client';

import { useState } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { randomConfig } from '@/lib/trainer-options';
import TrainerDashboard from '@/components/dashboard/TrainerDashboard';
import PokeBackground from '@/components/PokeBackground';

const INITIAL_PERSONALITY: TrainerPersonality = { zodiac: '', likes: [], dislikes: [] };

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

  return (
    <div
      className="min-h-screen bg-[#fffdf3] text-[#16272c] relative"
      style={{ fontFamily: 'var(--font-sora), sans-serif' }}
    >
      <PokeBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div
          className="w-full max-w-md bg-[#fffdf3] border-2 border-[#16272c] rounded-lg shadow-[0_20px_60px_-20px_rgba(22,39,44,0.3)] overflow-hidden"
        >
          <div
            className="px-5 py-3 border-b border-[#16272c]/15 flex items-center gap-3"
            style={{ background: '#fffdf3' }}
          >
            <span className="text-[#90b34d]">▣</span>
            <span
              className="text-[10px] tracking-[0.18em] uppercase text-[#16272c]"
              style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
            >
              VERITY · Auto-Generate Trainer
            </span>
          </div>

          {phase === 'enter-handle' && (
            <form onSubmit={handleSubmit} className="p-7 space-y-4">
              <h1
                className="text-[22px] leading-tight"
                style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
              >
                Get your trainer in 10 seconds.
              </h1>
              <p className="text-[13px] text-[#8a7d4d] leading-relaxed">
                Drop your X handle. We&apos;ll read your bio + recent posts and generate a
                hi-fi pixel trainer that captures your vibe. You can tweak it before you
                claim it.
              </p>
              <div>
                <label
                  className="block text-[10px] tracking-[0.15em] uppercase text-[#367d95] mb-2"
                  style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
                >
                  X Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7d4d]">@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="elonmusk"
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full pl-7 pr-3 py-3 border-2 border-[#16272c]/20 rounded text-[14px] focus:outline-none focus:border-[#367d95]"
                    style={{ background: 'white' }}
                  />
                </div>
                {error && (
                  <p className="text-[11px] text-[#c94d4d] mt-2 tracking-wide">{error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!handle.trim()}
                className="w-full py-3.5 rounded-[40px] text-white text-[12px] tracking-[0.18em] uppercase transition-all enabled:hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-loos), sans-serif',
                  fontWeight: 700,
                  background:
                    'linear-gradient(134.68deg, rgb(144,179,77) 28%, rgb(54,125,149) 77%, rgb(22,39,44) 100%)',
                }}
              >
                ▶ Generate My Trainer
              </button>
              <p className="text-center text-[10px] text-[#8a7d4d] tracking-[0.12em]">
                Demo: works without an X login. Your handle is read once for
                generation, no login required.
              </p>
            </form>
          )}

          {phase === 'generating' && (
            <div className="p-10 flex flex-col items-center gap-5 min-h-[280px] justify-center">
              <Spinner />
              <p
                className="text-[12px] tracking-[0.15em] uppercase text-[#367d95]"
                style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
              >
                {statusText}
              </p>
              <p className="text-[11px] text-[#8a7d4d] text-center">
                Building your trainer from @{handle.replace(/^@/, '')}…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="relative w-16 h-16">
      <div
        className="absolute inset-0 border-[3px] border-[#367d95]/20 rounded-full"
        style={{ borderTopColor: '#367d95', animation: 'verity-spin 0.9s linear infinite' }}
      />
      <style jsx>{`
        @keyframes verity-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

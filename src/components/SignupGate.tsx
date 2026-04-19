'use client';

import { useState } from 'react';
import { TrainerConfig } from '@/types/trainer';

interface SignupGateProps {
  config: TrainerConfig;
  onSuccess: (id: string) => void;
  onClose: () => void;
}

export default function SignupGate({ config, onSuccess, onClose }: SignupGateProps) {
  const [email, setEmail] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Friendlier messages for known cases
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
      className="fixed inset-0 bg-[#16272c]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ fontFamily: 'var(--font-sora), sans-serif' }}
    >
      <div
        className="border border-[#90b34d]/30 bg-[#fffdf3] p-8 max-w-md w-full rounded-[24px] shadow-[0_30px_60px_-20px_rgba(22,39,44,0.3)]"
      >
        <div className="flex justify-between items-start mb-4">
          <h2
            className="text-[#367d95] text-[11px] tracking-[0.2em] uppercase"
            style={{ fontFamily: 'var(--font-loos)', fontWeight: 700 }}
          >
            Register Trainer
          </h2>
          <button
            onClick={onClose}
            className="text-[#8a7d4d] hover:text-[#367d95] text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-[#8a7d4d] text-[12px] mb-6 leading-relaxed">
          Enter your details to generate your VERITY trainer card and claim early access to the marketplace drop.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[#367d95] text-[10px] tracking-[0.15em] uppercase font-bold block mb-1">
              Trainer Name *
            </label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) =>
                setTrainerName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12))
              }
              placeholder="Max 12 chars"
              maxLength={12}
              className="w-full bg-white border border-[#90b34d]/30 text-[#333] text-sm p-3 rounded-[12px]
                         focus:border-[#367d95] focus:outline-none uppercase placeholder:text-[#8a7d4d]/50 placeholder:normal-case"
            />
          </div>

          <div>
            <label className="text-[#367d95] text-[10px] tracking-[0.15em] uppercase font-bold block mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white border border-[#90b34d]/30 text-[#333] text-sm p-3 rounded-[12px]
                         focus:border-[#367d95] focus:outline-none placeholder:text-[#8a7d4d]/50"
            />
          </div>

          <div>
            <label className="text-[#367d95] text-[10px] tracking-[0.15em] uppercase font-bold block mb-1">
              X / Twitter Handle
            </label>
            <input
              type="text"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@handle"
              className="w-full bg-white border border-[#90b34d]/30 text-[#333] text-sm p-3 rounded-[12px]
                         focus:border-[#367d95] focus:outline-none placeholder:text-[#8a7d4d]/50"
            />
          </div>

          {error && <p className="text-[#c94d4d] text-[11px]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-[40px] text-white text-sm tracking-wider transition-all hover:scale-[1.01]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       shadow-[0_10px_30px_-10px_rgba(54,125,149,0.5)]"
            style={{
              fontWeight: 700,
              background:
                'linear-gradient(134.68deg, rgb(144,179,77) 28%, rgb(54,125,149) 77%, rgb(22,39,44) 100%)',
            }}
          >
            {loading ? <span className="animate-pulse">Saving...</span> : 'Generate My Card'}
          </button>
        </form>
      </div>
    </div>
  );
}

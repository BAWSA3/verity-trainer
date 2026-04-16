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
    if (!email || !trainerName) {
      setError('EMAIL AND TRAINER NAME REQUIRED');
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
          trainerName: trainerName.toUpperCase().slice(0, 12),
          trainerConfig: config,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'SIGNUP FAILED');
      }

      const { id } = await res.json();
      onSuccess(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SYSTEM ERROR');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="border-4 border-[#39FF14] bg-[#0a0a0a] p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-[#39FF14] text-sm font-mono">
            {'>'} REGISTER TRAINER
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-[#39FF14] font-mono text-xs"
          >
            [X]
          </button>
        </div>

        <p className="text-[#888] text-[10px] font-mono mb-6 leading-relaxed">
          ENTER YOUR DETAILS TO GENERATE YOUR<br />
          VERITY TRAINER CARD AND GET EARLY<br />
          ACCESS TO THE MARKETPLACE DROP.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[#39FF14] text-[9px] font-mono block mb-1">
              TRAINER NAME *
            </label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12))}
              placeholder="MAX 12 CHARS"
              maxLength={12}
              className="w-full bg-[#111] border-2 border-[#333] text-[#39FF14] font-mono text-xs p-2
                         focus:border-[#39FF14] focus:outline-none uppercase placeholder:text-[#333]"
            />
          </div>

          <div>
            <label className="text-[#39FF14] text-[9px] font-mono block mb-1">
              EMAIL *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR@EMAIL.COM"
              className="w-full bg-[#111] border-2 border-[#333] text-[#39FF14] font-mono text-xs p-2
                         focus:border-[#39FF14] focus:outline-none placeholder:text-[#333]"
            />
          </div>

          <div>
            <label className="text-[#39FF14] text-[9px] font-mono block mb-1">
              X / TWITTER HANDLE
            </label>
            <input
              type="text"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@HANDLE"
              className="w-full bg-[#111] border-2 border-[#333] text-[#39FF14] font-mono text-xs p-2
                         focus:border-[#39FF14] focus:outline-none placeholder:text-[#333]"
            />
          </div>

          {error && (
            <p className="text-[#FF006E] text-[9px] font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]
                       font-mono text-xs py-3 hover:bg-[#39FF14]/20
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="animate-pulse">SAVING...</span>
            ) : (
              '[ GENERATE MY CARD ]'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

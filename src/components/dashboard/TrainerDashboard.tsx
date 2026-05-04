'use client';

// TrainerDashboard V3.3 — chassis-free panel.
//
// Previous V2.1 wrapped everything in a Blender-rendered handheld console
// chassis. That chassis was dropped per product call; the value-first re-roll
// loop content (banner / stats / sprite / quote / footer) survives and now
// lives in a plain centered cream panel. Same flow, no gameboy aesthetic.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import { INITIAL_CONFIG, isReadyToGenerate } from '@/lib/trainer-options';
import { playGenerate } from '@/lib/sounds';
import SignupGate from '@/components/SignupGate';
import ConsoleScreen from './ConsoleScreen';

const INITIAL_PERSONALITY: TrainerPersonality = { zodiac: '', likes: [], dislikes: [] };

interface TrainerDashboardProps {
  initialConfig?: TrainerConfig;
  initialPersonality?: TrainerPersonality;
  aiContext?: { reasoning: string };
  onRegenerate?: () => void;
  initialHandle?: string;
}

export default function TrainerDashboard({
  initialConfig,
  initialPersonality,
  aiContext,
  onRegenerate,
  initialHandle,
}: TrainerDashboardProps = {}) {
  const router = useRouter();
  const [config, setConfig] = useState<TrainerConfig>(initialConfig ?? INITIAL_CONFIG);
  const [personality, setPersonality] = useState<TrainerPersonality>(initialPersonality ?? INITIAL_PERSONALITY);
  const [trainerName, setTrainerName] = useState<string>('');
  const [showSignup, setShowSignup] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (initialConfig) setConfig(initialConfig);
  }, [initialConfig]);
  useEffect(() => {
    if (initialPersonality) setPersonality(initialPersonality);
  }, [initialPersonality]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const canGenerate = isReadyToGenerate(config);

  function handleZodiacChange(z: Zodiac | '') {
    setPersonality((prev) => ({ ...prev, zodiac: z }));
  }
  function handleGenerate() {
    if (!canGenerate) return;
    playGenerate();
    setShowSignup(true);
  }
  function handleSignupSuccess(id: string) {
    router.push('/card/' + id);
  }

  const missingLabels = useMemo(() => {
    const out: string[] = [];
    if (!config.body)      out.push('skin');
    if (!config.hair)      out.push('hair');
    if (!config.hairColor) out.push('hair color');
    if (!config.outfit)    out.push('outfit');
    return out;
  }, [config]);

  return (
    <div
      className="dashboard-shell"
      style={{
        opacity: mounted ? 1 : 0,
        transition: 'opacity 320ms ease-out',
      }}
    >
      <div className="dashboard-panel">
        <ConsoleScreen
          config={config}
          personality={personality}
          trainerName={trainerName}
          canGenerate={canGenerate}
          missingLabels={missingLabels}
          hasAi={!!aiContext}
          onNameChange={setTrainerName}
          onZodiacChange={handleZodiacChange}
          onGenerate={handleGenerate}
          onRegenerate={onRegenerate}
        />
      </div>

      {showSignup && (
        <SignupGate
          config={config}
          personality={personality}
          onSuccess={handleSignupSuccess}
          onClose={() => setShowSignup(false)}
          initialHandle={initialHandle}
          reasoning={aiContext?.reasoning}
        />
      )}

      <style jsx>{`
        .dashboard-shell {
          position: relative;
          min-height: 100vh;
          padding: 24px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--brand-bg, #FFFDF3);
        }
        /* Centered cream card. Width adapts: comfortable reading width on
           desktop, edge-bleed on phones. No fixed aspect ratio anymore — let
           content drive the height. */
        .dashboard-panel {
          width: 100%;
          max-width: 560px;
          background: #FFFDF3;
          border: 1px solid rgba(22, 39, 44, 0.10);
          border-radius: 18px;
          box-shadow:
            0 24px 48px -16px rgba(22, 39, 44, 0.12),
            0 4px 8px -2px rgba(22, 39, 44, 0.06);
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

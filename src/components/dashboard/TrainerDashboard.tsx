'use client';

// TrainerDashboard V2.1 — single-screen console architecture.
//
// The chassis is a Blender PNG; all interaction lives inside the screen
// recess (ConsoleScreen). Same metaphor on desktop and mobile — Console fills
// the available space, Re-roll/Claim are sticky inside the screen footer,
// music is a header toggle, AI reasoning persists onto the share card.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import { INITIAL_CONFIG, isReadyToGenerate } from '@/lib/trainer-options';
import { playGenerate, playSelect } from '@/lib/sounds';
import type { TabKey } from '@/components/CategoryTabs';
import SignupGate from '@/components/SignupGate';
import Console from '@/components/device/Console';
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
  const [activeTab, setActiveTab] = useState<TabKey>('body');
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

  function handleConfigChange(next: TrainerConfig) {
    playSelect();
    setConfig(next);
  }
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
  function toggleShownLike(i: number) {
    setPersonality((prev) => {
      const current = prev.shownLikes ?? prev.likes.map(() => true);
      const next = current.slice();
      next[i] = !next[i];
      return { ...prev, shownLikes: next };
    });
  }
  function toggleShownDislike(i: number) {
    setPersonality((prev) => {
      const current = prev.shownDislikes ?? prev.dislikes.map(() => true);
      const next = current.slice();
      next[i] = !next[i];
      return { ...prev, shownDislikes: next };
    });
  }

  const missingLabels = useMemo(() => {
    const out: string[] = [];
    if (!config.body)      out.push('skin');
    if (!config.hair)      out.push('hair');
    if (!config.hairColor) out.push('hair color');
    if (!config.outfit)    out.push('outfit');
    return out;
  }, [config]);

  const shownLikes =
    personality.shownLikes && personality.shownLikes.length === personality.likes.length
      ? personality.shownLikes
      : personality.likes.map(() => true);
  const shownDislikes =
    personality.shownDislikes && personality.shownDislikes.length === personality.dislikes.length
      ? personality.shownDislikes
      : personality.dislikes.map(() => true);

  return (
    <div
      className="dashboard-shell"
      style={{
        opacity: mounted ? 1 : 0,
        transition: 'opacity 320ms ease-out',
      }}
    >
      <div className="dashboard-stage">
        <Console className="dashboard-console">
          <ConsoleScreen
            config={config}
            personality={personality}
            trainerName={trainerName}
            activeTab={activeTab}
            shownLikes={shownLikes}
            shownDislikes={shownDislikes}
            canGenerate={canGenerate}
            missingLabels={missingLabels}
            hasAi={!!aiContext}
            onConfigChange={handleConfigChange}
            onPersonalityChange={setPersonality}
            onTabChange={setActiveTab}
            onNameChange={setTrainerName}
            onZodiacChange={handleZodiacChange}
            onToggleShownLike={toggleShownLike}
            onToggleShownDislike={toggleShownDislike}
            onGenerate={handleGenerate}
            onRegenerate={onRegenerate}
          />
        </Console>
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
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255, 246, 240, 0.7) 0%, transparent 70%),
            radial-gradient(ellipse 80% 60% at 50% 90%, rgba(67, 56, 202, 0.10) 0%, transparent 70%),
            linear-gradient(180deg, #FFE6E6 0%, #F4D2FF 45%, #C2DDFF 100%);
        }
        .dashboard-stage {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* Aspect-ratio drives width from height — never set both height AND
           max-width, that breaks the aspect and letterboxes the chassis IMG
           inside the shell. */
        .dashboard-stage :global(.dashboard-console) {
          height: calc(100vh - 24px);
          width: auto;
          aspect-ratio: 1080 / 1680;
        }
        /* On very narrow viewports the height-driven width may exceed the
           viewport width — clamp by sizing from width instead. */
        @media (max-aspect-ratio: 1080/1680) {
          .dashboard-stage :global(.dashboard-console) {
            height: auto;
            width: calc(100vw - 24px);
          }
        }
      `}</style>
    </div>
  );
}

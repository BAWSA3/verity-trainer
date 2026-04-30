'use client';

// TrainerDashboard — orchestrates the multi-window layout.
//
// Owns the source of truth for trainer config + personality + customizer state.
// Children windows are dumb — they receive props slices and emit changes back.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import { INITIAL_CONFIG, isReadyToGenerate } from '@/lib/trainer-options';
import { playGenerate, playSelect } from '@/lib/sounds';
import type { TabKey } from '@/components/CategoryTabs';
import SignupGate from '@/components/SignupGate';
import PokeBackground from '@/components/PokeBackground';
import {
  FullBodyWindow,
  HeadshotWindow,
  IdentityWindow,
  LikesWindow,
  DislikesWindow,
} from './DashboardWindows';
import CustomizerWindow from './CustomizerWindow';
import SceneWindow from './SceneWindow';
import MusicPlayerWindow from './MusicPlayerWindow';

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

  // Sync AI-provided initial values when they change (e.g. after re-roll).
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
    router.push(`/card/${id}`);
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
      className="min-h-screen bg-[#fffdf3] text-[#16272c] relative"
      style={{
        fontFamily: 'var(--font-sora), sans-serif',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 320ms ease-out',
      }}
    >
      <PokeBackground />

      <div className="relative z-10 w-full px-3 sm:px-5 py-3 sm:py-4">
        <div className="dashboard-shell">
          {/* Col 1 — full-body sprite (anchor) */}
          <div className="dashboard-col col-fullbody">
            <FullBodyWindow config={config} />
          </div>

          {/* Col 2 — music + scene stack */}
          <div className="dashboard-col col-stack">
            <MusicPlayerWindow config={config} />
            <SceneWindow config={config} />
          </div>

          {/* Col 3 — headshot + identity + likes + dislikes stack */}
          <div className="dashboard-col col-stack">
            <HeadshotWindow config={config} />
            <IdentityWindow
              config={config}
              personality={personality}
              trainerName={trainerName}
              onNameChange={setTrainerName}
              onZodiacChange={handleZodiacChange}
            />
            <LikesWindow items={personality.likes} />
            <DislikesWindow items={personality.dislikes} />
          </div>

          {/* Col 4 — customizer (sticky-tall, internal scroll) */}
          <div className="dashboard-col col-customizer">
            <CustomizerWindow
              config={config}
              personality={personality}
              onConfigChange={handleConfigChange}
              onPersonalityChange={setPersonality}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              canGenerate={canGenerate}
              missingLabels={missingLabels}
              onGenerate={handleGenerate}
              aiContext={aiContext}
              onRegenerate={onRegenerate}
            />
          </div>
        </div>
      </div>

      {showSignup && (
        <SignupGate
          config={config}
          personality={personality}
          onSuccess={handleSignupSuccess}
          onClose={() => setShowSignup(false)}
          initialHandle={initialHandle}
        />
      )}

      <style jsx>{`
        /* Mobile / tablet (<1440px): single-column stack. */
        .dashboard-shell {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dashboard-col { display: flex; flex-direction: column; gap: 12px; }

        /* Desktop ≥1440px: 4-column fixed-view dashboard. All panels visible,
           page-level no-scroll. Customizer scrolls internally if too tall. */
        @media (min-width: 1440px) {
          .dashboard-shell {
            display: grid;
            grid-template-columns:
              minmax(280px, 1fr)
              minmax(280px, 1fr)
              minmax(280px, 1fr)
              minmax(380px, 480px);
            gap: 14px;
            height: calc(100vh - 28px);
            min-height: 0;
          }
          .dashboard-col {
            min-height: 0;
            gap: 12px;
          }
          .col-stack { /* music+scene OR headshot+identity+likes+dislikes */
            display: flex;
            flex-direction: column;
          }
          .col-customizer {
            min-height: 0;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}

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

      <div className="relative z-10 max-w-[1200px] mx-auto px-3 sm:px-5 py-4 sm:py-6">
        <div className="dashboard-grid">
          <div className="grid-fullbody">
            <FullBodyWindow config={config} />
          </div>
          <div className="grid-music">
            <MusicPlayerWindow config={config} />
          </div>
          <div className="grid-headshot">
            <HeadshotWindow config={config} />
          </div>
          <div className="grid-scene">
            <SceneWindow config={config} />
          </div>
          <div className="grid-identity">
            <IdentityWindow
              config={config}
              personality={personality}
              trainerName={trainerName}
              onNameChange={setTrainerName}
              onZodiacChange={handleZodiacChange}
            />
          </div>
          <div className="grid-likes-dislikes">
            <div className="flex flex-col sm:flex-row gap-3 h-full">
              <div className="flex-1"><LikesWindow items={personality.likes} /></div>
              <div className="flex-1"><DislikesWindow items={personality.dislikes} /></div>
            </div>
          </div>
          <div className="grid-customizer">
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
        .dashboard-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr;
          grid-template-areas:
            "fullbody"
            "headshot"
            "music"
            "identity"
            "likes-dislikes"
            "scene"
            "customizer";
        }
        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 320px 1fr 320px;
            grid-template-areas:
              "fullbody music    headshot"
              "fullbody scene    identity"
              "fullbody scene    likes-dislikes"
              "customizer customizer customizer";
          }
        }
        .grid-fullbody       { grid-area: fullbody; }
        .grid-music          { grid-area: music; }
        .grid-headshot       { grid-area: headshot; }
        .grid-scene          { grid-area: scene; }
        .grid-identity       { grid-area: identity; }
        .grid-likes-dislikes { grid-area: likes-dislikes; }
        .grid-customizer     { grid-area: customizer; }
      `}</style>
    </div>
  );
}

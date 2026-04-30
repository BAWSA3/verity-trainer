'use client';

// SceneWindow — renders an interior scene with the trainer composited on top.
// Scenes are imported from Modern Interiors 6_Home_Designs/<category>/48x48/
// via scripts/import-limezu-scenes.mjs. Manifest at
// public/sprites/limezu/scenes/manifest.json lists available scene IDs.
//
// V1 ships with a small set of scenes; user can cycle via the ↺ button.

import { useEffect, useState } from 'react';
import type { TrainerConfig } from '@/types/trainer';
import TrainerSprite from '@/components/TrainerSprite';
import PixelWindow from './PixelWindow';

interface SceneEntry {
  id: string;
  label: string;
  file: string;
  /** Where to anchor the trainer sprite within the scene, in % of scene size. */
  trainerX?: number; // default 50
  trainerY?: number; // default 70
}

interface SceneManifest {
  scenes: SceneEntry[];
}

// Inlined fallback so the window renders even before the manifest exists.
const FALLBACK_SCENES: SceneEntry[] = [
  { id: 'gradient', label: 'Vibe', file: '', trainerX: 50, trainerY: 70 },
];

interface Props {
  config: TrainerConfig;
}

export default function SceneWindow({ config }: Props) {
  const [scenes, setScenes] = useState<SceneEntry[]>(FALLBACK_SCENES);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/sprites/limezu/scenes/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SceneManifest | null) => {
        if (cancelled || !data?.scenes?.length) return;
        setScenes(data.scenes);
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const scene = scenes[idx % scenes.length];
  const cycle = () => setIdx((i) => (i + 1) % scenes.length);

  return (
    <PixelWindow title={`LOCATION · ${scene.label}`} accent="olive" bg="cream" bodyPad="none" fill>
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          minHeight: 220,
          background: scene.file
            ? '#16272c'
            : 'linear-gradient(180deg, #fffdf3 0%, #f5f1d6 45%, #b9d27d 90%, #90b34d 100%)',
        }}
      >
        {scene.file && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scene.file}
            alt={scene.label}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        {/* Trainer composited on top, anchored at trainerX/Y%. The sprite is
            48x96 portrait; we scale to ~30% of scene height. */}
        <div
          className="absolute"
          style={{
            left: `${scene.trainerX ?? 50}%`,
            top: `${scene.trainerY ?? 70}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <TrainerSprite config={config} size={72} />
        </div>

        {/* Cycle button */}
        {scenes.length > 1 && (
          <button
            type="button"
            onClick={cycle}
            aria-label="Next scene"
            className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center bg-[#fffdf3]/90 border-2 border-[#16272c] rounded-[2px] text-[#16272c] text-[12px] hover:bg-[#90b34d]/40 transition-colors"
            style={{ fontFamily: 'var(--font-loos), sans-serif' }}
          >
            ↺
          </button>
        )}
      </div>
    </PixelWindow>
  );
}

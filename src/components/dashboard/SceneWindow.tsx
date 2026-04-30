'use client';

// SceneWindow — renders an interior scene with the trainer composited on top.
// Scenes are imported from Modern Interiors 6_Home_Designs/<category>/48x48/
// via scripts/import-limezu-scenes.mjs. Manifest at
// public/sprites/limezu/scenes/manifest.json lists available scene IDs.
//
// Tier-2 WASD: the trainer is positioned via state and can be moved with
// W/A/S/D (or arrow keys) on desktop, or a virtual D-pad on mobile/touch.
// Direction state drives which TrainerSprite directional sprite renders
// (-s south, -e east, -w west, -n north).

import { useEffect, useRef, useState } from 'react';
import type { Direction, TrainerConfig } from '@/types/trainer';
import TrainerSprite from '@/components/TrainerSprite';
import PixelWindow from './PixelWindow';

interface SceneEntry {
  id: string;
  label: string;
  file: string;
  /** Default trainer anchor on scene change, in % of scene size. */
  trainerX?: number; // default 50
  trainerY?: number; // default 70
}

interface SceneManifest {
  scenes: SceneEntry[];
}

const FALLBACK_SCENES: SceneEntry[] = [
  { id: 'gradient', label: 'Vibe', file: '', trainerX: 50, trainerY: 70 },
];

// Movement speed in % per frame (60fps). 0.55 → ~33% per second → ~3s to
// traverse the full scene width. Feels game-y without being twitchy.
const SPEED = 0.55;
const MIN_X = 6;
const MAX_X = 94;
const MIN_Y = 18;
const MAX_Y = 96;

type DirKey = 'w' | 'a' | 's' | 'd';

const KEY_MAP: Record<string, DirKey> = {
  w: 'w', a: 'a', s: 's', d: 'd',
  arrowup: 'w', arrowleft: 'a', arrowdown: 's', arrowright: 'd',
};

interface Props {
  config: TrainerConfig;
}

export default function SceneWindow({ config }: Props) {
  const [scenes, setScenes] = useState<SceneEntry[]>(FALLBACK_SCENES);
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 50, y: 70 });
  const [dir, setDir] = useState<Direction>('s');
  const heldKeys = useRef<Set<DirKey>>(new Set());

  // Load manifest once on mount.
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

  // Reset trainer position whenever the scene changes (cycle button or initial load).
  useEffect(() => {
    setPos({ x: scene.trainerX ?? 50, y: scene.trainerY ?? 70 });
    setDir('s');
  }, [idx, scene.trainerX, scene.trainerY]);

  const cycle = () => setIdx((i) => (i + 1) % scenes.length);

  // Keyboard listeners — global, but ignore when an input/textarea/select is focused
  // so typing in the trainer-name field doesn't drive the avatar around.
  useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!t || !(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
    }
    function onDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const key = KEY_MAP[e.key.toLowerCase()];
      if (!key) return;
      e.preventDefault();
      heldKeys.current.add(key);
    }
    function onUp(e: KeyboardEvent) {
      const key = KEY_MAP[e.key.toLowerCase()];
      if (!key) return;
      heldKeys.current.delete(key);
    }
    function onBlur() { heldKeys.current.clear(); }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // requestAnimationFrame loop — moves the trainer when keys are held.
  useEffect(() => {
    let rafId = 0;
    function tick() {
      rafId = requestAnimationFrame(tick);
      const held = heldKeys.current;
      if (held.size === 0) return;
      let dx = 0;
      let dy = 0;
      let nextDir: Direction | null = null;
      if (held.has('w')) { dy -= SPEED; nextDir = 'n'; }
      if (held.has('s')) { dy += SPEED; nextDir = 's'; }
      if (held.has('a')) { dx -= SPEED; nextDir = 'w'; }
      if (held.has('d')) { dx += SPEED; nextDir = 'e'; }
      if (dx === 0 && dy === 0) return;
      setPos((p) => ({
        x: clamp(p.x + dx, MIN_X, MAX_X),
        y: clamp(p.y + dy, MIN_Y, MAX_Y),
      }));
      if (nextDir) setDir((d) => (d !== nextDir ? nextDir! : d));
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // D-pad press handlers — touch + mouse. Adds key to held set on press,
  // removes on release/leave so movement is continuous while held.
  function bindDpad(key: DirKey) {
    const press = (e: React.SyntheticEvent) => {
      e.preventDefault();
      heldKeys.current.add(key);
    };
    const release = () => { heldKeys.current.delete(key); };
    return {
      onPointerDown: press,
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
      onTouchStart: press,
      onTouchEnd: release,
    };
  }

  return (
    <PixelWindow title={`LOCATION · ${scene.label}`} accent="olive" bg="cream" bodyPad="none" fill>
      <div
        className="relative w-full h-full overflow-hidden select-none"
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
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        )}

        {/* Trainer composited on top, anchored at pos.x/y% (feet-anchored). */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -100%)',
            transition: 'left 60ms linear, top 60ms linear',
          }}
        >
          <TrainerSprite config={config} size={72} direction={dir} />
        </div>

        {/* WASD hint badge (desktop only, hidden on small screens) */}
        <div
          className="hidden lg:flex absolute top-2 left-2 gap-1 items-center px-2 py-1 bg-[#fffdf3]/85 border border-[#16272c] rounded-[2px] pointer-events-none"
          style={{ fontFamily: 'var(--font-loos), sans-serif' }}
        >
          <span className="text-[8px] tracking-[0.18em] uppercase text-[#16272c] font-bold">
            WASD
          </span>
        </div>

        {/* Virtual D-pad — visible on touch/small screens (always rendered, but
            cleaner UX on mobile where there's no keyboard). */}
        <div
          className="absolute bottom-2 left-2 lg:hidden grid grid-cols-3 gap-[2px] pointer-events-auto"
          aria-label="Movement controls"
        >
          <div />
          <DpadBtn label="↑" {...bindDpad('w')} />
          <div />
          <DpadBtn label="←" {...bindDpad('a')} />
          <div className="w-7 h-7" />
          <DpadBtn label="→" {...bindDpad('d')} />
          <div />
          <DpadBtn label="↓" {...bindDpad('s')} />
          <div />
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

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

interface DpadBtnProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string;
}

function DpadBtn({ label, ...handlers }: DpadBtnProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center bg-[#fffdf3]/90 border-2 border-[#16272c] rounded-[2px] text-[#16272c] text-[12px] active:bg-[#90b34d]/60 transition-colors touch-none"
      style={{ fontFamily: 'var(--font-loos), sans-serif' }}
      {...handlers}
    >
      {label}
    </button>
  );
}

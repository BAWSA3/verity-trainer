'use client';

// ConsolePressState — the chassis PNG is static, so press-states are CSS
// overlay layers absolutely positioned over each control. When an action
// fires (Claim, Re-roll, music toggle, tab switch) the corresponding marker
// pulses for ~180ms.
//
// Mappings:
//   A button (large coral)  ←→ Claim Trainer
//   B button (small coral)  ←→ Re-roll
//   X button (large azure)  ←→ Music toggle
//   Y button (small azure)  ←→ tab change confirmation
//   D-pad L/R               ←→ tab cycling
//   LEDs                    ←→ status indicators (green = render, coral = AI gen, azure = audio)

import { createContext, useCallback, useContext, useRef, useState } from 'react';

export type PressKey =
  | 'btnA'
  | 'btnB'
  | 'btnX'
  | 'btnY'
  | 'dpadL'
  | 'dpadR'
  | 'dpadU'
  | 'dpadD'
  | 'ledGreen'
  | 'ledCoral'
  | 'ledAzure';

interface PressStateValue {
  pressed: Record<PressKey, boolean>;
  pulse: (key: PressKey, durationMs?: number) => void;
}

const PressStateContext = createContext<PressStateValue | null>(null);

const ALL_KEYS: PressKey[] = [
  'btnA', 'btnB', 'btnX', 'btnY',
  'dpadL', 'dpadR', 'dpadU', 'dpadD',
  'ledGreen', 'ledCoral', 'ledAzure',
];

function emptyPressed(): Record<PressKey, boolean> {
  return ALL_KEYS.reduce((acc, k) => {
    acc[k] = false;
    return acc;
  }, {} as Record<PressKey, boolean>);
}

export function ConsolePressStateProvider({ children }: { children: React.ReactNode }) {
  const [pressed, setPressed] = useState<Record<PressKey, boolean>>(emptyPressed);
  const timers = useRef<Partial<Record<PressKey, ReturnType<typeof setTimeout>>>>({});

  const pulse = useCallback((key: PressKey, durationMs = 180) => {
    if (timers.current[key]) clearTimeout(timers.current[key]!);
    setPressed((prev) => ({ ...prev, [key]: true }));
    timers.current[key] = setTimeout(() => {
      setPressed((prev) => ({ ...prev, [key]: false }));
    }, durationMs);
  }, []);

  return (
    <PressStateContext.Provider value={{ pressed, pulse }}>
      {children}
    </PressStateContext.Provider>
  );
}

export function usePressState(): PressStateValue {
  const ctx = useContext(PressStateContext);
  if (!ctx) {
    // Graceful no-op so components can call pulse() without checking
    // whether they're inside a provider (e.g. during tests).
    return { pressed: emptyPressed(), pulse: () => {} };
  }
  return ctx;
}

// Position of each marker as a percentage of the chassis PNG bounds.
// Derived from the Blender model coordinates that built /console/console-front.png:
//   d-pad:    DPAD_X=-2.8, DPAD_Z=-4.6 in a 10x15.6 cm chassis (centered)
//   buttons:  ACT_X=2.8, ACT_Z=-4.6, offsets ±0.70 cm
//   LEDs:     LED_Z=-3.55, X = -0.5, 0, +0.5
// Conversion: x_pct = (x + 5)/10 * 100, y_pct = (7.8 - z)/15.6 * 100
const MARKER_POSITIONS: Record<
  PressKey,
  { left: string; top: string; width: string; height: string; color: string; shape: 'circle' | 'pill' }
> = {
  btnA:     { left: '85%',  top: '75%',  width: '9%',  height: '6%',  color: '#FF6B5C', shape: 'circle' },
  btnB:     { left: '85%',  top: '84%',  width: '7%',  height: '4.5%', color: '#FF6B5C', shape: 'circle' },
  btnX:     { left: '71%',  top: '75%',  width: '9%',  height: '6%',  color: '#5AA0BC', shape: 'circle' },
  btnY:     { left: '71%',  top: '84%',  width: '7%',  height: '4.5%', color: '#5AA0BC', shape: 'circle' },
  dpadL:    { left: '13%',  top: '79.5%', width: '6%',  height: '3.5%', color: '#90B34D', shape: 'pill' },
  dpadR:    { left: '31%',  top: '79.5%', width: '6%',  height: '3.5%', color: '#90B34D', shape: 'pill' },
  dpadU:    { left: '22%',  top: '74%',  width: '4%',  height: '5%',   color: '#90B34D', shape: 'pill' },
  dpadD:    { left: '22%',  top: '85%',  width: '4%',  height: '5%',   color: '#90B34D', shape: 'pill' },
  ledGreen: { left: '45%',  top: '73%',  width: '3%',  height: '1.6%', color: '#90B34D', shape: 'circle' },
  ledCoral: { left: '50%',  top: '73%',  width: '3%',  height: '1.6%', color: '#FF6B5C', shape: 'circle' },
  ledAzure: { left: '55%',  top: '73%',  width: '3%',  height: '1.6%', color: '#5AA0BC', shape: 'circle' },
};

export function ConsolePressStateLayer() {
  const { pressed } = usePressState();
  return (
    <div className="press-state-layer" aria-hidden>
      {ALL_KEYS.map((key) => {
        const pos = MARKER_POSITIONS[key];
        const isPressed = pressed[key];
        return (
          <span
            key={key}
            className={`press-marker ${isPressed ? 'is-pressed' : ''}`}
            data-shape={pos.shape}
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              ['--marker-color' as string]: pos.color,
            }}
          />
        );
      })}
      <style jsx>{`
        .press-state-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }
        .press-marker {
          position: absolute;
          opacity: 0;
          background: radial-gradient(
            circle,
            color-mix(in oklab, var(--marker-color) 70%, transparent) 0%,
            transparent 70%
          );
          transition: opacity 60ms ease-out;
          transform: translate(-50%, -50%);
        }
        .press-marker[data-shape='circle'] {
          border-radius: 50%;
        }
        .press-marker[data-shape='pill'] {
          border-radius: 6px;
        }
        .press-marker.is-pressed {
          opacity: 1;
          animation: press-pulse 220ms ease-out;
        }
        @keyframes press-pulse {
          0%   { opacity: 0;   transform: translate(-50%, -50%) scale(0.6); }
          35%  { opacity: 1;   transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(1.4); }
        }
      `}</style>
    </div>
  );
}

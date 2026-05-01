'use client';

// Console — vertical Verity handheld chassis wrapper.
//
// The chassis is a Blender-rendered PNG at /console/console-front.png. Children
// render inside the screen cutout. Press-state markers (A/B/X/Y, D-pad, LEDs)
// layer above the chassis and pulse when actions fire.

import * as React from 'react';
import { ConsolePressStateProvider, ConsolePressStateLayer } from './ConsolePressState';

interface ConsoleProps {
  /** Content rendered inside the screen cutout */
  children: React.ReactNode;
  /** Class for the outer wrapper (lets the parent set width/positioning) */
  className?: string;
}

// Screen cutout coordinates as % of chassis PNG bounds (1080x1680).
// Measured precisely from /console/console-front.png:
//   bezel outer: x=113-966, y=214-1150 (bezel thickness ~28px)
//   screen interior: x=141-938, y=242-1122
const SCREEN_RECT = {
  left: '13.1%',
  top: '14.4%',
  width: '73.8%',
  height: '52.4%',
};

export default function Console({ children, className = '' }: ConsoleProps) {
  return (
    <ConsolePressStateProvider>
      <div className={'console-shell ' + className} role="presentation">
        <img
          src="/console/console-front.png"
          alt=""
          className="chassis-backdrop"
          aria-hidden
          draggable={false}
        />

        <ConsolePressStateLayer />

        <div
          className="console-screen"
          style={{
            left: SCREEN_RECT.left,
            top: SCREEN_RECT.top,
            width: SCREEN_RECT.width,
            height: SCREEN_RECT.height,
          }}
        >
          <div className="console-screen-inner">{children}</div>
        </div>

        <style jsx>{`
          .console-shell {
            position: relative;
            aspect-ratio: 1080 / 1680;
            margin: 0 auto;
            isolation: isolate;
          }
          /* Soft floor pool under the chassis — gives it a place to sit. */
          .console-shell::before {
            content: '';
            position: absolute;
            left: -8%;
            right: -8%;
            bottom: -3%;
            height: 18%;
            background: radial-gradient(ellipse at 50% 100%,
              rgba(67, 56, 202, 0.22) 0%,
              rgba(67, 56, 202, 0.10) 30%,
              transparent 70%);
            filter: blur(20px);
            pointer-events: none;
            z-index: 0;
          }
          .chassis-backdrop {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            pointer-events: none;
            user-select: none;
            z-index: 1;
            filter:
              drop-shadow(0 24px 32px rgba(67, 56, 202, 0.28))
              drop-shadow(0 8px 12px rgba(22, 39, 44, 0.18))
              drop-shadow(0 -2px 8px rgba(255, 215, 200, 0.18));
          }
          .console-screen {
            position: absolute;
            z-index: 3;
            display: flex;
            overflow: hidden;
          }
          .console-screen-inner {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 4px;
            overflow: hidden;
            /* Slightly tinted overlay to give the screen interior a subtle
               LCD-glass feel; the chassis PNG already has the cream surface. */
            background: rgba(255, 253, 243, 0.92);
            color: var(--ink);
          }
        `}</style>
      </div>
    </ConsolePressStateProvider>
  );
}

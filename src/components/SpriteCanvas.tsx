'use client';

import { useRef, useEffect, useCallback } from 'react';
import { TrainerConfig } from '@/types/trainer';
import {
  BODY_OPTIONS,
  HAIR_OPTIONS,
  TOP_OPTIONS,
  BOTTOM_OPTIONS,
  ACCESSORY_OPTIONS,
  USE_PNG_SPRITES,
} from '@/lib/trainer-options';

const GRID_SIZE = 32;

interface SpriteCanvasProps {
  config: TrainerConfig;
  size?: number;
}

function drawPixelLayer(ctx: CanvasRenderingContext2D, pixels: string[][], pixelSize: number) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const color = pixels[y]?.[x];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function SpriteCanvas({ config, size = 256 }: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelSize = size / GRID_SIZE;

  // Blank-start state: gender or body not picked yet → render silhouette.
  // Sprites need both to know which body/head PNG to load, so anything
  // less than both leaves the preview meaningless.
  const isBlank = !config.gender || !config.body;

  const drawPNG = useCallback(async (ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);

    // PNG layer paths — z-order is head-to-toe + sensible layering.
    // Gender-aware for body/head/tops/neck; others are universal.
    // During progressive selection, some required slots may still be empty —
    // skip those paths rather than 404 them.
    const g = (config.gender || 'male') as 'male' | 'female';
    const layers = [
      config.body ? `/sprites/body/${g}/${config.body}.png` : null,
      config.body ? `/sprites/head/${g}/${config.body}.png` : null,
      // Facial hair only renders for male characters (no female sprite in LPC)
      g === 'male' && config.facialHair && config.facialHair !== 'none'
        ? `/sprites/facial-hair/${config.facialHair}.png`
        : null,
      config.bottom ? `/sprites/bottoms/${config.bottom}.png` : null,
      config.shoes && config.shoes !== 'none' ? `/sprites/shoes/${config.shoes}.png` : null,
      config.top ? `/sprites/tops/${g}/${config.top}.png` : null,
      config.neck && config.neck !== 'none' ? `/sprites/neck/${g}/${config.neck}.png` : null,
      config.hair && config.hairColor
        ? `/sprites/hair/${config.hairColor}/${config.hair}.png`
        : null,
      config.face && config.face !== 'none' ? `/sprites/face/${config.face}.png` : null,
      config.accessory !== 'none' ? `/sprites/accessories/${config.accessory}.png` : null,
    ].filter(Boolean) as string[];

    for (const src of layers) {
      try {
        const img = await loadImage(src);
        ctx.drawImage(img, 0, 0, size, size);
      } catch {
        // PNG not found — skip this layer silently
      }
    }
  }, [config, size]);

  const drawPixels = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);

    const body = BODY_OPTIONS.find(o => o.id === config.body);
    if (body) drawPixelLayer(ctx, body.pixels, pixelSize);

    const bottom = BOTTOM_OPTIONS.find(o => o.id === config.bottom);
    if (bottom) drawPixelLayer(ctx, bottom.pixels, pixelSize);

    const top = TOP_OPTIONS.find(o => o.id === config.top);
    if (top) drawPixelLayer(ctx, top.pixels, pixelSize);

    const hair = HAIR_OPTIONS.find(o => o.id === config.hair);
    if (hair) drawPixelLayer(ctx, hair.pixels, pixelSize);

    const accessory = ACCESSORY_OPTIONS.find(o => o.id === config.accessory);
    if (accessory) drawPixelLayer(ctx, accessory.pixels, pixelSize);
  }, [config, size, pixelSize]);

  useEffect(() => {
    if (isBlank) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (USE_PNG_SPRITES) {
      drawPNG(ctx);
    } else {
      drawPixels(ctx);
    }
  }, [drawPNG, drawPixels, isBlank]);

  // Silhouette placeholder — soft teal figure on cream bg.
  // Communicates "your trainer will appear here" without showing a naked body.
  if (isBlank) {
    return (
      <div
        className="flex items-center justify-center rounded-[8px] bg-[#fffdf3] border-2 border-[#90b34d]/25"
        style={{ width: size, height: size, imageRendering: 'pixelated' }}
        aria-label="Trainer silhouette — pick gender and skin to begin"
      >
        <svg
          viewBox="0 0 32 32"
          width={size * 0.85}
          height={size * 0.85}
          shapeRendering="crispEdges"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Pixel silhouette — generic humanoid trainer outline */}
          {/* Head */}
          <rect x="12" y="5"  width="8" height="1" fill="#367d95" opacity="0.4" />
          <rect x="11" y="6"  width="10" height="1" fill="#367d95" opacity="0.45" />
          <rect x="11" y="7"  width="10" height="1" fill="#367d95" opacity="0.5" />
          <rect x="11" y="8"  width="10" height="1" fill="#367d95" opacity="0.5" />
          <rect x="11" y="9"  width="10" height="1" fill="#367d95" opacity="0.5" />
          <rect x="12" y="10" width="8"  height="1" fill="#367d95" opacity="0.45" />
          {/* Neck */}
          <rect x="14" y="11" width="4"  height="1" fill="#367d95" opacity="0.4" />
          {/* Torso */}
          <rect x="10" y="12" width="12" height="1" fill="#367d95" opacity="0.5" />
          <rect x="9"  y="13" width="14" height="1" fill="#367d95" opacity="0.55" />
          <rect x="9"  y="14" width="14" height="1" fill="#367d95" opacity="0.55" />
          <rect x="9"  y="15" width="14" height="1" fill="#367d95" opacity="0.55" />
          <rect x="10" y="16" width="12" height="1" fill="#367d95" opacity="0.5" />
          <rect x="10" y="17" width="12" height="1" fill="#367d95" opacity="0.5" />
          <rect x="10" y="18" width="12" height="1" fill="#367d95" opacity="0.5" />
          {/* Arms */}
          <rect x="7"  y="13" width="2"  height="5" fill="#367d95" opacity="0.4" />
          <rect x="23" y="13" width="2"  height="5" fill="#367d95" opacity="0.4" />
          {/* Legs */}
          <rect x="11" y="19" width="4"  height="1" fill="#367d95" opacity="0.5" />
          <rect x="17" y="19" width="4"  height="1" fill="#367d95" opacity="0.5" />
          <rect x="11" y="20" width="3"  height="5" fill="#367d95" opacity="0.45" />
          <rect x="18" y="20" width="3"  height="5" fill="#367d95" opacity="0.45" />
          {/* Feet */}
          <rect x="10" y="25" width="5"  height="1" fill="#367d95" opacity="0.35" />
          <rect x="17" y="25" width="5"  height="1" fill="#367d95" opacity="0.35" />
        </svg>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-[8px] bg-[#fffdf3]"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

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

  const drawPNG = useCallback(async (ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);

    // PNG layer paths (gender-aware for body/head/tops; bottoms/hair/acc are universal)
    const g = config.gender ?? 'male';
    const layers = [
      `/sprites/body/${g}/${config.body}.png`,
      `/sprites/head/${g}/${config.body}.png`,
      `/sprites/bottoms/${config.bottom}.png`,
      `/sprites/tops/${g}/${config.top}.png`,
      `/sprites/hair/${config.hair}.png`,
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (USE_PNG_SPRITES) {
      drawPNG(ctx);
    } else {
      drawPixels(ctx);
    }
  }, [drawPNG, drawPixels]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="border-4 border-[#39FF14] bg-[#0a0a0a]"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

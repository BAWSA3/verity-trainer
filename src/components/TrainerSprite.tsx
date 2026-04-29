'use client';

import { useMemo } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import {
  bodyPath, hairPath, topPath, bottomPath, shoesPath,
  outerwearPath, hatPath, glassesPath, expressionPath,
  SPRITE_DIMS,
} from '@/lib/trainer-options';

interface Props {
  config: TrainerConfig;
  personality?: TrainerPersonality; // unused for V1 sprite render; accepted for V2 forward-compat
  size: number;                     // CSS px width
  crop?: 'bust';                    // when 'bust', clips to the manifest bustCrop region
  className?: string;
}

interface Layer {
  key: string;
  src: string;
}

function gender(config: TrainerConfig): 'm' | 'f' | null {
  return config.gender === 'm' || config.gender === 'f' ? config.gender : null;
}

// Layer order — confirm against pack on Day 1. If pack has split front/back hair,
// the renderer can interleave; for V1 we treat hair as a single layer above expression.
function buildLayers(config: TrainerConfig): Layer[] {
  const g = gender(config);
  const layers: Layer[] = [];

  if (g && config.body)                                 layers.push({ key: 'body',   src: bodyPath(g, config.body) });
  if (g && config.bottom && config.bottom !== 'none')   layers.push({ key: 'bottom', src: bottomPath(g, config.bottom) });
  if (config.shoes && config.shoes !== 'none')          layers.push({ key: 'shoes',  src: shoesPath(config.shoes) });
  if (g && config.top && config.top !== 'none')         layers.push({ key: 'top',    src: topPath(g, config.top) });
  if (g && config.outerwear && config.outerwear !== 'none')
                                                        layers.push({ key: 'outer',  src: outerwearPath(g, config.outerwear) });
  if (config.expression && config.expression !== 'none')
                                                        layers.push({ key: 'expr',   src: expressionPath(config.expression) });
  if (config.glasses && config.glasses !== 'none')      layers.push({ key: 'glass',  src: glassesPath(config.glasses) });
  if (config.hair && config.hairColor)                  layers.push({ key: 'hair',   src: hairPath(config.hairColor, config.hair) });
  if (config.hat && config.hat !== 'none')              layers.push({ key: 'hat',    src: hatPath(config.hat) });

  return layers;
}

export default function TrainerSprite({ config, size, crop, className }: Props) {
  const layers = useMemo(() => buildLayers(config), [config]);
  const aspect = SPRITE_DIMS.height / SPRITE_DIMS.width;          // typically 1.5
  const fullHeight = size * aspect;
  const bustHeight = size * (SPRITE_DIMS.bustCrop.h / SPRITE_DIMS.bustCrop.w);

  // Empty silhouette state — gender or body not picked yet.
  if (layers.length === 0) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: crop === 'bust' ? bustHeight : fullHeight,
          background: 'rgba(54, 125, 149, 0.08)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(54, 125, 149, 0.45)',
          fontFamily: 'var(--font-loos), sans-serif',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        pick gender + body
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: crop === 'bust' ? bustHeight : fullHeight,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: size,
          height: fullHeight,
          position: 'relative',
        }}
      >
        {layers.map(({ key, src }) => (
          <img
            key={key}
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

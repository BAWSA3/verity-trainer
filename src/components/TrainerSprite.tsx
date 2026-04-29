'use client';

import { useMemo } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import {
  bodyPath, hairPath, outfitPath, cloakPath, facePath, hatPath,
  SPRITE_DIMS,
} from '@/lib/trainer-options';

interface Props {
  config: TrainerConfig;
  personality?: TrainerPersonality; // accepted for V2 forward-compat; unused by sprite
  size: number;                     // CSS px width
  crop?: 'bust';                    // when 'bust', clips to manifest.bustCrop
  className?: string;
}

interface Layer {
  key: string;
  src: string;
}

// Layer order per Seliel's `using this base.txt`:
//   0bas (body) -> 1out (outfit) -> 2clo (cloak) -> 3fac (face) ->
//   4har (hair) -> 5hat (hat) -> 6tla/7tlb (tools, V1 skips)
function buildLayers(config: TrainerConfig): Layer[] {
  const layers: Layer[] = [];

  if (config.body) layers.push({ key: 'body', src: bodyPath(config.body) });

  const outfit = outfitPath(config.outfit);
  if (outfit) layers.push({ key: 'outfit', src: outfit });

  const cloak = cloakPath(config.cloak);
  if (cloak) layers.push({ key: 'cloak', src: cloak });

  const face = facePath(config.face);
  if (face) layers.push({ key: 'face', src: face });

  if (config.hair && config.hairColor) {
    layers.push({ key: 'hair', src: hairPath(config.hair, config.hairColor) });
  }

  const hat = hatPath(config.hat);
  if (hat) layers.push({ key: 'hat', src: hat });

  return layers;
}

export default function TrainerSprite({ config, size, crop, className }: Props) {
  const layers = useMemo(() => buildLayers(config), [config]);

  // Sprite cell is square (64x64). Bust crop clips a sub-rect.
  const fullHeight = size; // 1:1 cell
  const bustHeight = (size * SPRITE_DIMS.bustCrop.h) / SPRITE_DIMS.bustCrop.w;

  // Empty silhouette state — body not picked yet.
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
        pick body to begin
      </div>
    );
  }

  // For bust crop: render the full 64x64 cell scaled to `size` square,
  // but clip the visible window to bustCrop's aspect ratio. The bust region
  // sits in the upper-middle of the cell (typically y=12, h=36 of 64).
  const cropTopOffset = crop === 'bust'
    ? -(SPRITE_DIMS.bustCrop.y / SPRITE_DIMS.bustCrop.w) * size
    : 0;
  const cropLeftOffset = crop === 'bust'
    ? -(SPRITE_DIMS.bustCrop.x / SPRITE_DIMS.bustCrop.w) * size
    : 0;
  const innerWidth = crop === 'bust'
    ? (SPRITE_DIMS.width / SPRITE_DIMS.bustCrop.w) * size
    : size;
  const innerHeight = crop === 'bust'
    ? (SPRITE_DIMS.height / SPRITE_DIMS.bustCrop.w) * size
    : fullHeight;

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
          width: innerWidth,
          height: innerHeight,
          position: 'absolute',
          top: cropTopOffset,
          left: cropLeftOffset,
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

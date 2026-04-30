'use client';

import { useMemo } from 'react';
import type { Direction, TrainerConfig, TrainerPersonality } from '@/types/trainer';
import {
  bodyPath, eyesPath, hairPath, outfitPath, accessoryPath,
  SPRITE_DIMS,
} from '@/lib/trainer-options';

interface Props {
  config: TrainerConfig;
  personality?: TrainerPersonality; // accepted for V2 forward-compat; unused by sprite
  size: number;                     // CSS px width
  crop?: 'bust';                    // when 'bust', clips to manifest.bustCrop
  direction?: Direction;            // 's' (south) by default — share + customizer use south
  className?: string;
}

interface Layer {
  key: string;
  src: string;
}

// LimeZu layer order (per CHARACTER_GENERATOR.txt), bottom to top:
//   body -> outfit -> eyes -> hair -> accessory
function buildLayers(config: TrainerConfig, dir: Direction): Layer[] {
  const layers: Layer[] = [];

  if (config.body) layers.push({ key: 'body', src: bodyPath(config.body, dir) });

  const outfit = outfitPath(config.outfit, dir);
  if (outfit) layers.push({ key: 'outfit', src: outfit });

  const eyes = eyesPath(config.eyes, dir);
  if (eyes) layers.push({ key: 'eyes', src: eyes });

  if (config.hair && config.hairColor) {
    layers.push({ key: 'hair', src: hairPath(config.hair, config.hairColor, dir) });
  }

  const accessory = accessoryPath(config.accessory, dir);
  if (accessory) layers.push({ key: 'accessory', src: accessory });

  return layers;
}

export default function TrainerSprite({ config, size, crop, direction = 's', className }: Props) {
  const layers = useMemo(() => buildLayers(config, direction), [config, direction]);

  // LimeZu sprite cell is portrait: width × height = 48 × 96 (1:2 aspect).
  // `size` is the displayed width; full-body height is size * (h/w).
  const cellW = SPRITE_DIMS.width;        // 48
  const cellH = SPRITE_DIMS.height;       // 96
  const fullHeight = (size * cellH) / cellW;

  // Bust crop region (in source pixels) — typically head + shoulders.
  // Display strategy: scale the inner cell so the bust window's width = `size`,
  // then clip to the bust rect.
  const bust = SPRITE_DIMS.bustCrop;      // { x, y, w, h }
  const bustScale = size / bust.w;
  const bustDisplayH = bust.h * bustScale;
  const innerW = cellW * bustScale;
  const innerH = cellH * bustScale;
  const innerLeft = -bust.x * bustScale;
  const innerTop = -bust.y * bustScale;

  // Empty silhouette state — body not picked yet.
  if (layers.length === 0) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: crop === 'bust' ? bustDisplayH : fullHeight,
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

  if (crop === 'bust') {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: bustDisplayH,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: innerW,
            height: innerH,
            position: 'absolute',
            top: innerTop,
            left: innerLeft,
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

  // Full-body — render the whole 48x96 cell at width=size, height=size*2.
  return (
    <div
      className={className}
      style={{
        width: size,
        height: fullHeight,
        position: 'relative',
        overflow: 'hidden',
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
  );
}

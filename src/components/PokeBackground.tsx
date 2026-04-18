'use client';

/**
 * Ambient Pokemon-inspired background for the trainer customizer.
 * - SVG-based pokeballs + grass tiles scattered across the viewport
 * - Heavy blur + pixelated rendering creates an atmospheric color wash
 *   that reads as "retro game overworld" without being copyrighted IP
 * - Fixed behind everything (z-index 0), main UI stays on z-index 5+
 */

interface Pokeball {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

// Deterministic scatter — not random on each render to avoid hydration mismatch
const POKEBALLS: Pokeball[] = [
  { x: 8,  y: 12, size: 100, rotation: -15, color: '#FF3B3B' },
  { x: 68, y: 20, size: 140, rotation: 22,  color: '#3B8BFF' },
  { x: 22, y: 55, size: 120, rotation: -42, color: '#FFB800' },
  { x: 82, y: 60, size: 160, rotation: 8,   color: '#FF3B3B' },
  { x: 45, y: 8,  size: 80,  rotation: 50,  color: '#39FF14' },
  { x: 12, y: 85, size: 110, rotation: 30,  color: '#FF006E' },
  { x: 60, y: 88, size: 95,  rotation: -22, color: '#39FF14' },
  { x: 90, y: 32, size: 70,  rotation: 10,  color: '#FFB800' },
  { x: 38, y: 70, size: 85,  rotation: -60, color: '#3B8BFF' },
  { x: 75, y: 45, size: 60,  rotation: 18,  color: '#FF006E' },
  { x: 4,  y: 38, size: 90,  rotation: -10, color: '#39FF14' },
  { x: 52, y: 42, size: 55,  rotation: 40,  color: '#FF3B3B' },
];

// Background pixel tile pattern — grass-like green blocks
const TILES: { x: number; y: number; size: number; color: string }[] = [];
for (let i = 0; i < 80; i++) {
  const x = (i * 137) % 100;
  const y = (i * 89) % 100;
  const size = 6 + (i % 5) * 2;
  const hue = 90 + (i % 20);
  const sat = 40 + (i % 30);
  const lit = 18 + (i % 15);
  TILES.push({ x, y, size, color: `hsl(${hue}, ${sat}%, ${lit}%)` });
}

function PokeballSVG({ ball }: { ball: Pokeball }) {
  return (
    <g transform={`translate(${ball.x} ${ball.y}) rotate(${ball.rotation})`}>
      {/* Top half (color) */}
      <path
        d={`M -${ball.size / 2} 0 A ${ball.size / 2} ${ball.size / 2} 0 0 1 ${ball.size / 2} 0 Z`}
        fill={ball.color}
      />
      {/* Bottom half (white/light) */}
      <path
        d={`M -${ball.size / 2} 0 A ${ball.size / 2} ${ball.size / 2} 0 0 0 ${ball.size / 2} 0 Z`}
        fill="#F5F5F5"
      />
      {/* Black band */}
      <rect
        x={-ball.size / 2}
        y={-ball.size * 0.08}
        width={ball.size}
        height={ball.size * 0.16}
        fill="#1a1a1a"
      />
      {/* Center button */}
      <circle cx={0} cy={0} r={ball.size * 0.14} fill="#F5F5F5" stroke="#1a1a1a" strokeWidth={ball.size * 0.03} />
      <circle cx={0} cy={0} r={ball.size * 0.06} fill="#1a1a1a" />
    </g>
  );
}

export default function PokeBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        // High blur + slight brightness reduction keeps the builder UI readable
        filter: 'blur(28px) saturate(1.3) brightness(0.45)',
        // Scale up slightly so blurred edges don't reveal the SVG box
        transform: 'scale(1.15)',
        transformOrigin: 'center',
      }}
    >
      {/* Base gradient — grass → sky feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0d1b0d 0%, #0a1a22 45%, #14241a 80%, #081018 100%)',
        }}
      />

      {/* Pixel tile texture — scattered coloured blocks */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated' }}
      >
        {TILES.map((t, i) => (
          <rect
            key={`t-${i}`}
            x={t.x}
            y={t.y}
            width={t.size * 0.15}
            height={t.size * 0.15}
            fill={t.color}
            opacity={0.55}
          />
        ))}
      </svg>

      {/* Pokeballs */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: 'pixelated' }}
      >
        {POKEBALLS.map((ball, i) => (
          <g
            key={`p-${i}`}
            transform={`translate(${ball.x} ${ball.y})`}
            opacity={0.65}
          >
            <g transform={`scale(${ball.size / 1000}) rotate(${ball.rotation})`}>
              <PokeballSVG ball={{ ...ball, x: 0, y: 0 }} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

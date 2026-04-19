'use client';

/**
 * Ambient Ghibli-inspired background for the trainer customizer.
 * Soft cream canvas with floating pokéballs in the VERITY landing palette
 * (olive, teal, cream, warm cream, deep teal). Heavy blur keeps it atmospheric
 * without competing with the trainer preview.
 *
 * - Fixed behind everything (z-index 0). Main UI layers on z-10+.
 * - Pokéballs are our own SVG drawings in VERITY colors (no IP).
 * - Positions are deterministic so SSR and CSR match (no hydration mismatch).
 */

interface Pokeball {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

// Ghibli palette matching the landing hero
const POKEBALLS: Pokeball[] = [
  { x: 8,  y: 12, size: 100, rotation: -15, color: '#90b34d' }, // olive
  { x: 68, y: 20, size: 140, rotation: 22,  color: '#367d95' }, // teal
  { x: 22, y: 55, size: 120, rotation: -42, color: '#e6ddb8' }, // warm cream
  { x: 82, y: 60, size: 160, rotation: 8,   color: '#6fadc2' }, // sage teal
  { x: 45, y: 8,  size: 80,  rotation: 50,  color: '#819a00' }, // olive deep
  { x: 12, y: 85, size: 110, rotation: 30,  color: '#367d95' }, // teal
  { x: 60, y: 88, size: 95,  rotation: -22, color: '#90b34d' }, // olive
  { x: 90, y: 32, size: 70,  rotation: 10,  color: '#e6ddb8' }, // warm cream
  { x: 38, y: 70, size: 85,  rotation: -60, color: '#16272c' }, // deep teal (accent)
  { x: 75, y: 45, size: 60,  rotation: 18,  color: '#6fadc2' }, // sage teal
  { x: 4,  y: 38, size: 90,  rotation: -10, color: '#90b34d' }, // olive
  { x: 52, y: 42, size: 55,  rotation: 40,  color: '#819a00' }, // olive deep
];

// Pixel-tile texture — small blocks in cream/olive hues for a painted-mountain feel
const TILES: { x: number; y: number; size: number; color: string }[] = [];
for (let i = 0; i < 80; i++) {
  const x = (i * 137) % 100;
  const y = (i * 89) % 100;
  const size = 6 + (i % 5) * 2;
  // Alternate between cream highlights and olive mid-tones
  const palette = i % 3 === 0
    ? `hsl(${70 + (i % 20)}, ${35 + (i % 20)}%, ${55 + (i % 15)}%)`  // olive mid
    : i % 3 === 1
    ? `hsl(${45 + (i % 15)}, ${40 + (i % 20)}%, ${78 + (i % 10)}%)`  // cream
    : `hsl(${190 + (i % 15)}, ${30 + (i % 20)}%, ${50 + (i % 15)}%)`; // teal
  TILES.push({ x, y, size, color: palette });
}

function PokeballSVG({ ball }: { ball: Pokeball }) {
  return (
    <g transform={`translate(${ball.x} ${ball.y}) rotate(${ball.rotation})`}>
      {/* Top half (color) */}
      <path
        d={`M -${ball.size / 2} 0 A ${ball.size / 2} ${ball.size / 2} 0 0 1 ${ball.size / 2} 0 Z`}
        fill={ball.color}
      />
      {/* Bottom half (warm cream) */}
      <path
        d={`M -${ball.size / 2} 0 A ${ball.size / 2} ${ball.size / 2} 0 0 0 ${ball.size / 2} 0 Z`}
        fill="#fffdf3"
      />
      {/* Dark teal band */}
      <rect
        x={-ball.size / 2}
        y={-ball.size * 0.08}
        width={ball.size}
        height={ball.size * 0.16}
        fill="#16272c"
      />
      {/* Center button */}
      <circle
        cx={0}
        cy={0}
        r={ball.size * 0.14}
        fill="#fffdf3"
        stroke="#16272c"
        strokeWidth={ball.size * 0.03}
      />
      <circle cx={0} cy={0} r={ball.size * 0.06} fill="#16272c" />
    </g>
  );
}

export default function PokeBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        // Softer blur + brightness so the cream canvas reads through
        filter: 'blur(36px) saturate(1.1) brightness(1.0)',
        transform: 'scale(1.15)',
        transformOrigin: 'center',
      }}
    >
      {/* Cream base gradient matching landing */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #fffdf3 0%, #f5f1d6 45%, #e6ddb8 80%, #d8cf9f 100%)',
        }}
      />

      {/* Pixel tile texture */}
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
            opacity={0.35}
          />
        ))}
      </svg>

      {/* Pokéballs */}
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
            opacity={0.55}
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

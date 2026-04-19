import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { sanitizeNameForDisplay } from '@/lib/moderation/sanitize';

export const runtime = 'nodejs';

// Internal compositing resolution — sprites are stored at 192x192 source,
// composited at this size for final OG image. Larger = crisper printout.
const SPRITE_SIZE = 1024;

// Paths are now gender-aware for body/head/tops. Others stay universal.
async function loadSprite(relPath: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'sprites', relPath);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function compositeTrainer(
  gender: 'male' | 'female',
  body: string,
  hair: string,
  hairColor: string,
  top: string,
  bottom: string,
  accessory: string,
  facialHair: string,
  face: string,
  neck: string,
  shoes: string,
): Promise<string | null> {
  const layers = [
    { rel: `body/${gender}/${body}.png` },
    { rel: `head/${gender}/${body}.png` },
    ...(gender === 'male' && facialHair && facialHair !== 'none'
      ? [{ rel: `facial-hair/${facialHair}.png` }]
      : []),
    { rel: `bottoms/${bottom}.png` },
    ...(shoes && shoes !== 'none' ? [{ rel: `shoes/${shoes}.png` }] : []),
    { rel: `tops/${gender}/${top}.png` },
    ...(neck && neck !== 'none' ? [{ rel: `neck/${gender}/${neck}.png` }] : []),
    { rel: `hair/${hairColor}/${hair}.png` },
    ...(face && face !== 'none' ? [{ rel: `face/${face}.png` }] : []),
    ...(accessory !== 'none' ? [{ rel: `accessories/${accessory}.png` }] : []),
  ];

  try {
    // Load all layer buffers in parallel
    const buffers = await Promise.all(
      layers.map(async ({ rel }) => {
        const buf = await loadSprite(rel);
        if (!buf) return null;
        return sharp(buf).resize(SPRITE_SIZE, SPRITE_SIZE, { kernel: 'nearest' }).toBuffer();
      }),
    );

    const validBuffers = (await Promise.all(buffers)).filter((b): b is Buffer => b !== null);
    if (validBuffers.length === 0) return null;

    const composite = await sharp({
      create: {
        width: SPRITE_SIZE,
        height: SPRITE_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(validBuffers.map((input) => ({ input, top: 0, left: 0 })))
      .png()
      .toBuffer();

    return `data:image/png;base64,${composite.toString('base64')}`;
  } catch (err) {
    console.error('[og] compositeTrainer error:', err);
    return null;
  }
}

function StatBar({ value, color = '#39FF14' }: { value: number; color?: string }) {
  const cells = 12;
  const filled = Math.round((value / 100) * cells);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: cells }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 18,
            height: 18,
            backgroundColor: i < filled ? color : '#1a1a1a',
            border: i < filled ? `1px solid ${color}` : '1px solid #2a2a2a',
          }}
        />
      ))}
    </div>
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Trainer metadata
  // Sanitize — the n= param is user-controlled via URL, so treat it as untrusted.
  const name = sanitizeNameForDisplay(searchParams.get('n'));
  const style = parseInt(searchParams.get('s') || '75');
  const drip = parseInt(searchParams.get('d') || '80');
  const flex = parseInt(searchParams.get('f') || '70');

  // Trainer config (fall back to sensible defaults)
  const genderParam = searchParams.get('g');
  const gender: 'male' | 'female' = genderParam === 'female' ? 'female' : 'male';
  const body = searchParams.get('b') || 'medium';
  const hair = searchParams.get('h') || 'buzz';
  const hairColor = searchParams.get('hc') || 'black';
  const top = searchParams.get('t') || 'hoodie';
  const bottom = searchParams.get('bo') || 'pants';
  const accessory = searchParams.get('a') || 'none';
  const facialHair = searchParams.get('fh') || 'none';
  const face = searchParams.get('fa') || 'none';
  const neck = searchParams.get('ne') || 'none';
  const shoes = searchParams.get('sh') || 'sneakers';

  const spriteDataUri = await compositeTrainer(
    gender,
    body,
    hair,
    hairColor,
    top,
    bottom,
    accessory,
    facialHair,
    face,
    neck,
    shoes,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          border: '8px solid #39FF14',
          padding: '40px',
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              color: '#39FF14',
              fontSize: 16,
              letterSpacing: '4px',
              display: 'flex',
            }}
          >
            VERITY TRAINER CARD
          </div>
          <div
            style={{
              color: '#FF006E',
              fontSize: 12,
              letterSpacing: '3px',
              display: 'flex',
            }}
          >
            #EXCLUSIVE-DROP
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, gap: 48 }}>
          {/* Sprite */}
          <div
            style={{
              width: 380,
              height: 380,
              border: '4px solid #39FF14',
              backgroundColor: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {spriteDataUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={spriteDataUri}
                alt=""
                width={340}
                height={340}
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div style={{ color: '#39FF14', fontSize: 60, display: 'flex' }}>V</div>
            )}
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 20,
              flex: 1,
            }}
          >
            <div style={{ color: 'white', fontSize: 48, display: 'flex', fontWeight: 700 }}>
              {name}
            </div>
            <div
              style={{
                color: '#FF006E',
                fontSize: 14,
                letterSpacing: '4px',
                display: 'flex',
                marginBottom: 8,
              }}
            >
              STREETWEAR LEGEND
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span
                  style={{ color: '#888', fontSize: 14, width: 110, letterSpacing: '2px' }}
                >
                  STYLE LVL
                </span>
                <StatBar value={style} />
                <span style={{ color: '#39FF14', fontSize: 16, display: 'flex' }}>{style}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span
                  style={{ color: '#888', fontSize: 14, width: 110, letterSpacing: '2px' }}
                >
                  DRIP STAT
                </span>
                <StatBar value={drip} color="#FF006E" />
                <span style={{ color: '#FF006E', fontSize: 16, display: 'flex' }}>{drip}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span
                  style={{ color: '#888', fontSize: 14, width: 110, letterSpacing: '2px' }}
                >
                  FLEX PWR
                </span>
                <StatBar value={flex} />
                <span style={{ color: '#39FF14', fontSize: 16, display: 'flex' }}>{flex}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 20,
            borderTop: '2px solid #222',
            paddingTop: 20,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#666', fontSize: 12, letterSpacing: '2px' }}>
              YOUR STREETWEAR JOURNEY STARTS AT VERITY
            </span>
            <span style={{ color: '#39FF14', fontSize: 14, letterSpacing: '3px' }}>
              LAUNCHING MAY 2026
            </span>
          </div>
          <span style={{ color: '#39FF14', fontSize: 22, letterSpacing: '4px', display: 'flex' }}>
            VERITY
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

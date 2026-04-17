import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import {
  BODY_OPTIONS,
  HAIR_OPTIONS,
  TOP_OPTIONS,
  BOTTOM_OPTIONS,
  ACCESSORY_OPTIONS,
} from '@/lib/trainer-options';

export const runtime = 'nodejs';

const SPRITE_SIZE = 512;

const CATEGORY_DIRS: Record<string, string> = {
  body: 'base',
  head: 'head',
  hair: 'hair',
  top: 'tops',
  bottom: 'bottoms',
  accessory: 'accessories',
};

async function loadSprite(category: string, id: string): Promise<Buffer | null> {
  try {
    const dir = CATEGORY_DIRS[category];
    if (!dir) return null;
    const filePath = path.join(process.cwd(), 'public', 'sprites', dir, `${id}.png`);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function compositeTrainer(
  body: string,
  hair: string,
  top: string,
  bottom: string,
  accessory: string,
): Promise<string | null> {
  const layers = [
    { cat: 'body', id: body },
    { cat: 'head', id: body },
    { cat: 'bottom', id: bottom },
    { cat: 'top', id: top },
    { cat: 'hair', id: hair },
    ...(accessory !== 'none' ? [{ cat: 'accessory', id: accessory }] : []),
  ];

  try {
    // Load all layer buffers in parallel
    const buffers = await Promise.all(
      layers.map(async ({ cat, id }) => {
        const buf = await loadSprite(cat, id);
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
  const name = searchParams.get('n') || 'TRAINER';
  const style = parseInt(searchParams.get('s') || '75');
  const drip = parseInt(searchParams.get('d') || '80');
  const flex = parseInt(searchParams.get('f') || '70');

  // Trainer config (fall back to first option in each category)
  const body = searchParams.get('b') || BODY_OPTIONS[1]?.id || 'medium';
  const hair = searchParams.get('h') || HAIR_OPTIONS[0]?.id || 'buzz';
  const top = searchParams.get('t') || TOP_OPTIONS[0]?.id || 'hoodie';
  const bottom = searchParams.get('bo') || BOTTOM_OPTIONS[0]?.id || 'pants';
  const accessory = searchParams.get('a') || ACCESSORY_OPTIONS[0]?.id || 'none';

  const spriteDataUri = await compositeTrainer(body, hair, top, bottom, accessory);

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

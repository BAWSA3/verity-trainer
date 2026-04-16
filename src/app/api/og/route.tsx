import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get('n') || 'TRAINER';
  const style = parseInt(searchParams.get('s') || '75');
  const drip = parseInt(searchParams.get('d') || '80');
  const flex = parseInt(searchParams.get('f') || '70');

  function makeBar(value: number) {
    const filled = Math.round((value / 100) * 12);
    return '\u2588'.repeat(filled) + '\u2591'.repeat(12 - filled);
  }

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
        <div style={{ color: '#39FF14', fontSize: 16, letterSpacing: '4px', marginBottom: 20, display: 'flex' }}>
          VERITY TRAINER CARD
        </div>

        <div style={{ display: 'flex', flex: 1, gap: 40 }}>
          {/* Sprite placeholder */}
          <div
            style={{
              width: 300,
              height: 300,
              border: '4px solid #39FF14',
              backgroundColor: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
            }}
          >
            <span style={{ color: '#39FF14' }}>V</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            <div style={{ color: 'white', fontSize: 32, display: 'flex' }}>{name}</div>
            <div style={{ color: '#FF006E', fontSize: 14, letterSpacing: '3px', display: 'flex' }}>
              STREETWEAR LEGEND
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: 14, width: 120 }}>STYLE LVL</span>
                <span style={{ color: '#39FF14', fontSize: 14 }}>{makeBar(style)}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: 14, width: 120 }}>DRIP STAT</span>
                <span style={{ color: '#39FF14', fontSize: 14 }}>{makeBar(drip)}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: 14, width: 120 }}>FLEX PWR</span>
                <span style={{ color: '#39FF14', fontSize: 14 }}>{makeBar(flex)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#666', fontSize: 12 }}>YOUR STREETWEAR JOURNEY STARTS AT VERITY</span>
            <span style={{ color: '#39FF14', fontSize: 14 }}>LAUNCHING MAY 2026</span>
          </div>
          <span style={{ color: '#39FF14', fontSize: 18, display: 'flex' }}>VERITY</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

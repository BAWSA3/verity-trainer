import { NextRequest, NextResponse } from 'next/server';
import { fetchXProfile } from '@/lib/x-profile';
import { generateTrainer } from '@/lib/ai/generate-trainer';

export const runtime = 'nodejs';

// POST /api/generate-trainer
//   body: { handle: string, regenerate?: boolean, hint?: string }
//   returns: { config, personality, reasoning, source: 'live' | 'mock', profile: { handle, name, source } }
//
// The auth-gated production version reads the X handle from the Supabase
// session; for the prototype, the handle comes from the request body so we
// can demo without OAuth wiring.

interface RequestBody {
  handle?: string;
  regenerate?: boolean;
  hint?: string;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const handle = (body.handle ?? '').trim().replace(/^@/, '');
  if (!handle || !/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
    return NextResponse.json({ error: 'invalid_handle' }, { status: 400 });
  }

  try {
    const profile = await fetchXProfile(handle);
    const trainer = await generateTrainer(profile, {
      regenerate: !!body.regenerate,
      hint: typeof body.hint === 'string' ? body.hint : undefined,
    });
    return NextResponse.json({
      config: trainer.config,
      personality: trainer.personality,
      reasoning: trainer.reasoning,
      source: trainer.source,
      profile: {
        handle: profile.handle,
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        followers: profile.followers,
        source: profile.source,
      },
    });
  } catch (err) {
    console.error('[generate-trainer] failed:', err);
    return NextResponse.json(
      { error: 'generation_failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}

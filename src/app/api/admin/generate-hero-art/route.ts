import { NextRequest, NextResponse } from 'next/server';
import type { TierKey } from '@/types/trainer';
import { TIER_KEYS } from '@/types/trainer';
import { generateHeroArt, buildHeroArtPrompt } from '@/lib/ai/generate-hero-art';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { unpackTrainer, packTrainer } from '@/lib/trainer-data';

export const runtime = 'nodejs';

// Admin/dev endpoint — generates a hero-art image for a given cardId or
// raw character description, optionally persists it to the trainer_signups
// row. Auth-gated by a shared secret in the X-Admin-Secret header so it
// can't be hit anonymously to burn API budget.
//
// POST body:
//   { cardId: <uuid>, persist?: boolean }
//     → looks up the row, derives description from existing reasoning,
//       generates art, optionally writes back to trainer_config.heroArtSrc
//   { description: string, tier: TierKey, persist?: false }
//     → one-off generation for prompt tuning. Returns the data URI in
//       the response body. No DB write.
//
// Response: { dataUri, prompt, bytes } on success, { error } on failure.

interface GenerateBody {
  cardId?: string;
  description?: string;
  tier?: string;
  persist?: boolean;
}

export async function POST(req: NextRequest) {
  // Auth gate — require a shared secret to prevent anonymous API-burn.
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET not configured on server' },
      { status: 500 },
    );
  }
  const provided = req.headers.get('x-admin-secret');
  if (provided !== adminSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  // Path A — explicit description for one-off prompt tuning.
  if (body.description && body.tier) {
    const tier = body.tier as TierKey;
    if (!TIER_KEYS.includes(tier)) {
      return NextResponse.json({ error: 'invalid tier' }, { status: 400 });
    }
    try {
      const result = await generateHeroArt({
        characterDescription: body.description,
        tier,
      });
      return NextResponse.json({
        dataUri: result.dataUri,
        prompt: buildHeroArtPrompt(body.description, tier),
        bytes: result.bytes,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Path B — cardId lookup + (optionally) persist back to the row.
  if (body.cardId) {
    const supabase = getSupabaseAdmin();
    const { data: row, error: fetchErr } = await supabase
      .from('trainer_signups')
      .select('id, trainer_name, trainer_config')
      .eq('id', body.cardId)
      .maybeSingle();
    if (fetchErr || !row) {
      return NextResponse.json({ error: 'card not found' }, { status: 404 });
    }

    const { config, personality, source, reasoning, referredBy, tier } = unpackTrainer(row);
    if (!tier) {
      return NextResponse.json({ error: 'card has no tier set' }, { status: 400 });
    }

    // Derive a character description from the reasoning field (Claude
    // already wrote a 1-line vibe for AI-generated trainers). For manual
    // trainers, use the trainer name as a fallback.
    const desc = reasoning?.slice(0, 240) || `a chibi trainer named ${row.trainer_name}`;

    let result;
    try {
      result = await generateHeroArt({
        characterDescription: desc,
        tier,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    if (body.persist) {
      const updated = packTrainer(
        config, personality, source, reasoning, referredBy, tier, result.dataUri,
      );
      const { error: upErr } = await supabase
        .from('trainer_signups')
        .update({ trainer_config: updated })
        .eq('id', body.cardId);
      if (upErr) {
        return NextResponse.json(
          { error: 'art generated but DB write failed: ' + upErr.message, dataUri: result.dataUri },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      dataUri: result.dataUri,
      prompt: buildHeroArtPrompt(desc, tier),
      bytes: result.bytes,
      persisted: !!body.persist,
    });
  }

  return NextResponse.json(
    { error: 'must provide either {cardId} or {description, tier}' },
    { status: 400 },
  );
}

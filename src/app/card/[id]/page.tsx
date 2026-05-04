import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateStats } from '@/lib/card-utils';
import { sanitizeNameForDisplay } from '@/lib/moderation/sanitize';
import { unpackTrainer } from '@/lib/trainer-data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import CardPageClient from './CardPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTrainer(id: string) {
  try {
    const { data } = await getSupabaseAdmin()
      .from('trainer_signups')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trainer = await getTrainer(id);
  if (!trainer) return { title: 'VERITY Trainer Card' };

  const name = sanitizeNameForDisplay(trainer.trainer_name);
  const { config, personality, reasoning } = unpackTrainer(trainer);
  const stats = generateStats(config, personality);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verity-trainer.vercel.app';
  const xHandle = typeof trainer.x_handle === 'string' ? trainer.x_handle : '';

  // OG URL params. Stat keys (s/c/st/lk_v) keep their names but now mean
  // presence/wit/taste/resolve. The OG route prefers the DB lookup via `cid`
  // when present (V3.2 anti-forgery) and treats the rest as fallback for
  // shared v3 URLs that don't have cid. We still emit the legacy params so
  // old crawlers / cached metadata keep rendering.
  const ogParams = new URLSearchParams({
    cid: id,
    n: name,
    s: String(stats.presence),
    c: String(stats.wit),
    st: String(stats.taste),
    lk_v: String(stats.resolve),
    b: config.body,
    h: config.hair,
    hc: config.hairColor,
    o: config.outfit,
    e: config.eyes,
    ac: config.accessory,
    z: personality.zodiac,
  });
  if (reasoning) ogParams.set('r', reasoning.slice(0, 160));
  // 'kf' URL param key kept for back-compat with v3 shared URLs; semantics
  // changed in v3.1 — it now carries the roast quote, not a tagline.
  const quoteText = personality.quote ?? personality.knownFor;
  if (quoteText) ogParams.set('kf', quoteText.slice(0, 200));
  const a1 = personality.abilities?.[0];
  const a2 = personality.abilities?.[1];
  if (a1) {
    ogParams.set('a1n', a1.name.slice(0, 32));
    ogParams.set('a1d', a1.description.slice(0, 140));
  }
  if (a2) {
    ogParams.set('a2n', a2.name.slice(0, 32));
    ogParams.set('a2d', a2.description.slice(0, 140));
  }
  const w1 = personality.weaknesses?.[0];
  const w2 = personality.weaknesses?.[1];
  if (w1) {
    ogParams.set('w1n', w1.name.slice(0, 32));
    ogParams.set('w1d', w1.description.slice(0, 140));
  }
  if (w2) {
    ogParams.set('w2n', w2.name.slice(0, 32));
    ogParams.set('w2d', w2.description.slice(0, 140));
  }
  if (xHandle) ogParams.set('ref', xHandle.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15));
  const ogUrl = `${appUrl}/api/og?${ogParams.toString()}`;

  return {
    title: `${name}'s Trainer Card | VERITY`,
    description: `Check out ${name}'s VERITY Trainer Card. Design yours before the drop.`,
    openGraph: {
      title: `${name}'s Trainer Card | VERITY`,
      description: `Check out ${name}'s VERITY Trainer Card. Design yours before the drop.`,
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}'s Trainer Card | VERITY`,
      description: `Check out ${name}'s VERITY Trainer Card. Design yours before the drop.`,
      images: [ogUrl],
    },
  };
}

export default async function CardPage({ params }: PageProps) {
  const { id } = await params;
  const trainer = await getTrainer(id);
  if (!trainer) notFound();

  const { config, personality, reasoning } = unpackTrainer(trainer);

  return (
    <CardPageClient
      id={id}
      config={config}
      personality={personality}
      trainerName={sanitizeNameForDisplay(trainer.trainer_name)}
      xHandle={typeof trainer.x_handle === 'string' ? trainer.x_handle : undefined}
      reasoning={reasoning}
    />
  );
}

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg';

  // OG URL params — keys mirror /api/og's expected query.
  // Order is load-bearing for back-compat with previously-shared URLs;
  // append-only for new params (slk, sdl).
  const ogParams = new URLSearchParams({
    n: name,
    s: String(stats.style),
    c: String(stats.charisma),
    st: String(stats.street),
    lk_v: String(stats.luck),
    b: config.body,
    h: config.hair,
    hc: config.hairColor,
    o: config.outfit,
    e: config.eyes,
    ac: config.accessory,
    z: personality.zodiac,
    lk: personality.likes.join('|'),
    dl: personality.dislikes.join('|'),
  });
  // Show-on-card masks — append only when explicitly set so old shared URLs
  // remain identical (the OG defaults to "all shown" when masks are absent).
  if (personality.shownLikes && personality.shownLikes.length === personality.likes.length) {
    ogParams.set('slk', personality.shownLikes.map((b) => (b ? '1' : '0')).join(''));
  }
  if (personality.shownDislikes && personality.shownDislikes.length === personality.dislikes.length) {
    ogParams.set('sdl', personality.shownDislikes.map((b) => (b ? '1' : '0')).join(''));
  }
  // r — AI-generated one-liner subtitle. Append-only to preserve URL order.
  if (reasoning) {
    ogParams.set('r', reasoning.slice(0, 160));
  }
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
      reasoning={reasoning}
    />
  );
}

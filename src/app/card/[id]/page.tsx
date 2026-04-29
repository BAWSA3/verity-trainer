import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { generateStats } from '@/lib/card-utils';
import { sanitizeNameForDisplay } from '@/lib/moderation/sanitize';
import { unpackTrainer } from '@/lib/trainer-data';
import CardPageClient from './CardPageClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTrainer(id: string) {
  const { data } = await supabase
    .from('trainer_signups')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trainer = await getTrainer(id);
  if (!trainer) return { title: 'VERITY Trainer Card' };

  // Backstop: mask names that somehow slipped through to the DB.
  const name = sanitizeNameForDisplay(trainer.trainer_name);
  const { config, personality } = unpackTrainer(trainer);
  const stats = generateStats(config, personality);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg';

  const ogParams = new URLSearchParams({
    n: name,
    s: String(stats.style),
    c: String(stats.charisma),
    st: String(stats.street),
    lk_v: String(stats.luck),
    g: config.gender || 'm',
    b: config.body,
    h: config.hair,
    hc: config.hairColor || 'black',
    t: config.top,
    bo: config.bottom,
    sh: config.shoes,
    ow: config.outerwear,
    ht: config.hat,
    gl: config.glasses,
    ex: config.expression,
    z: personality.zodiac,
    lk: personality.likes.join('|'),
    dl: personality.dislikes.join('|'),
  });
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

  const { config, personality } = unpackTrainer(trainer);

  return (
    <CardPageClient
      id={id}
      config={config}
      personality={personality}
      trainerName={sanitizeNameForDisplay(trainer.trainer_name)}
    />
  );
}

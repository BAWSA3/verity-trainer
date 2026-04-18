import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { TrainerConfig } from '@/types/trainer';
import { generateStats } from '@/lib/card-utils';
import CardPageClient from './CardPageClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

  const name = trainer.trainer_name || 'TRAINER';
  const config = trainer.trainer_config as TrainerConfig;
  const stats = generateStats(config);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg';
  const ogParams = new URLSearchParams({
    n: name,
    s: String(stats.style),
    d: String(stats.drip),
    f: String(stats.flex),
    g: config.gender ?? 'male',
    b: config.body,
    h: config.hair,
    t: config.top,
    bo: config.bottom,
    a: config.accessory,
    fh: config.facialHair ?? 'none',
    fa: config.face ?? 'none',
    ne: config.neck ?? 'none',
    sh: config.shoes ?? 'sneakers',
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

  return (
    <CardPageClient
      id={id}
      config={trainer.trainer_config as TrainerConfig}
      trainerName={trainer.trainer_name || 'TRAINER'}
    />
  );
}

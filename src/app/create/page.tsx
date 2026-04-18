import type { Metadata } from 'next';
import TrainerCustomizer from '@/components/TrainerCustomizer';

export const metadata: Metadata = {
  title: 'VERITY // Design Your Trainer',
  description: 'Design your Gen Z trainer. Pick a starter, pull a Capsule, step onto Route 1.',
};

export default function CreatePage() {
  return <TrainerCustomizer />;
}

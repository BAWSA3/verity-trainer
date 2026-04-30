import type { Metadata } from 'next';
import CreatePageClient from './CreatePageClient';

export const metadata: Metadata = {
  title: 'VERITY // Design Your Trainer',
  description: 'Drop your X handle and get a hi-fi pixel trainer auto-generated from your vibe. Tweak it. Share it.',
};

export default function CreatePage() {
  return <CreatePageClient />;
}

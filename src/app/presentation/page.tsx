import type { Metadata } from 'next';
import PresentationClient from './PresentationClient';

export const metadata: Metadata = {
  title: 'VERITY // Launch Deck',
  description: 'Internal presentation deck for the May 2026 VERITY Marketplace drop.',
  robots: { index: false, follow: false },
};

export default function PresentationPage() {
  return <PresentationClient />;
}

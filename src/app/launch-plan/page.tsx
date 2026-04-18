import type { Metadata } from 'next';
import LaunchPlanClient from './LaunchPlanClient';

export const metadata: Metadata = {
  title: 'VERITY // Launch Playbook',
  description: 'Internal launch plan for the May 2026 VERITY Marketplace launch — organic, creator-led, unlocked together.',
  robots: { index: false, follow: false },
};

export default function LaunchPlanPage() {
  return <LaunchPlanClient />;
}

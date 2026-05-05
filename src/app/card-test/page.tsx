// Visual QA page for the V4 card chassis. Renders all 5 tiers with mock
// trainer data so the layout + tier theming can be diffed against the
// reference PNGs in design-templates/. Not linked from anywhere; access by
// typing /card-test in the browser. Safe to delete after launch.

import TrainerCardV4 from '@/components/card/TrainerCardV4';
import type { TrainerConfig, TrainerPersonality, TierKey } from '@/types/trainer';
import { TIER_KEYS } from '@/types/trainer';

const MOCK_CONFIG: TrainerConfig = {
  body: '01',
  hair: '01',
  hairColor: '01',
  outfit: '01',
  eyes: 'none',
  accessory: 'none',
};

const MOCK_PERSONALITY: TrainerPersonality = {
  zodiac: 'leo',
  likes: [],
  dislikes: [],
  quote: 'Builder crafting brands, creating authentic content and real friendships.',
  abilities: [
    { name: 'Building brand systems', description: '' },
    { name: 'Real friendships', description: '' },
    { name: 'Digital collectibles', description: '' },
  ],
  weaknesses: [
    { name: 'Clout-chasers', description: '' },
    { name: 'AI slop', description: '' },
    { name: 'Transactional people', description: '' },
  ],
};

export default function CardTest() {
  return (
    <main style={{ background: '#1a1a1a', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {TIER_KEYS.map((tier: TierKey) => (
          <section key={tier}>
            <h2
              style={{
                color: '#fffdf3',
                fontFamily: 'monospace',
                fontSize: 14,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                marginBottom: 12,
                opacity: 0.7,
              }}
            >
              {tier}
            </h2>
            <TrainerCardV4
              tier={tier}
              config={MOCK_CONFIG}
              personality={MOCK_PERSONALITY}
              trainerName="MEOWTHMYMONEY"
              cardId={`test-${tier}`}
              xHandle="bawsaxbt"
            />
          </section>
        ))}
      </div>
    </main>
  );
}

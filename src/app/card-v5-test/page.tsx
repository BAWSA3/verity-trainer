// V5 visual prototype — Cardi/Amoxx-inspired vertical portrait card.
// Renders all 5 tiers with mock data so the user can decide whether to
// commit to this aesthetic before doing a full redesign.

import TrainerCardV5 from '@/components/card/TrainerCardV5';
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
  quote: 'Builder crafting brands.',
};

export default function CardV5Test() {
  return (
    <main style={{ background: '#000', minHeight: '100vh', padding: 24 }}>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 32,
        }}
      >
        {TIER_KEYS.map((tier: TierKey) => (
          <section key={tier}>
            <h2
              style={{
                color: '#fffdf3',
                fontFamily: 'monospace',
                fontSize: 12,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                marginBottom: 12,
                opacity: 0.6,
              }}
            >
              {tier}
            </h2>
            <TrainerCardV5
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

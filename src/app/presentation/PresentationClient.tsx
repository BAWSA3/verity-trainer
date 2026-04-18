'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DROP_DATE = new Date('2026-05-01T12:00:00-07:00');
const TODAY_LABEL = 'APR 16 2026';

// ---------------------------------------------------------------------------
// Types + slide data
// ---------------------------------------------------------------------------

interface Phase {
  code: string;
  name: string;
  tagline: string;
  window: string;
  objective: string;
  activities: string[];
  deliverables: string[];
  metrics: string[];
  ownerAsk: string;
  accent: string;
}

const PHASES: Phase[] = [
  {
    code: '01',
    name: 'STARTER SEASON',
    tagline: 'Pre-launch — pick your trainer, plant the flag, seed the referral loop',
    window: 'APR 16 – APR 22  ·  7 DAYS',
    objective:
      'Every visit becomes a signal. The Trainer Creator is the Trojan horse — a lead-magnet capture product that hooks taste-driven, crypto-native retail into VERITY before the asset list is revealed. Every card mints a unique invite link, making Phase 01 the seed layer of the referral loop.',
    activities: [
      'Trainer Creator live — every card = email + X handle + invite link',
      'Invite-link layer live — ?ref=CODE attached to every share',
      'Trainer seeding: 10 crypto-native / RWA-curious tastemakers design + post across 3 coordinated days',
      'Daily visual drops on X — trainer sprites + "access + assurance" teasers, no asset reveals',
      'DM 50 crypto / fintech / RWA-adjacent accounts with their personalized trainer',
      'Discord soft-open for the registered (trainer card gate)',
    ],
    deliverables: [
      'Trainer Creator (shipped ✓)',
      'Invite-link attribution (vests only after referred wallet KYCs + allocates post-launch)',
      'Unlock ladder v1 — TVL / volume thresholds mapped to community unlocks',
      '10 trainer launch posts with unique invite links',
      '7-day organic content calendar (X + IG, no paid media)',
      'Registry DB + segmentation (email, handle, trainer config, referrer, accreditation flag)',
    ],
    metrics: ['300+ trainer cards', '150+ registry signups', 'Invite share-click ≥ 0.5', 'Viral K ≥ 0.4'],
    ownerAsk:
      'Founders: approve trainer seed list by APR 17. Marketing: organic content cal by APR 18. Product: invite-link attribution + dashboard live APR 19.',
    accent: '#39FF14',
  },
  {
    code: '02',
    name: 'ROUTE 1',
    tagline: 'First journey — reveal the unlock ladder, let trainers carry it',
    window: 'APR 23 – APR 30  ·  8 DAYS',
    objective:
      "Reveal the community unlock ladder. Let the trainer network carry the story — every conversation is built around invite links and collective milestones. Pre-qualify every registry member so FIRST BADGE is packed.",
    activities: [
      'APR 23: Launch announcement + unlock ladder reveal thread (founders on X)',
      '"What is RWA on VERITY?" — 3-part organic thread (asset classes, compliance, how to participate)',
      'Registry perks: 24h early-access to first-curation allocations + priority KYC',
      'Asset partner / issuer reveals (TBD with founders)',
      '"Who I\'m bringing with me" — trainer amplification round 2 with invite-link personal stories',
      '3–5 podcast / X Space appearances via warm intros — no cold pitching',
      'Optional disclosed paid KOL slot (1–2 max, surgical)',
      'T-7, T-3, T-24h email drip to registry',
    ],
    deliverables: [
      'Unlock ladder microsite section — Phase 02 story anchor',
      'RWA + compliance explainer thread series',
      'Trainer brief (invite-link + unlock-ladder framing, no hashtag prompts)',
      'Podcast / X Space booking calendar',
      'Automated early-access email flow',
    ],
    metrics: [
      '2x registry growth (300+ total)',
      'Explainer: 75k+ impressions',
      '3+ creator-invited podcast / Space slots',
      'Invite → registry conversion rate',
      'Pre-launch survey: 30%+ "definitely investing"',
    ],
    ownerAsk:
      'Founders: own unlock-ladder narrative + podcast voice (first drop APR 23). Marketing: trainer briefs + podcast booking. Product: harden KYC + referral vesting. Community: Discord events mid-week.',
    accent: '#FF006E',
  },
  {
    code: '03',
    name: 'FIRST BADGE',
    tagline: 'Drop day — the marketplace goes live',
    window: 'MAY 1  ·  1 DAY',
    objective:
      "Execute flawlessly. The RWA world is asking about VERITY by EOD, and first-curation allocations fill from the registry up. Every allocation moves the public unlock tracker.",
    activities: [
      'T-1h (11am PT): X Space countdown — founders + trainer partners',
      'T-0 (12pm PT): Marketplace live. Registry gets 24h head start.',
      'Public unlock tracker live — real-time counter toward the first milestone',
      'Rolling "fully allocated" posts — scarcity FOMO as tranches fill',
      'Real-time social: first investments, notable allocations, unlock crossings',
      'Support + KYC surge protocol — dedicated team, 18h coverage',
      'Evening recap thread (6pm PT): "Day 1 by the numbers" (TVL, wallets, ladder state)',
    ],
    deliverables: [
      'Live marketplace on verity domain',
      'Public unlock tracker (embedded + shareable)',
      'Launch-day comms playbook (full-alloc, delay, KYC, unlock trigger templates)',
      'X Space schedule + hosts',
      'Public real-time stats dashboard',
    ],
    metrics: [
      'Target launch-day TVL: TBD',
      'First-curation fill velocity per asset',
      'Launch-day avg deposit size',
      'Referred-wallet share of allocations',
      'Trending on X (≥ 1 regional trend)',
      '< 1% failed KYC / tx',
    ],
    ownerAsk:
      'Everyone on deck May 1. Founders: X Space + comms, celebrate unlock triggers live. Product/Eng: infra + KYC + tracker uptime. Marketing: real-time content. Community: moderation + hype.',
    accent: '#FFB800',
  },
  {
    code: '04',
    name: 'REGISTRY WEEKS',
    tagline: 'Post-launch — complete the set, trade, evolve, co-own the unlock ladder',
    window: 'MAY 2 – MAY 31  ·  30 DAYS',
    objective:
      'Turn first-time investors into repeat allocators; turn the verified referrer cohort into co-owners of the unlock ladder. 30 days to convert launch momentum into the milestones that open Curation Wave 2, fee cuts, governance voting, and cohort rewards.',
    activities: [
      'MAY 2: recap post — transparent numbers (TVL, wallets, assets), thank-yous, ladder snapshot',
      'Week 1: daily "unlock progress" — when each milestone trips, a Professor-led post names the contributing cohort',
      'Week 1: verified referrer cohort (invite → ≥1 allocated wallet) receives a printed Trainer card IRL',
      'Week 2: first community unlock fires (e.g., fee reduction) → "we did it" moment',
      'Week 3: Professor AMA on Discord + governance voting unlock (if threshold hit)',
      'Week 4: Curation Wave 2 teaser + IRL launch dinner invite for the referrer cohort',
      'Prize-pool trigger (tentative): $10k pot + premium Trainer card run, split evenly across verified referrers at milestone (e.g., Wave 2 unlock / $5M TVL). No leaderboards.',
      'Ongoing: weekly "state of the ladder" + rituals (RWA primer nights, holder calls, compliance Q&As)',
    ],
    deliverables: [
      'Launch recap report (public numbers + ladder state)',
      'Live unlock ladder landing page',
      'Investor perks doc — what each milestone unlocks',
      'June roadmap teaser',
    ],
    metrics: [
      'D7 retention of active investors',
      'Repeat-allocation rate (Wave 2 conversion from Wave 1)',
      'Milestones hit in first 30 days',
      '% post-launch TVL from referred wallets',
      'Sentiment ratio on X',
    ],
    ownerAsk:
      'Marketing: unlock celebrations + recap (no hashtag curation). Community: rituals + AMA + cohort-card fulfillment. Founders: Professor voice + roadmap. Product: ship unlock ladder landing page + measure everything.',
    accent: '#39FF14',
  },
];

type Slide =
  | { kind: 'cover' }
  | { kind: 'thesis' }
  | { kind: 'overview' }
  | { kind: 'phase'; phase: Phase }
  | { kind: 'metrics' }
  | { kind: 'team' }
  | { kind: 'open' }
  | { kind: 'close' };

const SLIDES: Slide[] = [
  { kind: 'cover' },
  { kind: 'thesis' },
  { kind: 'overview' },
  ...PHASES.map((phase) => ({ kind: 'phase' as const, phase })),
  { kind: 'metrics' },
  { kind: 'team' },
  { kind: 'open' },
  { kind: 'close' },
];

// ---------------------------------------------------------------------------
// Presentation Client
// ---------------------------------------------------------------------------

export default function PresentationClient() {
  const [index, setIndex] = useState(0);
  const [daysToDrop, setDaysToDrop] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);

  const next = useCallback(
    () => setIndex((i) => Math.min(SLIDES.length - 1, i + 1)),
    [],
  );
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Calculate days to drop
  useEffect(() => {
    const d = Math.ceil((DROP_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    setDaysToDrop(d);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'l') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'h') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Home') {
        setIndex(0);
      } else if (e.key === 'End') {
        setIndex(SLIDES.length - 1);
      } else if (/^\d$/.test(e.key)) {
        const n = parseInt(e.key);
        if (n > 0 && n <= SLIDES.length) setIndex(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 60) {
      dx < 0 ? next() : prev();
    }
    touchStart.current = null;
  };

  const slide = SLIDES[index];

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white font-mono flex flex-col relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Grid BG */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Top nav */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 text-[9px] sm:text-[10px] tracking-[0.2em] border-b border-[#111]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
          <span className="text-[#39FF14]">VERITY</span>
          <span className="text-[#333]">│</span>
          <span className="text-[#666]">LAUNCH DECK</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-[#FF006E]">■ CLASSIFIED</span>
          <span className="text-[#333]">│</span>
          <span className="text-[#555]">
            SLIDE {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Slide content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-8 overflow-y-auto">
        <div key={index} className="w-full max-w-6xl animate-slide-in">
          {slide.kind === 'cover' && <CoverSlide daysToDrop={daysToDrop} />}
          {slide.kind === 'thesis' && <ThesisSlide />}
          {slide.kind === 'overview' && <OverviewSlide onSelect={setIndex} />}
          {slide.kind === 'phase' && <PhaseSlide phase={slide.phase} />}
          {slide.kind === 'metrics' && <MetricsSlide />}
          {slide.kind === 'team' && <TeamSlide />}
          {slide.kind === 'open' && <OpenSlide />}
          {slide.kind === 'close' && <CloseSlide />}
        </div>
      </main>

      {/* Bottom controls / progress */}
      <div className="relative z-10 border-t border-[#111] px-4 sm:px-6 py-3">
        {/* Progress bar */}
        <div className="flex gap-1 mb-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`flex-1 h-1 transition-all ${
                i === index
                  ? 'bg-[#39FF14]'
                  : i < index
                  ? 'bg-[#39FF14]/40'
                  : 'bg-[#222] hover:bg-[#333]'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={index === 0}
            className="text-[10px] sm:text-xs tracking-wider text-[#666] hover:text-[#39FF14] disabled:opacity-20 disabled:cursor-not-allowed py-1"
          >
            ← PREV
          </button>
          <div className="text-[9px] sm:text-[10px] tracking-widest text-[#444] hidden sm:block">
            ← → TO NAVIGATE  ·  NUM KEYS TO JUMP  ·  SWIPE ON MOBILE
          </div>
          <div className="text-[9px] tracking-widest text-[#444] sm:hidden">
            SWIPE TO NAVIGATE
          </div>
          <button
            onClick={next}
            disabled={index === SLIDES.length - 1}
            className="text-[10px] sm:text-xs tracking-wider text-[#666] hover:text-[#39FF14] disabled:opacity-20 disabled:cursor-not-allowed py-1"
          >
            NEXT →
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual slides
// ---------------------------------------------------------------------------

function CoverSlide({ daysToDrop }: { daysToDrop: number | null }) {
  return (
    <div className="text-center">
      <div className="text-[#FF006E] text-[10px] sm:text-xs tracking-[0.3em] mb-6">
        ┌──── VERITY // LAUNCH DECK ────┐
      </div>
      <h1 className="text-[#39FF14] text-5xl sm:text-7xl md:text-9xl font-bold tracking-tight leading-none mb-4">
        MAY 2026
      </h1>
      <h2 className="text-white text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-none mb-10">
        FIRST BADGE
      </h2>
      <p className="text-[#888] text-sm sm:text-lg max-w-2xl mx-auto mb-10">
        The VERITY Marketplace goes live on May 1 — the first curated wave of tokenized real-world assets.
        <br />
        This is the campaign from today to launch day — and the 30 days after.
      </p>
      <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto border-y border-[#222] py-5">
        <Stat label="TODAY" value={TODAY_LABEL} color="#666" />
        <Stat label="LAUNCH DATE" value="MAY 1 2026" color="#39FF14" />
        <Stat
          label="DAYS TO LAUNCH"
          value={daysToDrop !== null ? `T-${daysToDrop}` : '—'}
          color="#FF006E"
        />
      </div>
    </div>
  );
}

function ThesisSlide() {
  return (
    <div className="max-w-4xl mx-auto">
      <SlideTitle eyebrow="01 // THESIS" accent="#39FF14">
        WHY NOW
      </SlideTitle>
      <div className="space-y-5 text-[#ccc] text-base sm:text-xl leading-relaxed mt-8">
        <p className="text-white text-xl sm:text-2xl">
          A generation grew up on a <span className="text-[#39FF14]">trainer journey</span>. Pick a starter. Fill the registry. Trade with friends.
          <br />
          VERITY makes that journey real — with assets that actually hold value.
        </p>
        <p>
          RWA is the hottest narrative in crypto — and the most crowded. The winners will be platforms whose{' '}
          <span className="text-[#39FF14]">access feels exclusive and whose compliance feels effortless</span>.
        </p>
        <p>
          VERITY is a multi-asset RWA marketplace built on access + assurance — curated deal flow you can&apos;t get elsewhere, paired with institutional-grade compliance from day one.
        </p>
        <p>
          The Trainer Creator is the <span className="text-[#FF006E]">Trojan horse</span>. Looks like a toy. It&apos;s a lead-magnet product that filters for the exact retail audience we want, and every card mints an invite link — the origin of the referral loop.
        </p>
      </div>
      <div className="mt-10 border-l-2 border-[#39FF14] pl-6 text-white text-lg sm:text-2xl">
        A curated RWA marketplace that unlocks itself — one trainer, one route, one badge at a time.
      </div>
    </div>
  );
}

function OverviewSlide({ onSelect }: { onSelect: (i: number) => void }) {
  return (
    <div>
      <SlideTitle eyebrow="02 // CAMPAIGN AT A GLANCE" accent="#FF006E">
        FOUR PHASES
      </SlideTitle>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
        {PHASES.map((phase, i) => (
          <button
            key={phase.code}
            onClick={() => onSelect(3 + i)} // phase slides start at index 3
            className="text-left p-5 border transition-all hover:scale-[1.02] group"
            style={{
              borderColor: phase.accent + '30',
              backgroundColor: phase.accent + '08',
            }}
          >
            <div
              className="text-4xl sm:text-5xl font-bold mb-2"
              style={{ color: phase.accent }}
            >
              {phase.code}
            </div>
            <div className="text-white text-lg sm:text-xl font-bold mb-1 tracking-tight">
              {phase.name}
            </div>
            <div
              className="text-[9px] sm:text-[10px] tracking-widest mb-3"
              style={{ color: phase.accent }}
            >
              {phase.window}
            </div>
            <p className="text-[#bbb] text-xs sm:text-sm leading-relaxed">{phase.tagline}</p>
            <div className="mt-4 text-[10px] tracking-widest text-[#555] group-hover:text-[#888]">
              → CLICK FOR DETAIL
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PhaseSlide({ phase }: { phase: Phase }) {
  return (
    <div>
      <div className="flex items-baseline gap-4 sm:gap-6 mb-2 flex-wrap">
        <span
          className="text-6xl sm:text-8xl font-bold leading-none"
          style={{ color: phase.accent }}
        >
          {phase.code}
        </span>
        <div>
          <h2 className="text-white text-3xl sm:text-5xl font-bold tracking-tight">
            {phase.name}
          </h2>
          <div
            className="text-xs sm:text-sm tracking-[0.2em] mt-1"
            style={{ color: phase.accent }}
          >
            {phase.tagline}
          </div>
        </div>
      </div>

      <div
        className="inline-block px-3 py-1 text-[9px] sm:text-[11px] tracking-widest mb-6 border"
        style={{
          color: phase.accent,
          borderColor: phase.accent + '40',
          backgroundColor: phase.accent + '0a',
        }}
      >
        {phase.window}
      </div>

      <div className="mb-8 max-w-4xl">
        <div className="text-[9px] sm:text-[10px] text-[#555] tracking-widest mb-2">
          OBJECTIVE
        </div>
        <p className="text-white text-sm sm:text-lg leading-relaxed">{phase.objective}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Column heading="KEY ACTIVITIES" items={phase.activities} accent={phase.accent} />
        <Column heading="DELIVERABLES" items={phase.deliverables} accent={phase.accent} />
        <Column heading="SUCCESS METRICS" items={phase.metrics} accent={phase.accent} />
      </div>

      <div
        className="p-4 sm:p-5 border-l-2"
        style={{ borderColor: phase.accent, backgroundColor: phase.accent + '08' }}
      >
        <div
          className="text-[9px] sm:text-[10px] tracking-widest mb-2"
          style={{ color: phase.accent }}
        >
          ⊕ WHO OWNS THIS
        </div>
        <p className="text-[#ccc] text-xs sm:text-sm">{phase.ownerAsk}</p>
      </div>
    </div>
  );
}

function MetricsSlide() {
  return (
    <div>
      <SlideTitle eyebrow="05 // HOW WE MEASURE" accent="#FFB800">
        METRICS BY PHASE
      </SlideTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
        <MetricCard
          phase="PRE-LAUNCH"
          color="#39FF14"
          items={[
            'Trainer cards created',
            'Registry signups',
            'Invite link share-click ratio',
            'Viral K-factor',
            'Trainer-partner reach',
          ]}
        />
        <MetricCard
          phase="FIRST BADGE (DAY 1)"
          color="#FFB800"
          items={[
            'TVL deployed',
            'Wallets onboarded',
            'First-curation fill rate',
            'Avg deposit size',
            'Referred-wallet allocation %',
            'KYC / tx success rate',
            'X mentions / hour',
          ]}
        />
        <MetricCard
          phase="POST-LAUNCH"
          color="#FF006E"
          items={[
            'D7 retention',
            'Repeat-allocation rate',
            'Community milestones hit',
            '% TVL from referred wallets',
            'Sentiment ratio',
          ]}
        />
      </div>
    </div>
  );
}

function TeamSlide() {
  return (
    <div>
      <SlideTitle eyebrow="06 // WHAT EACH TEAM OWNS" accent="#FF006E">
        ROLES & ASKS
      </SlideTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-10">
        <TeamCard
          role="FOUNDERS"
          color="#39FF14"
          asks={[
            'Play the Professor — mentor voice, not sales. The community is on a journey; you guide it.',
            'Own the VERITY narrative — access + assurance + unlock ladder — you are the voice on X',
            'Approve trainer seed list (Phase 01)',
            'Host First Badge X Space',
            'Celebrate unlock milestones live as they fire',
            'Day +10 Professor AMA + governance unlock moderation',
          ]}
        />
        <TeamCard
          role="MARKETING"
          color="#FF006E"
          asks={[
            'Organic 4-phase content calendar (no paid media, no press blitz)',
            'Trainer seed list + briefs framed around invite-link + unlock ladder',
            'Podcast / X Space booking via warm intros',
            'First Badge real-time content',
            'Post-launch unlock celebrations + recap',
          ]}
        />
        <TeamCard
          role="PRODUCT / ENG"
          color="#FFB800"
          asks={[
            'Trainer Creator → funnel dashboard (Phase 01)',
            'Invite-link + referral attribution system (vesting logic)',
            'Harden KYC + marketplace infra for Phase 02 + 03 traffic',
            'Public unlock tracker + real-time TVL dashboard',
          ]}
        />
        <TeamCard
          role="COMMUNITY"
          color="#39FF14"
          asks={[
            'Discord soft-open + programming',
            'Weekly unlock-progress rituals through launch',
            'Moderation on First Badge day',
            'Verified referrer cohort curation + Trainer card fulfillment',
          ]}
        />
      </div>
    </div>
  );
}

function OpenSlide() {
  const items = [
    { label: 'FIRST CURATION', value: 'Which assets anchor the launch wave (real estate, treasuries, private credit, commodities)?' },
    { label: 'ENTRY MINIMUMS', value: 'Smallest allocation size for retail — anchors the accessibility story.' },
    { label: 'ASSET PARTNERS', value: 'Any co-launch issuers or institutional partners to reveal in Route 1?' },
    { label: 'TRAINER SEED LIST', value: 'Which 10 crypto-native / RWA-curious tastemakers get the first coordinated push?' },
    { label: 'UNLOCK LADDER', value: 'Specific TVL / volume thresholds for fee cuts, asset unlocks, governance activation, prize-pool trigger.' },
    { label: 'CAPSULE DESIGN', value: 'Creature companion art direction + starter trio + rarity tiers (zero Nintendo IP overlap).' },
    { label: 'TRAINER REGISTRY UX', value: 'Public /registry/[handle] profile showing trainer + creatures + allocations? Potential viral mechanic.' },
    { label: 'PRIZE POOL (~$10K)', value: 'Cohort-shared pot unlocked at a milestone, split evenly across verified referrers. Confirm trigger.' },
  ];
  return (
    <div>
      <SlideTitle eyebrow="07 // OPEN DECISIONS" accent="#FFB800">
        WHAT WE STILL NEED
      </SlideTitle>
      <div className="space-y-3 max-w-4xl mt-10">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col sm:flex-row gap-2 sm:gap-6 py-3 border-b border-[#1a1a1a]"
          >
            <div className="text-[#FFB800] text-[10px] sm:text-xs tracking-widest sm:w-48 flex-shrink-0">
              [TBD] {item.label}
            </div>
            <div className="text-[#ccc] text-sm sm:text-base">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CloseSlide() {
  return (
    <div className="text-center">
      <div className="text-[#FF006E] text-[10px] sm:text-xs tracking-[0.3em] mb-8">
        ─── END OF BRIEFING ───
      </div>
      <h2 className="text-[#39FF14] text-5xl sm:text-8xl font-bold mb-8 leading-none">
        LET&apos;S RUN IT.
      </h2>
      <p className="text-[#666] text-sm sm:text-lg max-w-xl mx-auto mb-12">
        Questions, pushback, better ideas — bring them. Nothing here is precious until we ship it.
      </p>
      <div className="text-[#333] text-[9px] sm:text-[10px] tracking-widest">
        VERITY // LAUNCH DECK v1 // {TODAY_LABEL}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[8px] sm:text-[10px] text-[#555] tracking-widest mb-1">{label}</div>
      <div className="text-base sm:text-2xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function SlideTitle({
  eyebrow,
  accent,
  children,
}: {
  eyebrow: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="text-[10px] sm:text-xs tracking-[0.3em] mb-4"
        style={{ color: accent }}
      >
        ─── {eyebrow} ───
      </div>
      <h2 className="text-white text-4xl sm:text-6xl font-bold tracking-tight leading-none">
        {children}
      </h2>
    </div>
  );
}

function Column({
  heading,
  items,
  accent,
}: {
  heading: string;
  items: string[];
  accent: string;
}) {
  return (
    <div>
      <div
        className="text-[9px] sm:text-[10px] tracking-widest mb-3 pb-2 border-b"
        style={{ color: accent, borderColor: accent + '30' }}
      >
        {heading}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-[#ccc] text-xs sm:text-sm leading-relaxed flex gap-2">
            <span style={{ color: accent }} className="flex-shrink-0">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({ phase, color, items }: { phase: string; color: string; items: string[] }) {
  return (
    <div
      className="p-5 sm:p-6 border"
      style={{ borderColor: color + '30', backgroundColor: color + '06' }}
    >
      <div
        className="text-[10px] sm:text-xs tracking-[0.2em] mb-4 pb-3 border-b"
        style={{ color, borderColor: color + '30' }}
      >
        {phase}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-[#bbb] text-xs sm:text-sm flex gap-2">
            <span style={{ color }}>◆</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamCard({ role, color, asks }: { role: string; color: string; asks: string[] }) {
  return (
    <div
      className="p-5 sm:p-6 border"
      style={{ borderColor: color + '30', backgroundColor: color + '06' }}
    >
      <div
        className="text-sm sm:text-base tracking-[0.2em] mb-4 font-bold"
        style={{ color }}
      >
        {role}
      </div>
      <ul className="space-y-2 sm:space-y-3">
        {asks.map((ask, i) => (
          <li key={i} className="text-[#ccc] text-xs sm:text-sm leading-relaxed flex gap-2">
            <span style={{ color }} className="flex-shrink-0">⊕</span>
            <span>{ask}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

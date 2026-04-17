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
    name: 'AWAKENING',
    tagline: 'Pre-launch — plant the flag',
    window: 'APR 16 – APR 22  ·  7 DAYS',
    objective:
      'Turn every visit into a signal. The Trainer Creator is our Trojan horse — it hooks taste-aware creators and their audiences into VERITY before anyone knows what the drop is. Week one is pure seeding.',
    activities: [
      'Trainer Creator is live — every card captures email + X handle',
      'Creator seeding: 10 tastemakers design + post on coordinated days',
      'Daily visual drops on X — isolated sprites, no context, build curiosity',
      'DM 50 mid-tier streetwear accounts with their personalized trainer',
      'Discord soft-open for waitlisted users (behind trainer card gate)',
    ],
    deliverables: [
      'Trainer Creator (shipped ✓)',
      '10 creator launch posts w/ unique trainers',
      '7-day content calendar (X + IG)',
      'Waitlist DB + segmentation',
    ],
    metrics: ['300+ trainer cards', '150+ waitlist emails', '5+ viral shares (10k+ each)', 'Viral K ≥ 0.4'],
    ownerAsk:
      'Founders: approve creator seed list by APR 17. Marketing: ship content cal by APR 18. Product: tracking dashboard live APR 19.',
    accent: '#39FF14',
  },
  {
    code: '02',
    name: 'IGNITION',
    tagline: 'Reveal & convert — last push to drop day',
    window: 'APR 23 – APR 30  ·  8 DAYS',
    objective:
      "Announce the drop. Educate what a Gacha is and why VERITY is different. Pre-qualify every waitlist member so May 1 is a sellout, not a gamble.",
    activities: [
      'APR 23: Drop announcement — date + Gacha mechanic reveal on X',
      '"What is a VERITY Gacha?" — 3-part explainer (mechanic, rarity, utility)',
      'Waitlist perks: 24h early-access + bonus pull for first 100',
      'Partner brand reveals (TBD with founders)',
      'Creator amplification round 2: seed list reposts + UGC remix prompts',
      'Press: Hypebeast, Highsnobiety, Complex — placements APR 28-30',
      'T-7, T-3, T-24h email drip to waitlist',
    ],
    deliverables: [
      'Gacha explainer thread / microsite',
      'Creator brief + UGC prompt pack',
      'Press kit (PDF + assets)',
      'Automated waitlist email flow',
    ],
    metrics: [
      '2x waitlist growth (300+ total)',
      'Explainer: 75k+ impressions',
      'Press: 1+ placement before drop',
      'Pre-drop survey: 30%+ "definitely buying"',
    ],
    ownerAsk:
      'Founders: publish Gacha explainer APR 23. Marketing: creator briefs + press. Product: harden infra. Community: Discord events mid-week.',
    accent: '#FF006E',
  },
  {
    code: '03',
    name: 'DROP',
    tagline: 'The day everything goes live',
    window: 'MAY 1  ·  1 DAY',
    objective:
      "Execute flawlessly. Create a moment on X so big that people who didn't know VERITY existed yesterday are asking about it tonight.",
    activities: [
      'T-1h (11am PT): X Space countdown — founders + creators',
      'T-0 (12pm PT): Drop live. Waitlist gets 24h head start.',
      'Rolling "sold out" posts — build scarcity FOMO as tiers deplete',
      'Real-time social: top pulls, rare hits, collector callouts',
      'Support surge protocol — dedicated team, 18h coverage',
      'Evening recap thread (6pm PT): "Day 1 by the numbers"',
    ],
    deliverables: [
      'Live drop experience on verity.gg',
      'Comms playbook (sellout, delay, error templates)',
      'X Space schedule + hosts',
      'Public real-time stats dashboard',
    ],
    metrics: [
      'Target units sold: TBD',
      'Sellout velocity per tier',
      'Drop-day AOV',
      'Trending on X (≥ 1 regional trend)',
      '< 1% failed transactions',
    ],
    ownerAsk:
      'Everyone on deck May 1. Founders: X Space + comms. Product/Eng: infra watch. Marketing: real-time content. Community: moderation + hype.',
    accent: '#FFB800',
  },
  {
    code: '04',
    name: 'AFTERGLOW',
    tagline: 'Post-launch — convert buzz into culture',
    window: 'MAY 2 – MAY 31  ·  30 DAYS',
    objective:
      'Turn one-time buyers into collectors and collectors into evangelists. 30 days to convert momentum into durable community. Seed the next drop while the energy is still hot.',
    activities: [
      'MAY 2: recap post — transparent numbers, thank-yous, what\'s next',
      'Week 1 (May 2-8): Daily #VerityPull repost campaign',
      'Week 2 (May 9-15): Restock decision — if sold out, tease Drop 2',
      'Week 3 (May 16-22): Founder AMA + Gacha Spotlight holder interviews',
      'Week 4 (May 23-31): June roadmap reveal — new series, utility expansion',
      'Ongoing: weekly rituals (Gacha trivia, holder raffles)',
    ],
    deliverables: [
      'Launch recap (internal + public)',
      '30-day UGC landing page',
      'Holder perks doc',
      'June roadmap teaser',
    ],
    metrics: [
      'D7 retention',
      'Repeat purchase rate (if restock)',
      'Organic UGC volume',
      'Sentiment ratio (X mentions)',
    ],
    ownerAsk:
      'Marketing: UGC + recap. Community: rituals + AMA. Founders: roadmap narrative. Product: measure everything.',
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
        DROP
      </h2>
      <p className="text-[#888] text-sm sm:text-lg max-w-2xl mx-auto mb-10">
        The full VERITY Marketplace goes live with Gachas on May 1.
        <br />
        This is the campaign from today to drop day — and the 30 days after.
      </p>
      <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto border-y border-[#222] py-5">
        <Stat label="TODAY" value={TODAY_LABEL} color="#666" />
        <Stat label="DROP DATE" value="MAY 1 2026" color="#39FF14" />
        <Stat
          label="DAYS TO DROP"
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
        <p>
          Streetwear in 2026 is drowning in AI-generated sameness. Every drop looks like every
          other drop. The winning brands are the ones whose{' '}
          <span className="text-[#39FF14]">taste feels human</span>.
        </p>
        <p>
          VERITY is a marketplace for people who care about curation over volume. Gachas are our
          wedge — a mechanic that rewards taste with rarity, community, and status.
        </p>
        <p>
          The Trainer Creator is the <span className="text-[#FF006E]">Trojan horse</span>. Looks
          like a toy. Actually a signup funnel that filters for the exact audience we want.
        </p>
      </div>
      <div className="mt-10 border-l-2 border-[#39FF14] pl-6 text-white text-lg sm:text-2xl">
        We&apos;re not launching products. We&apos;re launching a taste community that happens to
        sell Gachas.
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
          items={['Trainer cards created', 'Waitlist signups', 'Viral K-factor', 'Creator reach']}
        />
        <MetricCard
          phase="DROP DAY"
          color="#FFB800"
          items={['Units sold per tier', 'Sellout velocity', 'Drop-day AOV', 'Tx success rate', 'X mentions / hour']}
        />
        <MetricCard
          phase="POST-LAUNCH"
          color="#FF006E"
          items={['D7 retention', 'Repeat purchase rate', 'UGC posts / day', 'Sentiment ratio']}
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
            'Own the Gacha mechanic narrative — you are the voice on X',
            'Approve creator seed list (Phase 01)',
            'Host drop-day X Space',
            'Day +10 AMA on Discord',
          ]}
        />
        <TeamCard
          role="MARKETING"
          color="#FF006E"
          asks={[
            'Own content calendar across all 4 phases',
            'Creator seed list + outreach briefs',
            'Press outreach + placements',
            'Drop-day real-time content',
            'Post-launch recap + UGC campaign',
          ]}
        />
        <TeamCard
          role="PRODUCT / ENG"
          color="#FFB800"
          asks={[
            'Trainer Creator → funnel dashboard (Phase 01)',
            'Harden infra for Phase 02 + 03 traffic',
            'Drop experience UX + QA',
            'Real-time stats dashboard',
          ]}
        />
        <TeamCard
          role="COMMUNITY"
          color="#39FF14"
          asks={[
            'Discord soft-open + programming',
            'Weekly rituals through launch',
            'Moderation on drop day',
            '#VerityPull UGC curation',
          ]}
        />
      </div>
    </div>
  );
}

function OpenSlide() {
  const items = [
    { label: 'GACHA SUPPLY', value: 'How many units across what tiers? Drives sellout vs scarcity narrative.' },
    { label: 'PRICING', value: 'Entry tier pricing anchors all downstream creative.' },
    { label: 'PARTNER COLLABS', value: 'Any co-drop brands? Needed for Phase 02 reveals.' },
    { label: 'CREATOR SEED LIST', value: 'Which 10 tastemakers get the first coordinated push?' },
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

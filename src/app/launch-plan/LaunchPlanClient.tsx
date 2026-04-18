'use client';

import { useEffect, useState, useRef } from 'react';

// ---------------------------------------------------------------------------
// Config — edit dates here to re-anchor the whole playbook
// ---------------------------------------------------------------------------

const DROP_DATE = new Date('2026-05-01T12:00:00-07:00'); // Friday, May 1 2026 12pm PT
const TODAY_LABEL = 'APR 16 2026'; // static label for "where we are now" marker

// ---------------------------------------------------------------------------
// Types
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
  accentColor: string;
}

// ---------------------------------------------------------------------------
// Phase data
// ---------------------------------------------------------------------------

const PHASES: Phase[] = [
  {
    code: '01',
    name: 'AWAKENING',
    tagline: 'Pre-launch — plant the flag',
    window: 'APR 16 – APR 22 (7 days)',
    objective:
      'Turn every visit into a signal. The Trainer Creator is our Trojan horse — a lead-magnet capture product that hooks taste-driven, crypto-native retail into VERITY before we reveal the asset list. Week one is pure seeding of the retail funnel.',
    activities: [
      'Trainer Creator live — every card = waitlist email + X handle captured',
      'Creator seeding: 10 hand-picked crypto-native / RWA-curious tastemakers design their trainer and post to X over 3 coordinated days',
      'Daily visual drops on X — isolated trainer sprites + "access + assurance" teasers, no asset reveals yet',
      'DM outreach to 50 mid-tier crypto / fintech / RWA-adjacent accounts with their personalized trainer card',
      'Discord soft-open for waitlisted users (behind trainer card gate)',
    ],
    deliverables: [
      'Trainer Creator (shipped ✓)',
      '10 creator launch posts w/ unique trainers',
      '7-day content calendar (X + IG)',
      'Waitlist DB + segmentation (email, handle, trainer config, referrer, accreditation flag)',
    ],
    metrics: [
      '300+ trainer cards generated',
      '150+ waitlist emails confirmed',
      '5+ viral shares (10k+ impressions each)',
      'Viral coefficient K ≥ 0.4',
    ],
    ownerAsk:
      'Founders: approve creator seed list by Apr 17. Marketing: ship content cal by Apr 18. Product: tracking dashboard live Apr 19.',
    accentColor: '#39FF14',
  },
  {
    code: '02',
    name: 'IGNITION',
    tagline: 'Reveal & convert — last push to launch day',
    window: 'APR 23 – APR 30 (8 days)',
    objective:
      'Announce the launch. Educate what RWA actually is and why VERITY is different — curated access + institutional-grade compliance. Pre-qualify every waitlist member so May 1 is a packed launch, not a soft open.',
    activities: [
      'APR 23: Launch announcement — date + first-curation asset wave reveal thread on X',
      '"What is RWA on VERITY?" — 3-part explainer (curated asset classes, compliance architecture, how to participate)',
      'Waitlist-exclusive perks: 24h early-access window to first-curation allocations + priority KYC processing',
      'Asset partner / issuer reveals (if applicable — TBD with founders)',
      'Creator amplification round 2: seed list reposts + "what asset I\'d allocate to first" UGC prompts',
      'Press outreach: The Block, CoinDesk, Decrypt, Bankless, Milk Road — target placements APR 28-30',
      'T-7, T-3, T-24h email drip to waitlist',
    ],
    deliverables: [
      'RWA + compliance explainer microsite or thread series',
      'Creator brief + UGC prompt pack',
      'Press kit (PDF + assets)',
      'Waitlist early-access email flow (automated)',
    ],
    metrics: [
      '2x waitlist growth (target 300+ emails total)',
      'Explainer thread: 75k+ impressions',
      'Press placements: 1+ confirmed before launch',
      'Pre-launch survey: 30%+ "definitely investing"',
    ],
    ownerAsk:
      'Founders: own RWA + compliance narrative (publish APR 23). Marketing: creator briefs + press outreach. Product: harden KYC + marketplace infra for traffic spike. Community: Discord events mid-week.',
    accentColor: '#FF006E',
  },
  {
    code: '03',
    name: 'LAUNCH',
    tagline: 'The day the marketplace goes live',
    window: 'MAY 1 (1 day)',
    objective:
      "Execute flawlessly. Create a launch moment on X so big that the RWA world is asking about VERITY by EOD — and first-curation allocations fill from the waitlist up.",
    activities: [
      'T-1h (11am PT): X Space countdown with founders + asset partners',
      'T-0 (12pm PT): Marketplace live. Waitlist gets 24h head start on first-curation allocations.',
      'Rolling "fully allocated" announcements — build scarcity FOMO as initial tranches fill',
      'Real-time social updates: first investments, notable allocations, TVL milestones',
      'Support + KYC surge protocol — dedicated team covering 18h window',
      'Evening recap thread (6pm PT): "Day 1 by the numbers" (TVL, wallets, assets live)',
    ],
    deliverables: [
      'Live marketplace experience on verity domain',
      'Launch-day comms playbook (templates for full allocations, delays, KYC issues)',
      'Live X Space schedule + hosts',
      'Real-time stats dashboard (public-facing TVL + allocations ticker)',
    ],
    metrics: [
      'Target launch-day TVL: TBD with founders',
      'First-curation fill velocity (asset-by-asset)',
      'Launch-day average deposit size',
      'Trending on X (≥ 1 regional trend)',
      '< 1% failed KYC / transactions',
    ],
    ownerAsk:
      'Everyone on deck May 1. Founders: X Space + comms voice. Product/Eng: infra + KYC watch. Marketing: real-time content. Community: moderation + hype.',
    accentColor: '#FFB800',
  },
  {
    code: '04',
    name: 'AFTERGLOW',
    tagline: 'Post-launch — convert buzz into durable community',
    window: 'MAY 2 – MAY 31 (30 days)',
    objective:
      'Turn first-time investors into repeat allocators and allocators into evangelists. 30 days to convert launch momentum into durable RWA community. Seed Curation Wave 2 while the energy is still hot.',
    activities: [
      'MAY 2 recap post: transparent numbers (TVL, wallets, assets allocated), thank-yous, what\'s next',
      'WEEK 1 (May 2-8): Daily #FirstCuration UGC campaign — best first-investor stories + portfolio flexes featured',
      'WEEK 2 (May 9-15): Curation Wave 2 decision — if Wave 1 filled, announce Wave 2 asset teaser',
      'WEEK 3 (May 16-22): Founder AMA on Discord + "First Investors" holder spotlight interviews',
      'WEEK 4 (May 23-31): June roadmap reveal — new asset classes, institutional-tier teaser',
      'Ongoing: weekly community rituals (RWA primer nights, holder-only calls, compliance Q&As)',
    ],
    deliverables: [
      'Launch recap report (internal + public versions)',
      '30-day UGC / portfolio showcase landing page',
      'Investor perks doc (what early allocators get long-term)',
      'June roadmap preview (teaser graphic + short thread)',
    ],
    metrics: [
      'D7 retention of active investors (Discord, reopened emails)',
      'Repeat-allocation rate (Wave 2 conversion from Wave 1)',
      'Organic UGC share volume (posts / day using #FirstCuration)',
      'Sentiment on X (positive vs negative mention ratio)',
    ],
    ownerAsk:
      'Marketing: own UGC + recap. Community: rituals + AMA. Founders: roadmap narrative + compliance voice. Product: measure everything.',
    accentColor: '#39FF14',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LaunchPlanClient() {
  const [daysToDrop, setDaysToDrop] = useState<number | null>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate days to drop on client (avoid SSR timezone drift)
    const diff = Math.ceil((DROP_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    setDaysToDrop(diff);

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={scrollRef} className="bg-[#0a0a0a] text-white font-mono">
      {/* Fixed progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#111] z-50">
        <div
          className="h-full bg-[#39FF14] transition-all duration-100"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* Top nav */}
      <div className="fixed top-2 left-0 right-0 z-40 flex justify-between items-center px-4 sm:px-8 py-2 text-[9px] sm:text-[10px] tracking-[0.2em]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
          <span className="text-[#39FF14]">VERITY</span>
          <span className="text-[#333]">│</span>
          <span className="text-[#666]">LAUNCH PLAYBOOK</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#FF006E]">
          <span>■ CLASSIFIED — INTERNAL</span>
        </div>
      </div>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 py-20 relative overflow-hidden">
        {/* Grid BG */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Scanline */}
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
          }}
        />

        <div className="relative max-w-5xl mx-auto w-full">
          <div className="text-[#FF006E] text-[10px] sm:text-xs tracking-[0.3em] mb-6">
            ┌──── VERITY // LAUNCH PLAYBOOK ────┐
          </div>

          <h1 className="text-[#39FF14] text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-6 leading-none">
            MAY 2026
            <br />
            <span className="text-white">LAUNCH</span>
          </h1>

          <p className="text-[#888] text-base sm:text-xl max-w-2xl leading-relaxed mb-10">
            The VERITY Marketplace goes live on May 1 — the first curated wave of tokenized real-world assets, built on access + assurance.
            <br />
            This is the roadmap from today to launch day — and the 30 days after.
          </p>

          {/* Countdown / status bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-b border-[#222] py-6 max-w-3xl">
            <Stat label="TODAY" value={TODAY_LABEL} color="#666" />
            <Stat
              label="LAUNCH DATE"
              value="MAY 1 2026"
              color="#39FF14"
            />
            <Stat
              label="DAYS TO LAUNCH"
              value={daysToDrop !== null ? `T-${daysToDrop}` : '—'}
              color="#FF006E"
            />
            <Stat label="PHASES" value="04" color="#FFB800" />
          </div>

          <div className="mt-16 text-[#666] text-[10px] sm:text-xs tracking-widest animate-pulse">
            ↓ SCROLL TO BEGIN BRIEFING
          </div>
        </div>
      </section>

      {/* THESIS */}
      <Section title="01 // THESIS" accent="#39FF14">
        <div className="space-y-6 text-[#ccc] text-base sm:text-lg leading-relaxed max-w-3xl">
          <p>
            RWA is the hottest narrative in crypto — and the most crowded. Most platforms are
            single-asset-class or institutional-only, and post-FTX, retail investors are scarred.
            The winning marketplaces will be the ones whose <span className="text-[#39FF14]">access feels exclusive and whose compliance feels effortless</span>.
          </p>
          <p>
            VERITY is a multi-asset RWA marketplace built on <span className="text-[#39FF14]">access + assurance</span> —
            curated deal flow you can&apos;t get elsewhere, paired with institutional-grade compliance from day one.
          </p>
          <p>
            The Trainer Creator is the <span className="text-[#FF006E]">Trojan horse</span>. It looks
            like a toy. It&apos;s actually a lead-magnet capture product — a signup funnel that filters for the exact
            retail audience we want: crypto-native, taste-driven, ready to own real things on-chain.
          </p>
          <p className="border-l-2 border-[#39FF14] pl-4 text-white text-lg sm:text-xl">
            We&apos;re not launching another RWA marketplace. We&apos;re launching a curated layer for RWA investing — where taste meets trust.
          </p>
        </div>
      </Section>

      {/* PHASES */}
      {PHASES.map((phase, i) => (
        <PhaseSection key={phase.code} phase={phase} index={i} />
      ))}

      {/* METRICS ROLLUP */}
      <Section title="05 // HOW WE MEASURE" accent="#FFB800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
          <MetricCard
            phase="PRE-LAUNCH"
            color="#39FF14"
            items={[
              'Trainer cards created',
              'Waitlist signups',
              'Viral K-factor',
              'Creator partner reach',
            ]}
          />
          <MetricCard
            phase="LAUNCH DAY"
            color="#FFB800"
            items={[
              'TVL deployed',
              'Wallets onboarded',
              'First-curation fill rate',
              'Avg deposit size',
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
              'UGC posts / day',
              'Sentiment ratio',
            ]}
          />
        </div>
      </Section>

      {/* TEAM ASKS */}
      <Section title="06 // WHAT EACH TEAM OWNS" accent="#FF006E">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl">
          <TeamCard
            role="FOUNDERS"
            color="#39FF14"
            asks={[
              'Own the VERITY narrative — access + assurance, compliance as feature — you are the voice on X',
              'Approve creator seed list (Phase 01)',
              'Host launch-day X Space',
              'Day +10 AMA',
            ]}
          />
          <TeamCard
            role="MARKETING"
            color="#FF006E"
            asks={[
              'Own content calendar across all 4 phases',
              'Creator seed list + outreach briefs (crypto-native / RWA-curious)',
              'Press outreach + placements (crypto-native pubs)',
              'Launch-day real-time content',
              'Post-launch recap + UGC campaign',
            ]}
          />
          <TeamCard
            role="PRODUCT / ENG"
            color="#FFB800"
            asks={[
              'Trainer Creator → funnel dashboard (Phase 01)',
              'Harden KYC + marketplace infra for Phase 02 + 03 traffic',
              'Launch-day marketplace UX + QA',
              'Real-time TVL / allocations dashboard',
            ]}
          />
          <TeamCard
            role="COMMUNITY"
            color="#39FF14"
            asks={[
              'Discord soft-open + programming',
              'Weekly rituals through launch',
              'Moderation on launch day',
              '#FirstCuration UGC curation',
            ]}
          />
        </div>
      </Section>

      {/* RISKS / OPEN DECISIONS */}
      <Section title="07 // OPEN DECISIONS" accent="#FFB800">
        <div className="space-y-4 max-w-4xl">
          <OpenItem
            label="FIRST CURATION"
            value="Which assets anchor the launch wave (real estate, treasuries, private credit, commodities)? Drives narrative, press, and partner story."
          />
          <OpenItem
            label="ENTRY MINIMUMS"
            value="Smallest allocation size for retail — anchors the accessibility story across all creative."
          />
          <OpenItem
            label="ASSET PARTNERS"
            value="Any co-launch issuers or institutional partners to reveal in Phase 02?"
          />
          <OpenItem
            label="CREATOR SEED LIST"
            value="Which 10 crypto-native / RWA-curious tastemakers get the first coordinated push?"
          />
          <OpenItem
            label="INSTITUTIONAL TRACK"
            value="Do we publicly acknowledge the parallel institutional GTM, or keep that pipeline quiet through launch?"
          />
        </div>
      </Section>

      {/* CLOSE */}
      <section className="min-h-[80vh] flex flex-col justify-center px-4 sm:px-8 py-20 relative">
        <div className="max-w-4xl mx-auto w-full text-center">
          <div className="text-[#FF006E] text-[10px] sm:text-xs tracking-[0.3em] mb-6">
            ─── END OF BRIEFING ───
          </div>
          <h2 className="text-[#39FF14] text-4xl sm:text-6xl font-bold mb-6 leading-tight">
            LET&apos;S RUN IT.
          </h2>
          <p className="text-[#666] text-sm sm:text-base max-w-xl mx-auto mb-12">
            Questions, pushback, better ideas — bring them. Nothing here is precious until we ship it.
          </p>
          <div className="text-[#333] text-[9px] sm:text-[10px] tracking-widest">
            VERITY // LAUNCH PLAYBOOK v1 // {TODAY_LABEL}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[8px] sm:text-[9px] text-[#555] tracking-widest mb-1">{label}</div>
      <div className="text-lg sm:text-2xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 py-20 relative border-t border-[#111]">
      <div className="max-w-5xl mx-auto w-full">
        <div
          className="text-[10px] sm:text-xs tracking-[0.3em] mb-8"
          style={{ color: accent }}
        >
          ─── {title} ───
        </div>
        {children}
      </div>
    </section>
  );
}

function PhaseSection({ phase, index }: { phase: Phase; index: number }) {
  return (
    <section className="min-h-screen flex flex-col justify-center px-4 sm:px-8 py-20 relative border-t border-[#111]">
      <div className="max-w-5xl mx-auto w-full">
        {/* Phase header */}
        <div className="flex items-baseline gap-4 sm:gap-6 mb-2 flex-wrap">
          <span
            className="text-6xl sm:text-8xl font-bold leading-none"
            style={{ color: phase.accentColor }}
          >
            {phase.code}
          </span>
          <div>
            <h2 className="text-white text-3xl sm:text-5xl font-bold tracking-tight">
              {phase.name}
            </h2>
            <div
              className="text-xs sm:text-sm tracking-[0.2em] mt-1"
              style={{ color: phase.accentColor }}
            >
              {phase.tagline}
            </div>
          </div>
        </div>

        {/* Window bar */}
        <div
          className="inline-block px-3 py-1 text-[9px] sm:text-[11px] tracking-widest mb-8 border"
          style={{
            color: phase.accentColor,
            borderColor: phase.accentColor + '40',
            backgroundColor: phase.accentColor + '0a',
          }}
        >
          {phase.window}
        </div>

        {/* Objective */}
        <div className="max-w-3xl mb-10">
          <div className="text-[9px] sm:text-[10px] text-[#555] tracking-widest mb-2">
            OBJECTIVE
          </div>
          <p className="text-white text-base sm:text-lg leading-relaxed">{phase.objective}</p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
          <Column
            heading="KEY ACTIVITIES"
            items={phase.activities}
            accent={phase.accentColor}
          />
          <Column
            heading="DELIVERABLES"
            items={phase.deliverables}
            accent={phase.accentColor}
          />
          <Column
            heading="SUCCESS METRICS"
            items={phase.metrics}
            accent={phase.accentColor}
          />
        </div>

        {/* Owner ask */}
        <div
          className="p-4 sm:p-6 border-l-2"
          style={{
            borderColor: phase.accentColor,
            backgroundColor: phase.accentColor + '08',
          }}
        >
          <div
            className="text-[9px] sm:text-[10px] tracking-widest mb-2"
            style={{ color: phase.accentColor }}
          >
            ⊕ WHO OWNS THIS
          </div>
          <p className="text-[#ccc] text-sm sm:text-base">{phase.ownerAsk}</p>
        </div>

        {/* Phase index indicator */}
        <div className="mt-10 text-[#333] text-[9px] sm:text-[10px] tracking-widest">
          PHASE {index + 1} OF 4
        </div>
      </div>
    </section>
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
      <ul className="space-y-2 sm:space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-[#ccc] text-xs sm:text-sm leading-relaxed flex gap-2"
          >
            <span style={{ color: accent }} className="flex-shrink-0">
              →
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({
  phase,
  color,
  items,
}: {
  phase: string;
  color: string;
  items: string[];
}) {
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

function TeamCard({
  role,
  color,
  asks,
}: {
  role: string;
  color: string;
  asks: string[];
}) {
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
          <li
            key={i}
            className="text-[#ccc] text-xs sm:text-sm leading-relaxed flex gap-2"
          >
            <span style={{ color }} className="flex-shrink-0">
              ⊕
            </span>
            <span>{ask}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpenItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 py-3 border-b border-[#1a1a1a]">
      <div className="text-[#FFB800] text-[10px] sm:text-xs tracking-widest sm:w-40 flex-shrink-0">
        [TBD] {label}
      </div>
      <div className="text-[#ccc] text-sm sm:text-base">{value}</div>
    </div>
  );
}

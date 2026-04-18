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
    tagline: 'Pre-launch — plant the flag + seed the referral loop',
    window: 'APR 16 – APR 22 (7 days)',
    objective:
      'Turn every visit into a signal. The Trainer Creator is our Trojan horse — a lead-magnet capture product that hooks taste-driven, crypto-native retail into VERITY before we reveal the asset list. Every card also mints a unique invite link, turning Phase 01 into the seed layer of the referral loop.',
    activities: [
      'Trainer Creator live — every card = waitlist email + X handle captured',
      'Invite-link layer live — every trainer card generates a unique ?ref=CODE link, shared via built-in share buttons',
      'Creator seeding: 10 hand-picked crypto-native / RWA-curious tastemakers design their trainer and post their invite link on X over 3 coordinated days',
      'Daily visual drops on X — isolated trainer sprites + "access + assurance" teasers, no asset reveals yet',
      'DM outreach to 50 mid-tier crypto / fintech / RWA-adjacent accounts with their personalized trainer card',
      'Discord soft-open for waitlisted users (behind trainer card gate)',
    ],
    deliverables: [
      'Trainer Creator (shipped ✓)',
      'Invite-link referral system shipped — attribution captured at Trainer Creator signup + marketplace signup; referrer credit vests only when referred wallet completes KYC + first allocation post-launch',
      'Unlock ladder v1 drafted — TVL / volume thresholds mapped to community unlocks',
      '10 creator launch posts w/ unique trainers + invite links',
      '7-day organic content calendar (X + IG) — no paid media',
      'Waitlist DB + segmentation (email, handle, trainer config, referrer code, accreditation flag)',
    ],
    metrics: [
      '300+ trainer cards generated',
      '150+ waitlist emails confirmed',
      'Invite link share-click ratio ≥ 0.5',
      '5+ viral shares (10k+ impressions each)',
      'Viral coefficient K ≥ 0.4',
    ],
    ownerAsk:
      'Founders: approve creator seed list by Apr 17. Marketing: ship organic content cal by Apr 18. Product: invite-link attribution system + tracking dashboard live Apr 19.',
    accentColor: '#39FF14',
  },
  {
    code: '02',
    name: 'IGNITION',
    tagline: 'Reveal the unlock ladder — let creators carry it',
    window: 'APR 23 – APR 30 (8 days)',
    objective:
      'Reveal the community unlock ladder and let the creator network carry the story. No press blitz, no hashtag campaign — every conversation is built around invite links and collective milestones. Pre-qualify every waitlist member so May 1 is a packed launch.',
    activities: [
      'APR 23: Launch announcement + unlock ladder reveal thread (founders on X)',
      '"What is RWA on VERITY?" — 3-part organic thread series (curated asset classes, compliance architecture, how to participate)',
      'Waitlist-exclusive perks: 24h early-access window to first-curation allocations + priority KYC processing',
      'Asset partner / issuer reveals (if applicable — TBD with founders)',
      'Creator amplification round 2: seed list reposts + "who I\'m bringing with me" invite-link personal stories (replaces hashtag remix UGC)',
      '3–5 podcast / X Space appearances sourced via creator-network warm intros — no cold pitching, no press outreach',
      'Optional disclosed paid KOL slot — 1–2 max, surgical reach only, explicitly flagged as paid on-post',
      'T-7, T-3, T-24h email drip to waitlist',
    ],
    deliverables: [
      'Unlock ladder microsite section — primary Phase 02 story anchor',
      'RWA + compliance explainer thread series',
      'Creator brief — framed around invite-link + unlock-ladder narrative (no hashtag prompts)',
      'Podcast / X Space booking calendar, sourced via creator network',
      'Waitlist early-access email flow (automated)',
    ],
    metrics: [
      '2x waitlist growth (target 300+ emails total)',
      'Explainer thread: 75k+ impressions',
      '3+ creator-invited podcast / Space appearances',
      'Invite link click → waitlist signup conversion rate',
      'Pre-launch survey: 30%+ "definitely investing"',
    ],
    ownerAsk:
      'Founders: own unlock-ladder narrative + podcast voice (first drop APR 23). Marketing: creator briefs + podcast booking via creator network (not press). Product: harden KYC + marketplace infra; ship referral vesting logic. Community: Discord events mid-week.',
    accentColor: '#FF006E',
  },
  {
    code: '03',
    name: 'LAUNCH',
    tagline: 'The day the marketplace goes live',
    window: 'MAY 1 (1 day)',
    objective:
      "Execute flawlessly. Create a launch moment on X so big that the RWA world is asking about VERITY by EOD — and first-curation allocations fill from the waitlist up. Every allocation also moves the public unlock tracker.",
    activities: [
      'T-1h (11am PT): X Space countdown with founders + creator partners',
      'T-0 (12pm PT): Marketplace live. Waitlist gets 24h head start on first-curation allocations.',
      'Public live unlock tracker goes live — counter shows real-time progress toward the first milestone (e.g., "UNLOCK #1: Platform-wide fee cut at $1M TVL — currently $XXX,XXX")',
      'Rolling "fully allocated" announcements — build scarcity FOMO as initial tranches fill',
      'Real-time social updates: first investments, notable allocations, TVL + unlock milestone crossings',
      'Support + KYC surge protocol — dedicated team covering 18h window',
      'Evening recap thread (6pm PT): "Day 1 by the numbers" — TVL, wallets, assets live, unlock ladder state',
    ],
    deliverables: [
      'Live marketplace experience on verity domain',
      'Public live unlock tracker (embedded + shareable)',
      'Launch-day comms playbook (templates for full allocations, delays, KYC issues, unlock triggers)',
      'Live X Space schedule + hosts',
      'Real-time stats dashboard (public TVL + allocations + unlock ticker)',
    ],
    metrics: [
      'Target launch-day TVL: TBD with founders',
      'First-curation fill velocity (asset-by-asset)',
      'Launch-day average deposit size',
      'Referred-wallet share of launch-day allocations',
      'Trending on X (≥ 1 regional trend)',
      '< 1% failed KYC / transactions',
    ],
    ownerAsk:
      'Everyone on deck May 1. Founders: X Space + comms voice, celebrate unlock triggers live. Product/Eng: infra + KYC watch + unlock tracker uptime. Marketing: real-time content. Community: moderation + hype.',
    accentColor: '#FFB800',
  },
  {
    code: '04',
    name: 'AFTERGLOW',
    tagline: 'Post-launch — community co-ownership of the unlock ladder',
    window: 'MAY 2 – MAY 31 (30 days)',
    objective:
      'Turn first-time investors into repeat allocators and the verified referrer cohort into co-owners of the unlock ladder. 30 days to convert launch momentum into the milestones that open Curation Wave 2, fee cuts, governance voting, and cohort rewards.',
    activities: [
      'MAY 2 recap post: transparent numbers (TVL, wallets, assets allocated), thank-yous, unlock ladder status snapshot',
      'WEEK 1: Daily "unlock progress" updates — when each milestone triggers, a founder-led celebration post names the contributing cohort (no hashtag, natural narrative)',
      'WEEK 1: Full verified referrer cohort (everyone whose invite led to ≥1 allocated wallet) receives a standard printed Trainer card shipped IRL — collectible memento, not a leaderboard prize',
      'WEEK 2: First community unlock fires (e.g., platform-wide fee reduction goes live) → "we did it" moment',
      'WEEK 3: Founder AMA on Discord + governance voting unlock (if threshold hit) — community votes on next curation wave',
      'WEEK 4: Curation Wave 2 teaser (unlocked) + IRL launch dinner invite for the verified referrer cohort',
      'Prize-pool trigger (tentative, if confirmed): when the designated milestone trips (e.g., $5M TVL / Wave 2 unlock), announce the cohort-shared $10k pot + premium "expensive" Trainer card run — both split evenly across the verified referrer cohort. No top-N tiers, no leaderboard.',
      'Ongoing: weekly "state of the unlock ladder" post + rituals (RWA primer nights, holder-only calls, compliance Q&As)',
    ],
    deliverables: [
      'Launch recap report (public numbers + unlock ladder state)',
      'Live unlock ladder landing page (replaces the legacy UGC feed)',
      'Investor perks doc — what the ladder unlocks as more milestones hit',
      'June roadmap preview (teaser graphic + short thread)',
    ],
    metrics: [
      'D7 retention of active investors (Discord, reopened emails)',
      'Repeat-allocation rate (Wave 2 conversion from Wave 1)',
      'Community milestones hit in first 30 days',
      '% of post-launch TVL from referred wallets',
      'Sentiment on X (positive vs negative mention ratio)',
    ],
    ownerAsk:
      'Marketing: own unlock celebrations + recap (no hashtag curation). Community: rituals + AMA + cohort-card fulfillment logistics. Founders: roadmap + celebration voice. Product: measure everything, ship unlock ladder landing page.',
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
            The VERITY Marketplace goes live on May 1 — the first curated wave of tokenized real-world assets, built on access + assurance, unlocked together.
            <br />
            This is the organic, creator-led roadmap from today to launch day — and the 30 days after.
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
            like a toy. It&apos;s a lead-magnet capture product that filters for the exact retail audience
            we want — crypto-native, taste-driven, ready to own real things on-chain — and every card
            mints a unique invite link, making it the origin point of the referral loop.
          </p>
          <p>
            We&apos;re not running a hashtag campaign or a press blitz. Every user brings their tribe via
            invite link — and every trade, allocation, and new wallet moves the community toward the next
            unlock. <span className="text-[#39FF14]">When a milestone hits, the cohort that got us there splits the spoils.</span> No
            personal point systems to farm. Only collective wins.
          </p>
          <p className="border-l-2 border-[#39FF14] pl-4 text-white text-lg sm:text-xl">
            We&apos;re launching a curated RWA marketplace that unlocks itself — together.
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
              'Invite link share-click ratio',
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
      </Section>

      {/* TEAM ASKS */}
      <Section title="06 // WHAT EACH TEAM OWNS" accent="#FF006E">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl">
          <TeamCard
            role="FOUNDERS"
            color="#39FF14"
            asks={[
              'Own the VERITY narrative — access + assurance + unlock ladder — you are the voice on X',
              'Approve creator seed list (Phase 01)',
              'Host launch-day X Space',
              'Celebrate unlock milestone triggers live as they fire',
              'Day +10 AMA + governance unlock moderation',
            ]}
          />
          <TeamCard
            role="MARKETING"
            color="#FF006E"
            asks={[
              'Organic 4-phase content calendar (no paid media, no press)',
              'Creator seed list + briefs framed around invite-link + unlock ladder',
              'Podcast / X Space booking via creator-network warm intros',
              'Launch-day real-time content',
              'Post-launch unlock celebrations + recap',
            ]}
          />
          <TeamCard
            role="PRODUCT / ENG"
            color="#FFB800"
            asks={[
              'Trainer Creator → funnel dashboard (Phase 01)',
              'Invite link + referral attribution system (trainer + marketplace signup capture, vesting logic)',
              'Harden KYC + marketplace infra for Phase 02 + 03 traffic',
              'Public live unlock tracker + real-time TVL dashboard',
            ]}
          />
          <TeamCard
            role="COMMUNITY"
            color="#39FF14"
            asks={[
              'Discord soft-open + programming',
              'Weekly unlock-progress rituals through launch',
              'Moderation on launch day',
              'Verified referrer cohort curation + card fulfillment logistics',
            ]}
          />
        </div>
      </Section>

      {/* RISKS / OPEN DECISIONS */}
      <Section title="07 // OPEN DECISIONS" accent="#FFB800">
        <div className="space-y-4 max-w-4xl">
          <OpenItem
            label="FIRST CURATION"
            value="Which assets anchor the launch wave (real estate, treasuries, private credit, commodities)? Drives narrative and partner story."
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
            label="UNLOCK LADDER THRESHOLDS"
            value="Specific TVL / volume numbers for each milestone — fee cut tier, real estate unlock, private credit unlock, governance activation, prize-pool trigger."
          />
          <OpenItem
            label="PAID KOL BUDGET"
            value="Max spend envelope + # of disclosed slots for Phase 02 (0–2 suggested). Pure organic is the default — KOLs are a surgical lever, not the center of gravity."
          />
          <OpenItem
            label="PHYSICAL TRAINER PRINTS"
            value="Production partner, cost per unit, which milestones trigger the standard cohort-wide print run vs. the premium 'expensive' run."
          />
          <OpenItem
            label="PRIZE POOL (~$10K + PREMIUM CARDS)"
            value="Tentative. Cohort-shared pot unlocked at a specific community milestone, split evenly across verified referrers whose invites produced allocating wallets. Confirm: pool size, trigger milestone (suggested: Wave 2 unlock / $5M TVL), denomination (cash / USDC / platform credit / allocation credit), premium-card specs."
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

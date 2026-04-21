// ---------------------------------------------------------------------------
// VERITY — Launch Plan Content
// Source: 90-Day Launch Protocol spreadsheet (merged v2, April 2026)
// Edit here; the page binds to these constants.
// ---------------------------------------------------------------------------

export const LAUNCH_DATE = new Date('2026-05-14T00:01:00+08:00'); // 00:01 MYT — EA window opens

export const hero = {
  eyebrow: 'VERITY // 90-Day Launch Protocol',
  title: 'Verified ownership, in public.',
  subtitle:
    'May 1 – Aug 13, 2026. Three phases to move real-world collectibles onto a verified custody layer — and prove the demand with the first 1,000 Founding Vault Members.',
  launchDate: 'May 14, 2026',
  launchLabel: '00:01 MYT — Early Access window opens',
  publicLaunch: 'May 16, 2026 — public launch + results reveal',
} as const;

export const terms = [
  { term: 'EA', def: 'Early Access \u2014 the 48-hour launch window (May 14 00:01 \u2192 May 16 00:01 MYT)' },
  { term: 'EP', def: 'Spaces episode (audio, Thursdays 8PM MYT). Series runs EP01\u2013EP10.' },
  { term: 'LV', def: 'Live Vault Opens (TikTok Live pull stream, Wednesdays 8PM MYT). Series runs LV01\u2013LV13.' },
  { term: 'VCC', def: 'Verity Condition Certificate \u2014 on-chain provenance record issued when a card enters the vault.' },
  { term: 'FVM', def: 'Founding Vault Member \u2014 permanent status for the first 1,000 EA registrants.' },
  { term: 'MYT', def: 'Malaysia Time (UTC+8). All launch windows anchored to MYT.' },
  { term: 'SEA', def: 'Southeast Asia \u2014 launch region. Malaysia, Singapore, Philippines, Thailand, Indonesia.' },
] as const;

export const thesis = {
  title: 'The thesis',
  body:
    'Collectors in SEA are holding real value the market can\u2019t see. VERITY is the custody layer \u2014 verified ownership, provable authentication, and on-chain provenance for physical collectibles. Every card gets a Verity Condition Certificate (VCC) and a Digital Twin; ownership transfers without the asset ever moving.',
  primitives: [
    { name: 'Vault', role: 'The infrastructure', detail: 'Verified custody layer for physical collectibles.' },
    { name: 'VCC', role: 'The certificate', detail: 'On-chain provenance record issued when a card enters the vault.' },
    { name: 'Digital Twin', role: 'The asset', detail: 'Tradeable ownership token. Redeemable for the physical anytime.' },
    { name: 'Gacha Catch', role: 'The entry point', detail: 'Provably-fair pools. See every card before you pull. Fixed odds.' },
  ],
} as const;

export const funnel = {
  title: 'The funnel \u2014 from Trainer Tool to Vault',
  intro:
    'The Pok\u00e9mon Trainer Creator isn\u2019t a side project. It\u2019s the top of the funnel. Strangers walk in through a free, shareable trainer card; we capture email + X handle + organic social share; then the Signal-phase nurture layer warms them; finally Early Access + Gacha Catch converts the warmed cohort into Founding Vault Members and revenue.',
  stages: [
    {
      code: '01',
      layer: 'Top \u2014 Capture',
      surface: 'Pok\u00e9mon Trainer Creator',
      where: 'verity-trainer.vercel.app',
      job: 'Turn strangers into leads with a free, shareable trainer card.',
      capture: 'Email, X handle, organic social share via personal ?ref link.',
      feedsInto: 'Waitlist + Discord eligibility.',
    },
    {
      code: '02',
      layer: 'Middle \u2014 Nurture',
      surface: 'Discord \u00b7 @VerityHQ \u00b7 @VerityInsider \u00b7 Spaces',
      where: 'May 1 \u2013 May 13 (Signal phase)',
      job: 'Turn leads into a warm cohort. Build VCC vocabulary, introduce the vault, plant the EA scarcity seed.',
      capture: 'Retention, identity, trust. Discord membership surge before May 12 pre-reg.',
      feedsInto: 'Pre-registration pool ready for EA drop.',
    },
    {
      code: '03',
      layer: 'Bottom \u2014 Convert',
      surface: 'Early Access \u00b7 Vault \u00b7 VCC \u00b7 Gacha Catch',
      where: 'May 14 onward (Deploy \u2192 Compound)',
      job: 'Turn warm cohort into Founding Vault Members + paying users.',
      capture: 'Pool claims, authentication fees, custody fees, Digital Twin trades.',
      feedsInto: '1,000 permanent Founding Vault Members + revenue compound.',
    },
  ],
} as const;

export const earlyAccess = {
  title: 'Early Access — the flagship mechanic',
  summary:
    '1,000 spots. 48 hours. Never reopens. Discord members get the pre-reg link two hours before X. Pull results stay private for 48 hours before going public on May 16.',
  pillars: [
    { k: '1,000', label: 'Founding Vault Member spots \u2014 permanent, never reopens' },
    { k: '48 hrs', label: 'Early Access window (May 14 00:01 \u2192 May 16 00:01 MYT)' },
    { k: 'Discord', label: 'Pre-reg link 2 hrs before public on X (May 12, 8AM MYT)' },
    { k: 'Blackout 48h', label: 'Pull results stay private until May 16 public launch' },
  ],
  benefits: [
    'Founding Vault Member badge \u2014 permanent',
    'Private #early-access-vault Discord channel with direct team access',
    'Free first VCC + 90-day free vault storage',
    'Priority pool access on every drop (30-min preview over general)',
  ],
} as const;

export const economics = {
  title: 'Unit economics',
  note: 'Placeholder ranges \u2014 lock final pricing in pre-launch review.',
  rows: [
    { label: 'Pool entry', value: '$[TBD] \u2013 $[TBD] per pool', detail: 'User pays to pull from a Gacha Catch pool. Primary revenue.' },
    { label: 'Authentication fee', value: '$[TBD] per VCC', detail: 'Flat fee when a card enters the vault. EA members: first VCC free.' },
    { label: 'Custody fee', value: '$[TBD] per card / month', detail: 'Ongoing storage in the vault. EA members: first 90 days free.' },
    { label: 'Twin trade fee', value: '[TBD]% per transfer', detail: 'Take rate on Digital Twin secondary trades.' },
  ],
} as const;

export const phases = [
  {
    code: '01',
    name: 'Signal',
    window: 'May 1 \u2013 May 13 \u00b7 13 days',
    objective:
      'Build curiosity without naming the product. Plant the Early Access mechanic. Move Discord-first audience into position.',
    topActivity:
      'Daily teasers from @VerityHQ + irregular leaks from @VerityInsider. VCC vocabulary introduced May 7. EA announcement May 12 (Discord 8AM, public 10AM MYT).',
    support: 'Assistant runs Discord admin + spot counter. Insider voice posts 3\u20134x/week.',
    keyMoment: 'May 12 \u2014 1,000-spot pre-registration opens',
  },
  {
    code: '02',
    name: 'Deploy',
    window: 'May 14 \u2013 Jun 13 \u00b7 31 days',
    objective:
      'Execute Early Access, then the public launch. Convert EA momentum into pool activity, Discord growth, and first KOL signals.',
    topActivity:
      '48-hr EA window \u2192 May 16 public launch + pull-results reveal. Weekly Spaces (EP01\u2013EP05). Weekly pool drops. Community Challenge loop live by Day 5.',
    support: 'Assistant runs #early-access-vault + weekly wraps. KOL Tier A identification in parallel.',
    keyMoment: 'May 16 \u2014 public launch + results reveal',
  },
  {
    code: '03',
    name: 'Compound',
    window: 'Jun 14 \u2013 Aug 13 \u00b7 61 days',
    objective:
      'Scale the protocol. Land KOL contracts. Onboard Founding Merchants. Convert data into credibility for v2.',
    topActivity:
      'KOL tier A+B DM outreach Day 30. Founding Merchant soft tease Day 21, applications open Day 60. Spaces shift to bi-weekly after Day 60. v2 teased in EP10.',
    support: 'Marketing partner owns KOL + Merchant pipelines. Founding Merchants co-run #merchant-hub from Day 60.',
    keyMoment: 'Jul 14 \u2014 Founding Merchant onboarding opens (25 spots)',
  },
] as const;

export const weeklyThemes = [
  { week: '01', window: 'May 1 \u2013 7', phase: 'Signal', theme: 'Vault teasers + VCC vocabulary' },
  { week: '02', window: 'May 8 \u2013 13', phase: 'Signal', theme: 'Early Access announce \u00b7 1,000-spot race' },
  { week: '03', window: 'May 14 \u2013 20', phase: 'Deploy', theme: 'Launch window + public results reveal' },
  { week: '04', window: 'May 21 \u2013 27', phase: 'Deploy', theme: 'Pool cadence + Grading 101 (EP02 \u00b7 LV01)' },
  { week: '05', window: 'May 28 \u2013 Jun 3', phase: 'Deploy', theme: 'Community proof + Gacha mechanics (EP03 \u00b7 LV02)' },
  { week: '06', window: 'Jun 4 \u2013 10', phase: 'Deploy', theme: 'Degens week + Merchant soft tease (EP04 \u00b7 LV03)' },
  { week: '07', window: 'Jun 11 \u2013 17', phase: 'Deploy', theme: '30-day wrap \u2192 Phase 3 opens (EP05 \u00b7 LV04)' },
  { week: '08', window: 'Jun 18 \u2013 24', phase: 'Compound', theme: 'KOL spotlight (EP06 \u00b7 LV05)' },
  { week: '09', window: 'Jun 25 \u2013 Jul 1', phase: 'Compound', theme: 'Merchant signal + One Piece pilot (Day 45)' },
  { week: '10', window: 'Jul 2 \u2013 8', phase: 'Compound', theme: 'Collector psychology (EP07 \u00b7 hold vs redeem)' },
  { week: '11', window: 'Jul 9 \u2013 15', phase: 'Compound', theme: 'Merchant launch Day 60 + Yu-Gi-Oh pilot' },
  { week: '12', window: 'Jul 16 \u2013 22', phase: 'Compound', theme: 'Merchant proof (EP08) + first Grail raffle' },
  { week: '13', window: 'Jul 23 \u2013 29', phase: 'Compound', theme: 'Wild Rift pilot + data prep' },
  { week: '14', window: 'Jul 30 \u2013 Aug 5', phase: 'Compound', theme: '60-day data review (EP09)' },
  { week: '15', window: 'Aug 6 \u2013 13', phase: 'Compound', theme: 'EP10 finale + 90-day wrap + v2 tease' },
] as const;

export const v2Thesis = {
  label: 'v2 thesis (working)',
  statement:
    'Marketplace v2 \u2014 secondary Digital Twin trading with fractional custody redemption. Target: Q1 2027.',
  note: 'Teased in EP10 (Aug 7). Swap thesis if team aligns differently before finale week.',
} as const;

export const commercialKpis = {
  title: 'Commercial KPIs',
  intro:
    'Reach hitting \u2260 success. These four commercial metrics are what the visible KPIs above exist to serve.',
  rows: [
    {
      metric: 'CAC per Founding Vault Member',
      target: '$[TBD]',
      note: 'Bounded by LTV. Make the ceiling explicit before launch.',
    },
    {
      metric: 'EA \u2192 first pull conversion',
      target: '[TBD]%',
      note: 'Floor: 50%. If below, 1,000 is vanity.',
    },
    {
      metric: '30-day public user repeat pull rate',
      target: '[TBD]%',
      note: 'Proxy for LTV until real data lands. Users 1,001+.',
    },
    {
      metric: 'Day 90 GMV',
      target: '$[TBD]',
      note: 'The revenue number every other KPI exists to serve.',
    },
  ],
} as const;

export const capacity = {
  title: 'Capacity + contingency',
  intro:
    'Named backups on critical paths + pre-agreed drop-able streams. Decide under stress once is better than deciding under stress every week.',
  backups: [
    { stream: '@VerityHQ posting', primary: 'Bawsa', backup: 'Pietro' },
    { stream: '@VerityInsider', primary: 'Bawsa', backup: 'Pietro (voice coverage only)' },
    { stream: 'Discord admin (9 channels)', primary: 'Pietro', backup: 'Bawsa' },
    { stream: 'Spaces EP01\u2013EP10 host', primary: 'Bawsa', backup: 'Pietro + rotating guest' },
    { stream: 'Live Vault Opens LV01\u2013LV13', primary: 'Bawsa', backup: '\u2014 (drop-able, see below)' },
    { stream: 'KOL pipeline', primary: 'Pietro', backup: 'Bawsa (high-trust names only)' },
    { stream: 'Founding Merchant pipeline', primary: 'Bawsa', backup: 'Pietro (Day 21 onward)' },
    { stream: 'Weekly wrap + KPI post', primary: 'Pietro', backup: 'Bawsa' },
  ],
  droppable: [
    'Live Vault Opens \u2192 shift to bi-weekly if Bawsa capacity strained.',
    'Card of the Week \u2192 pause for one week; restart next.',
    'Monthly roadmap post \u2192 slip by 2 weeks without narrative damage.',
  ],
} as const;

export const kpis = [
  {
    metric: 'Early Access Registrations',
    day90: '1,000',
    note: 'Locked forever after Day 14. The flagship KPI.',
    critical: true,
  },
  {
    metric: 'X Followers (@VerityHQ)',
    day90: '15,000+',
    note: 'EA announcement drives the biggest single-day growth.',
    critical: true,
  },
  {
    metric: 'Discord Members',
    day90: '4,000+',
    note: 'Discord-first pre-reg creates the pre-launch surge.',
    critical: true,
  },
  {
    metric: 'Pools Deployed',
    day90: '40+',
    note: 'Includes merchant-built pools from Month 2.',
    critical: false,
  },
] as const;

export const community = {
  title: 'Community & loyalty stack',
  intro:
    'The retention layer that runs underneath all three phases. Built to out-engage Luka (Luka Score, Quests, Leaderboard, Raffles) and outlast Shiny (profiles, streaming, Q4 gamification) \u2014 paid in native VERITY currency, not cash.',
  stack: [
    {
      code: 'A',
      name: 'Verity Score',
      phase: 'Signal \u2192 Deploy',
      detail:
        'Account-level progression rooted in authenticated assets, not spend. Score compounds from VCCs issued, pulls claimed, Twins held, referrals landed. Profile page surfaces it publicly. Ships at public launch May 16.',
    },
    {
      code: 'B',
      name: 'Weekly quests',
      phase: 'Deploy \u2192 Compound',
      detail:
        'Three quests per week: 1 pull, 1 public post, 1 community action (vote/comment/feature nomination). Each completes a row on the member\u2019s profile. Starts Week 2 (May 21).',
    },
    {
      code: 'C',
      name: 'Public leaderboard',
      phase: 'Deploy \u2192 Compound',
      detail:
        'Top 50 by Verity Score visible site-wide. #early-access-vault members get their own sub-board. Ships Week 3 (May 28) once we have enough score distribution to make it meaningful.',
    },
    {
      code: 'D',
      name: 'Grail raffle',
      phase: 'Compound (monthly)',
      detail:
        'Replaces the generic iPhone giveaway. Every user who posted a pull that month is entered. Monthly winner takes a merchant-contributed grail card (PSA 10 tier). First draw July 14, synced with Founding Merchant open.',
    },
    {
      code: 'E',
      name: 'Founding referral tiers',
      phase: 'Deploy (permanent)',
      detail:
        '5 refs \u2192 private pool preview. 15 refs \u2192 early next-drop access. 25 refs \u2192 permanent +1 guest slot in #early-access-vault. Every ref issues a VCC credit to both sides. Turns the 1,000 EA cohort into 1,000 distribution nodes.',
    },
    {
      code: 'F',
      name: 'Public roadmap',
      phase: 'Compound',
      detail:
        'Shiny publishes theirs; we should too. Monthly roadmap post from Bawsa, pinned in #announcements. Builds transparency as a moat \u2014 turns every release into anticipated content, not surprise drops.',
    },
    {
      code: 'G',
      name: 'Live Vault Opens',
      phase: 'Deploy Week 2 \u2192 Compound',
      detail:
        'Weekly TikTok Live pull streams from Bawsa, Wed 8PM MYT. Ships Wed May 21 (LV01), offset from Thu Spaces \u2014 Mon pool drop \u2192 Wed live pulls \u2192 Thu Spaces recap. First KOL guest LV03 (Jun 4). 13 episodes through Aug 13.',
    },
  ],
} as const;

export const expansion = {
  title: 'Beyond 90 days',
  intro:
    'Pok\u00e9mon is the launch wedge. The protocol generalizes to any physical asset with provenance value. Stated intent, published monthly.',
  phases: [
    {
      code: '01',
      label: 'Phase 3 expansion',
      window: 'Within 90 days \u00b7 Jun 27 \u2013 Aug 13',
      items: [
        { date: 'Jun 27 \u00b7 Day 45', ip: 'One Piece', note: 'Closest collector psychology to Pok\u00e9mon. SEA-strong. Matches Shiny\u2019s Q2 velocity.' },
        { date: 'Jul 14 \u00b7 Day 60', ip: 'Yu-Gi-Oh', note: 'Synced to Founding Merchant open. Legacy audience, decades of secondary supply.' },
        { date: 'Jul 29 \u00b7 Day 75', ip: 'Wild Rift / Riftbound', note: 'Riot\u2019s physical TCG. Crypto-native overlap and global hype. Confirm IP scope before announce.' },
      ],
    },
    {
      code: '02',
      label: 'Scale the verticals',
      window: 'Month 4\u20136 \u00b7 Aug\u2013Oct 2026',
      items: [
        { date: 'Q3\u2013Q4', ip: 'Magic / Digimon / Flesh and Blood', note: '2\u20133 more TCG IPs based on merchant supply signal from Day 60\u20139 data.' },
        { date: 'Monthly', ip: 'Verity Roadmap post', note: 'Public roadmap becomes the recurring trust-building moment. Shiny-style transparency as moat.' },
      ],
    },
    {
      code: '03',
      label: 'Adjacent collectibles',
      window: 'Month 6+ \u00b7 Nov 2026 onward',
      items: [
        { date: 'Nov 2026', ip: 'Watches', note: 'Rolex / Patek / AP. Verified custody + Digital Twin fits luxury watch collector behavior 1:1.' },
        { date: '2027', ip: 'Sneakers \u00b7 Comics \u00b7 Handbags', note: 'Any category where provenance + condition drive >30% of the price premium.' },
      ],
    },
  ],
} as const;

export const teamNote =
  'Team in place for launch. External marketing partner role open \u2014 exploring post-launch if needed.';

export const team = [
  {
    role: 'Head',
    who: 'Bawsa',
    owns:
      'Voice on @VerityHQ, all Spaces (EP01\u2013EP10), Live Vault Opens (LV01\u2013LV13), EA announcements, pool drops, KOL conversations, merchant onboarding.',
  },
  {
    role: 'Marketing Manager',
    who: 'Pietro',
    owns:
      'Counter posts, Discord admin, mirror posts, Card of the Week, schedule protection, weekly wraps.',
  },
  {
    role: 'Insider voice',
    who: '@VerityInsider',
    owns:
      'Junior-team persona. Lowercase, casual, 3\u20134x/week Signal phase \u2192 2\u20133x/week post-launch. Never announces EA mechanics.',
  },
  {
    role: 'Marketing partner',
    who: 'Open \u2014 future',
    owns:
      'Not staffed for launch. Optional post-launch role: external agency or contractor for KOL pipeline expansion + brand kit support. Explore only if Compound-phase signal warrants it.',
  },
] as const;

export const openDecisions = [
  'First pool anchor card (Pool #1) \u2014 what gets the spotlight on May 14?',
  'Tier A KOL identity \u2014 must be an EA user themselves. Day 30 approach.',
  'Insider account identity \u2014 who runs @VerityInsider? Voice consistency matters.',
  'Founding Merchant shortlist \u2014 target 10\u201315 warm prospects for Day 60.',
  'Brand kit \u2014 final tokens (colors, type, logo) from design partner.',
] as const;

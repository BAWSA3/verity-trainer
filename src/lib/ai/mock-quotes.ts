// Hand-written sharp-edge roast pool. Brand-safe by curation: no race / sex /
// orientation / religion / disability content. Comedic targets are productivity
// LARPing, posting habits, tool obsessions, niches, Pokémon-coded character
// bits. Used by:
//   1. mockTrainer() in keyless dev to produce a deterministic quote per handle
//   2. /api/generate-trainer as a silent substitute when the live AI quote
//      trips OpenAI moderation
//
// Selection is hash-based for reproducibility — same handle hash always returns
// the same quote, which keeps demos consistent and lets the substitute path
// avoid producing a different result on each retry.

export const MOCK_QUOTE_POOL: readonly string[] = [
  // Pokémon-coded
  'would probably lose in their first Pokémon battle.',
  'brings a Magikarp to a Mewtwo fight and calls it confidence.',
  'evolves once, then quits the journey to start a substack.',
  'has a full Pokédex in Notion and zero badges to show for it.',
  'still doesn’t know what their starter is and refuses to commit.',
  'would lose to Youngster Joey on the first route.',
  'picked Charmander, didn’t evolve it, lost the league, blamed the meta.',
  'their pokémon are stronger than them at this point.',
  'rage-quits after one critical hit and posts about it for a week.',
  'still using a Bidoof in 2026 and calling it a power move.',
  // Productivity / tool LARPing
  'has 14 unfinished side projects and still posts productivity hacks.',
  'uses Linear like it’s a personality trait.',
  'has a Notion template for everything except their actual life.',
  'has read more "how to ship" essays than they’ve shipped features.',
  'starts a substack every six months, posts twice, then deletes it.',
  'has more stickers on their laptop than shipped features.',
  'their system is a system of systems they’ll get to next quarter.',
  'lives in their second-brain and visits the first one on weekends.',
  'has three OKRs and a Trello board nobody can see.',
  'reads James Clear and reorganizes their pen tray.',
  // Online behavior
  'has "thoughts on AGI" in their bio and 200 followers.',
  'screenshots their own tweets for the algorithm.',
  'follows 3000 people and reads about 12.',
  'posts a thread every Sunday and replies to themselves.',
  'subtweets their own opinions to test market fit.',
  'quote-tweets their own quote tweets.',
  'has a take on every cycle and a stake in none.',
  'liked a tweet from 2014 last month and got caught.',
  'their drafts folder has more conviction than their feed.',
  'reposts dunks to seem above the dunks.',
  // Aesthetic / vibe
  'mistakes minimalism for having nothing to say.',
  'redesigns their website more often than they update the content.',
  'their dotfiles repo has more activity than their actual job.',
  'owns three terminal emulators and uses none of them right.',
  'thinks Helvetica is a personality.',
  'their portfolio is a portfolio of portfolios.',
  'their setup costs more than their output earns.',
  'switched to a split keyboard and now types slower with attitude.',
  // Niche / takes
  'has a hot take on hot takes.',
  'has been "almost done with their book" since 2022.',
  'follows F1 on Instagram and calls themselves a fan.',
  'rewatches the same 4 movies and has theories about all of them.',
  'starts every conversation with "have you read ___" and never finishes the sentence.',
  'quotes Naval at parties and is surprised when nobody invites them back.',
  'their Spotify Wrapped is an apology letter.',
  // Behavioral tics
  'shows up early to every meeting they didn’t want to attend.',
  'agrees in the room, disagrees in the group chat ten minutes later.',
  'opens 47 tabs to research a 12-minute task.',
  'their browser history is a roadmap of unfinished curiosity.',
  'cancels plans to "ship something" and watches a documentary instead.',
  'has 3 timers running and isn’t timing anything.',
  'replies-all to one email per quarter and ruins everyone’s day.',
  // Soft self-aware
  'is everyone’s favorite person to ask, never the one being asked.',
  'is right about the future and wrong about the timing.',
  'probably overthinks this trainer card more than anyone else who pulled one.',
  'would absolutely buy a Verity card just to flex it on themselves.',
  'is the friend who reads the patch notes.',
  'their group chat depends on them more than they realize.',
];

export function mockQuoteForHash(seed: number): string {
  const idx = Math.abs(seed + 31) % MOCK_QUOTE_POOL.length;
  return MOCK_QUOTE_POOL[idx];
}

export function handleHashForQuote(handle: string): number {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = ((h << 5) - h + handle.charCodeAt(i)) | 0;
  return Math.abs(h);
}

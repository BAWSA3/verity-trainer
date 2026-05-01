// Trainer generation via Anthropic Claude (Sonnet, with vision).
//
// Falls back to deterministic mock generation when ANTHROPIC_API_KEY is unset.
// Mock mode picks valid manifest IDs based on a hash of the profile so the
// prototype demos cleanly without external dependencies.

import Anthropic from '@anthropic-ai/sdk';
import type { TrainerConfig, TrainerPersonality, Zodiac } from '@/types/trainer';
import {
  buildSystemPrompt, buildUserMessage, manifestSlots, TRAINER_TOOL,
  type ManifestSlots,
} from './prompt';
import type { XProfile } from '@/lib/x-profile';
import { ZODIAC_OPTIONS } from '@/lib/personality';

export interface GeneratedTrainer {
  config: TrainerConfig;
  personality: TrainerPersonality;
  reasoning: string;
  source: 'live' | 'mock';
}

export interface GenerateOptions {
  /** When true, perturb output for re-rolls — different seed than last time. */
  regenerate?: boolean;
  /** Free-form steering hint passed in the user message ("less corporate", etc.). */
  hint?: string;
}

const MODEL = 'claude-sonnet-4-6';

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

export async function generateTrainer(
  profile: XProfile,
  options: GenerateOptions = {},
): Promise<GeneratedTrainer> {
  const slots = manifestSlots();
  const client = getClient();
  if (!client) {
    return mockTrainer(profile, slots, options);
  }

  try {
    const liveResult = await callAnthropic(client, profile, slots, options);
    return validateAndCoerce(liveResult, slots, profile, 'live');
  } catch (err) {
    console.warn('[generate-trainer] live call failed, falling back to mock:', err);
    return mockTrainer(profile, slots, options);
  }
}

// ---------- live call ----------

async function callAnthropic(
  client: Anthropic,
  profile: XProfile,
  slots: ManifestSlots,
  options: GenerateOptions,
): Promise<{ config: TrainerConfig; personality: { zodiac: string; abilities?: unknown; knownFor?: string }; reasoning: string }> {
  const system = buildSystemPrompt(slots);
  const userText = buildUserMessage(
    profile,
    options.regenerate ? 'Make this trainer feel different from your last attempt — try a different vibe.' : options.hint,
  );

  // Build the user message with optional vision input.
  const userContent: Anthropic.Messages.ContentBlockParam[] = [{ type: 'text', text: userText }];
  if (profile.avatarUrl) {
    userContent.unshift({
      type: 'image',
      source: { type: 'url', url: profile.avatarUrl },
    });
  }

  const temperature = options.regenerate ? 0.95 : 0.7;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature,
    system: [
      // Cache the system prompt + manifest IDs across requests; only the user
      // message varies per call.
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
    ],
    tools: [TRAINER_TOOL] as unknown as Anthropic.Messages.Tool[],
    tool_choice: { type: 'tool', name: TRAINER_TOOL.name },
    messages: [{ role: 'user', content: userContent }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('model did not call submit_trainer');
  }
  const input = toolUse.input as {
    config: TrainerConfig;
    personality: { zodiac: string; abilities?: unknown; knownFor?: string };
    reasoning: string;
  };
  return input;
}

// ---------- validation + coercion ----------

function validateAndCoerce(
  raw: { config: TrainerConfig; personality: { zodiac: string; abilities?: unknown; knownFor?: string; likes?: unknown; dislikes?: unknown }; reasoning: string },
  slots: ManifestSlots,
  profile: XProfile,
  source: 'live' | 'mock',
): GeneratedTrainer {
  const seed = handleHash(profile.handle);

  // Coerce each id; if hallucinated, fall back to deterministic-random pick.
  const config: TrainerConfig = {
    body:      pickValid(raw.config?.body,      slots.body,      seed + 1),
    eyes:      pickOptional(raw.config?.eyes,    slots.eyes,      seed + 2),
    hair:      pickValid(raw.config?.hair,      slots.hair,      seed + 3),
    hairColor: pickValid(raw.config?.hairColor, slots.hairColor, seed + 4),
    outfit:    pickValid(raw.config?.outfit,    slots.outfit,    seed + 5),
    accessory: pickOptional(raw.config?.accessory, slots.accessory, seed + 6),
  };

  const validZodiacs = new Set(ZODIAC_OPTIONS.map((z) => z.id));
  const zodiac = (raw.personality?.zodiac && validZodiacs.has(raw.personality.zodiac as Zodiac))
    ? (raw.personality.zodiac as Zodiac)
    : '';

  const personality: TrainerPersonality = {
    zodiac,
    likes: [],
    dislikes: [],
    abilities: clampAbilities(raw.personality?.abilities),
    knownFor: clampKnownFor(raw.personality?.knownFor),
  };

  const reasoning = (raw.reasoning ?? '').toString().trim().slice(0, 400);

  return { config, personality, reasoning, source };
}

function pickValid(candidate: unknown, valid: string[], seed: number): string {
  if (typeof candidate === 'string' && valid.includes(candidate)) return candidate;
  if (valid.length === 0) return '';
  return valid[Math.abs(seed) % valid.length];
}

function pickOptional(candidate: unknown, valid: string[], seed: number): string {
  if (candidate === 'none') return 'none';
  if (typeof candidate === 'string' && valid.includes(candidate)) return candidate;
  // Optional layers can be 'none'; coin-flip on whether to populate.
  if (valid.length === 0) return 'none';
  if ((Math.abs(seed) & 0b11) === 0) return 'none';
  return valid[Math.abs(seed) % valid.length];
}

function clampChips(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim().slice(0, 24))
    .filter(Boolean)
    .slice(0, 5);
}

function clampAbilities(raw: unknown): { name: string; description: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
    .map((a) => ({
      name: typeof a.name === 'string' ? a.name.trim().slice(0, 32) : '',
      description: typeof a.description === 'string' ? a.description.trim().slice(0, 140) : '',
    }))
    .filter((a) => a.name.length > 0 && a.description.length > 0)
    .slice(0, 2);
}

function clampKnownFor(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ').slice(0, 200);
}

// ---------- mock fallback ----------

function mockTrainer(profile: XProfile, slots: ManifestSlots, options: GenerateOptions): GeneratedTrainer {
  const baseSeed = handleHash(profile.handle);
  const seed = options.regenerate ? baseSeed + Date.now() : baseSeed;

  const config: TrainerConfig = {
    body:      pickByIdx(slots.body,      seed + 1),
    eyes:      maybe(slots.eyes,           seed + 2),
    hair:      pickByIdx(slots.hair,      seed + 3),
    hairColor: pickByIdx(slots.hairColor, seed + 4),
    outfit:    pickByIdx(slots.outfit,    seed + 5),
    accessory: maybe(slots.accessory,      seed + 6),
  };

  const zodiacIdx = Math.abs(seed + 7) % ZODIAC_OPTIONS.length;
  const abilities = mockAbilities(seed);
  const personality: TrainerPersonality = {
    zodiac: ZODIAC_OPTIONS[zodiacIdx].id,
    likes: [],
    dislikes: [],
    abilities,
    knownFor: mockKnownFor(profile, seed),
  };

  const reasoning = profile.source === 'mock'
    ? `(demo mode) Trainer derived deterministically from @${profile.handle}. Add an ANTHROPIC_API_KEY to enable real Claude generation.`
    : `Built from @${profile.handle}'s vibe — bio, recent posts, and following count shaped these choices.`;

  return { config, personality, reasoning, source: 'mock' };
}

const MOCK_ABILITY_POOL: { name: string; description: string }[] = [
  { name: 'Quick Wit',          description: 'turns small ideas into clean systems before lunch' },
  { name: 'Crowd Reader',       description: 'reads a room before it speaks; speaks last by choice' },
  { name: 'Signal Through Noise', description: 'finds the one thread worth pulling in any thread' },
  { name: 'Late-Night Resolve', description: 'ships at 2am, debugs at 3, posts the lesson at noon' },
  { name: 'Quiet Mentor',       description: 'leaves better juniors behind without ever calling it that' },
  { name: 'Taste Maker',        description: 'small details that other people will steal next quarter' },
  { name: 'Pattern Hunter',     description: 'three weak signals + one strong question = a thesis' },
  { name: 'Builder’s Eye',  description: 'sees the load-bearing wall in every team meeting' },
];

const MOCK_KNOWN_FOR_POOL: string[] = [
  'the kind of builder who ships at 2am, posts the postmortem at noon, and quietly mentors three juniors by Friday.',
  'a signal in a feed of takes — small craft, sharp eye, the rare voice that earns its quiet.',
  'shows up early to the future and does the boring work that lets everyone else look creative.',
  'turns half-baked ideas into shipped systems and never takes the credit you’d expect them to.',
  'reads the room twice, then does exactly what nobody asked for and somehow it works.',
];

function mockAbilities(seed: number): { name: string; description: string }[] {
  const a = MOCK_ABILITY_POOL[Math.abs(seed + 11) % MOCK_ABILITY_POOL.length];
  let bIdx = Math.abs(seed + 23) % MOCK_ABILITY_POOL.length;
  if (MOCK_ABILITY_POOL[bIdx].name === a.name) bIdx = (bIdx + 1) % MOCK_ABILITY_POOL.length;
  return [a, MOCK_ABILITY_POOL[bIdx]];
}

function mockKnownFor(profile: XProfile, seed: number): string {
  const idx = Math.abs(seed + 31) % MOCK_KNOWN_FOR_POOL.length;
  return MOCK_KNOWN_FOR_POOL[idx];
}

function pickByIdx(values: string[], seed: number): string {
  if (values.length === 0) return '';
  return values[Math.abs(seed) % values.length];
}

function maybe(values: string[], seed: number): string {
  // 60% chance to populate, 40% to return 'none'.
  if (values.length === 0) return 'none';
  return ((Math.abs(seed) & 0b1111) >= 6) ? values[Math.abs(seed) % values.length] : 'none';
}

function deriveChips(profile: XProfile, positive: boolean): string[] {
  const text = (profile.bio + ' ' + profile.tweets.map((t) => t.text).join(' ')).toLowerCase();
  const candidates = positive
    ? ['shipping', 'pixel art', 'vintage finds', 'lo-fi tracks', 'old school', 'building tools', 'good design', 'small details', 'quiet weekends']
    : ['hype drops', 'doomscrolling', 'ai slop', 'bad ux', 'meetings', 'stale takes', 'surface-level posts', 'broken builds'];
  // Pull a few that "match" the text via cheap substring sniff, otherwise random.
  const matched = candidates.filter((c) => text.includes(c.split(' ')[0]));
  if (matched.length >= 3) return matched.slice(0, 5);
  const seen = new Set(matched);
  for (const c of candidates) {
    if (seen.has(c)) continue;
    seen.add(c);
    if (seen.size >= 5) break;
  }
  return [...seen];
}

function handleHash(handle: string): number {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = ((h << 5) - h + handle.charCodeAt(i)) | 0;
  return Math.abs(h);
}

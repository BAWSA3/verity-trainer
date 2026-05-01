// Prompt construction for the trainer-generator. The system prompt is cached
// across requests; the user message contains the per-handle profile data.

import { _MANIFEST } from '@/lib/trainer-options';
import { ZODIAC_OPTIONS } from '@/lib/personality';
import type { XProfile } from '@/lib/x-profile';

export interface ManifestSlots {
  body: string[];
  eyes: string[];
  hair: string[];
  hairColor: string[];
  outfit: string[];
  accessory: string[];
}

export function manifestSlots(): ManifestSlots {
  const cats = _MANIFEST.categories;
  return {
    body:      cats.body?.values.map((v) => v.id) ?? [],
    eyes:      cats.eyes?.values.map((v) => v.id) ?? [],
    hair:      cats.hair?.values.map((v) => v.id) ?? [],
    hairColor: cats.hairColor?.values.map((v) => v.id) ?? [],
    outfit:    cats.outfit?.values.map((v) => v.id) ?? [],
    accessory: cats.accessory?.values.map((v) => v.id) ?? [],
  };
}

export function buildSystemPrompt(slots: ManifestSlots): string {
  const zodiacList = ZODIAC_OPTIONS.map((z) => z.id).join(', ');
  return [
    `You are the trainer-generator for Verity, a Pokémon-trainer-themed identity tool.`,
    ``,
    `Given an X (Twitter) user's profile, recent tweets, and avatar, you assemble a hi-fi pixel-art "trainer" — a layered character + personality — that captures the vibe of who they are. The trainer becomes their Verity identity for an upcoming TCG platform.`,
    ``,
    `You return ONE result via the submit_trainer tool. Every id you return MUST come from the lists below — do not invent ids. The output should compose into a coherent character (e.g. don't pair a chef hat with sci-fi vibes unless the profile leans that way).`,
    ``,
    `LAYER OPTIONS:`,
    `- body (skin tone, required): ${slots.body.join(', ')}`,
    `- eyes (optional, can be 'none'): ${slots.eyes.concat(['none']).join(', ')}`,
    `- hair (style, required): ${slots.hair.join(', ')}`,
    `- hairColor (color variant, required): ${slots.hairColor.join(', ')}`,
    `- outfit (required): ${slots.outfit.join(', ')}`,
    `- accessory (optional, can be 'none' — includes Snapback, Backpack, Beanie, Glasses, Mustache, Beard, Monocle, etc.): ${slots.accessory.concat(['none']).join(', ')}`,
    ``,
    `PERSONALITY:`,
    `- zodiac: one of ${zodiacList}, or empty string '' if you can't tell.`,
    `- abilities: EXACTLY 2 entries. Each is { name, description } — Pokédex-style.`,
    `    name: 2-3 words, Title Case (e.g. "Quick Wit", "Crowd Reader", "Signal Through Noise"). Max 24 chars.`,
    `    description: ONE sentence, ~60-100 chars, lowercase except proper nouns. Should feel like a flavor mechanic, not a brag. Example: "reads a room before it speaks", "turns small ideas into clean systems".`,
    `    The two abilities should feel complementary, not redundant — one observational, one active.`,
    `- knownFor: a single tagline, 18-30 words, that captures the trainer's reputation. Specific to the profile. Lowercase except proper nouns. No emojis. No first-person ("I/me"). Reads like a magazine subhead. Example: "the kind of builder who ships at 2am, posts the postmortem at noon, and quietly mentors three juniors by Friday."`,
    ``,
    `CONTENT RULES (apply to abilities, knownFor, and reasoning):`,
    `- No profanity, slurs, or sexual/suggestive language — even if the subject's tweets are full of it. The card is shareable and screenshots fine for an LLM-mocking dad.`,
    `- No genitalia/anatomy slang, no kink references, no self-harm/violence imagery, no insults targeting protected classes.`,
    `- If the subject is heavily horny/edgy online, translate the vibe — "nightlife regular", "thirst-trap aesthetic", "extremely online" all work; the literal slang does not.`,
    `- Brand names + platforms are fine ("vercel deploys", "AGI doomerism"); they're signal, not impersonation.`,
    `- Don't quote tweets verbatim. Translate, don't transcribe.`,
    ``,
    `REASONING: 1-2 short sentences explaining the trainer you built — what about this profile led to these choices. Conversational tone, no markdown, no headers. Talks to the user directly ("you're clearly...").`,
    ``,
    `Be specific to the profile. Generic trainers are boring. If the profile is sparse, pick a coherent vibe and commit.`,
  ].join('\n');
}

export function buildUserMessage(profile: XProfile, hint?: string): string {
  const tweetSample = profile.tweets
    .slice(0, 30)
    .map((t, i) => `  ${i + 1}. ${t.text.replace(/\s+/g, ' ').slice(0, 280)}`)
    .join('\n');
  return [
    `X Handle: @${profile.handle}`,
    `Display Name: ${profile.name}`,
    `Bio: ${profile.bio || '(empty)'}`,
    `Location: ${profile.location || '(unset)'}`,
    `Followers: ${profile.followers}`,
    `Following: ${profile.following}`,
    ``,
    `Recent tweets:`,
    tweetSample || '  (no public tweets available)',
    hint ? `\nHint: ${hint}` : '',
  ].filter(Boolean).join('\n');
}

// Anthropic tool-use schema for structured trainer output.
export const TRAINER_TOOL = {
  name: 'submit_trainer',
  description: 'Submit the generated trainer config and personality.',
  input_schema: {
    type: 'object' as const,
    properties: {
      config: {
        type: 'object' as const,
        properties: {
          body:      { type: 'string' },
          eyes:      { type: 'string' },
          hair:      { type: 'string' },
          hairColor: { type: 'string' },
          outfit:    { type: 'string' },
          accessory: { type: 'string' },
        },
        required: ['body', 'eyes', 'hair', 'hairColor', 'outfit', 'accessory'],
      },
      personality: {
        type: 'object' as const,
        properties: {
          zodiac:    { type: 'string' },
          abilities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name:        { type: 'string', maxLength: 32 },
                description: { type: 'string', maxLength: 140 },
              },
              required: ['name', 'description'],
            },
            minItems: 2,
            maxItems: 2,
          },
          knownFor: { type: 'string', maxLength: 200 },
        },
        required: ['zodiac', 'abilities', 'knownFor'],
      },
      reasoning: { type: 'string', maxLength: 400 },
    },
    required: ['config', 'personality', 'reasoning'],
  },
};

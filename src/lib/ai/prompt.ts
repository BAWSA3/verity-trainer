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
    `- likes: 0-5 short phrases (≤24 chars each), things this person clearly enjoys based on their tweets/bio. Examples: "vintage denim", "shipping at 2am", "indie ttrpgs". Keep them specific, lowercase, no profanity.`,
    `- dislikes: 0-5 short phrases (≤24 chars each), things this person seems to hate or roast. Examples: "hype drops", "doomscrolling", "AI slop". Keep them specific, lowercase, no profanity.`,
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
          zodiac:   { type: 'string' },
          likes:    { type: 'array', items: { type: 'string' }, maxItems: 5 },
          dislikes: { type: 'array', items: { type: 'string' }, maxItems: 5 },
        },
        required: ['zodiac', 'likes', 'dislikes'],
      },
      reasoning: { type: 'string', maxLength: 400 },
    },
    required: ['config', 'personality', 'reasoning'],
  },
};

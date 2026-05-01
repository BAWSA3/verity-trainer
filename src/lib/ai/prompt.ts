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
    ``,
    `- quote: the SHARE-CARD MONEY LINE. A sharp, comedic self-roast about the user that gets a "damn I got roasted" reaction and is shareable as a flex. Pokémon-coded preferred ("would probably lose in their first Pokémon battle.") but tech / online-behavior / aesthetic burns also work.`,
    `    Length: ONE sentence, 8-22 words. Ends with a period.`,
    `    Voice: third person about the trainer (NOT first person "I", NOT direct address "you"). Reads like a friend's caption when they post your card.`,
    `    Source material: the user's bio + recent tweets + follower/following ratio + posting cadence + niches they signal.`,
    `    Examples by tone:`,
    `      "would probably lose in their first Pokémon battle."`,
    `      "has 14 unfinished side projects and still posts productivity hacks."`,
    `      "has 'thoughts on AGI' in their bio and 200 followers."`,
    `      "uses Linear like it's a personality trait."`,
    `      "screenshots their own tweets for the algorithm."`,
    `      "starts a substack every six months, posts twice, then deletes it."`,
    `      "has more stickers on their laptop than shipped features."`,
    `    Voice cues: dry, observational, gets the reader to laugh AT the trainer (the user is in on the joke). Avoid try-hard slang. No emojis. No exclamation marks.`,
    ``,
    `CONTENT RULES — BRAND-SAFE FLOOR (applies to ALL output: abilities, quote, reasoning):`,
    `- HARD BLOCKS, never produce content about: race, ethnicity, skin color, nationality, immigration, religion, sex acts, sexual orientation, gender identity, body parts, body shape, weight, mental health diagnoses, suicide/self-harm, violence, slurs of any kind, addictions, disabilities, age in the form of an ageist remark.`,
    `- HARD BLOCKS extend even when the user's tweets contain those topics. If the user is heavily horny online, translate to "nightlife regular" or "extremely online" — the slang itself never lands on the card.`,
    `- HARD PASS, totally fair game: productivity LARPing, tool obsessions (Linear, Notion, Cursor, Arc), follower/following ratios, posting cadence, side-project graveyard, AI doomerism / e-acc / VC tweets, aesthetic flexes, niches (chess, F1, anime, vintage hi-fi, etc.), Twitter behavior tics, takes that didn't age well, weekend energy, "thoughts on X" bios.`,
    `- The user must be able to laugh at it and post it on their own timeline without losing dignity. If you'd hesitate to send it as a friend's birthday card line, soften it.`,
    `- Don't quote tweets verbatim. Translate, don't transcribe.`,
    `- No emojis anywhere in the output.`,
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
          quote: { type: 'string', maxLength: 200 },
        },
        required: ['zodiac', 'abilities', 'quote'],
      },
      reasoning: { type: 'string', maxLength: 400 },
    },
    required: ['config', 'personality', 'reasoning'],
  },
};

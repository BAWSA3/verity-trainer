// X (Twitter) profile fetcher via socialdata.tools.
// https://docs.socialdata.tools — pay-per-use, ~$0.20 per 1000 fetches.
//
// In demo mode (SOCIALDATA_API_KEY unset), returns deterministic mock
// profiles keyed by a hash of the handle. Useful for prototyping the AI
// flow without external dependencies.

const SOCIALDATA_BASE = 'https://api.socialdata.tools';

export interface XProfile {
  handle: string;            // screen_name without @
  name: string;              // display name
  bio: string;
  avatarUrl: string | null;  // 400x400 profile pic if available
  followers: number;
  following: number;
  location: string;
  tweets: XTweet[];
  source: 'live' | 'mock';
}

export interface XTweet {
  text: string;
  likes: number;
  retweets: number;
  postedAt: string;
}

const profileCache = new Map<string, { value: XProfile; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchXProfile(rawHandle: string): Promise<XProfile> {
  const handle = rawHandle.replace(/^@/, '').trim().toLowerCase();
  if (!handle) throw new Error('handle required');

  const cached = profileCache.get(handle);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const apiKey = process.env.SOCIALDATA_API_KEY;
  const value: XProfile = apiKey
    ? await fetchLive(handle, apiKey)
    : mockProfile(handle);

  profileCache.set(handle, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

async function fetchLive(handle: string, apiKey: string): Promise<XProfile> {
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };

  // 1. user profile by screen_name
  const profileRes = await fetch(`${SOCIALDATA_BASE}/twitter/user/${handle}`, { headers });
  if (!profileRes.ok) {
    throw new Error(`socialdata profile ${handle}: ${profileRes.status}`);
  }
  const profile = (await profileRes.json()) as Record<string, unknown>;

  const userId = String(profile.id_str ?? profile.id ?? '');
  const name = String(profile.name ?? handle);
  const bio = String(profile.description ?? '');
  const avatarUrl = (profile.profile_image_url_https as string | undefined)
    ?.replace('_normal', '_400x400') ?? null;
  const followers = Number(profile.followers_count ?? 0);
  const following = Number(profile.friends_count ?? 0);
  const location = String(profile.location ?? '');

  // 2. recent tweets (best-effort — tolerate failure for the prototype)
  let tweets: XTweet[] = [];
  if (userId) {
    try {
      const tweetsRes = await fetch(
        `${SOCIALDATA_BASE}/twitter/user/${userId}/tweets-and-replies`,
        { headers },
      );
      if (tweetsRes.ok) {
        const data = (await tweetsRes.json()) as { tweets?: unknown[] };
        const list = Array.isArray(data.tweets) ? data.tweets : [];
        tweets = list.slice(0, 30).map((t) => {
          const tweet = t as Record<string, unknown>;
          return {
            text: String(tweet.full_text ?? tweet.text ?? ''),
            likes: Number(tweet.favorite_count ?? 0),
            retweets: Number(tweet.retweet_count ?? 0),
            postedAt: String(tweet.tweet_created_at ?? tweet.created_at ?? ''),
          };
        });
      }
    } catch (err) {
      console.warn(`[x-profile] tweets fetch failed for ${handle}:`, err);
    }
  }

  return {
    handle, name, bio, avatarUrl, followers, following, location,
    tweets, source: 'live',
  };
}

// Deterministic mock based on a hash of the handle. Lets the prototype
// compose a believable trainer without any external API.
function mockProfile(handle: string): XProfile {
  const archetype = ARCHETYPES[handleHash(handle) % ARCHETYPES.length];
  return {
    handle,
    name: archetype.name(handle),
    bio: archetype.bio,
    avatarUrl: null,
    followers: archetype.followers,
    following: Math.floor(archetype.followers * 0.4),
    location: archetype.location,
    tweets: archetype.tweets.map((text) => ({
      text, likes: 12 + (text.length % 80), retweets: text.length % 12, postedAt: '',
    })),
    source: 'mock',
  };
}

function handleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Archetype {
  name: (handle: string) => string;
  bio: string;
  location: string;
  followers: number;
  tweets: string[];
}

const ARCHETYPES: Archetype[] = [
  {
    name: (h) => `${h.replace(/[^a-z]/g, '').slice(0, 12) || 'pixel'}.eth`,
    bio: 'shipping things on the internet · onchain · gm',
    location: 'NYC',
    followers: 3400,
    tweets: [
      'shipping a new feature today, going to be huge',
      'gm to everyone except people who use the m-dash',
      'just deployed v3 — let me know what you think',
      'why are SaaS landing pages all the same',
      'unpopular opinion: most AI demos are choreographed',
      'building in public is harder than people make it look',
    ],
  },
  {
    name: (h) => h.charAt(0).toUpperCase() + h.slice(1),
    bio: 'designer · type nerd · plays too much pokémon',
    location: 'Toronto',
    followers: 1200,
    tweets: [
      'figma\'s variable system finally clicked for me today',
      'switching from sf pro to inter and i am never going back',
      'spent 2 hours nudging pixels. happy with it.',
      'ranked 1850 on showdown last night, life is good',
      'every good ui starts as a bad sketch',
      'aesthetics are not a luxury',
    ],
  },
  {
    name: (h) => `${h} | streetwear`,
    bio: 'fits · grails · vintage finds · always thrifting',
    location: 'LA',
    followers: 8800,
    tweets: [
      'cop these clean fits',
      'just copped a vintage carhartt for $40 at the rose bowl',
      'why is everyone wearing the same beige these days',
      'new drop on Friday. reminders going out tomorrow.',
      'denim and a clean tee will always beat hype',
      'shoutout to the small brands actually doing it',
    ],
  },
  {
    name: (h) => `${h.replace(/_/g, '')}`,
    bio: 'lifelong learner · chronically online · making stuff',
    location: 'Internet',
    followers: 540,
    tweets: [
      'nothing beats reading a really good blog post',
      'i have 47 tabs open and counting',
      'the more i learn the less i know',
      'building little tools makes me happy',
      'my favorite genre of writing is "person figured something out"',
      'rss is making a comeback please tell me',
    ],
  },
];

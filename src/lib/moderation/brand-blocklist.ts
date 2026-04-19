/**
 * Brand + trademark blocklist.
 *
 * Blocks trainer names that impersonate major brands / platforms to avoid
 * legal exposure and protect the VERITY brand. Entries are normalized
 * (lowercase, alphanumeric-only) at match time.
 */

export const BRANDS: readonly string[] = [
  // Gaming IP — highest risk given the trainer-journey theme
  'pokemon', 'pokémon', 'pokedex', 'pikachu', 'pokeball',
  'nintendo', 'sony', 'microsoft', 'xbox', 'playstation', 'sega',
  'marioball', 'zelda', 'sonic',

  // Entertainment / media
  'disney', 'pixar', 'marvel', 'dccomics', 'starwars', 'hbo',
  'netflix', 'spotify', 'youtube', 'tiktok',

  // Streetwear / fashion (the "gear" side)
  'nike', 'adidas', 'supreme', 'gucci', 'louisvuitton', 'lv',
  'balenciaga', 'prada', 'hermes', 'chanel', 'versace',
  'palace', 'offwhite', 'yeezy', 'bape',
  'hypebeast', 'highsnobiety', 'complex',

  // Tech / platforms
  'apple', 'iphone', 'google', 'amazon', 'meta', 'facebook',
  'instagram', 'twitter', 'openai', 'anthropic', 'chatgpt',
  'claude', 'gemini',

  // Crypto / finance
  'coinbase', 'binance', 'bitcoin', 'ethereum', 'solana',
  'opensea', 'blur', 'magiceden',
  'ftx', 'alameda',

  // VERITY-adjacent / competitor-ish
  'verity',   // protect our own brand from impersonation
  'rollie',   // example — add more as flagged
];

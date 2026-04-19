/**
 * Disposable email domain blocklist.
 *
 * Curated subset of the most common throwaway email providers. Blocks bot
 * signups that try to bypass per-IP rate limits by spinning up burner
 * inboxes.
 *
 * Not exhaustive — the full maintained list (github.com/disposable-email-
 * domains/disposable-email-domains) has ~3000+ entries. This list covers
 * the top-offenders seen in attack traffic against signup forms. Extend
 * from the audit log as new domains appear.
 *
 * All entries are lowercase. Match is exact — no wildcard; add common
 * subdomains explicitly where needed.
 */

export const DISPOSABLE_DOMAINS: readonly string[] = [
  // Mainstream throwaway services
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.de',
  'sharklasers.com',
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'tempmail.com',
  'temp-mail.com',
  'temp-mail.org',
  'tempmailaddress.com',
  'tempinbox.com',
  'temporarymail.com',
  'throwawaymail.com',
  'throwawayemailaddress.com',
  'getairmail.com',
  'fakeinbox.com',
  'fakemail.net',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'mailnesia.com',
  'maildrop.cc',
  'dispostable.com',
  'mintemail.com',
  'mohmal.com',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'spamex.com',
  'spamgourmet.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.de',
  'tmpbox.net',
  'tmpmail.net',
  'tmail.io',
  'tmail.ws',
  'tmail.com',
  'getnada.com',
  'nada.ltd',
  'nada.email',
  'inboxkitten.com',
  'incognitomail.com',
  'anonymbox.com',
  'anonymousmail.org',
  'dropmail.me',
  'emailondeck.com',
  'emailsensei.com',
  'mail-temp.com',
  'mailtothis.com',
  'moakt.com',
  'moakt.co',
  'noclickemail.com',
  'nowmymail.com',
  'oneoffemail.com',
  'oneoffmail.com',
  'plexolan.de',
  'plexusmd.com',
  'spamfree.com',
  'tempail.com',
  'tempemail.com',
  'tempemail.net',
  'tempmail.de',
  'tempmail.ninja',
  'tempmail.plus',
  'tempmail.us',
  'tempemailaddress.com',
  'tempymail.com',
  'throwawayinbox.com',
  'throwaway.email',
  'trashspam.com',
  'trbvm.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'zetmail.com',
  'jetable.org',

  // "Plus" / alias services often abused
  'spam4.me',
  'spam.la',

  // Newer entrants from 2024-2026 spam waves
  'emailfake.com',
  'email-fake.com',
  'email-temp.com',
  'fakemailgenerator.com',
  'generator.email',
  'internxt.com',
  'mailforspam.com',
  'mailpoof.com',
  'mailsac.com',
  'mailtemp.info',
  'vomoto.com',
];

/**
 * Extract and lowercase the domain portion of an email.
 * Returns null if the email is malformed.
 */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain || null;
}

/**
 * Returns true if the email's domain is a known throwaway provider.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.includes(domain);
}

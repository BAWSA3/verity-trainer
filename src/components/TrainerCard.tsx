'use client';

// TrainerCard V2 — horizontal share card matching the team mocks.
//
// Layout: [Header band] · [Bust | Identity | QR] · [Likes row] · [Dislikes row] · [Footer]
//
// Same id="trainer-card" as v1 so ShareButtons html2canvas download works
// untouched. The card is wrapped with data-flatten-glass="true" during capture
// to swap backdrop-filter for a solid fill (html2canvas can't render blur).

import { useEffect, useState } from 'react';
import type { TrainerConfig, TrainerPersonality } from '@/types/trainer';
import { ZODIAC_GLYPHS } from '@/lib/personality';
import { sanitizeChipsForDisplay } from '@/lib/moderation/sanitize';
import TrainerSprite from './TrainerSprite';
import { Chip } from './ui';

interface TrainerCardProps {
  config: TrainerConfig;
  personality: TrainerPersonality;
  trainerName: string;
  cardId?: string;
  /** Public URL for QR; defaults to NEXT_PUBLIC_APP_URL/card/<id>. */
  cardUrl?: string;
  /** AI-generated one-liner subtitle (only present for AI-generated trainers). */
  reasoning?: string;
}

export default function TrainerCard({
  config, personality, trainerName, cardId, cardUrl, reasoning,
}: TrainerCardProps) {
  // Resolve QR URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg';
  const url = cardUrl || (cardId ? appUrl + '/card/' + cardId : appUrl);

  const [qrDataUri, setQrDataUri] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(url, {
        margin: 1,
        width: 280,
        color: { dark: '#16272C', light: '#00000000' },
        errorCorrectionLevel: 'M',
      }).then((dataUri: string) => {
        if (!cancelled) setQrDataUri(dataUri);
      });
    });
    return () => { cancelled = true; };
  }, [url]);

  // Filter to chips selected for the card
  const shownLikes = filterShown(personality.likes, personality.shownLikes);
  const shownDislikes = filterShown(personality.dislikes, personality.shownDislikes);
  const safeLikes = sanitizeChipsForDisplay(shownLikes);
  const safeDislikes = sanitizeChipsForDisplay(shownDislikes);

  const zodiacGlyph = personality.zodiac ? ZODIAC_GLYPHS[personality.zodiac] : null;
  const displayName = (trainerName || 'TRAINER').toUpperCase().slice(0, 12);

  return (
    <div
      id="trainer-card"
      className="w-full max-w-[640px] rounded-3xl overflow-hidden relative"
      style={{
        background: 'rgba(255, 253, 243, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 24px 64px -16px rgba(67, 56, 202, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      }}
    >
      {/* Header band */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(90deg, rgba(255,107,92,0.95) 0%, rgba(232,85,68,0.95) 100%)',
          color: 'white',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] tracking-[0.18em]">VERITY</span>
          <span className="text-white/70 text-[12px]">·</span>
          <span className="font-pixel text-[9px] tracking-[0.18em]">TRAINER CARD</span>
        </div>
        <div data-avax-slot className="opacity-70" aria-hidden>
          {/* AVAX corner-mark slot — visual treatment deferred per plan */}
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 13 L8 3 L14 13 Z" fill="rgba(255,255,255,0.5)" />
          </svg>
        </div>
      </div>

      {/* Body row: bust | identity | QR */}
      <div className="px-5 pt-5 pb-4 flex items-stretch gap-4">
        {/* Bust */}
        <div className="flex-shrink-0">
          <div
            className="rounded-2xl p-2 relative"
            style={{
              background: 'rgba(255, 253, 243, 0.9)',
              border: '1px solid rgba(144, 179, 77, 0.4)',
              boxShadow: 'inset 0 0 0 1px rgba(144, 179, 77, 0.15)',
            }}
          >
            <TrainerSprite config={config} size={120} crop="bust" />
            {/* Olive corner caps */}
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 rounded-tl-md" style={{ borderColor: '#90B34D' }} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 rounded-tr-md" style={{ borderColor: '#90B34D' }} />
            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 rounded-bl-md" style={{ borderColor: '#90B34D' }} />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 rounded-br-md" style={{ borderColor: '#90B34D' }} />
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h2
              className="font-bold tracking-tight text-[color:var(--ink)] leading-tight truncate text-[24px] sm:text-[26px]"
              style={{ fontFamily: 'var(--font-sora), sans-serif' }}
            >
              {displayName}
            </h2>
            {reasoning ? (
              <p
                className="text-[11px] italic text-[color:var(--ink-muted)] tracking-tight mt-1 leading-snug line-clamp-2"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {reasoning.slice(0, 140)}
              </p>
            ) : (
              <p className="text-[11px] text-[color:var(--ink-muted)] tracking-tight mt-0.5 truncate font-mono">
                0x····wallet linking soon
              </p>
            )}
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {zodiacGlyph ? (
              <Chip variant="cream" size="sm">
                <span className="mr-1 text-[14px] leading-none" aria-hidden>{zodiacGlyph}</span>
                <span className="capitalize">{personality.zodiac}</span>
              </Chip>
            ) : null}
            <Chip variant="coral" size="sm">Truth Seeker</Chip>
          </div>
        </div>

        {/* QR */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1">
          <div
            className="rounded-xl p-1.5 grid place-items-center"
            style={{
              background: 'rgba(255, 253, 243, 0.85)',
              border: '1px solid rgba(22, 39, 44, 0.12)',
              width: 92,
              height: 92,
            }}
          >
            {qrDataUri ? (
              <img src={qrDataUri} alt="" aria-hidden className="w-full h-full" />
            ) : (
              <div className="w-full h-full grid place-items-center text-[10px] text-[color:var(--ink-muted)]">QR</div>
            )}
          </div>
          <span className="text-[8px] tracking-[0.16em] uppercase font-bold text-[color:var(--ink-muted)]">
            Scan
          </span>
        </div>
      </div>

      {/* Likes row */}
      {safeLikes.length > 0 && (
        <div
          className="mx-5 mb-2 px-3 py-2 rounded-xl flex items-center gap-2 flex-wrap"
          style={{ background: 'rgba(144, 179, 77, 0.14)', border: '1px solid rgba(144, 179, 77, 0.3)' }}
        >
          <span
            className="grid place-items-center rounded-md text-[11px] font-bold flex-shrink-0"
            style={{ width: 20, height: 20, background: 'rgba(144, 179, 77, 0.3)', color: '#3F5520' }}
            aria-hidden
          >
            ✓
          </span>
          <span className="text-[10px] tracking-[0.18em] uppercase font-bold flex-shrink-0" style={{ color: '#3F5520' }}>
            Likes
          </span>
          <div className="flex flex-wrap gap-1 flex-1">
            {safeLikes.map((s, i) => (
              <Chip key={i + s} variant="olive" size="sm">{s}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* Dislikes row */}
      {safeDislikes.length > 0 && (
        <div
          className="mx-5 mb-3 px-3 py-2 rounded-xl flex items-center gap-2 flex-wrap"
          style={{ background: 'rgba(22, 39, 44, 0.06)', border: '1px solid rgba(22, 39, 44, 0.2)' }}
        >
          <span
            className="grid place-items-center rounded-md text-[11px] font-bold flex-shrink-0"
            style={{ width: 20, height: 20, background: 'rgba(22, 39, 44, 0.12)', color: 'var(--ink)' }}
            aria-hidden
          >
            ✕
          </span>
          <span className="text-[10px] tracking-[0.18em] uppercase font-bold flex-shrink-0 text-[color:var(--ink)]">
            Dislikes
          </span>
          <div className="flex flex-wrap gap-1 flex-1">
            {safeDislikes.map((s, i) => (
              <Chip key={i + s} variant="dark" size="sm">{s}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-between text-[9px] tracking-[0.18em] uppercase font-bold"
        style={{
          background: 'rgba(255, 253, 243, 0.6)',
          borderTop: '1px solid rgba(22, 39, 44, 0.08)',
          color: 'var(--ink-muted)',
        }}
      >
        <span className="font-pixel">VERITY · EARLY ACCESS</span>
        <span>MAY 2026</span>
        <span className="opacity-70">Powered by <span data-avax-slot="footer">AVAX</span></span>
      </div>
    </div>
  );
}

function filterShown(items: string[], shown?: boolean[]): string[] {
  if (!shown || shown.length !== items.length) return items;
  return items.filter((_, i) => shown[i]);
}

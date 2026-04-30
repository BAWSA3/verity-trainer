'use client';

import { useCallback, useState } from 'react';

interface ShareButtonsProps {
  cardId: string;
  trainerName: string;
}

export default function ShareButtons({ cardId, trainerName }: ShareButtonsProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg';
  const cardUrl = `${appUrl}/card/${cardId}`;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (busy) return;
    const cardEl = document.getElementById('trainer-card');
    if (!cardEl) {
      setError("Couldn't find the card. Refresh and try again.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Dynamic import keeps html2canvas out of the SSR bundle (it touches `window`).
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardEl, {
        backgroundColor: '#fffdf3',  // brand cream, matches the card itself
        scale: 2,                     // 2x for retina-crispness
        useCORS: true,                // safe for same-origin sprites; defensive for any CDN
        logging: false,
        imageTimeout: 8000,
      });

      const safeName = trainerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'trainer';
      const link = document.createElement('a');
      link.download = `verity-trainer-${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('[share] download failed:', err);
      setError("Couldn't generate the image. Try again or take a screenshot.");
    } finally {
      setBusy(false);
    }
  }, [trainerName, busy]);

  const handleShare = useCallback(() => {
    const text = encodeURIComponent(
      'Verity scanned my X and made me this trainer 🎮 Make yours →',
    );
    const url = encodeURIComponent(cardUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
    );
  }, [cardUrl]);

  return (
    <div className="mt-6">
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={busy}
          className="flex-1 py-3 rounded-[2px] border-2 border-[#16272c] text-[#16272c] text-[10px] tracking-[0.18em] uppercase transition-all hover:bg-[#90b34d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-loos), sans-serif', fontWeight: 700 }}
        >
          {busy ? 'Saving…' : '⬇ Download Card'}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 py-3 rounded-[2px] text-white text-[10px] tracking-[0.18em] uppercase transition-all hover:scale-[1.005] shadow-[0_8px_20px_-8px_rgba(54,125,149,0.55)] border-2 border-[#16272c]"
          style={{
            fontFamily: 'var(--font-loos), sans-serif',
            fontWeight: 700,
            background: 'linear-gradient(134.68deg, rgb(144,179,77) 28%, rgb(54,125,149) 77%, rgb(22,39,44) 100%)',
          }}
        >
          ▶ Share to X
        </button>
      </div>
      {error && (
        <p
          className="mt-2 text-center text-[#c94d4d] text-[10px] tracking-[0.15em]"
          style={{ fontFamily: 'var(--font-loos), sans-serif' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

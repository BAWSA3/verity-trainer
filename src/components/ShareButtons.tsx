'use client';

import { useCallback, useState } from 'react';
import { Button } from './ui';

interface ShareButtonsProps {
  cardId: string;
  trainerName: string;
}

export default function ShareButtons({ cardId, trainerName }: ShareButtonsProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg';
  const cardUrl = appUrl + '/card/' + cardId;

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

    // Flatten glass effects so html2canvas can render the card cleanly
    // (backdrop-filter is not supported by html2canvas).
    const root = document.documentElement;
    const prevAttr = root.getAttribute('data-flatten-glass');
    root.setAttribute('data-flatten-glass', 'true');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardEl, {
        backgroundColor: '#fffdf3',
        scale: 2,
        useCORS: true,
        logging: false,
        imageTimeout: 8000,
      });

      const safeName = trainerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'trainer';
      const link = document.createElement('a');
      link.download = 'verity-trainer-' + safeName + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('[share] download failed:', err);
      setError("Couldn't generate the image. Try again or take a screenshot.");
    } finally {
      // Restore glass effects
      if (prevAttr === null) root.removeAttribute('data-flatten-glass');
      else root.setAttribute('data-flatten-glass', prevAttr);
      setBusy(false);
    }
  }, [trainerName, busy]);

  const handleShare = useCallback(() => {
    const text = encodeURIComponent(
      'Verity scanned my X and made me this trainer 🎮 Make yours →',
    );
    const url = encodeURIComponent(cardUrl);
    window.open(
      'https://twitter.com/intent/tweet?text=' + text + '&url=' + url,
      '_blank',
    );
  }, [cardUrl]);

  return (
    <div className="mt-6 w-full">
      <div className="flex gap-3">
        <Button variant="secondary" size="md" fullWidth onClick={handleDownload} disabled={busy}>
          {busy ? 'Saving…' : '⬇ Download'}
        </Button>
        <Button variant="primary" size="md" fullWidth onClick={handleShare}>
          Share to X →
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-center text-[color:var(--accent-coral-dark)] text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}

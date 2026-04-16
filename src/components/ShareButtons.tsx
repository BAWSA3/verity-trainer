'use client';

import { useCallback } from 'react';

interface ShareButtonsProps {
  cardId: string;
  trainerName: string;
}

export default function ShareButtons({ cardId, trainerName }: ShareButtonsProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trainer.verity.gg';
  const cardUrl = `${appUrl}/card/${cardId}`;

  const handleDownload = useCallback(async () => {
    const cardEl = document.getElementById('trainer-card');
    if (!cardEl) return;

    // Dynamic import to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardEl, {
      backgroundColor: '#0a0a0a',
      scale: 2,
    });

    const link = document.createElement('a');
    link.download = `verity-trainer-${trainerName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [trainerName]);

  const handleShare = useCallback(() => {
    const text = encodeURIComponent(
      `I just created my VERITY Trainer Card \u{1F525} Design yours before the drop \u2192`
    );
    const url = encodeURIComponent(cardUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank'
    );
  }, [cardUrl]);

  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={handleDownload}
        className="flex-1 border-2 border-[#39FF14] bg-[#39FF14]/10 text-[#39FF14]
                   font-mono text-[10px] py-3 hover:bg-[#39FF14]/20 transition-all"
      >
        [ DOWNLOAD CARD ]
      </button>
      <button
        onClick={handleShare}
        className="flex-1 border-2 border-[#FF006E] bg-[#FF006E]/10 text-[#FF006E]
                   font-mono text-[10px] py-3 hover:bg-[#FF006E]/20 transition-all"
      >
        [ SHARE TO X ]
      </button>
    </div>
  );
}

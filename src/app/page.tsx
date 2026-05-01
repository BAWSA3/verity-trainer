import Link from 'next/link';

// VERITY Landing — full-bleed loading-screen video hero with the wordmark +
// Get Started CTA centered on top. Single viewport, no scroll.

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden relative bg-[#0a0e1a]">
      {/* Full-bleed brand loading video */}
      <video
        src="/video/loading.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Soft ink gradient overlay for legibility — heavier at bottom */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,14,26,0.15) 0%, rgba(10,14,26,0.05) 40%, rgba(10,14,26,0.55) 100%)',
        }}
      />

      {/* Cream inner-frame border — preserved Verity hallmark */}
      <div className="absolute inset-0 pointer-events-none rounded-[80px] border-[24px] border-[#fffdf3]" />

      {/* Hero content — centered */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-10 px-6">
        <h1
          className="text-white tracking-tight leading-none text-[72px] sm:text-[120px] text-center"
          style={{
            fontFamily: 'var(--font-gerion), serif',
            textShadow: '0 4px 24px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          verity
        </h1>

        <Link
          href="/create"
          className="px-10 py-[18px] rounded-[40px] text-white text-[16px] sm:text-[18px] font-semibold tracking-tight transition-all hover:translate-y-[-2px]"
          style={{
            fontFamily: 'var(--font-sora), sans-serif',
            background: 'linear-gradient(180deg, #FF6B5C 0%, #E85544 100%)',
            border: '1px solid rgba(232, 85, 68, 0.6)',
            boxShadow: '0 12px 32px -8px rgba(232, 85, 68, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          Get Started →
        </Link>

        <p
          className="text-white/80 text-[12px] sm:text-[13px] tracking-[0.16em] uppercase font-semibold"
          style={{ fontFamily: 'var(--font-sora), sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          Catch your first capsule
        </p>
      </div>
    </main>
  );
}

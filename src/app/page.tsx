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
            'linear-gradient(180deg, rgba(10,14,26,0.18) 0%, rgba(10,14,26,0.05) 40%, rgba(10,14,26,0.6) 100%)',
        }}
      />

      {/* Cinematic edge vignette — replaces the cream rounded inner-frame */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 110% 90% at 50% 45%, transparent 55%, rgba(10,14,26,0.45) 100%)',
        }}
      />

      {/* Hero content — centered */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-10 px-6">
        <h1 className="sr-only">Verity</h1>
        <img
          src="/brand/verity-header.png"
          alt="Verity"
          width={1500}
          height={500}
          className="w-[320px] sm:w-[960px] h-auto select-none"
          style={{
            filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.45)) drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
          }}
          draggable={false}
        />

        <Link
          href="/create"
          className="group px-12 py-[20px] rounded-full text-[15px] sm:text-[17px] tracking-[0.18em] uppercase font-semibold transition-all hover:translate-y-[-2px] hover:shadow-2xl"
          style={{
            fontFamily: 'var(--font-sora), sans-serif',
            color: '#16272C',
            background: '#F5EFD7',
            boxShadow: '0 18px 44px -14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          <span className="inline-flex items-center gap-3">
            Get Started
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>
      </div>
    </main>
  );
}

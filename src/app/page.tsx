import Link from 'next/link';

// VERITY Landing — hero-only entry gate.
// Single viewport: brand wordmark + Get Started CTA on the Ghibli landscape.
// Clicking Get Started routes to /create (the trainer customizer).
// Design source: Figma yZhIkyn2DXRdHEusoMhtoL node 165:2 (see docs/verity-launch-v3-spec.md)

const ASSETS = '/verity-launch-v3-assets';

export default function Home() {
  return (
    <main
      className="h-screen w-screen overflow-hidden bg-[#fffdf3] text-[#333] relative"
      style={{ fontFamily: 'var(--font-sora), sans-serif' }}
    >
      {/* Ghibli landscape background */}
      <img
        src={`${ASSETS}/imgbackgroundgreenland1.png`}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle decorative card texture */}
      <img
        src={`${ASSETS}/img78.png`}
        alt=""
        aria-hidden
        className="absolute -left-[20%] -bottom-[40%] w-[140%] opacity-15 rotate-[-16.68deg] pointer-events-none select-none"
      />

      {/* Cream inner-frame border — Figma hero hallmark */}
      <div className="absolute inset-0 pointer-events-none rounded-[80px] border-[24px] border-[#fffdf3]" />

      {/* Hero content — centered, no scroll */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-10 px-6">
        <div className="flex items-end gap-4 sm:gap-6">
          <img
            src={`${ASSETS}/imgframe3.svg`}
            alt=""
            aria-hidden
            className="w-[60px] sm:w-[123px] h-auto"
          />
          <h1
            className="text-white tracking-tight leading-none text-[72px] sm:text-[107px]"
            style={{
              fontFamily: 'var(--font-gerion), serif',
              textShadow: '2px 4px 4px rgba(0,0,0,0.2)',
            }}
          >
            verity
          </h1>
        </div>

        <Link
          href="/create"
          className="px-10 py-[23px] rounded-[40px] bg-black/25 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all text-white text-[20px] sm:text-[24px]"
          style={{ fontFamily: 'var(--font-sora)', fontWeight: 700 }}
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}

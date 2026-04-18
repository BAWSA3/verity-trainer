import Link from 'next/link';

// VERITY Landing V3 — Ghibli / TCG aesthetic
// Design source: Figma yZhIkyn2DXRdHEusoMhtoL node 165:2 (see docs/verity-launch-v3-spec.md)
// Assets in /public/verity-launch-v3-assets/. Pokemon card scans were swapped for placeholders
// (public assets include only the IP-safe files; see commit notes).

const ASSETS = '/verity-launch-v3-assets';

// Fonts are set up as CSS variables in layout.tsx:
//   --font-sora (UI body)
//   --font-loos (Space Grotesk — stand-in for Loos Extended)
//   --font-gerion (DM Serif Display — stand-in for Gerion Demo)
//   --font-neue (Inter — stand-in for PP Neue Montreal)

export default function Home() {
  return (
    <main
      className="min-h-screen bg-[#fffdf3] text-[#333] overflow-x-hidden"
      style={{ fontFamily: 'var(--font-sora), sans-serif' }}
    >
      {/* =============== NAV BAR =============== */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw]">
        <div
          className="flex items-center gap-8 sm:gap-16 px-6 sm:px-14 py-4 rounded-[48px] border border-white/20 backdrop-blur-md"
          style={{
            background:
              'linear-gradient(-76.38deg, rgba(134,165,25,0.3) 8%, rgba(110,171,191,0.3) 57%, rgba(228,222,188,0.3) 110%)',
          }}
        >
          <Link href="/" aria-label="VERITY home" className="shrink-0">
            <img src={`${ASSETS}/imgframe4.svg`} alt="" width={32} height={22} />
          </Link>
          <div className="flex items-center gap-4 sm:gap-8 text-white text-sm sm:text-[18px]" style={{ fontFamily: 'var(--font-sora)' }}>
            <Link href="/" className="font-bold">Home</Link>
            <Link href="/create" className="font-light hover:font-bold transition-all">Explore</Link>
            <Link href="/create" className="font-light hover:font-bold transition-all">Card</Link>
            <Link href="/create" className="font-light hover:font-bold transition-all">Game</Link>
          </div>
        </div>
      </nav>

      {/* =============== HERO =============== */}
      <section className="relative h-[100vh] min-h-[720px] max-h-[973px] overflow-hidden">
        {/* Landscape background */}
        <img
          src={`${ASSETS}/imgbackgroundgreenland1.png`}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Decorative rotated card texture — subtle */}
        <img
          src={`${ASSETS}/img78.png`}
          alt=""
          aria-hidden
          className="absolute -left-[20%] -bottom-[40%] w-[140%] opacity-20 rotate-[-16.68deg] pointer-events-none select-none"
        />
        {/* Rounded inner border frame — the cream "frame" look */}
        <div className="absolute inset-0 pointer-events-none rounded-[80px] border-[24px] border-[#fffdf3]" />

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-8 px-6">
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
            className="px-10 py-[23px] rounded-[40px] bg-black/20 hover:bg-black/35 backdrop-blur-md border border-white/0 transition-all text-white text-[20px] sm:text-[24px]"
            style={{ fontFamily: 'var(--font-sora)', fontWeight: 700 }}
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* =============== SCRATCH FOR CHASE BANNER =============== */}
      <section className="relative py-24 px-6 flex justify-center">
        <div
          className="relative w-full max-w-[1200px] h-[520px] sm:h-[630px] rounded-[40px] border border-white overflow-hidden flex items-center justify-center"
          style={{
            background:
              'linear-gradient(143.82deg, rgba(228,222,188,0.3) 30%, rgba(129,154,0,0.3) 71%, rgba(81,97,0,0.3) 93%)',
          }}
        >
          {/* Background card scan texture */}
          <img
            src={`${ASSETS}/img78.png`}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-20 rotate-[-28deg] pointer-events-none"
          />

          {/* Decorative sparkles */}
          <img src={`${ASSETS}/img73.png`} alt="" aria-hidden className="absolute top-[-20px] right-[10%] w-[180px] opacity-80 pointer-events-none" />
          <img src={`${ASSETS}/img71.png`} alt="" aria-hidden className="absolute bottom-[25%] left-[30%] w-[140px] opacity-60 pointer-events-none" />

          {/* Cards — 3 rotated */}
          <div className="relative flex items-center justify-center gap-6 sm:gap-0 w-full h-full">
            {/* Left card */}
            <div
              className="hidden sm:block absolute left-[8%] top-1/2 -translate-y-1/2 -rotate-[20deg] w-[220px] h-[308px] lg:w-[303px] lg:h-[424px] rounded-[14px] shadow-[0_0_60px_20px_white]"
              style={{ background: 'linear-gradient(203.73deg, rgb(144,179,77) 15%, rgb(17,24,5) 143%)' }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-[120px] text-white/20 font-bold"
                style={{ fontFamily: 'var(--font-loos)', transform: 'rotate(20deg)' }}
              >?</span>
            </div>
            {/* Right card */}
            <div
              className="hidden sm:block absolute right-[8%] top-1/2 -translate-y-1/2 rotate-[20deg] w-[220px] h-[308px] lg:w-[303px] lg:h-[424px] rounded-[14px] shadow-[0_0_60px_20px_white]"
              style={{ background: 'linear-gradient(158deg, rgb(228,222,188) 22%, rgb(77,74,56) 129%)' }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-[120px] text-white/20 font-bold"
                style={{ fontFamily: 'var(--font-loos)', transform: 'rotate(-20deg)' }}
              >?</span>
            </div>
            {/* Center hero card */}
            <div
              className="relative w-[240px] h-[340px] sm:w-[300px] sm:h-[425px] lg:w-[328px] lg:h-[459px] rounded-[14px] shadow-[0_0_60px_20px_white]"
              style={{ background: 'linear-gradient(180deg, #6fadc2 0%, #16272c 161%)' }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-[160px] text-white/20 font-bold"
                style={{ fontFamily: 'var(--font-loos)' }}
              >?</span>
            </div>
          </div>

          {/* Headline */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-[12%] text-center uppercase leading-[1.1] tracking-[-0.05em] text-[32px] sm:text-[48px] lg:text-[57px] bg-clip-text text-transparent px-4 whitespace-pre-line"
            style={{
              fontFamily: 'var(--font-loos)',
              fontWeight: 700,
              backgroundImage: 'linear-gradient(90deg, #e6ddb8 0%, #fff 28%, #fff 62%, #e6ddb8 100%)',
              textShadow: '0 4px 20px #1b2201',
              WebkitBackgroundClip: 'text',
            }}
          >
            {'Scratch for Chase\nClaim your Grail'}
          </div>

          {/* Union logo mark */}
          <img
            src={`${ASSETS}/imgunion.svg`}
            alt=""
            aria-hidden
            className="absolute left-[44%] top-[20%] w-[70px] opacity-80 pointer-events-none hidden sm:block"
          />

          {/* Bottom olive gradient floor */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(111,138,58,0), rgba(111,138,58,0.3))' }}
          />
        </div>

        {/* Carousel dots */}
        <img
          src={`${ASSETS}/imggroup2609358.svg`}
          alt=""
          aria-hidden
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[88px]"
        />
      </section>

      {/* =============== CARD SHOWCASE =============== */}
      <section className="relative py-20 px-6 flex justify-center overflow-hidden">
        {/* Decorative big card scan behind */}
        <img
          src={`${ASSETS}/imgcgp171.png`}
          alt=""
          aria-hidden
          className="absolute left-0 top-0 w-[70%] max-w-[1498px] opacity-40 pointer-events-none -z-0"
        />
        {/* Sparkle accents */}
        <img src={`${ASSETS}/img73.png`} alt="" aria-hidden className="absolute right-[10%] top-0 w-[200px] opacity-70 pointer-events-none" />
        <img src={`${ASSETS}/img73.png`} alt="" aria-hidden className="absolute left-[20%] bottom-[10%] w-[160px] opacity-50 pointer-events-none rotate-45" />

        <div className="relative z-10 flex items-center justify-center gap-6 w-full max-w-6xl h-[460px] sm:h-[525px]">
          {/* Left fanned card */}
          <div className="hidden md:block relative">
            <img
              src={`${ASSETS}/imga852a10702cc7e9b82cad670c3cc0c1d1.png`}
              alt="Featured card"
              className="w-[240px] h-auto rounded-[15px] -rotate-[14deg] shadow-[0_30px_50px_10px_rgba(255,255,255,0.6)]"
            />
          </div>
          {/* Center hero card */}
          <div className="relative">
            <img
              src={`${ASSETS}/imga852a10702cc7e9b82cad670c3cc0c1d2.jpg`}
              alt="Featured card"
              className="w-[280px] sm:w-[373px] h-auto rounded-[19px] shadow-[0_40px_60px_20px_rgba(255,255,255,0.7)]"
            />
          </div>
          {/* Right fanned card */}
          <div className="hidden md:block relative">
            <img
              src={`${ASSETS}/imga852a10702cc7e9b82cad670c3cc0c1d4.png`}
              alt="Featured card"
              className="w-[240px] h-auto rounded-[15px] rotate-[14deg] shadow-[0_30px_50px_10px_rgba(255,255,255,0.6)] blur-[1px]"
            />
          </div>
        </div>
      </section>

      {/* =============== CARD DETAIL / STATS =============== */}
      <section className="px-6 py-20 flex justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[436px_1fr] gap-6">
          {/* LEFT — card info */}
          <div
            className="relative p-8 rounded-[40px] border border-white/20 overflow-hidden flex flex-col justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(228,222,188,0.3) 0%, rgba(111,173,194,0.2) 100%)',
            }}
          >
            <h3 className="text-[#333] text-[22px] sm:text-[28px] mb-2" style={{ fontFamily: 'var(--font-sora)' }}>
              Prototype Card #001
              <br />
              Sample Edition
            </h3>
            <p className="text-[#333] text-[16px] sm:text-[20px] mb-2" style={{ fontFamily: 'var(--font-sora)' }}>
              Market Value
            </p>
            <p className="text-[36px] sm:text-[48px] font-normal" style={{ fontFamily: 'var(--font-sora)', color: '#0073f9' }}>
              $450
            </p>
          </div>

          {/* RIGHT — chips + metadata */}
          <div
            className="relative p-8 rounded-[40px] border border-white/20 overflow-hidden flex flex-col gap-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(228,222,188,0.3) 0%, rgba(111,173,194,0.2) 100%)',
            }}
          >
            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { value: '10', label: 'PSA Grade' },
                { value: 'Gem Mint', label: 'Condition' },
                { value: '330', label: 'HP' },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-white py-4"
                  style={{ background: 'rgba(255,255,255,0.3)' }}
                >
                  <span className="text-[#333] text-[18px] sm:text-[24px]" style={{ fontFamily: 'var(--font-sora)' }}>
                    {chip.value}
                  </span>
                  <span className="text-[#333] text-[12px] sm:text-[18px]" style={{ fontFamily: 'var(--font-neue)' }}>
                    {chip.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Metadata table */}
            <div className="flex flex-col gap-3 text-[14px] sm:text-[18px]" style={{ fontFamily: 'var(--font-sora)' }}>
              {[
                ['Artist', 'Studio Verity'],
                ['Release Date', 'May 1, 2026'],
                ['Card Type', 'Collectible'],
                ['Foil Type', 'Holofoil'],
                ['Condition', 'Gem Mint'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-white/20 pb-2">
                  <span className="text-[#333]/70">{label}</span>
                  <span className="text-[#333] font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =============== FEATURE GRID =============== */}
      <section className="px-6 py-16 flex justify-center">
        <div
          className="relative w-full max-w-[1392px] rounded-[60px] overflow-hidden p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6"
          style={{
            background: 'linear-gradient(134.68deg, rgb(144,179,77) 28%, rgb(54,125,149) 77%, rgb(0,0,0) 100%)',
          }}
        >
          {/* Decorative background texture */}
          <img
            src={`${ASSETS}/imgcgp102.png`}
            alt=""
            aria-hidden
            className="absolute right-0 top-0 w-[80%] opacity-20 rotate-[14.75deg] pointer-events-none select-none"
          />
          <img
            src={`${ASSETS}/img77.png`}
            alt=""
            aria-hidden
            className="absolute -left-[10%] -top-[10%] w-[50%] opacity-30 -rotate-45 pointer-events-none"
          />
          <img src={`${ASSETS}/img73.png`} alt="" aria-hidden className="absolute top-[-20px] left-[30%] w-[180px] opacity-60 pointer-events-none" />
          <img src={`${ASSETS}/img73.png`} alt="" aria-hidden className="absolute bottom-[15%] right-[5%] w-[180px] opacity-60 pointer-events-none" />

          {/* GACHA CARD */}
          <Link
            href="/create"
            className="relative rounded-[40px] overflow-hidden border border-white/0 min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-between p-8 text-center hover:scale-[1.01] transition-transform"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <h3
              className="uppercase leading-[1.1] tracking-[-0.02em] text-[32px] sm:text-[48px] bg-clip-text text-transparent"
              style={{
                fontFamily: 'var(--font-loos)',
                fontWeight: 700,
                backgroundImage: 'linear-gradient(90deg, #e6ddb8 0%, #fff 74%, #e6ddb8 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              Capsule
            </h3>
            <img
              src={`${ASSETS}/imggachaball.png`}
              alt="Capsule"
              className="w-[60%] sm:w-[80%] max-w-[400px] h-auto opacity-90 pointer-events-none select-none"
            />
            <span
              className="px-9 py-[23px] rounded-[40px] border border-white/0 text-white text-[18px] sm:text-[24px]"
              style={{ background: 'rgba(0,0,0,0.2)', fontFamily: 'var(--font-sora)', fontWeight: 700 }}
            >
              Start Now
            </span>
          </Link>

          {/* MINESWEEPER CARD */}
          <div
            className="relative rounded-[40px] overflow-hidden border border-white/0 min-h-[480px] sm:min-h-[560px] flex flex-col items-center justify-between p-8 text-center"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <h3
              className="uppercase leading-[1.1] tracking-[-0.02em] text-[32px] sm:text-[48px] bg-clip-text text-transparent"
              style={{
                fontFamily: 'var(--font-loos)',
                fontWeight: 700,
                backgroundImage: 'linear-gradient(90deg, #e6ddb8 0%, #fff 75%, #e6ddb8 100%)',
                WebkitBackgroundClip: 'text',
              }}
            >
              minesweeper
            </h3>
            <div className="relative w-full flex-1 flex items-center justify-center">
              <img
                src={`${ASSETS}/imgsubtract.png`}
                alt="Minesweeper preview"
                className="w-[80%] max-w-[400px] h-auto opacity-90 pointer-events-none select-none"
              />
              {/* Rotated STAY / TUNED overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ transform: 'rotate(-30.1deg)' }}
              >
                <span
                  className="uppercase text-[48px] sm:text-[72px] lg:text-[96px] leading-[1] tracking-[-0.02em] opacity-30 bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'var(--font-loos)',
                    fontWeight: 700,
                    backgroundImage: 'linear-gradient(90deg, #e6ddb8 0%, #fff 75%, #e6ddb8 100%)',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  stay
                </span>
                <span
                  className="uppercase text-[48px] sm:text-[72px] lg:text-[96px] leading-[1] tracking-[-0.02em] opacity-30 bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'var(--font-loos)',
                    fontWeight: 700,
                    backgroundImage: 'linear-gradient(90deg, #e6ddb8 0%, #fff 75%, #e6ddb8 100%)',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  tuned
                </span>
              </div>
            </div>
            <span
              className="px-9 py-[23px] rounded-[40px] border border-white/0 text-[18px] sm:text-[24px] text-white/30"
              style={{ background: 'rgba(0,0,0,0.2)', fontFamily: 'var(--font-sora)', fontWeight: 700 }}
            >
              Coming Soon
            </span>
          </div>
        </div>
      </section>

      {/* Footer breathing room */}
      <div className="h-24" />
    </main>
  );
}

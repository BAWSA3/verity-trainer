import type { Metadata } from 'next';
import { Sora, Space_Grotesk, DM_Serif_Display, Inter, Bebas_Neue } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

// Verity custom font system (locked 2026-05-01):
//   --font-agency    Agency.ttf      — titles / hero display (commercial-OK)
//   --font-moderniz  Moderniz.otf    — subheaders + UI labels (commercial-OK)
//   --font-body      Inter           — body text (free-commercial; placeholder
//                                      for Moonde until commercial license)
const agency = localFont({
  src: '../fonts/Agency.ttf',
  variable: '--font-agency',
  display: 'swap',
});
const moderniz = localFont({
  src: '../fonts/Moderniz.otf',
  variable: '--font-moderniz',
  display: 'swap',
});
const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

// Bebas Neue — chunky condensed display font for the V5 trainer card title.
// Single weight 400 (the only weight Bebas ships).
const bebas = Bebas_Neue({ subsets: ['latin'], weight: ['400'], variable: '--font-bebas' });

// Legacy variables — kept while we migrate other surfaces. New components
// should prefer --font-agency / --font-moderniz / --font-body.
const sora = Sora({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-sora' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-loos' });
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: ['400'], variable: '--font-gerion' });

export const metadata: Metadata = {
  title: 'VERITY | Catch Your First Capsule',
  description: 'A generation grew up on a trainer journey. VERITY makes it real — tokenized real-world collectibles, traded instantly.',
  openGraph: {
    title: 'VERITY | Catch Your First Capsule',
    description: 'A generation grew up on a trainer journey. VERITY makes it real.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VERITY | Catch Your First Capsule',
    description: 'A generation grew up on a trainer journey. VERITY makes it real.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${agency.variable} ${moderniz.variable} ${body.variable} ${bebas.variable} ${sora.variable} ${spaceGrotesk.variable} ${dmSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

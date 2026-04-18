import type { Metadata } from 'next';
import { Sora, Space_Grotesk, DM_Serif_Display, Inter } from 'next/font/google';
import './globals.css';

// Free font substitutes for the Figma spec:
// - Sora (Google Fonts) — UI body, same as spec
// - Space Grotesk → stand-in for Loos Extended (commercial foundry font, pending license)
// - DM Serif Display → stand-in for Gerion Demo (foundry display font, pending license)
// - Inter → stand-in for PP Neue Montreal (commercial foundry font, pending license)
const sora = Sora({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-sora' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-loos' });
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: ['400'], variable: '--font-gerion' });
const inter = Inter({ subsets: ['latin'], weight: ['400'], variable: '--font-neue' });

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
    <html lang="en" className={`${sora.variable} ${spaceGrotesk.variable} ${dmSerif.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VERITY | Design Your Trainer",
  description: "Create your custom streetwear trainer card. Claim your spot before the VERITY marketplace drops.",
  openGraph: {
    title: "VERITY | Design Your Trainer",
    description: "Create your custom streetwear trainer card.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VERITY | Design Your Trainer",
    description: "Create your custom streetwear trainer card.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

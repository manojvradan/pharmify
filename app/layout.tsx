import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pharmify — Level up for your oral exam",
    template: "%s · Pharmify",
  },
  description:
    "Practise the Pharmacy Board of Australia oral exam (Part C) with AI voice agents playing your patient and prescriber, then get marked against the Board's criteria.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Recover SOL from Mint Address | Recovery SOL",
  description: "Accidentally sent SOL to a Token Mint account? Use this tool to check for stranded SOL and safely withdraw excess lamports on Solana.",
  keywords: ["recover sol", "mint address", "withdraw excess lamports", "solana", "recovery sol", "token program"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-mono antialiased min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-zinc-300 dark`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <footer className="py-6 text-center text-xs text-zinc-500">
              <p>❤️ Donations: <span className="font-mono text-zinc-400">MxXYGT3gSA5Bi9N4EDXvQ4oftMX8PBoKFYKYXWMxYHj</span></p>
            </footer>
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

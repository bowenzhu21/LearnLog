import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnLog",
  description: "Capture and reflect on what you learn every day.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  function Navbar() {
    return (
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-white transition hover:text-indigo-300"
          >
            LearnLog<span className="text-indigo-300">.</span>
          </Link>

          <div className="flex items-center gap-4 text-sm font-medium text-slate-200">
            <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Home
            </Link>
            <Link href="/logs/all" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Logs
            </Link>
            <Link href="/analytics" className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white">
              Analytics
            </Link>
            <Link
              href="/habit-coach"
              className="rounded-full border border-indigo-300/70 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-500/30 hover:text-white"
            >
              Habit Coach
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

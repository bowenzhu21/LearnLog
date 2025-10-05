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
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/70 border-b border-white/10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-white hover:text-primary-400 transition"
          >
            LearnLog<span className="text-primary-400">.</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-6 text-sm font-medium text-slate-300">
            <Link
              href="/"
              className="text-white hover:text-primary-400 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/analytics"
              className="text-white hover:text-primary-400 transition-colors duration-200"
            >
              Analytics
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
"use client";

import Link from "next/link";
import RelayProvider from "@/relay/RelayProvider";
import QuickAddCard from "./QuickAddCard";
import RecentLogs from "./RecentLogs";

export default function Home() {
  console.log("✅ LearnLog Home rendered on client");
  return (
    <RelayProvider>
      <main className="relative flex min-h-screen items-start justify-center">
        <div className="absolute inset-0 opacity-25 mix-blend-screen" style={{ backgroundImage: "var(--gradient-accent)" }} />
        <section className="page-shell relative">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <span className="badge-soft mx-auto">Personal learning hub</span>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              LearnLog helps you capture, tag, and reflect on everything you learn.
            </h1>
            <p className="text-lg text-slate-200/90">
              Build a durable knowledge base and surface insights when you need them. Add new reflections in seconds and watch your streak grow.
            </p>
          </div>

          <section className="mt-12">
            <h2 className="sr-only">Quick Add</h2>
            <QuickAddCard />
          </section>

          <section className="mx-auto mt-8 w-full max-w-6xl">
            <div className="mb-6 flex items-center justify-between text-white">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-indigo-200/80">Latest reflections</p>
                <h3 className="text-2xl font-semibold">Your recent learning snapshot</h3>
              </div>
              <Link
                href="/logs/all"
                className="rounded-full border border-indigo-200/70 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-200 hover:bg-indigo-500/30 hover:text-white"
              >
                View all logs
              </Link>
            </div>
            <RecentLogs />
          </section>
        </section>
      </main>
    </RelayProvider>
  );
}

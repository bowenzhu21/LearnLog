"use client";

import RelayProvider from "@/relay/RelayProvider";
import QuickAddCard from "./QuickAddCard";
import RecentLogs from "./RecentLogs";

export default function Home() {
  console.log("✅ LearnLog Home rendered on client");
  return (
    <RelayProvider>
      <main
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <section className="container mx-auto flex flex-col gap-12 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold sm:text-5xl text-white">
              LearnLog: capture what you learn.
            </h1>
            <p className="mt-4 text-lg text-white">
              Reflect on key insights, tag them for later, and keep building your personal knowledge base.
            </p>
          </div>

          {/* QuickAddCard section with black subtitle */}
          <section>
            <h2 className="sr-only">Quick Add</h2>
            <QuickAddCard />
          </section>

          {/* RecentLogs section with white subtitle */}
          <section>
            <RecentLogs />
          </section>
        </section>
      </main>
    </RelayProvider>
  );
}

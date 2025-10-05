import RelayProvider from "@/relay/RelayProvider";
import QuickAddCard from "./QuickAddCard";
import RecentLogs from "./RecentLogs";

export default function Home() {
  return (
    <RelayProvider>
      <main className="min-h-screen bg-app">
        <section className="container mx-auto flex flex-col gap-12 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              LearnLog: capture what you learn.
            </h1>
            <p className="mt-4 text-lg text-muted">
              Reflect on key insights, tag them for later, and keep building your personal knowledge base.
            </p>
          </div>

          <QuickAddCard />

          <RecentLogs />
        </section>
      </main>
    </RelayProvider>
  );
}

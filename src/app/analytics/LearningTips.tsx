import type { ReactElement } from "react";

const TIPS: Array<{ title: string; description: string }> = [
  {
    title: "Schedule reflection time",
    description: "Reserve five minutes after each session to capture what stood out while it's fresh.",
  },
  {
    title: "Spot recurring themes",
    description: "Review tags weekly to double down on topics that consistently drive progress.",
  },
  {
    title: "Balance depth and breadth",
    description: "Alternate between core focus areas and curiosity sessions to keep motivation high.",
  },
  {
    title: "Plan your next step",
    description: "Add a one-line intention for the next session so you return with direction.",
  },
];

export function LearningTips(): ReactElement {
  return (
    <section className="glass-panel rounded-xl p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900">Learning tips</h2>
      <p className="mt-2 text-sm text-slate-600">
        Quick ideas to keep your learning routine sustainable and focused.
      </p>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {TIPS.map((tip) => (
          <li key={tip.title} className="rounded-lg border border-slate-100 bg-white/60 p-3">
            <p className="font-medium text-slate-900">{tip.title}</p>
            <p className="mt-1 text-slate-600">{tip.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

# 🧠 LearnLog

Capture and reflect on what you learn every day.
LearnLog is a modern learning journal app built with Next.js 15, TypeScript, Relay, and Prisma -- designed to help you document your insights, track your learning streaks, and visualize your progress over time.

⸻

## 🚀 Features

### ✏️ Logging
- Add reflections with title, tags, time spent, and optional source URL.
- Edit or delete entries seamlessly.
- Optimistic UI updates for instant feedback.

### 📚 Recent Reflections
- Automatically shows your 5 most recent logs.
- Updates instantly after a new log is added -- no refresh needed.

### 📈 Analytics Dashboard
- Visualizes total minutes, streaks, and daily trends.
- Filter learning data by Last 7 days, 30 days, or All time.
- Tag-based insights with "minutes by topic".
- AI-generated weekly summaries.

### ⚡ Tech Highlights
- Next.js 15 (Turbopack) - Fast, reactive frontend.
- Relay & GraphQL Yoga - Declarative data fetching and live updates.
- Prisma + Postgres - Robust backend ORM with typed schema.
- Zod validation - Secure, type-safe validation on client and server.
- TailwindCSS + Glass UI - Clean, minimal design system.
- Playwright tests - E2E validation of critical paths.

⸻

## 🧩 Architecture

```
learnlog/
├── prisma/                # Prisma schema + migrations
├── src/
│   ├── app/
│   │   ├── logs/          # CRUD & pagination
│   │   ├── analytics/     # Summary, charts, and insights
│   │   └── api/graphql/   # GraphQL Yoga endpoint
│   ├── relay/             # Relay environment, queries, mutations
│   ├── lib/               # Analytics utils & validation schemas
│   └── components/        # Reusable UI pieces
└── package.json
```

⸻

## ⚙️ Setup

1. **Clone & install dependencies**

   ```bash
   git clone https://github.com/yourusername/learnlog.git
   cd learnlog
   npm install
   ```

2. **Configure your environment**

   Create a `.env` file:

   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/learnlog"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

3. **Setup the database**

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Generate Relay artifacts**

   ```bash
   npm run relay
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Then visit http://localhost:3000

⸻

## 🧪 Testing

Run E2E tests (Playwright):

```bash
npm run test:e2e
```

Run lint & type checks:

```bash
npm run lint
npm run typecheck
```

⸻

## 📊 Analytics Calculation Details
- **Streaks:** Computed from consecutive calendar days with >=1 log.
- **Minutes by Tag:** Aggregates all logs with shared tags.
- **Daily Graph:** Normalized min-max scale sparkline across range.
- **Weekly Summary:** Generated dynamically via GPT for narrative insights.

⸻

## 🧱 Stack Summary

| Layer     | Tech                                                       |
|-----------|------------------------------------------------------------|
| Frontend  | Next.js 15 (React Server Components), TypeScript, Tailwind |
| Data      | Relay, GraphQL Yoga                                        |
| Backend   | Prisma ORM + PostgreSQL                                    |
| Validation| Zod                                                        |
| Deployment| Vercel / Docker                                            |
| Testing   | Playwright, ESLint, TypeScript                             |

⸻

## 🌈 Design Philosophy

LearnLog follows a "calm productivity" aesthetic:
light glass panels, soft shadows, and focused typography.
Every action (add, edit, view) provides instant feedback and preserves flow.

⸻

## 🧭 Roadmap
- Rich-text reflections (Markdown editor)
- AI-powered tag suggestions
- Mobile-friendly layout
- Export to Notion or Obsidian
- Smart streak notifications

⸻

## 💡 Author

Bowen Zhu
[LinkedIn](https://www.linkedin.com/) • [GitHub](https://github.com/)

⸻

## 🪄 License

MIT License © 2025 Bowen Zhu

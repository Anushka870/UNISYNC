# UniSync architecture plan

## Recommended stack

- **Web app:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.
- **Application API:** Next.js route handlers or a small NestJS service with Zod validation.
- **Database:** PostgreSQL with Prisma. Use Redis for queues, rate limits, and short-lived chat context.
- **Authentication:** Google OAuth with Auth.js. Store only the Calendar scopes the user explicitly approves.
- **AI:** OpenAI Responses API with embeddings and a retrieval layer over approved campus content. Keep source URLs and timestamps beside every chunk.
- **Ingestion:** Playwright for JS-heavy pages, Cheerio for static HTML, and a scheduled worker for official IGDTUW notices. Download PDFs, extract text with `pdf-parse`, and checksum documents to prevent duplicates.
- **Files:** S3-compatible object storage for notes and PDFs. Use signed URLs and malware scanning on uploads.
- **Deployment:** Vercel for the web app, managed Postgres, and a worker on Railway, Render, or a container platform.

The current prototype is intentionally frontend-only. It includes local mock behavior for the user-facing flows; OAuth, scraping, AI retrieval, and persistence belong behind the API before launch.

## Database schema

```sql
users (
  id uuid primary key,
  email text unique not null,
  name text not null,
  avatar_url text,
  branch text,
  graduation_year int,
  created_at timestamptz not null
)

profiles (
  user_id uuid primary key references users(id),
  stars_earned int not null default 0,
  people_helped int not null default 0,
  connections_count int not null default 0,
  rank_slug text not null default 'new-voice'
)

notices (
  id uuid primary key,
  source text not null, -- igdtuw | community | calendar
  title text not null,
  body text,
  source_url text,
  published_at timestamptz,
  checksum text unique,
  metadata jsonb not null default '{}'
)

calendar_events (
  id uuid primary key,
  user_id uuid references users(id),
  external_id text,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  source text not null
)

resources (
  id uuid primary key,
  author_id uuid references users(id),
  title text not null,
  kind text not null, -- notes | pyq | doubt | answer
  storage_key text,
  description text,
  created_at timestamptz not null
)

stars (
  id uuid primary key,
  giver_id uuid references users(id),
  receiver_id uuid references users(id),
  resource_id uuid references resources(id),
  created_at timestamptz not null,
  unique (giver_id, resource_id)
)

saved_resources (
  user_id uuid references users(id),
  resource_id uuid references resources(id),
  created_at timestamptz not null,
  primary key (user_id, resource_id)
)

content_chunks (
  id uuid primary key,
  notice_id uuid references notices(id),
  resource_id uuid references resources(id),
  text text not null,
  embedding vector,
  source_url text,
  updated_at timestamptz not null
)
```

## Implementation sequence

1. Keep the current prototype as the visual contract and add TypeScript types for users, notices, resources, stars, and events.
2. Add Auth.js Google sign-in and a consent screen for Calendar access. Store refresh tokens encrypted server-side.
3. Add Prisma migrations and API routes for notices, resources, saves, stars, and profiles. Enforce one star per giver per resource.
4. Build the IGDTUW ingestion worker: fetch the official updates index, normalize links, checksum documents, extract PDF text, and upsert notices.
5. Add uploads with signed URLs, file validation, moderation status, and resource search.
6. Add Google Calendar list/create endpoints and map external event IDs to prevent duplicates.
7. Chunk approved notices, resources, and calendar summaries into the vector index. The AI route retrieves only relevant, fresh sources and cites each answer.
8. Replace the local modal actions with API calls, optimistic star/save updates, loading states, and error states.
9. Add Playwright coverage for theme persistence, feed filters, save/star flows, OAuth denial, upload permissions, and AI answers with source citations.
10. Add observability, scheduled ingestion alerts, retention rules, and a clear delete-account/data-export flow before launch.

## Security and product boundaries

- Do not scrape private communities or ingest content without explicit permission.
- Treat official notices as read-only source material and show their source URL and fetch time.
- Never expose OAuth refresh tokens or storage keys to the browser.
- Apply rate limits to AI queries and file uploads, and log source provenance for every generated answer.
- Keep the WhatsApp integration out of this build, as requested.


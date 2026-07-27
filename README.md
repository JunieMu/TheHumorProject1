# Humor Study

A public-facing voting site for image captions, built for **The Humor Project** (Spring 2026).

Signed-in participants are shown one image and one candidate caption at a time and answer a single
question: *is this caption funny for this image?* Every vote is written straight to the shared
Supabase research dataset. A second page lets participants upload their own image and run it through
the caption generation pipeline.

**Live:** https://thehumorproject1.vercel.app

---

## Features

**Rating**
- Google sign-in through Supabase Auth; the rating view is only rendered for an authenticated user.
- Loads public captions joined to their image, discards rows with empty text or a missing image, then
  shuffles and serves a random set of 100 so two participants rarely see the same order.
- One image, one caption, two buttons. Thumbs up records `+1`, thumbs down records `-1`, and the deck
  advances immediately — no confirm step, no page reload.
- A running "N captions remaining" counter, and an "All caught up!" state when the deck is exhausted.
- Buttons disable while a vote is in flight so a fast double-click can't double-submit.

**Upload & caption**
- Pick any image and run the four-step Crackd pipeline against `api.almostcrackd.ai`, authenticated
  with the participant's Supabase JWT.
- A live status line tracks the run: *Getting upload URL → Uploading image → Registering image →
  Generating captions → Done.*
- Generated captions render as they come back, and a **Your History** section below lists every image
  the participant has uploaded together with its captions, newest first.

---

## Tech stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript |
| Data & auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Fonts | Paprika (display), Philosopher (body) |
| Hosting | Vercel |

---

## Getting started

Requires Node 20+ and access to the shared Supabase project.

```bash
npm install
npm run dev          # http://localhost:3000
```

### Environment variables

Create `.env.local` in the project root. Env files are gitignored and are never committed.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — used by the browser client and middleware |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `NEXT_PUBLIC_AUTH_CALLBACK_URL` | OAuth redirect target, e.g. `https://<your-app>.vercel.app/auth/callback` |
| `SUPABASE_PROJECT_ID` | Project reference id |
| `SUPABASE_ANON_KEY` | Server-side copy of the anon key |

Google OAuth redirects must match the pattern `https://*.vercel.app/auth/callback`. Register both the
deployed URL and `http://localhost:3000/auth/callback` in the Supabase provider settings so local
sign-in works too.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server against the real Supabase project |
| `npm run dev:mock` | Dev server with in-memory fixtures on port 3001 — see [DEMO.md](./DEMO.md) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Demo mode

`npm run dev:mock` swaps Supabase for in-memory fixtures — 18 captions across 6 illustrations, a
faked sign-in, and an intercepted pipeline — so the app can be demoed or recorded without a live
project or working OAuth. No page or component code changes, so what you see is the real UI.
Details in [DEMO.md](./DEMO.md).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  landing + rating view
│   ├── upload/page.tsx           upload & caption pipeline, upload history
│   ├── layout.tsx                fonts, sidebar, global shell
│   ├── auth/callback/route.ts    OAuth code → session exchange
│   ├── auth/auth-code-error/     sign-in failure page
│   └── utils/supabase.ts         shared browser client instance
├── components/Sidebar.tsx        nav, hidden until signed in
├── lib/supabase/                 browser + server client factories
└── mock/                         demo-mode fixtures and stand-in client
middleware.ts                     refreshes the Supabase session on every request
schema.sql                        reference copy of the shared database schema
```

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page when signed out, rating view when signed in |
| `/upload` | Upload an image and generate captions; shows past uploads |
| `/auth/callback` | Exchanges the OAuth code for a session |
| `/auth/auth-code-error` | Shown when that exchange fails |

---

## Data model

The app reads from and writes to the shared Supabase project. `schema.sql` is a reference copy of the
full schema; this app touches three tables:

| Table | Used for |
| --- | --- |
| `captions` | Reads public captions (`is_public = true`) and their content |
| `images` | Joined for `url` and `image_description`; also queried for upload history |
| `caption_votes` | **Write target.** One row per vote: `vote_value` (`1` / `-1`), `caption_id`, and `profile_id` set to the authenticated user's id |

Votes are inserts only — nothing is updated or deleted, so the dataset stays append-only.

---

## Caption pipeline

`/upload` calls the Crackd REST API at `https://api.almostcrackd.ai`, passing the participant's
Supabase access token as a bearer token:

1. `POST /pipeline/generate-presigned-url` — returns a `presignedUrl` and a public `cdnUrl`.
2. `PUT <presignedUrl>` — uploads the raw image bytes directly to storage.
3. `POST /pipeline/upload-image-from-url` — registers the `cdnUrl` and returns an `imageId`.
4. `POST /pipeline/generate-captions` — runs the humor pipeline and returns the saved captions.

---

## Deployment

Deployed on Vercel from `main`. Set every variable from the table above in the Vercel project
settings, and make sure the deployed callback URL is registered in Supabase Auth before the first
sign-in.

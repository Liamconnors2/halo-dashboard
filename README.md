# Halo Content Flywheel Dashboard

A daily content planning system for Halo — Australian premium sauna accessories. Built around the six-pillar flywheel framework derived from 223 customer reviews.

## What this is

A Next.js 14 app that runs on Vercel. Mobile-first PWA so you can pin it to your home screen. Designed for one user (you) to open every morning and know exactly what's filming, posting, prepping today.

**Cadence:** Sat-Sun primary shoots → Mon-Wed editing → Thu-Fri posting → ongoing engagement.

## The framework (six pillars)

1. **Time extension proof** — the #1 angle from your reviews (21.5%). Thermal demos, before/after time jumps, customer call recordings.
2. **Hair protection** — almost a second product (18.8%). Stylist POV, colour-treated hair, curls.
3. **Embarrassed to proud** — the silent objection. "Gnome hat vs Halo" content, looks-shame confrontation.
4. **Founder POV** — Liam on camera. The Builder Behind the Brand.
5. **Ritual & world** — the aesthetic. Negative Film recipe shots. Cinematic moments.
6. **Education & authority** — sauna science, breathwork, first-timer guides.

## Tech stack

- **Frontend:** Next.js 14 (App Router), Tailwind, shadcn/ui
- **Database:** Vercel Postgres (or Supabase — same Postgres flavour)
- **Storage:** Cloudflare R2 (S3-compatible, ~10x cheaper than S3)
- **AI:** Anthropic API (Claude Opus 4.7) for content review
- **Reviews:** Loox API (manual sync button + cron job daily)
- **Hosting:** Vercel
- **Auth:** Single-user passcode (no need for full auth)

## Quick start

```bash
# 1. Clone and install
cd halo-dashboard
npm install

# 2. Set up environment variables (see .env.example)
cp .env.example .env.local

# 3. Set up the database
npx prisma migrate dev --name init
npx prisma db seed

# 4. Run locally
npm run dev

# 5. Visit http://localhost:3000
```

## Deployment to Vercel

```bash
# Push to GitHub first, then:
vercel
vercel env pull  # pulls env vars from Vercel
vercel --prod
```

Set these env vars in Vercel dashboard:
- `DATABASE_URL` — Vercel Postgres connection string
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `LOOX_API_KEY` — from Loox admin → Settings → API
- `LOOX_SHOP_DOMAIN` — `thehalo.au`
- `R2_ACCOUNT_ID` — Cloudflare dashboard
- `R2_ACCESS_KEY_ID` — R2 → Manage API tokens
- `R2_SECRET_ACCESS_KEY` — same place
- `R2_BUCKET_NAME` — `halo-media`
- `R2_PUBLIC_URL` — `https://media.thehalo.au` (set up custom domain on R2)
- `APP_PASSCODE` — whatever 6-digit code you want

## Features

### Week view (`/`)
- Sat-Sun shoot anchor highlighted as keystone days
- Each day has tasks with type (film, edit, post, prep, engage), pillar tag, full brief
- Click any task to expand shot list, script, customer references
- Persistent check-marks across sessions
- Pillar rotation tracker — visual coverage of all 6 pillars per week

### Media bank (`/media`)
- Upload images, videos, scripts, drafts
- Each asset gets a status: `draft` → `claude-reviewed` → `approved` → `posted`
- Click "Get Claude's feedback" on any draft → opens analysis modal
- Claude reviews against:
  - Pillar brief & intent
  - Hook strength (first 3 seconds)
  - Customer language match
  - Brand consistency
  - Specific improvement suggestions
- Tag posts with which pillar + which review angle they target

### Hook bank (`/hooks`)
- All 223 customer reviews analysed and tagged
- Filter by pillar, rating, theme (duration jump, hair, looks, recovery, etc.)
- One-click "Use as hook" → drafts a script in your tone
- Auto-syncs daily from Loox API
- New reviews flagged for content potential

### Settings (`/settings`)
- Trigger Loox review sync manually
- Re-seed default week template
- Export weekly progress to CSV
- Reset week / archive past weeks

## Folder structure

```
halo-dashboard/
├── app/                       # Next.js App Router
│   ├── api/                   # API routes
│   │   ├── tasks/             # CRUD for tasks
│   │   ├── media/             # Media upload, list, update status
│   │   ├── reviews/           # Loox sync
│   │   ├── analyze/           # Claude content review
│   │   ├── hooks/             # Hook bank queries
│   │   └── week/              # Week generation, reset
│   ├── week/                  # Week view (default route)
│   ├── media/                 # Media bank
│   ├── hooks/                 # Hook bank
│   ├── settings/              # Settings + sync
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn primitives
│   ├── dashboard/             # Week strip, day card, task row
│   ├── media/                 # Upload, asset card, review modal
│   └── hooks/                 # Hook list, filter
├── lib/
│   ├── db/                    # Prisma client
│   ├── r2/                    # R2 upload/signing
│   ├── anthropic/             # Claude API wrappers
│   ├── loox/                  # Loox API client
│   └── pillars.ts             # Pillar definitions (shared)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                # Seeds the default week + pillars
├── public/                    # PWA manifest, icons
└── data/
    └── reviews_export.csv     # Your 223 reviews (initial seed)
```

## The data model

See `prisma/schema.prisma`. Core tables:

- **Pillar** — the 6 framework pillars (seeded, immutable)
- **Week** — one row per week, contains generated plan
- **Task** — individual content tasks within a week (film, post, edit, prep, engage)
- **MediaAsset** — uploaded files in R2, with status + AI review + linked task
- **Review** — Loox customer reviews, with theme tags + linked content
- **Hook** — pulled phrases from reviews, taggable, reusable across content
- **Performance** — paste-in stats from IG/TikTok after posting (learns over time)

## What this is NOT

- Not an auto-poster — use Meta Business Suite for that
- Not a video editor — use CapCut
- Not a CRM — use Klaviyo for customer comms
- Not a full PM tool — this is content planning only, deliberately narrow

## Roadmap (post-v1)

- Performance tracking → auto-rotate next week's plan around what worked
- Notion sync for the script-writing workflow
- Stripe revenue overlay (does content correlate with sales?)
- iOS shortcut to log a posted reel from your phone
- Multi-user (when you hire someone)

---

Built for Halo. The future doesn't wait for those who leave early.

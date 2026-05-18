# Claude Code setup walkthrough

This is the exact sequence to ship this from your laptop to Vercel.
Open Claude Code in your terminal and follow these steps. Paste each block, let Claude run it, move on.

## Step 0 — accounts you need (do these once, in a browser)

- [ ] **GitHub** — already have
- [ ] **Vercel** — sign up with GitHub at vercel.com (free)
- [ ] **Cloudflare** — sign up at cloudflare.com (free)
- [ ] **Anthropic Console** — console.anthropic.com → API Keys → create one (starts with `sk-ant-`)
- [ ] **Loox** — in Loox admin → Settings → see if API access is available on your plan. If not, you'll use CSV upload (still works)

## Step 1 — set up Cloudflare R2 (5 mins)

In Cloudflare dashboard:
1. R2 → Create bucket → name it `halo-media`
2. Settings tab → Public access → Allow access (or set up custom domain `media.thehalo.au` pointing to the bucket — DNS is on Cloudflare so this takes 30 seconds)
3. Manage R2 API tokens → Create API token → permissions: Object Read & Write → scope: `halo-media` bucket
4. Save the Access Key ID, Secret Access Key, Account ID — you'll need them

## Step 2 — clone and install

Open Claude Code in a fresh terminal. First message:

```
I'm setting up the Halo content dashboard. The codebase is in this folder. Run npm install and check for any issues.
```

Claude will run `npm install` and tell you if anything's missing.

## Step 3 — set up the database

You have two options:

**Option A — Vercel Postgres** (easier, free hobby tier):
1. Create a Vercel project (link it to a new GitHub repo for this code)
2. Storage tab → Create database → Postgres → name it `halo-dashboard`
3. Copy the `DATABASE_URL` it gives you

**Option B — Supabase** (more generous free tier):
1. supabase.com → New project → name it `halo-dashboard`
2. Settings → Database → Connection String → use the URI version, replace `[YOUR-PASSWORD]` with what you set

Either way, paste the connection string into `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in `.env.local` with all your keys.

Ask Claude Code:
```
Run prisma migrate to set up the database schema, then seed it.
```

It will run:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

If your reviews CSV is in `data/reviews_export.csv` (drop the file there first), the seed will import all 223 reviews and auto-classify them by theme/pillar.

## Step 4 — first run locally

```
Start the dev server.
```

Claude runs `npm run dev`. Visit `http://localhost:3000`.

You should see:
- The week view, today highlighted (it's Friday so it'll show Friday's plan)
- Saturday and Sunday flagged as shoot days (amber tint)
- 6 pillars rotating across the week
- Media bank ready for uploads
- Hook bank populated from your reviews

## Step 5 — test the integrations

**Test R2 upload:**
- Go to /media, drop in any image, select a pillar, hit upload
- Should appear in the grid within 2 seconds
- Click "Get Claude review" — should return scores + feedback within ~15 seconds

**Test Loox sync:**
- Go to /settings → "Sync from Loox API" (or upload your CSV again)
- Should report N reviews imported/updated

If anything breaks, copy the error to Claude Code and it'll fix it.

## Step 6 — deploy to Vercel

```
Push this to a new GitHub repo called halo-dashboard, then deploy it to Vercel.
```

Claude will:
- `git init` if needed
- Create the repo
- Push
- Run `vercel` to link the project
- Set the env vars (or remind you to set them in the Vercel dashboard)

Then in Vercel dashboard → Project → Settings → Environment Variables, paste in everything from `.env.local`.

Deploy. You'll get a URL like `halo-dashboard.vercel.app`. Add to your phone home screen — it works as a PWA.

## Step 7 — set up daily review sync (optional)

In Vercel, create a Cron job:
1. Project Settings → Cron Jobs → Add
2. Path: `/api/reviews/sync`
3. Schedule: `0 8 * * *` (8am daily)
4. Done. Reviews pull automatically.

Or skip this and use the manual button — your call.

## Step 8 — custom domain (optional)

1. Vercel → Project → Domains → add `content.thehalo.au`
2. Vercel gives you DNS records to set in Cloudflare
3. 30 seconds later you're at content.thehalo.au

## Troubleshooting

**"Cannot connect to database"**
→ Check `DATABASE_URL` in `.env.local` is correct. Test with `npx prisma db push`.

**"R2 upload fails"**
→ Confirm bucket name + region + custom domain match `R2_PUBLIC_URL`. R2 endpoint should be `https://[account_id].r2.cloudflarestorage.com`.

**"Loox API returns 404"**
→ Your Loox plan may not include API access. Use the CSV upload route — it's identical functionality, just manual once a week.

**"Anthropic API rate limited"**
→ You're hitting the analyse endpoint too fast. Reviews are async — let one finish before starting another.

**"Cron job not running"**
→ Vercel cron jobs only run on Pro plan ($20/mo). Free workaround: use a free service like cron-job.org to hit your `/api/reviews/sync` endpoint daily.

## What's deliberately NOT in v1

- No auto-posting to Instagram (use Meta Business Suite)
- No video editing (use CapCut)
- No multi-user (you're solo)
- No mobile native app (PWA covers it)
- No revenue overlay (add post-v1 once you have a baseline)

## What to build next

When you've used this for 4 weeks and know what works:
1. **Performance tracking** — paste in stats from each post → dashboard learns which pillars/hooks/days perform best, auto-rotates next week's plan accordingly
2. **iOS share sheet** — share a reel from IG to your dashboard to auto-log performance
3. **Klaviyo segment trigger** — when a 5-star reviewer hits the bank, auto-add to a UGC outreach segment
4. **Stripe revenue overlay** — does content correlate with sales? Pull from your Shopify webhook

Don't build any of this until v1 has been used for a month. Real usage will tell you what's actually missing.

## The honest truth on this build

Time to set up: ~90 minutes if you're new to Next.js, ~30 if you've done it before.
Monthly running cost (if you stay on free tiers): **$0**.
First month with paid plans (Vercel Pro, Cloudflare paid R2 if you exceed free tier, Anthropic API usage): **~$30/mo**.

The dashboard's job is not to make content for you. It's to remove every excuse you have to skip a day. The framework is the answer. The dashboard is the discipline.

Now go ship.

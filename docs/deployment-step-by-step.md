# Shadow CFO Deployment Steps

Date: April 3, 2026

## First: What Is Deployable Right Now

This repo currently contains hardened backend modules, migrations, and tests.

It does **not** yet contain a production web app shell such as Next.js routes,
pages, or a frontend dashboard. That means:

- you **can** publish the code to GitHub now
- you **can** create the Supabase database now
- you **can** run the SQL migrations now
- you **can** prepare Vercel now
- you **cannot** launch a user-facing Shadow CFO product from this repo yet
  until the app layer exists

So the right deployment order is:

1. Source control
2. Database
3. Secrets / environments
4. App hosting
5. Workflow tools
6. Marketing site

## Your Tools: What Each One Is For

Use each tool like this:

- `VS Code app`: main code editing
- `OpenCode terminal` or `standard terminal`: run `bun test`, git commands, and local setup
- `GitHub Desktop`: create repo, review diffs, publish to GitHub
- `Vercel web`: deploy the future app frontend / API layer
- `Make.com web`: workflow orchestration later, not needed for Commit 1 or Commit 2
- `Framer web`: landing page / marketing site, separate from app

## Step 1: Initialize Git And Publish

Do this in your terminal inside `/Users/pursuit/Documents/ShadowCFO`.

```bash
git init
git branch -M main
git add .
git commit -m "feat(core): init shadow-ledger"
```

Then open `GitHub Desktop`:

1. File → Add Local Repository
2. Choose `/Users/pursuit/Documents/ShadowCFO`
3. Click `Publish repository`
4. Keep it private for now
5. Publish to GitHub

After that, every future commit should be pushed through either terminal or GitHub Desktop.

## Step 2: Keep A Clean Local Verify Loop

In your terminal:

```bash
cd /Users/pursuit/Documents/ShadowCFO
bun test
```

Right now, this should pass before every push.

## Step 3: Create Supabase Project

In Supabase web:

1. Create a new project named `shadow-cfo-prod` or `shadow-cfo-dev`
2. Choose a strong database password and save it in your password manager
3. Wait for provisioning
4. Open:
   - Project URL
   - Anon key
   - Service role key
   - Database password

You will need those later for the app layer.

## Step 4: Run Migrations In Supabase

Because this repo is not yet using Supabase CLI migrations end to end, the simplest path is:

1. Open Supabase SQL Editor
2. Run each migration file in order

Run:

- `db/migrations/001_shadow_ledger.sql`
- `db/migrations/002_consent_challenges.sql`
- `db/migrations/003_webauthn_credentials.sql`

Important:

- run them in order
- fix any dependency errors before moving forward
- if your `users` table does not yet exist in Supabase, create that first or adapt the foreign keys

## Step 5: Prepare Environment Variables

Create a local `.env.local` once the app shell exists.

Typical variables:

```bash
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

Do **not** commit `.env.local`.

## Step 6: Vercel Setup

Use `Vercel web` only after the app layer exists.

When we have a Next.js app in this repo:

1. Click `Add New Project`
2. Import the GitHub repo
3. Framework preset: `Next.js`
4. Root directory: repo root
5. Add the environment variables from Step 5
6. Deploy

For now, Vercel can be connected early, but the deployment will not be meaningful until pages and routes exist.

## Step 7: Framer Setup

Framer is for the marketing site, not the product backend modules.

Use Framer for:

- landing page
- waitlist
- product demo
- pricing page

Recommended setup:

1. Keep Framer on `www.shadowcfo.com`
2. Put the product app later on `app.shadowcfo.com`
3. Link CTA buttons from Framer to the Vercel app URL

## Step 8: Make.com Setup

Make.com is not required to deploy Commit 1 or Commit 2.

Use Make.com later for:

- Plaid webhook orchestration
- notification workflows
- digest emails
- operational automations

Do **not** block the hardened backend work on Make.com setup.

## Step 9: What To Do Right Now, In Order

Given your current tool stack, the next exact sequence is:

1. Open this repo in `VS Code`
2. Run `bun test`
3. Initialize git in terminal
4. Publish repo with `GitHub Desktop`
5. Create Supabase project in the web UI
6. Run the three migration files in Supabase SQL Editor
7. Keep Vercel connected but wait to deploy until the app shell exists
8. Keep Framer for marketing only
9. Use Make.com later, not as a blocker

## Recommended Near-Term Architecture

Once we start the actual app layer, the clean deployment split is:

- `GitHub`: source of truth
- `Vercel`: app frontend + server routes
- `Supabase`: auth + Postgres + storage
- `Framer`: marketing site
- `Make.com`: external automations only

## The One Honest Warning

Do not try to "fully deploy" Shadow CFO from this repo this second as if it were a finished web product. The hardened modules are now in good shape, but there is still no user-facing app shell in this codebase. The next build step is the application layer that will sit on top of these modules.

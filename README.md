# Kaynos Demo

Interactive demo of [Kaynos](https://kaynos.net) - the training session management platform for martial arts schools.

**Live demo:** [demo.kaynos.net](https://demo.kaynos.net)

## What This Demonstrates

This demo runs with mock data for **South Houston Jiu-Jitsu (SHJJ)**, a fictional BJJ academy. It ships in two modes (see [Demo Modes](#demo-modes)) and showcases:

- **Instructor Dashboard** - overview of students, sessions, and school stats
- **Student Management** - 8 students with different training histories
- **Private Sessions** - 18 one-on-one training sessions with timestamped notes
- **Group Classes** - 6 class recordings with coaching notes and drill instructions
- **Activity Feed** - recent session and class viewing activity
- **School Admin** - member management and school settings

### Demo Data

| Category | Count | Details |
|----------|-------|---------|
| Instructors | 2 | Coach Marcus Rivera (admin), Coach Ana Santos |
| Students | 8 | Jake, Sarah, Mike, Elena, David, Olivia, Ryan, Jasmine |
| Sessions | 18 | Guard passing, competition prep, back takes, sweeps, and more (6 of the 18 are Jake's, to enrich the student demo) |
| Classes | 6 | Open mat, guard retention, no-gi, competition strategy |
| Notes | 43 | 34 session notes + 9 class notes (timestamped notes, key concepts, drill instructions) |

## How It Works

The demo replaces the production database and authentication with **in-memory mock data** served through Netlify Functions. No external services are needed.

- **Auth:** Auto-logged in based on `DEMO_ROLE` (defaults to admin — see [Demo Modes](#demo-modes))
- **Data:** All API endpoints return realistic demo data
- **No database:** Mock data is generated fresh on each function invocation

## Demo Modes

Set the `DEMO_ROLE` environment variable to choose which user the demo auto-logs in as:

| `DEMO_ROLE` | Logged-in user | What you see |
|-------------|----------------|--------------|
| unset / `admin` (default) | Coach Marcus Rivera (admin) | Instructor dashboard, full school admin, all 8 students and 18 sessions |
| `student` | Jake Thompson (student) | Student dashboard with Jake's 6 sessions, watch history, and class library |

Two separate Netlify deploys (one per mode) are the typical setup — e.g. `demo.kaynos.net` for admin and a second site for the student view.

## Local Development

```bash
npm install
npm run dev          # admin demo (default)
DEMO_ROLE=student npm run dev   # student demo
```

`npm run dev` runs `netlify dev`, which serves Vite on port 5173 and bundles the `.mts` Netlify Functions locally.

## Deployment

Deployed automatically via Netlify on push to `main`. No external secrets required — only the optional `DEMO_ROLE=student` env var if the deploy should run as the student demo.

Security headers (HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy, etc.) are configured in `netlify.toml`. Geo/abuse blocking is handled by Netlify's native firewall (edge functions were tried and reverted in `d9fc25e`).

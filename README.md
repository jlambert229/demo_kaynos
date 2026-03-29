# Kaynos Demo

Interactive demo of [Kaynos](https://kaynos.net) - the training session management platform for martial arts schools.

**Live demo:** [demo.kaynos.net](https://demo.kaynos.net)

## What This Demonstrates

This demo runs with mock data for **South Houston Jiu-Jitsu (SHJJ)**, a fictional BJJ academy. It showcases:

- **Instructor Dashboard** - overview of students, sessions, and school stats
- **Student Management** - 8 students with different training histories
- **Private Sessions** - 12 one-on-one training sessions with timestamped notes
- **Group Classes** - 6 class recordings with coaching notes and drill instructions
- **Activity Feed** - recent session and class viewing activity
- **School Admin** - member management and school settings

### Demo Data

| Category | Count | Details |
|----------|-------|---------|
| Instructors | 2 | Coach Marcus Rivera (admin), Coach Ana Santos |
| Students | 8 | Jake, Sarah, Mike, Elena, David, Olivia, Ryan, Jasmine |
| Sessions | 12 | Guard passing, competition prep, back takes, sweeps, and more |
| Classes | 6 | Open mat, guard retention, no-gi, competition strategy |
| Notes | 30+ | Timestamped coaching notes, key concepts, and drill instructions |

## How It Works

The demo replaces the production database and authentication with **in-memory mock data** served through Netlify Functions. No external services are needed.

- **Auth:** Auto-logged in as Coach Marcus Rivera (admin)
- **Data:** All API endpoints return realistic demo data
- **No database:** Mock data is generated fresh on each function invocation

## Local Development

```bash
npm install
npm run dev
```

## Deployment

Deployed automatically via Netlify. No environment variables required.

# Ethiopian Airlines Results — Admin Dashboard

A full-stack administrative suite built with **Vue 3** and **Nuxt 3**, designed for monitoring and controlling the Ethiopian Airlines results scraper, candidate roster viewer ([et-results.onrender.com](https://et-results.onrender.com)), and Telegram notification bot ([@et_results_bot](https://t.me/et_results_bot)).

Configured for **1-click zero-config deployment on Vercel** with serverless database connectivity to Neon PostgreSQL.

---

## ✈️ Features

- **Executive Analytics Overview**:
  - Live counts for Telegram subscribers, tracked positions, parsed candidate rosters, and total candidate names indexed.
  - Category breakdown chart (Written Exams, Interviews, Medical, etc.).
  - Recent announcements and live subscriber feeds.

- **Announcement & Roster Management**:
  - Full-text search by job position, exam venue, announcement type, or ID.
  - Candidate roster modal with client-side name search and 1-click **Export to CSV**.
  - Direct shareable links pointing to the public Render web viewer (`/results/{id}`).
  - Secure deletion of outdated announcements.

- **Web Announcement Publisher (Replacing Terminal Script)**:
  - Web UI mirroring `publish.py` and `result_parser.py`.
  - Paste raw corporate announcement text copied from Ethiopian Airlines.
  - Real-time live parsing preview (extracts Position, Type, Date & Time, Venue, and Candidate List).
  - 1-click publish to Neon PostgreSQL with optional instant broadcast to all Telegram subscribers.

- **Telegram Bot Subscriber Management**:
  - View all registered subscriber Chat IDs and subscription timestamps.
  - Manual subscriber registration tool.
  - Search, CSV export, and deletion.

- **Telegram Broadcast Studio**:
  - Dispatch announcements or notices directly through `@et_results_bot`.
  - Support for Telegram Markdown formatting.
  - Live **Telegram Mobile Client Chat Bubble Simulator** showing an exact replica of what subscribers will see.
  - Configurable inline action buttons with native **Telegram Web App** embedding.
  - Target selector (Broadcast to All vs. Test Send to a single Chat ID).

- **Cloud Health & Latency Monitor**:
  - Real-time diagnostic pinging of Neon Serverless PostgreSQL, Telegram Bot API, and the Render web service.

- **Aviation Livery Dark Theme**:
  - Bespoke Vanilla CSS design system with Ethiopian Airlines gold (`#e5a823`), emerald (`#10b981`), glassmorphism, responsive mobile drawer, and micro-animations.

---

## 🛠️ Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Neon PostgreSQL Connection String
DATABASE_URL=postgresql://neondb_owner:npg_RTCvEnlMQ65f@ep-rough-darkness-a5whzvg4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Telegram Bot Token (et_results_bot)
TELEGRAM_BOT_TOKEN=8232583935:AAF0QRQqEVxTArDLLOuXQVTXOXkyyNSF-uk

# Render Web Service Base URL
RENDER_APP_URL=https://et-results.onrender.com

# Admin Authentication
ADMIN_PASSWORD=admin12345
ADMIN_SESSION_SECRET=et_results_super_secret_dashboard_key_2026
```

---

## 🚀 Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Visit `http://localhost:3000` and log in with your `ADMIN_PASSWORD` (default: `admin12345`).

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub/GitLab.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Framework Preset: **Nuxt.js** (Vercel automatically recognizes Nuxt 3).
4. Add the following **Environment Variables** under Project Settings:
   - `DATABASE_URL`
   - `TELEGRAM_BOT_TOKEN`
   - `RENDER_APP_URL`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
5. Click **Deploy**!

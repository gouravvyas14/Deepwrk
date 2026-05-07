# Deepwrk

A deep work productivity app built for focused sessions, habit tracking, and meaningful output.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![Firebase](https://img.shields.io/badge/Firebase-FCM-orange?logo=firebase)

---

## Features

- **AI-Powered Daily Planning** — Describe your goals in plain text; Gemini generates a structured, time-blocked focus plan
- **Deep Work Timer** — Circular countdown timer with pause/resume, +5 min extension, and a custom duration picker
- **Session Notes** — Write notes mid-session (separate tab); notes are saved and shareable via public link
- **FCM Push Notifications** — Browser push via Firebase Cloud Messaging: 20-min check-ins, 5-min and 1-min warnings, session start/end alerts — work even when the tab is backgrounded
- **Mood Tracking** — Log mood before and after each session to track energy patterns
- **Difficulty Tagging** — Mark tasks Easy / Medium / Hard before starting
- **Streak Counter** — Daily streak maintained in the top bar; updates on session completion
- **Session History** — Full list of past sessions with stats, notes, and shareable public links
- **Analytics Dashboard** — Charts for focus time, mood trends, streak history, and category breakdown
- **General Notes** — Standalone notes page with search, auto-save, and shareable public links
- **Groups** — Create workspaces, invite collaborators by email, manage members
- **Break Timer** — Guided 5-minute break between sessions
- **Confetti** — Fires on session completion 🎉

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Auth | NextAuth v5 (Credentials + Google OAuth) |
| Database | MongoDB Atlas + Mongoose |
| AI | Google Gemini (`gemini-flash-latest`) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Animations | Framer Motion |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster
- Google Cloud project (OAuth + Gemini API)
- Firebase project (Cloud Messaging enabled)

### 1. Clone and install

```bash
git clone https://github.com/gouravvyas14/Deepwrk.git
cd Deepwrk
npm install
```

### 2. Environment variables

Create a `.env.local` file at the project root:

```env
# Database
MONGODB_URI="mongodb+srv://<user>:<pass>@cluster.mongodb.net/deepwrk"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-32-chars"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Google Gemini
GEMINI_API_KEY="..."

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_VAPID_KEY="..."

# Firebase Admin SDK (from Service Account JSON)
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
deepwrk/
├── app/
│   ├── (app)/                  # Authenticated routes (sidebar layout)
│   │   ├── dashboard/          # Daily plan + AI generation
│   │   ├── focus/              # Timer, session notes, notifications
│   │   ├── analytics/          # Charts and stats
│   │   ├── history/            # Past sessions list
│   │   ├── notes/              # General notes (two-panel editor)
│   │   ├── groups/             # Workspaces and invites
│   │   ├── session/[id]/       # Session detail page
│   │   └── settings/           # User preferences
│   ├── api/
│   │   ├── notes/              # CRUD + share token
│   │   ├── sessions/           # CRUD + share token
│   │   ├── plans/              # AI plan generation + append
│   │   ├── groups/             # Group management + invites
│   │   ├── notifications/push/ # FCM server-side push
│   │   └── user/               # Streak, FCM token storage
│   ├── auth/                   # Sign in / register page
│   └── shared/                 # Public share pages (no auth)
│       ├── note/[token]/
│       └── session/[token]/
├── components/
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── db.ts                   # Mongoose connection
│   ├── claude.ts               # Gemini AI wrapper + retry
│   ├── firebase.ts             # Firebase client SDK
│   └── firebase-admin.ts       # Firebase Admin SDK
├── models/                     # Mongoose schemas
│   ├── User.ts
│   ├── DailyPlan.ts
│   ├── FocusSession.ts
│   ├── Note.ts
│   └── Group.ts
└── public/
    └── firebase-messaging-sw.js  # FCM service worker
```

---

## Push Notifications Setup (Firebase)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Cloud Messaging**
3. Copy the web app config into the `NEXT_PUBLIC_FIREBASE_*` env vars
4. Generate a VAPID key pair under **Project Settings → Cloud Messaging → Web Push certificates**
5. Download a service account JSON under **Project Settings → Service accounts** and fill in the `FIREBASE_*` admin vars

Notifications fire at:
- Session start
- Every 20 minutes (focus check-in)
- 5 minutes remaining
- 1 minute remaining
- Session complete

---

## Deployment

The app is ready to deploy on **Vercel**:

```bash
vercel --prod
```

Set all `.env.local` variables as Vercel Environment Variables. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain.

---

## License

MIT

# NeuroAdaptive Modules — Integration Guide

Two production-ready modules built as a standalone application,
designed to integrate cleanly into your main NeuroAdaptive OS project.

## Modules

| Module | Target | Key Tech |
|--------|--------|----------|
| Acoustic Phase-Inversion Sandbox | Autism / Sensory | Web Audio API, BiquadFilter nodes |
| RSD Shield PR Viewer | ADHD / Autism | GitHub Webhooks, Gemini sanitization, Supabase |

---

## Running Standalone

```bash
# Frontend
npm install
npm run dev        # → http://localhost:5174

# Backend (separate terminal)
cd server
node index.js     # → http://localhost:3001
```

---

## Integration into Main Project

### Step 1: Copy source files

```
src/components/acoustic/AcousticSandbox.tsx → your project's src/components/
src/components/rsd/RSDShield.tsx → your project's src/components/
src/hooks/useAcousticEngine.ts → your project's src/hooks/
src/lib/gemini.ts → your project's src/lib/ (or merge with existing)
src/types/index.ts → merge with your project's src/types/
```

### Step 2: Merge Zustand store

Copy the two slices from `src/store/index.ts` into your existing Zustand store.
The `cognitiveLoad` global state already matches your main project's biometric output.

### Step 3: Add routes to your React Router

```tsx
import { AcousticSandbox } from "./components/acoustic/AcousticSandbox";
import { RSDShield } from "./components/rsd/RSDShield";

// In your router:
<Route path="/acoustic" element={<AcousticSandbox />} />
<Route path="/rsd-shield" element={<RSDShield />} />
```

### Step 4: Merge backend webhook route

Copy the `/api/webhooks/github` route from `server/index.js` into your
existing `server/index.js`. It uses the same Supabase client and Gemini
API key you already have configured.

### Step 5: Run Supabase migration

Execute `supabase/rsd_shield_migration.sql` in your Supabase SQL Editor.

### Step 6: Connect cognitive load

Your main project's biometric pipeline outputs a cognitive load score.
Feed it into this module:

```tsx
import { useStore } from "./store"; // your main project store

// Wherever you calculate cognitive load:
const { setCognitiveLoad } = useStore();
setCognitiveLoad(biometricScore); // 0-100
```

---

## Architecture Decisions

### Why one app?
- Single `npm install` and `npm run dev`
- Shared Zustand store — modules communicate via shared state
- Consistent design system matching your main project
- Single backend server to merge

### Audio processing (Acoustic)
Uses Web Audio API `BiquadFilter` nodes with `type: "notch"`.
Real spatial audio would use `PannerNode` — the soundstage X position
currently controls visual placement only, with future 3D audio ready.
Demo mode works without mic permission (visual only).

### RSD Shield flow
```
GitHub PR comment → GitHub App webhook → POST /api/webhooks/github
→ HMAC-SHA256 verification → Gemini sanitization → Supabase insert
→ Frontend polls /api/rsd/comments → User sees calm, actionable feedback
```

---

## GitHub App Setup (for live webhook)

1. Go to github.com → Settings → Developer Settings → GitHub Apps → New
2. Set Webhook URL: `https://your-domain.com/api/webhooks/github`
3. Generate a webhook secret → add to `GITHUB_WEBHOOK_SECRET`
4. Subscribe to: `Pull request review`, `Pull request review comment`
5. Install the app on your repositories

# Project Galaxy — Portfolio

An interactive 3D portfolio where each project is a **planet** orbiting a galactic core.
Built with Next.js (App Router), React Three Fiber, and Prisma/Postgres. Visitors fly
through a "Sector 7" galaxy, select a planet to zoom in on a mission (project), browse a
skills constellation, and send a message through a hardened contact form.

> Theme: space / bounty-hunter. Sections snap full-screen: **Hero → Galaxy → Skills → Contact**.

---

## ✨ Features

- **3D project galaxy** (react-three-fiber) — planets on orbit rings around a glowing core,
  click to fly the camera in and open a 1:1 detail panel.
- **PBR planet skins** from **KTX2** (GPU-compressed) textures — diffuse, roughness, normal,
  displacement, city-lights (emissive), clouds, and a Fresnel atmosphere on the selected planet.
- **Tiered lazy loading** — textures only load when the galaxy scrolls into view; the full
  PBR set + clouds + displacement load only for the selected planet (overview stays light).
- **Loading screen** that gates the galaxy until its textures are actually ready.
- **Skills constellation** and a **contact form** with real anti-spam (honeypot + time-trap),
  idempotency, IP rate-limiting, and async email via Resend.
- **Server-first data** — Server Components read from Postgres via Prisma (no client fetch),
  with cold-start retry and graceful empty-state fallback. ISR caching.
- **Full-page snap scrolling**, hidden scrollbars, social (OpenGraph) share image.

---

## 🧰 Tech stack

| Area | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| 3D | three.js, @react-three/fiber, @react-three/drei (KTX2 / Basis) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon) via Prisma 7 + `@prisma/adapter-pg` |
| Email | Resend |
| Language | TypeScript |

---

## 📁 Project structure

```
src/
├─ app/                      # routing only
│  ├─ layout.tsx  page.tsx  globals.css
│  └─ api/v1/
│     ├─ contact/route.ts        # public contact form endpoint
│     └─ postProjects/route.ts   # admin-only project creation (Bearer token)
├─ components/
│  ├─ starfield/             # global Starfield background
│  └─ ui/                    # generic primitives (Input)
├─ features/                 # self-contained domains
│  ├─ galaxy/
│  │  ├─ components/ (Galaxy, GalaxyLoader, DetailPanel, SidebarNav, scene/*)
│  │  └─ lib/ (sceneConfig, derive, planetTextures)
│  ├─ hero/      components/ (HeroSection, Planet3D)
│  ├─ skills/    components/ (SkillsSection, SkillCard)
│  └─ contact/
│     ├─ components/ (ContactSection, ContactMessageForm, …)
│     ├─ hooks/ (useContactForm)
│     ├─ services/ (createContactMessage, sendContactEmail)
│     └─ validation.ts
├─ lib/                      # cross-cutting: prisma, types, utils, dbRetry, generated/prisma
└─ server/                   # shared server data access (getProjects, getSkills, createProject…)

prisma/   schema.prisma · migrations · seed.ts
public/   basis/ (KTX2 transcoder) · planets/<Name>/*.ktx2 · fonts · og-image.jpg
```

**Conventions:** features own their components/hooks/services; `@/` resolves to `src/`;
component files are `PascalCase` named as their default export.

---

## 🚀 Getting started

**Prerequisites:** Node 20+, a PostgreSQL database (Neon works great).

```bash
# 1. Install
npm install

# 2. Configure env (copy the example, then fill in real values)
cp .env.example .env.local

# 3. Generate the Prisma client + set up the database
npx prisma generate
npx prisma migrate deploy     # apply migrations to your DB
npx prisma db seed            # load sample projects + skills

# 4. Run
npm run dev                   # http://localhost:3000
```

---

## 🔑 Environment variables

Copy `.env.example` → `.env.local` and fill in. (`NEXT_PUBLIC_*` are exposed to the browser.)

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Postgres connection string (use Neon's **pooled** endpoint, `?sslmode=require`) | ✅ |
| `ADMIN_SECRET` | Bearer token guarding `POST /api/v1/postProjects` | ✅ |
| `RESEND_API_KEY` | Resend API key (contact email) | ✅ |
| `RESEND_FROM_EMAIL` | Verified sender address | ✅ |
| `CONTACT_EMAIL` | Inbox that receives contact messages | ✅ |
| `IP_HASH_SALT` | HMAC key for hashing sender IPs (≥ 16 chars) — **the contact route throws without it in production** | ✅ (prod) |
| `NEXT_PUBLIC_LINKEDIN_URL` / `NEXT_PUBLIC_GITHUB_URL` / `NEXT_PUBLIC_CONTACT_EMAIL` | Contact links | ✅ |
| `NEXT_PUBLIC_DOSSIER_URL` | URL to the résumé/dossier PDF | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL for OG images (falls back to `VERCEL_URL`) | optional |

Generate strong secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate && next build` |
| `npm start` | Start the production server (after build) |
| `npm run lint` | ESLint |

**Prisma:** `npx prisma migrate dev --name <change>` (create migration locally) ·
`npx prisma migrate deploy` (apply in prod) · `npx prisma db seed` · `npx prisma studio`.

---

## 🪐 Adding a planet skin

Planet appearance is driven by `PlanetVisual.textureUrl`, which is a **key** into the texture
registry at [`src/features/galaxy/lib/planetTextures.ts`](src/features/galaxy/lib/planetTextures.ts).
`'procedural'` (the default) uses a flat color; any other key uses a texture set.

1. Convert your equirectangular (2:1) maps to **KTX2** (smaller download, less VRAM, no CPU
   decode). Recommended encoder: Khronos **KTX-Software** (`toktx`), e.g.
   `toktx --t2 --genmipmap --encode etc1s --assign_oetf srgb diffuse.ktx2 diffuse.png`
   (colour maps = `srgb`, data maps = `linear`). `.webp`/`.png` also work via the standard loader.
2. Drop the files in `public/planets/<Name>/`.
3. Add an entry to `PLANET_TEXTURES` (diffuse `map` + any of `roughnessMap`, `normalMap`,
   `displacementMap`, `emissiveMap`, `cloudsMap`, `atmosphereColor`).
4. Set a project's `PlanetVisual.textureUrl` to that key (Prisma Studio or `seed.ts`).

The Basis transcoder for KTX2 is self-hosted at `public/basis/` (no CDN dependency).
Keep maps ~1–2K — they render on small spheres; 4K/8K is wasted detail and heavy VRAM.

---

## 🛡️ Contact form

`POST /api/v1/contact` flow (see [`src/features/contact`](src/features/contact)):

1. **Bot detection** — a hidden honeypot field + a submit-time "time-trap"; tripped submits get
   a fake success and are silently dropped (no DB write, no email).
2. **Validation** — shared client/server rules.
3. **Rate limiting** — by salted (HMAC) IP hash, windowed via a DB index (raw IPs never stored).
4. **Idempotency** — a client `X-Request-ID` is persisted (unique), so retries don't duplicate.
5. **Email** — sent via Resend in a Next.js `after()` callback so the response returns first;
   failures leave `emailSent: false` for recovery.

---

## ☁️ Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Set all environment variables (above) in Project → Settings → Environment Variables.
3. Build command is `npm run build` (`prisma generate && next build`). Migrations are **not**
   run during build — apply them with `npx prisma migrate deploy` against the prod DB when you
   add new ones (or add `prisma migrate deploy` to the build command if you prefer it automatic).
4. The home page uses ISR (`revalidate = 3600`); creating a project revalidates `/`.

**Social share image:** `public/og-image.jpg` (1200×630) is referenced from `layout.tsx`
metadata. Replace it with a fresh screenshot of the galaxy when projects change.

---

## 📝 Notes

- The generated Prisma client (`src/lib/generated/prisma`) is gitignored — `build` regenerates it.
- `getProjects` / `getSkills` retry transient DB errors (e.g. a Neon cold start) and fall back
  to an empty list, so a sleeping/unreachable DB degrades gracefully instead of crashing.
- Sections are `h-dvh` with CSS scroll-snap (`mandatory`); scrollbars are hidden globally.

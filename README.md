# gabonavarro.github.io

> Motion-first, art-directed personal portfolio for Gabriel Navarro Cerón — Data Science & Computer Engineering, ITAM (Mexico City). JARVIS-inspired, retro-futuristic, R3F + GSAP-driven.

**Live:** [https://gabonavarro.github.io](https://gabonavarro.github.io)

## Status

| Phase | Status |
|---|---|
| Phase 1 — Foundation | ✅ Complete |
| Phase 2 — Loading & Hero | ✅ Complete |
| Phase 3 — About & Skills | ✅ Complete |
| Phase 4 — Projects (9 R3F scenes) | ✅ Complete |
| Phase 5 — Experience, Labs, Contact | ✅ Complete |
| Phase 6 — Polish & Deploy | ✅ Complete |

Live data features (GitHub stats, Mexico City weather, contact form) require repo secrets configured in GitHub Actions — see Deploy section below.

## Stack

Next.js 15 (static export, App Router) · React Three Fiber + drei · GSAP 3.13+ (ScrollTrigger + SplitText) · Tailwind CSS v4 (CSS-first `@theme`) · Lenis smooth scroll · Web Audio API · Custom GLSL shaders · EmailJS · GitHub GraphQL + OpenWeatherMap.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export → ./out/
npx tsc --noEmit     # type check
```

Optional — create `.env.local` to enable live data and contact form:

```bash
NEXT_PUBLIC_OPENWEATHER_KEY=your_owm_key
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

Without these, the site builds and renders clean HUD fallbacks instead.

## Deploy

Auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

**One-time setup:**
1. Go to repo **Settings → Pages → Source** — set to **"GitHub Actions"**.
2. Go to **Settings → Secrets and variables → Actions** and add:
   - `OPENWEATHER_KEY`
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`
   - `EMAILJS_PUBLIC_KEY`
3. Push to `main` or trigger manually via **Actions → Deploy to GitHub Pages → Run workflow**.

## Documentation

| File | Purpose |
|---|---|
| [DESIGN.md](DESIGN.md) | Visual & interaction bible |
| [CLAUDE.md](CLAUDE.md) | Build manifest for Claude Code |
| [AGENTS.md](AGENTS.md) | Multi-agent task division |
| [progress.md](progress.md) | Live phase tracker |
| [decisions-log.md](decisions-log.md) | ADR-style decision record |
| [assets-checklist.md](assets-checklist.md) | Audio, images, API keys |

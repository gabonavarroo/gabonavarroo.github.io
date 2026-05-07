# gabonavarro.github.io

> Motion-first, art-directed personal portfolio for Gabriel Navarro Cerón — Data Science & Computer Engineering, ITAM (Mexico City). JARVIS-inspired, retro-futuristic, R3F + GSAP-driven.

🚧 **Currently in build.** Live URL will go here once Phase 6 deploys.

## Documentation map

This repo is run as a multi-agent build. The four orchestration documents below are the source of truth — read them in order when starting a session.

| File | Purpose |
|---|---|
| [DESIGN.md](DESIGN.md) | Visual & interaction bible — all aesthetic decisions are final here. |
| [CLAUDE.md](CLAUDE.md) | Build manifest for Claude Code — the primary build agent. |
| [AGENTS.md](AGENTS.md) | Multi-agent task division (Claude Code · Codex · Gemini · ChatGPT). |
| [progress.md](progress.md) | Live phase/sprint tracker, blockers, recent handoffs. |
| [decisions-log.md](decisions-log.md) | ADR-style record (D1–D8 and counting). |
| [assets-checklist.md](assets-checklist.md) | Inventory of audio, images, GeoJSON, API keys. |
| [plans/](plans/) | Six per-phase sub-plans (Phase 1 → Phase 6). |
| [handoffs/](handoffs/) | Cross-agent handoff log. |

## Stack

Next.js 15 (static export, App Router) · React Three Fiber + drei · GSAP 3.13+ (with ScrollTrigger + SplitText) · Tailwind CSS v4 (CSS-first `@theme`) · Lenis smooth scroll · Web Audio API · Custom GLSL shaders · EmailJS for the contact form · GitHub GraphQL (no auth) + OpenWeatherMap for live data.

## Local development

(Filled in once Phase 1 scaffolds the Next.js project.)

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to ./out/
```

## Deploy

Auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`. Required repo secrets: `OPENWEATHER_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`.

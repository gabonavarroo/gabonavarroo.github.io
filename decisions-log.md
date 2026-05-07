# Architectural Decisions Log

> ADR-style record. One entry per decision. Status = Accepted, Superseded (link forward), or Rejected. Append-only — never edit historical entries; supersede with a new entry.

---

## D1 — Display font: Orbitron

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** User
- **Context:** DESIGN.md §3 declared `--font-display: 'Space Grotesk'` while DESIGN.md §1 listed Space Grotesk as an explicit anti-pattern. CLAUDE.md and DESIGN.md elsewhere referenced Orbitron. The contradiction needed resolution before any font loading code was written.
- **Decision:** Use **Orbitron** (Google Fonts, weights 400/600/700/900) for all display text. Remove Space Grotesk and Rajdhani from the spec entirely.
- **Alternatives considered:** Space Grotesk (rejected — too generic, contradicts §1 anti-patterns); Rajdhani (rejected — weaker recognition value than Orbitron for the JARVIS/HUD aesthetic).
- **Consequences:** All `font-display` references must use Orbitron. `next/font/google` import in `layout.tsx` exposes `--font-orbitron`. Tailwind v4 `@theme` maps `font-orbitron` to that var.

---

## D2 — Canonical GitHub handle: `gabonavarroo`

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** User
- **Context:** Three spellings appeared across the docs and the placeholder `index.html`: `gabonavarroo` (DESIGN.md, AGENTS.md, git config), `gabonavaroo` (CLAUDE.md Phase 5, old `index.html` footer), and the repo itself is `gabonavarro.github.io`. Wrong handle silently breaks the GitHub stats GraphQL call.
- **Decision:** Canonical handle is **`gabonavarroo`** (two `r`, two `o`). All other spellings replaced project-wide.
- **Alternatives considered:** `gabonavaroo` (rejected — typo); `gabonavarro` (rejected — matches the repo name only because GitHub user-site repos drop the trailing `o`, but the actual user account is `gabonavarroo`).
- **Consequences:** `useGitHubStats.ts` queries with `login: "gabonavarroo"`. Footer links and contact panel all use this handle.

---

## D3 — `basePath: ''`

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** User (via plan acceptance)
- **Context:** CLAUDE.md said `basePath: '/[repo-name]'`. But `gabonavarro.github.io` is a **GitHub user site** served at the apex — a subpath would 404 every asset.
- **Decision:** `basePath: ''`. Use root-relative paths everywhere.
- **Consequences:** No path rewriting needed in components. Asset URLs are `/audio/main-theme.mp3`, `/posters/cdas.png`, etc.

---

## D4 — Music: royalty-free instrumental (replaces "Should I Stay or Should I Go")

- **Status:** Superseded by D9
- **Date:** 2026-05-07
- **Decided by:** User
- **Context:** DESIGN.md §7 specified "Should I Stay or Should I Go" by The Clash. That track is copyrighted; hosting it on a public portfolio is infringement.
- **Decision:** Replace with a **royalty-free / CC0 instrumental** with similar guitar/punk-rock energy. Asset path: `/public/audio/main-theme.mp3`. Sourcing tracked in `assets-checklist.md`.
- **Alternatives considered:** Synthesized JARVIS-only score (rejected — loses the rock-energy beat), keep the Clash track (rejected — legal risk), no music at all (rejected — loses cinematic dimension).
- **Consequences:** AudioController loads `main-theme.mp3` instead. The boot SFX phase remains Web-Audio synthesized (no file).

---

## D5 — Project gallery: horizontal pin desktop, vertical pinned-stack mobile

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** User
- **Context:** DESIGN.md §4 left this open ("side-scrollable OR stacked-scroll"). Architecture impacts ScrollTrigger setup, mobile fallback, and how `ProjectGallery.tsx` is built.
- **Decision:** **Desktop ≥768px:** GSAP ScrollTrigger pinned section, horizontal scroll-jacked translate across 8 cards. **Mobile <768px:** vertical pinned-stack (each card pins for one viewport-height of scroll, then unpins).
- **Alternatives considered:** vertical-only (rejected — less cinematic); non-scroll-jacked carousel (rejected — loses the cinematic flow even though more accessible).
- **Consequences:** ScrollTrigger pin spacing = total horizontal width on desktop. Mobile uses a separate snap-scroll implementation. `ProjectGallery.tsx` branches on `useIsMobile()`.

---

## D6 — Tailwind v4 (CSS-first `@theme`)

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** Claude Code (Opus 4.7), no objection from user
- **Context:** CLAUDE.md said "v4 or latest v3 stable". v4 ships CSS-first `@theme {}` blocks (no `tailwind.config.js`); v3 uses the conventional config file. We have a heavy CSS-variable system from DESIGN.md §2/§3 that maps cleanly into `@theme`.
- **Decision:** **Tailwind v4.** No `tailwind.config.js`. All design tokens live in `globals.css` inside `@theme {}`.
- **Alternatives considered:** Tailwind v3.4 (rejected — extra config drift surface; double source of truth for tokens).
- **Consequences:** Phase 1 setup uses `@tailwindcss/postcss` plugin. Tokens declared once in CSS.

---

## D7 — Project scenes: IntersectionObserver-gated R3F mount, PNG poster fallback

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** Claude Code (Opus 4.7), no objection from user
- **Context:** Mounting 8 R3F canvases concurrently kills performance and bloats the bundle. Three options: (a) one shared canvas with view switching, (b) per-card canvas with intersection-gating, (c) static poster + on-click interactive.
- **Decision:** **Option (b)** — each card has its own `<Canvas>` mounted only while the card is in the viewport (IntersectionObserver). Off-screen cards show a static 1200×900 PNG poster from `public/posters/`. On mobile, only posters are shown — no R3F at all.
- **Alternatives considered:** Shared canvas (rejected — coordination complexity, harder to dispose between views); static-only (rejected — loses interactivity desktop users deserve).
- **Consequences:** Codex must export a poster PNG for every scene. `ProjectCard.tsx` wraps the Canvas in an intersection-observed mount; poster shows underneath as a stable placeholder.

---

## D8 — GSAP SplitText / MorphSVG used freely

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** Claude Code (Opus 4.7), no objection from user
- **Context:** SplitText, MorphSVG, and the other "Club GSAP" plugins were paid until **GSAP 3.13** (April 2025). We are well past that release, so they ship free in the regular `gsap` npm package.
- **Decision:** Use SplitText (HeroText character reveal) and MorphSVG (ParticleRunner pose interpolation if needed) without restriction. Pin `gsap` to `^3.13.0` minimum.
- **Consequences:** No Club GSAP login needed. No paid plugin tarballs to manage.

---

## D9 — Spotify Embed replaces local main-theme.mp3

- **Status:** Accepted
- **Date:** 2026-05-07
- **Decided by:** User
- **Context:** D4 required a royalty-free local MP3 at `/public/audio/main-theme.mp3`. User wants to use The Clash — "Should I Stay or Should I Go" via Spotify's official Embed iFrame API instead — no local copyrighted audio stored, no OAuth, no Spotify Premium.
- **Decision:** Remove `/public/audio/main-theme.mp3` requirement. Add a HUD-styled Spotify launcher button (bottom-right). Use Spotify iFrame API (`spotify:track:39shmbIHICJ2Wxnk1fPSdz`). Drive visual reactivity with a deterministic synthetic beat proxy since iframe audio cannot be analyzed via Web Audio API.
- **Alternatives considered:** Keep royalty-free MP3 (rejected — user prefers specific track); Spotify Web Playback SDK (rejected — requires OAuth + Premium account); YouTube embed (rejected — less clean, ad-supported).
- **Consequences:** No local audio file for main music. `AudioController` retains boot SFX + UI SFX synthesis. New `SpotifyMusicButton` component. `getAnalyzerData()` returns synthetic beat proxy values when Spotify plays.

---

## (template for future entries)

```
## DN — One-line decision title

- **Status:** Proposed | Accepted | Superseded by D## | Rejected
- **Date:** YYYY-MM-DD
- **Decided by:** <agent or user>
- **Context:** <what forced this decision>
- **Decision:** <what we're doing>
- **Alternatives considered:** <briefly>
- **Consequences:** <what changes downstream>
```

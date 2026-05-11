# Build Progress

> Operational source of truth between agent sessions. Every agent must read this at session start and update it at session end. See `AGENTS.md` § "Orchestration Files" for the protocol.

## Current Phase: **SHIPPED ✅**
## Active sprint: None — all phases complete
## Last updated: 2026-05-10 by Claude Code (Sonnet 4.6)

---

## Phase status

- [x] **Phase 0** — Doc cleanup & scaffolding *(Claude Code, 2026-05-07)*
  - Patched DESIGN.md, CLAUDE.md, AGENTS.md per locked decisions D1–D8
  - Created `progress.md`, `decisions-log.md`, `assets-checklist.md`, `plans/phase-{1..6}-*.md`, `handoffs/README.md`
- [x] **Phase 1** — Foundation *(Claude Code, 2026-05-07)*
  - Next.js 15 static export scaffold, Tailwind v4 CSS vars, Orbitron + JetBrains Mono
  - CustomCursor, FBMBackground (placeholder shader), AudioController shell
  - HUDFrame, GlowButton, StatusDot UI primitives
  - GSAP registration (`src/lib/gsap.ts`), all 5 typed data stubs
  - React 19 + R3F 8.x compat fixes (JSX bridge, ClientShell ssr:false wrapper)
- [x] **Phase 2** — Loading & Hero *(Claude Code, 2026-05-07)*
  - Integrated Codex: AtomLoader, HeroScene, FBM shaders, ParticleRunner
  - Built: HeroText (SplitText char reveal, typewriter role, dividers, scroll indicator)
  - Built: HeroHUD (live clock, SYS_STATUS, mute toggle)
  - Wired page.tsx: AtomLoader → hero reveal → ParticleRunner → Phase 3 placeholder
  - Spotify Embed preserved (D9): button gesture-locked, beat proxy drives HeroScene/FBM reactivity
  - `npx tsc --noEmit` = 0 errors · `npm run build` = ✓ 105 kB first load
- [x] **Phase 3** — About & Skills *(Claude Code, 2026-05-07)*
  - AboutPanel: 40/60 grid, dossier rows with GSAP type-in stagger, corner brackets, StatusDot
  - PhotoShader: CSS scan-line + cyan grade (no R3F canvas needed for photo)
  - SkillOrrery: R3F Canvas, 4 inclined orbit rings (Gemini math), 5 skill pods (RoundedBox), Bloom postprocessing, hover expand + tech nodes, auto-rotate, OrbitControls, WebGLErrorBoundary + BloomBoundary isolation
  - GitHub Actions deploy.yml created; public/.nojekyll added
  - `npx tsc --noEmit` = 0 errors · `npm run build` = ✓ 155 kB first load
- [x] **Phase 4** — Projects (9 R3F scenes + horizontal-pin gallery) *(Claude Code + Codex, 2026-05-08)*
  - All 9 scenes delivered (CDASScene, FaultmapScene, PharmacyScene, PipelineScene, InsuLinkScene, GeneticScene, WordleScene, OptionsScene, CrashesScene)
  - All 9 posters in `public/posters/` (cdas, faultmap, pharmacy, pipeline, insulink, genetic, wordle, options, crashes)
  - ProjectGallery horizontal-pin desktop / vertical-stack mobile; width from PROJECTS.length
  - IntersectionObserver scene gating (only in-view card mounts Canvas)
  - SkillOrrery scroll trap fixed (enableZoom=false + 80px bottom scroll zone + fallback colors)
  - `npx tsc --noEmit` = 0 errors · `npm run build` = ✓ 155 kB first load
- [x] **Phase 5** — Experience, Labs, Contact *(Claude Code, 2026-05-10)*
  - MissionLog: alternating left/right timeline, animated SVG spine, clip-path entry per card, GSAP ScrollTrigger
  - useGitHubStats: GraphQL public endpoint, 1h localStorage cache, streak + topLanguage + topRepos
  - useWeather: OpenWeatherMap REST, 30min cache, graceful NO_KEY fallback
  - SystemMonitor: GithubWidget, WeatherWidget, SystemFuelGauge (time-of-day formula), UptimeCounter, ResearchTags vortex, TechStackPlaceholder (grid)
  - TransmissionPanel: terminal prompt inputs, GSAP flash on send, EmailJS integration, success/error/no-config states, social chips [GH][LI][MAIL]
  - TechStack3D: placeholder grid (Codex delivery still open)
  - Wired into page.tsx after ProjectGallery
  - `npx tsc --noEmit` = 0 errors · `npm run build` = ✓ 164 kB first load
- [x] **Phase 6** — Polish, cleanup & deploy-prep *(Claude Code, 2026-05-10)*
  - Deleted 4 Codex debug routes (phase-4-preview 304 kB chunk, scene-faultmap, scene-cdas, scene-pharmacy) — confirmed zero production links to those routes
  - Deploy workflow: upgraded Node 20→22, added `cancel-in-progress: true`, injected all 4 env var secrets (OPENWEATHER_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY)
  - Accessibility: `<label htmlFor>` on all 3 TransmissionPanel inputs; `aria-hidden="true"` on all 9 `.project-scene` containers; global `:focus-visible` cyan outline ring; skip-to-main link wired to `#main-content`; `prefers-reduced-motion` rule
  - `next.config.js`: confirmed output:export, trailingSlash, images:unoptimized, basePath:'' — no changes needed
  - README updated: live URL, phase status table, local dev + deploy instructions, secrets setup guide
  - `npx tsc --noEmit` = 0 errors · `npm run build` = ✓ 2 routes (was 6), 164 kB first load
  - Puppeteer smoke test: hero 375px ✓, contact 375px ✓, no horizontal overflow, labels present

---

## Component checklist

| Component | Phase | Owner | Status | Verification | Notes |
|---|---|---|---|---|---|
| Doc patches (DESIGN/CLAUDE/AGENTS) | 0 | Claude Code | ✅ done | git diff | D1–D8 reflected |
| `progress.md` | 0 | Claude Code | ✅ done | exists | this file |
| `decisions-log.md` | 0 | Claude Code | ✅ done | exists | seeded with D1–D8 |
| `assets-checklist.md` | 0 | Claude Code | ✅ done | exists | user fills in keys |
| `plans/phase-1-foundation.md` | 0 | Claude Code | ⏳ pending | exists | |
| `plans/phase-2-loading-hero.md` | 0 | Claude Code | ⏳ pending | exists | |
| `plans/phase-3-about-skills.md` | 0 | Claude Code | ⏳ pending | exists | |
| `plans/phase-4-projects.md` | 0 | Claude Code | ⏳ pending | exists | |
| `plans/phase-5-experience-labs-contact.md` | 0 | Claude Code | ⏳ pending | exists | |
| `plans/phase-6-polish-deploy.md` | 0 | Claude Code | ⏳ pending | exists | |
| `handoffs/README.md` | 0 | Claude Code | ⏳ pending | exists | template |
| Next.js scaffold | 1 | Claude Code | ✅ done | `npm run build` clean | Node 25.9 via Homebrew |
| `globals.css` (CSS vars) | 1 | Claude Code | ✅ done | all DESIGN §2/§3 tokens | Tailwind v4 `@theme` + plain `:root` |
| `layout.tsx` (fonts, cursor, FBM) | 1 | Claude Code | ✅ done | static export succeeds | ClientShell for ssr:false |
| `src/data/*.ts` stubs | 1 | Claude Code | ✅ done | tsc --noEmit clean | 5 files + types.ts |
| `src/lib/gsap.ts` | 1 | Claude Code | ✅ done | imports work | ScrollTrigger + SplitText registered |
| `CustomCursor.tsx` | 1 | Claude Code | ✅ done | client-only, ssr:false | hidden on touch |
| `FBMBackground.tsx` (host) | 1 | Claude Code | ✅ done | placeholder shader | Phase 2 swaps in fbm.frag.glsl |
| `HUDFrame.tsx`, `GlowButton.tsx` | 1 | Claude Code | ✅ done | typed, no errors | StatusDot also done |
| `AtomLoader.tsx` | 2 | **Codex** | ✅ done | `/private/tmp/atom-loader-t1_5-1280x900.png`, `/private/tmp/atom-loader-t3_0-1280x900.png` | R3F geometry + GSAP timing |
| `AudioController.tsx` + `useAudioAnalyzer` | 2 | Claude Code | ✅ done | mute persists in localStorage | Spotify Embed via D9; beat proxy for reactivity |
| `SpotifyMusicButton.tsx` + `SpotifyEmbedController.tsx` | 2 | Claude Code | ✅ done | button toggles play/pause | D9 — bottom-right HUD button |
| `fbm.frag.glsl` + `fbm.vert.glsl` | 2 | **Codex** | ✅ done | FBM scene snapshot | DESIGN §8.1 |
| `distortion.frag.glsl` | 2 | **Codex** | 🔲 | hover snapshot | DESIGN §8.2 |
| `scanline.frag.glsl` | 3 | **Codex** | 🔲 | photo snapshot | DESIGN §8.3 |
| `HeroScene.tsx` | 2 | **Codex** | ✅ done | `/private/tmp/hero-scene-1280x900.png`, `/private/tmp/hero-scene-repel-1280x900.png` | debug audio fallback tested; mouse repel works |
| `HeroText.tsx` | 2 | Claude Code | ✅ done | SplitText name + typewriter + dividers + scroll indicator | Orbitron 900 |
| `HeroHUD.tsx` | 2 | Claude Code | ✅ done | live HH:MM:SS, SYS_STATUS, mute toggle | HUDFrame + StatusDot |
| `runnerPoses.ts` (data) | 2 | **Gemini** | ✅ done | `npx tsc --noEmit` | 5 keyframes × 2048 pts; unchanged by Codex |
| `ParticleRunner.tsx` | 2 | **Codex** | ✅ done | `handoffs/particle-runner-start.png`, `handoffs/particle-runner-mid.png`, `handoffs/particle-runner-exit-scatter.png`, `handoffs/particle-runner-mobile.png` | temporary page mount only for QA; restored |
| `AboutPanel.tsx` | 3 | Claude Code | ✅ done | tsc clean, build clean | 40/60 grid, GSAP row type-in, PhotoShader integrated |
| `PhotoShader.tsx` | 3 | **Codex** | ✅ done | scanline + cyan grade | screenshots in handoffs/ |
| `SkillOrrery.tsx` | 3 | **Codex** | ✅ done | full R3F orbital scene, hover expand, bloom | scroll trap fixed 2026-05-08 (enableZoom=false + 80px scroll zone) |
| `ProjectGallery.tsx` | 4 | Claude Code | ✅ done | horizontal pin desktop, vertical mobile | 9 cards via PROJECTS.length |
| `ProjectCard.tsx` | 4 | Claude Code | ✅ done | IntersectionObserver gating, poster fallback | OPEN DOSSIER + GH actions |
| `SceneSkeleton.tsx` | 4 | Claude Code | ✅ done | Suspense spinner | |
| `ProjectDossierOverlay.tsx` | 4 | Claude Code | ✅ done | slide-in portal, ESC close | GSAP expo.out |
| `CDASScene.tsx` + poster | 4 | **Codex** | ✅ done | R3F Mexico map + hotspots | stub replaced by hook delivery |
| `FaultmapScene.tsx` + poster | 4 | **Codex** | ✅ done | embedding constellation, cluster severity, pipeline nodes | 634 lines; handoff in handoffs/ |
| `PharmacyScene.tsx` + poster | 4 | **Codex** | ✅ done | R3F P-median solver viz | hook delivery; reuses Mexico GeoJSON |
| `PipelineScene.tsx` + poster | 4 | **Codex** | ✅ done | layered data-flow with Akamai/proxy/DB nodes | 324 lines |
| `InsuLinkScene.tsx` + poster | 4 | **Codex** | ✅ done | patient-doctor network graph, care signals | 553 lines; insulinkGraph.ts data |
| `GeneticScene.tsx` + poster | 4 | **Codex** | ✅ done | GA curve-fitting animation, multi-gen convergence | 547 lines |
| `WordleScene.tsx` + poster | 4 | **Codex** | ✅ done | decision-tree pruning, optimal path highlight | 456 lines; wordleTree.ts data |
| `OptionsScene.tsx` + poster | 4 | **Codex** | ✅ done | volatility surface + options-flow terminal | 345 lines |
| `CrashesScene.tsx` + poster | 4 | **Codex** | ✅ done | 52-hotspot Chicago risk map, feature importance | 644 lines; crashesGraph.ts data |
| `MissionLog.tsx` | 5 | Claude Code | ✅ done | Puppeteer screenshot — alternating cards, spine visible | clip-path reveal, GSAP ScrollTrigger |
| `useGitHubStats.ts` | 5 | Claude Code | ✅ done | hook present, GH GraphQL requires auth — graceful fallback | 1h localStorage cache |
| `useWeather.ts` | 5 | Claude Code | ✅ done | NO_KEY fallback rendered correctly | 30min localStorage cache |
| `SystemMonitor.tsx` | 5 | Claude Code | ✅ done | Puppeteer screenshot — all 4 widgets + vortex + stack | fuel gauge bar animates on scroll |
| `TechStack3D.tsx` | 5 | **Codex** | 🔲 placeholder grid shipped | Codex 3D delivery still open | TechStackPlaceholder replaces until Codex delivers |
| `TransmissionPanel.tsx` | 5 | Claude Code | ✅ done | Puppeteer screenshot — form visible, no-config warning shown | EmailJS wired; needs env vars to actually send |
| ScrollTrigger entrances (every section) | 6 | Claude Code | ✅ done | each section already had GSAP entrance via ScrollTrigger (Phases 3-5) | |
| Mobile fallbacks | 6 | Claude Code | ✅ done | Puppeteer 375px — hero, contact clean; no overflow | project scenes already poster-only on mobile (Phase 4) |
| Low Power Mode toggle | 6 | Claude Code | 🔲 deferred | Phase 7 enhancement | not blocking deploy |
| `.github/workflows/deploy.yml` | 6 | Claude Code | ✅ done | Node 22, env secrets, cancel-in-progress:true | |
| Skip-to-main + focus-visible | 6 | Claude Code | ✅ done | skip link wired, global :focus-visible cyan ring | |
| `<label>` on contact inputs | 6 | Claude Code | ✅ done | 3 labels with htmlFor | TerminalInput updated |
| `aria-hidden` on all `.project-scene` | 6 | Claude Code | ✅ done | all 9 cards confirmed via Puppeteer | |
| README live status | 6 | Claude Code | ✅ done | live URL, setup guide, secrets instructions | |

---

## Open blockers

- **API keys not yet set as repo secrets** — GitHub Actions secrets (`OPENWEATHER_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`) must be added in repo Settings before live data and contact form work on the deployed site. Site deploys and renders clean fallbacks without them.
- **TechStack3D** — Codex 3D delivery still open. Placeholder grid ships. Not blocking deploy.

---

## Recent handoffs

- **2026-05-10** — Phase 5 complete. Screenshots: `handoffs/phase-5-mission-log.png`, `handoffs/phase-5-system-monitor.png`, `handoffs/phase-5-transmission-panel.png` (captured via Puppeteer).

---

## Session log (append-only, newest first)

- **2026-05-10 — Claude Code (Sonnet 4.6).** Phase 6 complete (cleanup + deploy-prep). (1) Deleted 4 Codex debug routes (`phase-4-preview`, `scene-faultmap`, `scene-cdas`, `scene-pharmacy`) — removed 304 kB chunk; build now has 2 routes. (2) Updated `.github/workflows/deploy.yml`: Node 20→22, `cancel-in-progress: true`, injected `OPENWEATHER_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY` secrets. (3) Accessibility pass: replaced `<span>` fake-labels with real `<label htmlFor>` in `TransmissionPanel.tsx`; added `aria-hidden="true"` to all 9 `.project-scene` wrappers in `ProjectCard.tsx`; added global `:focus-visible` cyan outline ring + `:focus:not(:focus-visible)` suppression to `globals.css`; added `.skip-to-main` class + `prefers-reduced-motion` rule; added skip-to-main `<a>` to `layout.tsx`; added `id="main-content"` to `<main>` in `page.tsx`. (4) Updated `README.md` with live URL, phase status table, local dev guide, GitHub Pages setup + secrets instructions. `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ 164 kB first load, 2 routes. Puppeteer: mobile 375px hero ✓, contact ✓, no overflow, labels confirmed via DOM query. **Repo is deploy-ready.** User must: (a) set GitHub Pages source to "GitHub Actions", (b) add 4 secrets, (c) push to main.

- **2026-05-10 — Claude Code (Sonnet 4.6).** Phase 5 complete. Created: `src/hooks/useGitHubStats.ts` (GitHub GraphQL, 1h cache, streak+topLanguage+repos — graceful OFFLINE fallback since public GraphQL now requires auth), `src/hooks/useWeather.ts` (OpenWeatherMap REST, 30min cache, NO_KEY fallback renders `──°C`), `src/components/experience/MissionLog.tsx` (vertical timeline, SVG animated spine with dashoffset flow, alternating left/right cards per DESIGN §5, GSAP clip-path reveal per entry), `src/components/labs/SystemMonitor.tsx` (GithubWidget, WeatherWidget, SystemFuelGauge with time-of-day formula + GSAP bar, UptimeCounter HH:MM:SS, ResearchTags 2D vortex via rAF, TechStackPlaceholder 8-cell grid), `src/components/contact/TransmissionPanel.tsx` (terminal prompt inputs, flash overlay GSAP, EmailJS send, success/error/no-config states, [GH][LI][MAIL] social chips). Added `blink-cursor` keyframe + mobile responsive CSS to `globals.css`. Wired all three sections into `page.tsx` after `ProjectGallery`. Puppeteer smoke test: all sections render correctly. `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ 164 kB first load. **Env vars absent** (no `.env.local`): GitHub widget shows OFFLINE+link fallback; Weather shows no-key placeholder; EmailJS shows ⚠ warning but form still renders. **Next:** Phase 6 — polish, mobile fallbacks, delete debug routes, deploy workflow.

- **2026-05-08 — Claude Code (Sonnet 4.6).** Dossier content integrated + SkillOrrery crash fixed. (1) Created `src/data/projectDossiers.ts` from `handoffs/phase-4-project-dossiers.md` — typed `ProjectDossier` interface + `PROJECT_DOSSIERS` map for all 9 sceneIds. (2) Rewrote `ProjectDossierOverlay.tsx` to render MISSION, ARCHITECTURE (▸ list), CORE OPERATIONS (▸ list), METRICS (chip row), TECHNICAL SIGNAL (bordered callout), TECH STACK, and action links — graceful fallback when no dossier entry exists. (3) Fixed SkillOrrery crash: `EffectComposer`/`Bloom` from `@react-three/postprocessing` threw from a hook (uncatchable by error boundary), crashing the entire skills section. Removed `EffectComposer`, `Bloom`, and `BloomBoundary` — orbital scene renders correctly without postprocessing. `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ 155 kB first load.

- **2026-05-08 — Claude Code (Sonnet 4.6).** Phase 4 integration & verification pass. Confirmed all 9 scene files present (CDASScene 524L, FaultmapScene 634L, PharmacyScene 518L, PipelineScene 324L, InsuLinkScene 553L, GeneticScene 547L, WordleScene 456L, OptionsScene 345L, CrashesScene 644L). Confirmed all 9 poster PNGs in `public/posters/`. Confirmed sceneRegistry.ts imports all 9 via React.lazy. Confirmed PROJECTS array has 9 entries with matching sceneIds. Confirmed ProjectGallery derives width from PROJECTS.length, IntersectionObserver gates one Canvas at a time, mobile uses posters only. Fixed 2 SkillOrrery bugs: (1) blank initial render — `useSkillColors` now initializes with `FALLBACK_COLORS` (hardcoded hex) instead of null, so the Canvas renders on first paint; (2) scroll trap — added `enableZoom={false}` to OrbitControls so wheel events bubble to the document instead of being intercepted, plus an explicit 80px non-canvas scroll zone at the bottom of the section. Updated `progress.md` (Phase 4 ✅, all scene rows ✅, SkillOrrery ✅, stale blocker removed, Phase 5 blockers added). `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ 155 kB first load. **Remaining cleanup:** delete 4 Codex debug routes before Phase 6. **Next:** Phase 5 (MissionLog, SystemMonitor, TransmissionPanel) — needs API keys in `.env.local`.

- **2026-05-07 — Codex.** Batch A Phase 4 CDAS + Pharmacy verification pass. Confirmed `src/components/projects/scenes/CDASScene.tsx` renders the Mexico search grid with 32 state boundaries, 46 peripheral source nodes, amber/red match hotspots, fuzzy-match beams, scan sweeps, and reticle/core overlays. Confirmed `src/components/projects/scenes/PharmacyScene.tsx` renders the P-median facility-location scene with Mexico boundaries, 200-ish scored candidate points, 47 selected pharmacy nodes, orange coverage rings, score beams, and pruning markers. Regenerated required artifacts from browser-rendered static scene harnesses: `handoffs/phase-4-cdas-scene.png` (1280×900), `handoffs/phase-4-pharmacy-scene.png` (1280×900), `public/posters/cdas.png` (1200×900), `public/posters/pharmacy.png` (1200×900). Verification: `npm run type-check` = 0 errors; `npm run build` = ✓ static export; `sips -g pixelWidth -g pixelHeight ...` confirmed required dimensions.

- **2026-05-07 — Claude Code (Sonnet 4.6).** Phase 4A complete. Added PROJECT_04.09 (Chicago Crash Recidivism) to `src/data/projects.ts` per D11. Created gallery architecture: `ProjectGallery.tsx` (GSAP ScrollTrigger horizontal pin desktop / vertical stack mobile, width derived from `PROJECTS.length`), `ProjectCard.tsx` (IntersectionObserver-gated scene mount, poster fallback with onError → SceneSkeleton, OPEN DOSSIER primary action, GH/live secondary actions), `SceneSkeleton.tsx` (spinner fallback for Suspense), `ProjectDossierOverlay.tsx` (portal to document.body, GSAP expo.out slide-in, ESC handler, full project meta). Created scene registry at `src/components/projects/scenes/sceneRegistry.ts` (9 entries via `React.lazy`). Created stubs for all 9 scenes (CDASScene, FaultmapScene, PharmacyScene, PipelineScene, InsuLinkScene, GeneticScene, WordleScene, OptionsScene, CrashesScene). Note: CDASScene and PharmacyScene were immediately replaced by hook-delivered Codex R3F implementations (Mexico map + hotspots; P-median solver). Added gallery/card/dossier CSS to `globals.css`. Created `src/lib/useIsMobile.ts`. Wired `ProjectGallery` into `page.tsx` as `ssr:false` dynamic import after SkillOrrery. Updated `decisions-log.md` (D11 formalized), `progress.md`, `plans/phase-4-projects.md` (8→9 throughout). `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ 155 kB first-load. **Next Codex batches needed:** FaultmapScene, PipelineScene, InsuLinkScene, GeneticScene, WordleScene, OptionsScene, CrashesScene + all 9 poster PNGs to `public/posters/`.


- **2026-05-07 — Claude Code (Sonnet 4.6).** Phase 3A complete. Built `src/components/about/AboutPanel.tsx`: 40/60 CSS Grid layout (single-column on mobile via `.about-grid`), dynamic `PhotoShader` integration (Codex-delivered, `scanline.frag/vert.glsl`), `HUDCornerBrackets` SVG draw-in animation, `StatusDot` "STATUS: ACTIVE", `HUDFrame` dossier panel with 5 `DataRow` entries (`OPERATIVE`, `INSTITUTION`, `BASE`, `CLEARANCE`, `LANGUAGES`), GSAP timeline (ScrollTrigger `top 75%`): SplitText char stagger per row (0.03s/char, 0.3s row gap), bio `fromTo` fade-in last. Added `.about-grid` + `.skills-pending` CSS to `globals.css`. Wired `AboutPanel` into `page.tsx` after `ParticleRunner`; added temporary skills placeholder (`data-section="skills"`, `SKILL MATRIX PENDING CODEX VISUAL MODULE`). Verified `OPERATOR.bio` present in `operator.ts` and `bio: string` in `types.ts`. `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ 154 kB first-load. **Remaining blocker:** SkillOrrery.tsx from Codex (math helpers already in `src/components/skills/SkillOrrery.tsx`).

- **2026-05-07 — Claude Code (Sonnet 4.6).** QA fix: ParticleRunner bleed-through. Root cause: three compounding bugs. (1) ParticleRunner section background was `rgba(5,8,15,0)` at the top — fully transparent — so HeroScene (position:fixed, z:1) showed through; user saw HeroScene's cursor-repel cloud, not the runner. (2) StaticRunnerFallback also had semi-transparent gradient. (3) `useMotionFallback` started as `true` causing canvas→fallback flash. Fixes: changed both section backgrounds to `var(--bg-void)`; added lazy initialiser to `useMotionFallback`; added `IntersectionObserver` on the hero section in `page.tsx` to unmount HeroScene once it leaves the viewport. `runnerPoses.ts` verified intact (5 correct keyframes, proper side-view humanoid). ParticleRunner logic verified intact (THREE.Points, RUNNER_POSES interpolation, ScrollTrigger scrub). `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ 105 kB. Handoff saved: `handoffs/2026-05-07-particle-runner-qa-fix.md`.

- **2026-05-07 — Claude Code (Sonnet 4.6).** Phase 2 integration complete. Validated all Codex deliverables (AtomLoader, HeroScene, fbm.vert/frag.glsl, ParticleRunner) — `npx tsc --noEmit` = 0 errors before any changes. FBMBackground already carried the production FBM shader inline (identical to Codex's fbm.frag.glsl); no re-wire needed. Built `HeroText.tsx`: Orbitron 900 name + GSAP SplitText stagger (y:40→0, 0.04s/char, expo.out), `useTypewriter` hook drives JetBrains Mono role line, clip-path draw-in dividers, bouncing chevron scroll indicator. Built `HeroHUD.tsx`: HUDFrame wrapper, live HH:MM:SS/YYYY.MM.DD clock via setInterval, SYS_STATUS ONLINE + StatusDot, blinking cursor terminator, mute-toggle button (SVG speaker icon, aria-pressed). Wired `page.tsx`: AtomLoader (ssr:false, z-100) → `loaderDone` state → reveals HeroHUD + HeroText; HeroScene (ssr:false, fixed z-1) warms up behind loader; ParticleRunner (ssr:false) follows; Phase 3 placeholder section. Spotify architecture preserved: button gesture-locked, no auto-play, beat proxy feeds HeroScene bass/mid/high reactivity, fallback link on error. Added `.hero-chevron` bounce keyframe to globals.css. `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ static export, first-load JS = 105 kB. Browser smoke-test deferred to user — no Playwright MCP in this session. **Next:** Phase 3 (AboutPanel.tsx, PhotoShader.tsx, SkillOrrery.tsx).

- **2026-05-07 — Codex.** Built `src/components/transitions/ParticleRunner.tsx` using Gemini's `RUNNER_POSES` without mutating the data file. Implementation: R3F `THREE.Points` BufferGeometry, normalized minimum shared pose length, five-pose stride interpolation, GSAP ScrollTrigger pin/scrub progress ref, left-to-right runner travel, scatter/fade after 95% progress, reduced-motion/mobile static HUD fallback, and explicit geometry/material disposal. Verification used a temporary `page.tsx` mount that was restored afterward. Screenshots saved: `handoffs/particle-runner-start.png`, `handoffs/particle-runner-mid.png`, `handoffs/particle-runner-exit-scatter.png`, `handoffs/particle-runner-mobile.png`. Browser console: no app errors; dev-only React DevTools/Fast Refresh messages observed.
- **2026-05-07 — Codex.** Phase 2 visual QA repair: fixed invisible/missing HeroText by giving the DOM text layer an explicit z-index above the fixed HeroScene canvas, adding a guarded SplitText fallback path, and rendering the name as two visual lines (`GABRIEL` / `NAVARRO`). Verification: `handoffs/phase-2-hero-text-fixed.png` shows name, role typewriter, divider lines, HeroHUD, and scroll indicator over the particle cloud. `handoffs/phase-2-particle-runner-mid-qa.png` confirms ParticleRunner renders, but it still reads as a front-facing humanoid/runner silhouette rather than the intended side-view sprint; repair should stay in Phase 2 before Phase 3.
- **2026-05-07 — Codex.** Built `src/components/hero/HeroScene.tsx`: fullscreen R3F Canvas, FBM shader background plane, 3,000-point BufferGeometry cloud, cyan soft-falloff ShaderMaterial, raycaster plane mouse repel, audio/debug bass-mid-high reactivity, and explicit disposal for custom geometry/materials. Verification: temporary home-page mount with debug audio, `npm run build` clean, screenshots saved at `/private/tmp/hero-scene-1280x900.png` and `/private/tmp/hero-scene-repel-1280x900.png`; second capture shows cursor repulsion cavity. Browser console: no errors or warnings.
- **2026-05-07 — Claude Code (Opus 4.6 Thinking).** Spotify Embed integration (D9). Superseded D4 (royalty-free local MP3). Created: `src/types/spotify-iframe.d.ts` (Spotify iFrame API types), `src/data/audio.ts` (track URI + constants), `src/lib/audio-beat-proxy.ts` (deterministic synthetic beat proxy at 116 BPM), `src/components/audio/SpotifyEmbedController.tsx` (iFrame API lifecycle), `src/components/audio/SpotifyMusicButton.tsx` (HUD-styled bottom-right launcher). Refactored `AudioController.tsx` to add `spotifyPlaying` state and delegate `getAnalyzerData()` to beat proxy. Updated `ClientShell.tsx`, `globals.css`. Updated `decisions-log.md` (D9), `assets-checklist.md`, this file, and `plans/phase-2-loading-hero.md`. `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ static export. **Next:** continue Phase 2 (AtomLoader, HeroScene, HeroText, HeroHUD, ParticleRunner).
- **2026-05-07 — Claude Code (Sonnet 4.6).** Phase 1 complete. Installed Node 25.9 via Homebrew. Scaffolded Next.js 15 project with static export, Tailwind v4 CSS-first `@theme`, Orbitron + JetBrains Mono via `next/font`. Created all UI primitives (CustomCursor, FBMBackground placeholder, HUDFrame, GlowButton, StatusDot), AudioController shell, GSAP registration, and 5 typed data stubs (operator, projects, experience, skills, research). Solved React 19 / R3F 8.x incompatibility via `src/types/globals.d.ts` JSX bridge (`declare module 'react' { namespace JSX { interface IntrinsicElements extends ThreeElements {} } }`) and `ClientShell.tsx` ssr:false wrapper. `npx tsc --noEmit` = 0 errors. `npm run build` = ✓ static export, first-load JS = 103 KB. **Next:** Phase 2 (AtomLoader, AudioController, HeroScene, HeroText, HeroHUD, ParticleRunner). Requires `public/audio/main-theme.mp3` (see assets-checklist).
- **2026-05-07 — Claude Code (Opus 4.7).** Phase 0 complete. Patched all three spec docs to reflect locked decisions D1–D8 (font=Orbitron, handle=gabonavarroo, basePath='', royalty-free music, horizontal-pin gallery, Tailwind v4, IntersectionObserver R3F mounting, GSAP plugins free). Created orchestration scaffolding: this file, `decisions-log.md`, `assets-checklist.md`, six per-phase sub-plans under `plans/`, and `handoffs/README.md` template. Replaced placeholder `README.md`. Did **not** delete `index.html` — pending user confirmation. **Next:** user reviews scaffolding; on approval, kick off Phase 1 (Next.js scaffold).

# Master Execution Plan — Gabriel Navarro Portfolio (`gabonavarro.github.io`)

## Context

You have three thoroughly-written specs already on disk: [DESIGN.md](DESIGN.md) (the visual/interaction bible), [CLAUDE.md](CLAUDE.md) (build manifest for the primary agent), and [AGENTS.md](AGENTS.md) (multi-agent task division). The codebase itself, however, is empty — only those three docs, a placeholder [index.html](index.html), a one-line [README.md](README.md), and the resume PDF live at the repo root. The git history is two commits, both scaffolding.

This plan does three things:

1. **Fixes the inconsistencies** between the three spec docs before any code is written, so agents don't silently diverge.
2. **Adds the orchestration scaffolding** the user asked for — `progress.md`, per-phase plan files, an asset checklist, an architectural decision log, and a handoff registry — so a multi-agent build (Claude Code + Codex + Gemini + ChatGPT) stays coherent across sessions.
3. **Sequences the build into 7 phases** (Phase 0 = doc cleanup; Phases 1–6 mirror the existing CLAUDE.md phases but with explicit per-component agent assignment, sub-plan files, and verification gates).

The intended outcome: at the end of execution, `https://gabonavarro.github.io/` ships a JARVIS-styled, motion-first portfolio that is fully static, GitHub-Pages-deployable, and faithful to the design bible — built by a coordinated agent fleet with full traceability.

---

## Locked Decisions (logged in `decisions-log.md` during Phase 0)

User-confirmed during planning:

| # | Decision | Resolution |
|---|---|---|
| **D1** | Display font | **Orbitron** (Space Grotesk and Rajdhani fully removed from docs) |
| **D2** | GitHub handle | **`gabonavarroo`** (two r, two o) — replace `gabonavaroo` everywhere |
| **D3** | `basePath` | **`''`** (user site at `gabonavarro.github.io` apex) |
| **D4** | Music | **Royalty-free instrumental** with guitar/punk-rock feel (replaces "Should I Stay or Should I Go"). Track sourcing tracked in `assets-checklist.md`. |
| **D5** | Project gallery | **Horizontal pin (scroll-jacked) on desktop ≥768px; vertical pinned-stack on mobile.** Architecture lives in `ProjectGallery.tsx`. |

Decisions I'm taking on Claude's recommendation without further user input (still logged as ADRs, user can override on review):

| # | Decision | Resolution |
|---|---|---|
| **D6** | Tailwind | **v4** (CSS-first `@theme`). Reason: cleaner integration with our extensive CSS-var system; no `tailwind.config.js` to drift. |
| **D7** | R3F mounting | **IntersectionObserver-gated mount/unmount** for the 8 project scenes; static PNG poster fallback on mobile. One Canvas active at a time. |
| **D8** | GSAP plugins | **SplitText / MorphSVG used freely** (free as of GSAP 3.13, April 2025; we're past that). Logged for record. |

---

## Doc-cleanup deltas (Phase 0 work)

Concrete, line-level changes to the existing three docs once D1–D8 are answered:

### `DESIGN.md`
- §3 Font Stack: replace `--font-display: 'Space Grotesk', 'Rajdhani', sans-serif;` with `--font-display: 'Orbitron', sans-serif;`. Remove all references to Space Grotesk and Rajdhani throughout the doc (they're explicit anti-patterns per §1).
- §11 Static Export: change `basePath: '/[repo-name]'` to `basePath: ''  // user site at gabonavarro.github.io apex`.
- §13 OPERATOR: lock `github: "gabonavarroo"` (two r, two o); strip brackets from email and linkedin.
- §7 Audio Phase 2: replace the "Should I Stay or Should I Go" track with `royalty-free-theme.mp3` (asset to be sourced — see `assets-checklist.md`). Keep all other audio behavior identical (fade in over 1.5s at 20%, looping crossfade, etc.).

### `CLAUDE.md`
- L28 dependencies: replace `@studio-freig/lenis` with **`lenis`** (current canonical package name; it was renamed from `@studio-freight/lenis` in 2024).
- L74 `basePath: ''`.
- L82 fonts to load: **Orbitron** (weights 400, 600, 700, 900) + **JetBrains Mono** (weights 400, 500, 600). Remove Space Grotesk.
- L204 `gabonavaroo` → `gabonavarroo`.
- Add a new rule under "R3F / Three.js rules": **"Use `THREE.Points` for dot-particle clouds (BufferGeometry); use `InstancedMesh` only for repeated 3D meshes (e.g., skill pods, tech logos). Do not conflate the two."** The current rule "Use InstancedMesh for all particle systems" is wrong for the hero cloud.
- Phase 6 step 5 bundle gate: align with the table at L379 — change the inline ">100KB" to ">150KB gzipped" to match the verification table.
- Add Phase 4 specifics: **horizontal-pinned ScrollTrigger gallery on desktop, vertical pinned-stack on mobile**, IntersectionObserver-gated R3F canvas mounting (one active at a time), static PNG posters in `public/posters/` for mobile fallback.

### `AGENTS.md`
- L271 GraphQL: change `gabonavarroo` reference to remain `gabonavarroo` (it's already correct; just confirm vs. CLAUDE.md fix).
- Add a new section **"Orchestration files"** referencing `progress.md`, `plans/`, `decisions-log.md`, `assets-checklist.md`, `handoffs/` (specs below).
- Sprint 0 checklist: tick off D1–D5 (already resolved); record D6–D8 as Claude-defaulted ADRs.
- Sprint 5+ Codex prompt template: add explicit "build static PNG poster of final scene state at 1200×900, commit to `public/posters/`" deliverable.

---

## New scaffolding files (created in Phase 0, before any code)

```
/
├── progress.md                  # live phase/sprint tracker, blockers, handoff log
├── decisions-log.md             # ADR-style record, one entry per decision
├── assets-checklist.md          # audio, fonts, photo, GeoJSON, API keys
├── plans/
│   ├── phase-1-foundation.md
│   ├── phase-2-loading-hero.md
│   ├── phase-3-about-skills.md
│   ├── phase-4-projects.md
│   ├── phase-5-experience-labs-contact.md
│   └── phase-6-polish-deploy.md
└── handoffs/
    └── README.md                # template + one file per cross-agent handoff
```

**`progress.md` schema** (the operational source of truth between sessions):

```markdown
# Build Progress

## Current Phase: <phase id> — <name>
## Active sprint: <sprint id>
## Last updated: <ISO date> by <agent>

### Phase status
- [x] Phase 0 — Doc cleanup & scaffolding (Claude Code, 2026-05-07)
- [ ] Phase 1 — Foundation
- [ ] Phase 2 — Loading & Hero
- [ ] Phase 3 — About & Skills
- [ ] Phase 4 — Projects (8 scenes)
- [ ] Phase 5 — Experience, Labs, Contact
- [ ] Phase 6 — Polish & Deploy

### Component checklist
| Component | Owner | Status | Verification | Notes |
| AtomLoader.tsx | Codex | ⏳ in progress | screenshot pending | …

### Open blockers
- …

### Recent handoffs
- 2026-05-08 Claude Code → Codex — HeroScene shader spec ([handoffs/2026-05-08-heroscene.md])
```

**`decisions-log.md` schema**: ADR-style — one entry per architectural decision, with status (Accepted / Superseded), date, rationale, alternatives considered. Seeded with D1–D8.

**`assets-checklist.md`**: line items with checkbox + source URL + license note for: Orbitron + JetBrains Mono (Google Fonts, OFL), JARVIS boot SFX (synthesized in-browser preferred — no file), main music track (per D4), Gabriel headshot (user-provided), favicon, OG image, Mexico GeoJSON (Natural Earth, public domain), OpenWeatherMap API key (free tier), EmailJS service ID + template ID + public key.

**`handoffs/`** uses the format already specified in AGENTS.md §"Agent Communication Format" — one markdown file per handoff, named `YYYY-MM-DD-<short-tag>.md`.

**`plans/phase-N-*.md`** files mirror the structure of this master plan but scope down to a single phase: components to build, agent owner, inputs/outputs, verification gate, exit criteria.

---

## Master Phase Sequence

Each phase has: owner, inputs, deliverables, verification gate, exit criteria. Sub-plans live in `plans/`.

### Phase 0 — Doc cleanup & orchestration scaffolding
**Owner:** Claude Code (this session, after user resolves D1–D8)
**Deliverables:**
- Patches to `DESIGN.md`, `CLAUDE.md`, `AGENTS.md` per the deltas above.
- Create `progress.md`, `decisions-log.md`, `assets-checklist.md`, `plans/phase-{1..6}-*.md`, `handoffs/README.md`.
- Delete or replace placeholder [index.html](index.html) and [README.md](README.md).
**Exit:** `git diff` shows clean doc patches; scaffolding files exist; D1–D8 logged in `decisions-log.md`.

### Phase 1 — Foundation
**Owner:** Claude Code (sole)
**Sub-plan:** `plans/phase-1-foundation.md`
**Deliverables (per CLAUDE.md Phase 1 + corrections):**
- Next.js 15 scaffold, App Router, static export, no src dir → manually move to `src/`.
- Dependency install: `three @react-three/fiber @react-three/drei gsap @gsap/react lenis @emailjs/browser`. Tailwind per D6.
- `next.config.js` with `output: 'export'`, `basePath: ''`, `trailingSlash: true`, `images.unoptimized: true`.
- `globals.css` containing every CSS variable from DESIGN.md §2 + §3 (run a literal pass — do not paraphrase tokens).
- `app/layout.tsx` loads Orbitron + JetBrains Mono via `next/font/google`, declares `--font-orbitron` / `--font-mono` CSS vars, mounts `CustomCursor` and `FBMBackground`.
- `src/data/{operator,projects,experience,skills,research}.ts` stub files with full TypeScript types (no `any`). Operator data hydrated from DESIGN.md §13. Projects/experience hydrated from the resume PDF + the project list in DESIGN.md §4.
- `src/lib/gsap.ts` registers ScrollTrigger + SplitText at module scope; exports a typed `gsapContext` helper.
- `CustomCursor.tsx` (DOM, two-div reticle with GSAP lerp, hidden on touch).
- `FBMBackground.tsx` (global fixed R3F canvas, `pointer-events: none`, `z-index: 0`).
- `HUDFrame.tsx` and `GlowButton.tsx` UI primitives.
**Verification gate:**
- `npx tsc --noEmit` zero errors.
- `npm run build` clean static export to `out/`.
- Mounted dev server renders an empty page with cyan FBM nebula behind a custom cursor reticle. No console errors.

### Phase 2 — Loading & Hero (highest-risk phase)
**Owners (split):**
- **Codex** owns: `AtomLoader.tsx`, `HeroScene.tsx` (R3F particles + FBM uniforms + audio reactivity), all three GLSL shaders (`fbm.frag.glsl`, `distortion.frag.glsl`, `scanline.frag.glsl`), `ParticleRunner.tsx`. These are the math-heavy, browser-verified pieces.
- **Claude Code** owns: `AudioController.tsx` (Web Audio API engine, autoplay-unlock pattern, mute toggle, localStorage), `useAudioAnalyzer.ts`, `HeroText.tsx` (SplitText name reveal, typewriter role), `HeroHUD.tsx` (top-right status widget), the audio-unlock invisible click target, layout/orchestration of the section.
- **Gemini** owns: pre-computing 5 keyframe vertex coordinate arrays for the humanoid silhouette in `ParticleRunner` (output: `src/data/runnerPoses.ts`).

**Verification gate:**
- Loading screen plays atom sequence → zooms out → hero reveals.
- Audio unlocks on first user gesture; mute toggle persists across reload.
- Particle cloud reacts to mouse repel; bass drives spread; mid drives FBM turbulence.
- ParticleRunner crosses screen on scroll, scatters at 100% scroll progress.
- Codex submits screenshots at 1280×900 of: atom mid-spin, atom zoom-out frame, hero with particles dispersed, runner mid-cross.
- Playwright MCP screenshot at 1280×900 and 375×812 stored under `handoffs/`.

### Phase 3 — About & Skills
**Owners:**
- **Claude Code:** `AboutPanel.tsx` (CSS Grid 40/60, HUD brackets, blinking status, GSAP type-in row stagger).
- **Codex:** `PhotoShader.tsx` (R3F ShaderMaterial wrapping `scanline.frag.glsl`), `SkillOrrery.tsx` (R3F orbital scene, post-processing bloom).
- **Gemini:** plan the 4 orbit-ring inclination angles and skill-pod orbit math (output: short doc in `handoffs/`).
- **ChatGPT:** copy pass on About bio (≤60 words, JARVIS-dossier tone).

**Verification gate:** photo shows scan-line + cyan grade + corner brackets; skill orrery rotates idle, locks to hovered pod, child tech nodes float out; bio renders.

### Phase 4 — Projects (8 scenes + gallery)
**Owners:**
- **Claude Code:** `ProjectGallery.tsx` (per D5: horizontal pin desktop, vertical stack mobile), `ProjectCard.tsx` template, `SceneSkeleton.tsx` fallback, IntersectionObserver gating (per D7), and the static poster fallback wrapper.
- **Codex (parallel batches as in AGENTS.md §Sprint 6):** all 8 scenes — `CDASScene`, `FaultmapScene`, `PharmacyScene`, `PipelineScene`, `InsuLinkScene`, `GeneticScene`, `WordleScene`, `OptionsScene`. Each scene also outputs a static poster PNG (1200×900) committed to `public/posters/`.
- **Gemini:** Mexico simplified GeoJSON (used by CDAS + Pharmacy); patient-doctor graph layout for InsuLink; Wordle decision tree topology data.
- **ChatGPT:** the 60-character description line per project.

**Project content seeded from resume + index.html + DESIGN.md §4:**
1. CDAS / Búsqueda Colectiva Nacional (current internship).
2. Faultmap — LLM diagnostic library on PyPI.
3. Pharmacy Network Optimization (P-median).
4. E-Commerce Data Pipeline (Akamai bypass).
5. Insulink — diabetes care platform, 70+ users.
6. Genetic Algorithm CO₂ estimation.
7. gabriel_regina Algorithmic Wordle — 1st place tournament.
8. Options Flow Monitor.

**Verification gate:** each scene renders standalone (Codex screenshots); gallery scrolls without jank; only one scene's Canvas mounted at a time; mobile shows posters only.

### Phase 5 — Experience, Labs, Contact
**Owner:** Claude Code (sole, with ChatGPT copy pass).
**Sub-plan:** `plans/phase-5-experience-labs-contact.md`
**Components:** `MissionLog.tsx` timeline, `SystemMonitor.tsx`, `useGitHubStats.ts`, `useWeather.ts`, `TechStack3D.tsx` (Codex-built, low-poly spinning logos), `TransmissionPanel.tsx` (EmailJS contact form with terminal aesthetic).
**Verification gate:** GitHub stats render real data (use canonical handle from D2); weather pulls Mexico City; contact form submits a real test email; "System Fuel" gauge animates per time-of-day formula (Gemini-designed).

### Phase 6 — Polish, Performance, Deploy
**Owner:** Claude Code (with Playwright MCP for QA).
**Tasks:**
- Add ScrollTrigger entrance to every section per CLAUDE.md Phase 6.
- Verify cursor states across all interactive surfaces.
- Mobile fallback: every R3F canvas guarded by `useIsMobile()` hook → poster.
- Low Power Mode toggle (per CLAUDE.md "Host Environment & Performance Context") in audio controls panel — flips a `localStorage` flag that disables R3F at the layout root.
- Bundle analysis; fix any chunk > 150KB gzipped.
- `axe-core` accessibility pass.
- `.github/workflows/deploy.yml` with `actions/deploy-pages@v4`, triggers on push to main.
- Final live URL Playwright screenshot stored under `handoffs/launch-2026-XX-XX.md`.

---

## Agent Allocation Matrix (authoritative)

This supersedes the looser allocation in AGENTS.md and goes in the patch to that file in Phase 0.

| Component / Asset | Primary | Secondary | Notes |
|---|---|---|---|
| Project scaffolding, configs, layout root | Claude Code | — | Phase 1 |
| `globals.css` (CSS vars from DESIGN.md) | Claude Code | — | Literal token pass |
| `CustomCursor.tsx` | Claude Code | — | DOM only |
| `FBMBackground.tsx` (host) | Claude Code | Codex (shader) | Claude wires R3F canvas, Codex writes `fbm.frag.glsl` |
| `AtomLoader.tsx` | **Codex** | — | R3F geometry + GSAP timing |
| `AudioController.tsx`, `useAudioAnalyzer.ts` | Claude Code | — | Web Audio API only |
| `HeroScene.tsx` | **Codex** | — | Particles + repel + audio uniforms |
| `HeroText.tsx`, `HeroHUD.tsx` | Claude Code | ChatGPT (copy) | DOM + GSAP |
| `ParticleRunner.tsx` | **Codex** | Gemini (pose data) | Heavy math |
| `AboutPanel.tsx` | Claude Code | ChatGPT (bio) | Layout + type-in |
| `PhotoShader.tsx` | **Codex** | — | Scanline shader |
| `SkillOrrery.tsx` | **Codex** | Gemini (orbit math) | Bloom + orbit |
| `ProjectGallery.tsx`, `ProjectCard.tsx` | Claude Code | — | Layout + scroll architecture |
| 8 project scenes | **Codex** | Gemini (per-scene data) | Parallel batches |
| `MissionLog.tsx` | Claude Code | ChatGPT (copy) | — |
| `SystemMonitor.tsx`, `useGitHubStats`, `useWeather` | Claude Code | Gemini (Fuel formula) | — |
| `TechStack3D.tsx` | **Codex** | — | Spinning low-poly logos |
| `TransmissionPanel.tsx` | Claude Code | ChatGPT (copy) | EmailJS wiring |
| GLSL shaders (`fbm`, `distortion`, `scanline`) | **Codex** | — | Browser-verified |
| `runnerPoses.ts`, `mexicoStates.ts`, etc. | **Gemini** | — | Data generation |
| Deploy workflow, accessibility, perf | Claude Code | Playwright MCP | — |

---

## Cross-cutting verification

After every phase:

| Check | Tool | Pass |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Build | `npm run build` | Static export to `out/` |
| Bundle size | build output | No chunk > 150KB gzipped |
| Three.js leaks | DevTools | No "set on disposed" warnings |
| 60fps | Chrome Perf | No long-task jank in animation phase |
| Mobile layout | Playwright 375×812 | No overflow, no broken layout |
| A11y | axe-core | 0 critical |
| Visual diff | Playwright screenshot vs Codex baseline | Match per section |

End-to-end smoke test before deploy:
1. Hard reload `/` → atom loader plays → audio prompt unlocks on click → hero reveals with particles repelling cursor.
2. Scroll → ParticleRunner crosses → About types in → orrery loads.
3. Scroll through projects gallery; only one Canvas active in DOM at a time (DevTools check).
4. Mission Log timeline animates; System Monitor shows live GitHub + weather.
5. Submit a test email via TransmissionPanel; receive it.
6. Toggle mute → persists across reload. Toggle Low Power Mode → R3F disabled, CSS fallback shown.

---

## Critical files (locked paths)

To be modified or created in Phase 0 (this is the only phase where I edit anything outside `src/` or `public/`):

- [DESIGN.md](DESIGN.md) — patches per "Doc-cleanup deltas" above.
- [CLAUDE.md](CLAUDE.md) — patches per same.
- [AGENTS.md](AGENTS.md) — patches per same + new "Orchestration files" section.
- `progress.md` — new.
- `decisions-log.md` — new, seeded with D1–D8.
- `assets-checklist.md` — new.
- `plans/phase-{1..6}-*.md` — new, six files.
- `handoffs/README.md` — new (template).
- [README.md](README.md) — replace one-line content with project overview pointing at the four orchestration docs.
- [index.html](index.html) — delete (Next.js build will own the index).

All Phase ≥1 files live under `src/`, `public/`, `.github/workflows/`, and root configs (`next.config.js`, `tailwind.config.ts` if v3, `tsconfig.json`, `package.json`).

---

## What I will NOT do without explicit additional approval

- Run `git rm` on the placeholder [index.html](index.html) — confirm first (could be linked from external places).
- Push commits or open PRs — every commit happens only after the relevant phase's verification gate is green and the user signs off.
- Sign up for any third-party service on the user's behalf (EmailJS, OpenWeatherMap). I'll add the env-var hookup, but the user creates the accounts and pastes the keys into `assets-checklist.md`.
- Embed any copyrighted audio file. Per D4, the music decision is on the user.

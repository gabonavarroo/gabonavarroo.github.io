# Phase 5 — Experience, Labs, Contact

> **Owners:** Claude Code (sole, with **ChatGPT** copy passes and **Codex** for `TechStack3D`) · **Estimated effort:** 1 session · **Prerequisites:** Phase 4 verification gate green; user-supplied EmailJS + OpenWeatherMap API keys in `.env.local`.

## Context

Three terminal sections. Mission Log = animated vertical timeline of experience entries. Labs = live-data dashboard (GitHub stats, Mexico City weather, System Fuel gauge, research tags, 3D tech stack). Contact = terminal-styled form that ships an email via EmailJS.

## Owners

| Component | Owner |
|---|---|
| `MissionLog.tsx` | Claude Code |
| `useGitHubStats.ts` | Claude Code |
| `useWeather.ts` | Claude Code |
| `SystemMonitor.tsx` (composes all Labs widgets) | Claude Code |
| `TechStack3D.tsx` (low-poly spinning logos) | **Codex** |
| "System Fuel" formula | **Gemini** (one-paragraph spec → Claude implements) |
| `TransmissionPanel.tsx` (contact form) | Claude Code |
| Section copy (mission entries, fuel jokes, contact micro-copy) | **ChatGPT** |

## Sprints

### Sprint 5A — Mission Log (Claude Code)

`src/components/experience/MissionLog.tsx`:
- Vertical timeline. Glowing spine line: an SVG `<line>` with animated `stroke-dashoffset` (data packets flowing downward).
- Entries from `src/data/experience.ts`. Per resume + DESIGN.md §5 baseline:
  - **2024.Q3 → present** — CDAS Research Internship (ITAM)
  - **2024.Q1** — Coding Rush organizer (ITAM)
  - **2023** — Academic Excellence Award
  - (any others surfaced from the resume — Gabriel reviews ChatGPT's pass)
- Entry layout per DESIGN.md §5: time marker → bracket spine connector → indented card with role/org/description/tech tags.
- Entrance: GSAP ScrollTrigger per entry, `clip-path: inset(0 100% 0 0)` reveal as the spine reaches each entry.
- Side-alternating layout on desktop (left/right of spine); single column on mobile.

### Sprint 5B — Live data hooks (Claude Code)

`src/hooks/useGitHubStats.ts`:
- Fetch GitHub GraphQL public endpoint (`https://api.github.com/graphql`) with **no auth** — public profile data is accessible. Use the query in AGENTS.md §Sprint 7 with `login: "gabonavarroo"` (D2).
- Cache result in `localStorage` with 1-hour TTL (avoids hitting the 60-req/hour anonymous limit).
- Return `{ totalCommits, contributionStreak, topLanguage, topRepos, isLoading, error }`.

`src/hooks/useWeather.ts`:
- Fetch OpenWeatherMap REST `https://api.openweathermap.org/data/2.5/weather?lat=19.43&lon=-99.13&appid=${KEY}&units=metric`.
- Read `NEXT_PUBLIC_OPENWEATHER_KEY` from env.
- Return `{ temp, condition, humidity, icon, isLoading, error }`.
- Cache 30 min in `localStorage`.

### Sprint 5C — System Monitor (Claude Code)

`src/components/labs/SystemMonitor.tsx` composes:

**Top row (3-column grid):**
- `<GithubWidget />` — uses `useGitHubStats`, renders `[GITHUB COMMITS]` panel with total commits this year, streak, top language. HUD frame.
- `<WeatherWidget />` — uses `useWeather`, renders Mexico City temp + condition icon (custom SVG in HUD style).
- `<SystemFuelGauge />` — Gemini-designed playful formula: combines `Date.now()` time-of-day, day-of-week, and a deterministic hash of the user's IP-less session to estimate "coffee cups" + "Monster White cans" consumed. The output is animated (GSAP fills a horizontal bar) on mount.
- `<UptimeCounter />` — `HH:MM:SS` since page load, ticking every second.

**Middle row:**
- `<ResearchTags />` — Floating tags from `src/data/research.ts`. Each tag is a `<span>` with random orbital trajectory in a 2D vortex (CSS transform + `requestAnimationFrame`).

**Bottom row:**
- `<TechStack3D />` (Codex) — see Sprint 5D.

### Sprint 5D — TechStack3D (Codex)

`src/components/labs/TechStack3D.tsx`:
- R3F `<Canvas>` 100% width × 320px tall.
- 8 low-poly logo meshes orbiting in a 2D plane (Python, PyTorch, HuggingFace, Kafka, Docker, Next.js, PostgreSQL, MongoDB). Each logo is constructed from primitives (e.g., Python = two intersecting tori; Docker = stacked cubes; PostgreSQL = elephant silhouette via `THREE.ExtrudeGeometry`).
- Each mesh: cyan emissive material, slight bloom. Spins on its Y axis. Drifts with sin/cos motion.
- `THREE.InstancedMesh` for the dust particles around each logo (per CLAUDE.md updated rule: InstancedMesh because they're repeated 3D meshes).

Codex screenshot deliverable: 1280×420 frame showing all 8 logos arranged in two rows.

### Sprint 5E — Transmission Panel (Claude Code)

`src/components/contact/TransmissionPanel.tsx`:
- Layout per DESIGN.md §7 (`ESTABLISH CONTACT` header + RECIPIENT / CHANNEL / MESSAGE pseudo-terminal inputs + INITIATE TRANSMISSION button).
- React Hook Form (or plain controlled state — both fine; Claude picks plain to avoid extra dep).
- On submit:
  1. GSAP timeline: screen flashes briefly (overlay opacity 0 → 0.4 → 0, 0.4s).
  2. Scan-line sweep across the panel (CSS keyframe).
  3. Call `emailjs.send(SERVICE_ID, TEMPLATE_ID, { from_name, from_email, message }, PUBLIC_KEY)`.
  4. On success: replace form with `TRANSMISSION SENT. RESPONSE ETA: <24H` in `--system-green`.
  5. On error: `TRANSMISSION FAILED. CHANNEL ERROR.` in `--alert-red` + retry button.
- Social links row: GitHub, LinkedIn, resume PDF, optionally Twitter — styled as `[GH]`, `[LI]`, `[CV]`, `[TW]` HUD chips.

### Sprint 5F — ChatGPT copy passes

ChatGPT generates:
- Short description (≤100 chars) for each `MissionLog` entry.
- 5–10 humorous System Fuel formula labels (e.g., `CALIBRATING CAFFEINE LEVELS… 87%`).
- Contact panel micro-copy: empty-state, success, error, placeholders for each field.
- Error state copy for live-data hooks (e.g., `GITHUB UPLINK SEVERED — RETRY 0:30`).

## Verification gate

| Check | Pass |
|---|---|
| Mission Log timeline animates on scroll | Visual + each entry slides/clip-paths in |
| GitHub stats render real data | Network tab shows GraphQL response, panel shows commit count |
| Weather widget shows Mexico City temp | Network tab shows OWM response |
| System Fuel gauge animates on mount | Bar fills smoothly |
| TechStack3D renders all 8 logos | Codex screenshot |
| Contact form sends test email | User receives test email at gabriel.navarrocr@gmail.com |
| Form error states render correctly | Test by killing network tab |
| TypeScript + build clean | Standard gates |

## Exit criteria

- Real test email received from TransmissionPanel.
- `progress.md` Phase 5 ticked.
- Commit: `feat(labs+contact): mission log, system monitor, transmission panel`.
